/**
 * Text Parser for Pulse Content
 * Parses @mentions and #hashtags separately
 */

export interface MovieMention {
    id?: string
    title: string
    mention: string // e.g., "@Inception"
    startIndex: number
    endIndex: number
}

export interface ParsedContent {
    hashtags: string[]
    mentions: MovieMention[]
    plainText: string
}

/**
 * Parse pulse content to extract @mentions and #hashtags
 */
export function parsePulseContent(text: string): ParsedContent {
    const hashtags: string[] = []
    const mentions: MovieMention[] = []

    // Match hashtags: #word (letters, numbers, underscore)
    const hashtagPattern = /#(\w+)/g
    let match

    while ((match = hashtagPattern.exec(text)) !== null) {
        const tag = match[1].toLowerCase()
        if (!hashtags.includes(tag)) {
            hashtags.push(tag)
        }
    }

    // Match mentions: @word (can include spaces for multi-word titles)
    // Pattern: @WordOrPhrase (stops at whitespace, punctuation, or end)
    const mentionPattern = /@([A-Za-z0-9]+(?:[A-Za-z0-9\s]*[A-Za-z0-9])?)/g

    while ((match = mentionPattern.exec(text)) !== null) {
        const title = match[1].trim()
        mentions.push({
            title,
            mention: `@${title}`,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        })
    }

    return {
        hashtags,
        mentions,
        plainText: text,
    }
}

/**
 * Render parsed content with clickable mentions and hashtags
 */
export function renderParsedContent(
    text: string,
    onMentionClick?: (mention: MovieMention) => void,
    onHashtagClick?: (tag: string) => void
): React.ReactNode {
    const parsed = parsePulseContent(text)
    const segments: React.ReactNode[] = []
    let lastIndex = 0

    // Combine all matches (mentions and hashtags) with their positions
    const allMatches: Array<{
        type: 'mention' | 'hashtag'
        text: string
        start: number
        end: number
        data?: MovieMention | string
    }> = []

    // Add mentions
    parsed.mentions.forEach((m) => {
        allMatches.push({
            type: 'mention',
            text: m.mention,
            start: m.startIndex,
            end: m.endIndex,
            data: m,
        })
    })

    // Add hashtags
    const hashtagPattern = /#(\w+)/g
    let match
    while ((match = hashtagPattern.exec(text)) !== null) {
        allMatches.push({
            type: 'hashtag',
            text: match[0],
            start: match.index,
            end: match.index + match[0].length,
            data: match[1],
        })
    }

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start)

    // Build segments
    allMatches.forEach((item, index) => {
        // Add plain text before this match
        if (item.start > lastIndex) {
            segments.push(text.slice(lastIndex, item.start))
        }

        // Add the match (mention or hashtag)
        if (item.type === 'mention' && onMentionClick) {
            segments.push(
                <span
                    key={`mention-${index}`}
                    className="text-[#00BFFF] hover:underline cursor-pointer font-medium"
                    onClick={() => onMentionClick(item.data as MovieMention)}
                >
                    {item.text}
                </span>
            )
        } else if (item.type === 'hashtag' && onHashtagClick) {
            segments.push(
                <span
                    key={`hashtag-${index}`}
                    className="text-[#A0A0A0] hover:text-[#E0E0E0] cursor-pointer"
                    onClick={() => onHashtagClick(item.data as string)}
                >
                    {item.text}
                </span>
            )
        } else {
            segments.push(item.text)
        }

        lastIndex = item.end
    })

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push(text.slice(lastIndex))
    }

    return <>{segments}</>
}

/**
 * Extract movie IDs from mentions (for backend submission)
 */
export function extractMentionedMovieIds(mentions: MovieMention[]): string[] {
    return mentions.filter((m) => m.id).map((m) => m.id!)
}
