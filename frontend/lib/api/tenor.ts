/**
 * Tenor GIF API Client
 * 
 * Provides functions to search and fetch GIFs from Tenor API
 * API Documentation: https://developers.google.com/tenor/guides/quickstart
 */

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyCj0Ts518NF6uvEaIiAE9fBx12lXvAQUZ0"
const TENOR_API_BASE = "https://tenor.googleapis.com/v2"
const CLIENT_KEY = "movie_madders_reviews"

export interface TenorGif {
    id: string
    title: string
    media_formats: {
        gif: {
            url: string
            dims: [number, number]
            size: number
        }
        tinygif: {
            url: string
            dims: [number, number]
            size: number
        }
        mediumgif: {
            url: string
            dims: [number, number]
            size: number
        }
    }
    created: number
    content_description: string
    itemurl: string
    url: string
    tags: string[]
    hasaudio: boolean
}

export interface TenorSearchResponse {
    results: TenorGif[]
    next: string
}

/**
 * Search for GIFs using a query string
 */
export async function searchGifs(
    query: string,
    limit: number = 20,
    pos?: string
): Promise<TenorSearchResponse> {
    const params = new URLSearchParams({
        key: TENOR_API_KEY,
        q: query,
        client_key: CLIENT_KEY,
        limit: limit.toString(),
        media_filter: "gif,tinygif,mediumgif",
    })

    if (pos) {
        params.append("pos", pos)
    }

    const response = await fetch(`${TENOR_API_BASE}/search?${params.toString()}`)

    if (!response.ok) {
        throw new Error(`Tenor API error: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get trending/featured GIFs
 */
export async function getTrendingGifs(
    limit: number = 20,
    pos?: string
): Promise<TenorSearchResponse> {
    const params = new URLSearchParams({
        key: TENOR_API_KEY,
        client_key: CLIENT_KEY,
        limit: limit.toString(),
        media_filter: "gif,tinygif,mediumgif",
    })

    if (pos) {
        params.append("pos", pos)
    }

    const response = await fetch(`${TENOR_API_BASE}/featured?${params.toString()}`)

    if (!response.ok) {
        throw new Error(`Tenor API error: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get GIF categories/tags
 */
export async function getGifCategories(): Promise<string[]> {
    // Tenor doesn't have a categories endpoint, so we'll return popular search terms
    return [
        "happy",
        "excited",
        "love",
        "sad",
        "angry",
        "surprised",
        "laughing",
        "crying",
        "shocked",
        "confused",
        "thumbs up",
        "applause",
        "mind blown",
        "fire",
        "heart eyes",
    ]
}

/**
 * Register a GIF share (for analytics)
 */
export async function registerGifShare(gifId: string): Promise<void> {
    const params = new URLSearchParams({
        key: TENOR_API_KEY,
        id: gifId,
        client_key: CLIENT_KEY,
    })

    await fetch(`${TENOR_API_BASE}/registershare?${params.toString()}`)
    // We don't need to handle the response
}
