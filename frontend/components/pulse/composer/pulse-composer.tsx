'use client'

/**
 * Pulse Composer Component
 * Main composer with expandable textarea, media upload, emoji picker, and tagging
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CurrentUser, PulseMedia, TaggedItem } from '@/types/pulse'
import ComposerTextarea from './composer-textarea'
import CharacterCounter from './character-counter'
import MediaUploadButton from './media-upload-button'
import MediaPreviewGrid from './media-preview-grid'
import EmojiPickerButton from './emoji-picker-button'
import TagSearchButton from './tag-search-button'
import TagChip from './tag-chip'
import PostButton from './post-button'
import { me } from '@/lib/auth'
import { createPulse } from '@/lib/api/pulses'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star } from "lucide-react"

interface PulseComposerProps {
  currentUser: CurrentUser
  onSubmit: (content: string, media: PulseMedia[], taggedItems: TaggedItem[]) => void
  isSubmitting?: boolean
  onPulseCreated?: () => void
}

export default function PulseComposer({
  currentUser,
  onSubmit,
  isSubmitting = false,
  onPulseCreated,
}: PulseComposerProps) {
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<PulseMedia[]>([])
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [authUser, setAuthUser] = useState<any>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [starRating, setStarRating] = useState<number>(0)
  const { toast } = useToast()

  const MAX_CHARS = 280 // Changed from 500 to 280 as per requirements
  const charCount = content.length
  const isOverLimit = charCount > MAX_CHARS
  const canPost = content.trim().length > 0 && !isOverLimit && !isPosting

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await me()
        setAuthUser(user)
      } catch (error) {
        console.debug("User not authenticated")
      }
    }
    fetchUser()
  }, [])

  const handleSubmit = async () => {
    if (!canPost) return

    setIsPosting(true)

    try {
      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g
      const hashtags = content.match(hashtagRegex) || []

      // Get linked movie ID from tagged items
      const linkedMovieId = taggedItems.find(tag => tag.type === 'movie')?.id

      // Prepare media URLs
      const contentMedia = media.length > 0 ? media.map(m => m.url) : undefined

      // Call real API
      await createPulse({
        contentText: content.trim(),
        contentMedia,
        linkedMovieId,
        hashtags,
        postedAsRole: selectedRole || undefined,
        starRating: (selectedRole && linkedMovieId && starRating > 0) ? starRating : undefined,
      })

      toast({
        title: "Success",
        description: "Pulse posted successfully",
      })

      // Call original onSubmit for UI update
      onSubmit(content, media, taggedItems)

      // Reset form
      setContent('')
      setMedia([])
      setTaggedItems([])
      setSelectedRole("")
      setStarRating(0)
      setIsExpanded(false)

      // Notify parent to refresh feed
      if (onPulseCreated) {
        onPulseCreated()
      }
    } catch (error: any) {
      console.error("Error creating pulse:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to post pulse",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handleMediaAdd = (newMedia: PulseMedia[]) => {
    setMedia((prev) => [...prev, ...newMedia].slice(0, 4)) // Max 4 media items
  }

  const handleMediaRemove = (mediaId: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== mediaId))
  }

  const handleTagAdd = (tag: TaggedItem) => {
    if (taggedItems.length < 3) {
      setTaggedItems((prev) => [...prev, tag])
    }
  }

  const handleTagRemove = (tagId: string) => {
    setTaggedItems((prev) => prev.filter((t) => t.id !== tagId))
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
  }

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-[#282828] border border-[#3A3A3A] rounded-xl p-6"
    >
      <div className="flex justify-end mb-2">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[140px] h-8 bg-[#1A1A1A] border-[#3A3A3A] text-xs">
            <SelectValue placeholder="Post as..." />
          </SelectTrigger>
          <SelectContent className="bg-[#282828] border-[#3A3A3A] text-white">
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="critic">As Critic 🎬</SelectItem>
            <SelectItem value="industry_pro">As Filmmaker 🎥</SelectItem>
            <SelectItem value="talent_pro">As Talent 🌟</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={currentUser.avatar_url}
            alt={currentUser.display_name}
            className="w-12 h-12 rounded-full"
          />
        </div>

        {/* Composer Content */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Textarea */}
          <ComposerTextarea
            value={content}
            onChange={setContent}
            isExpanded={isExpanded}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's happening in the Siddu Verse?"
          />

          {/* Media Preview Grid */}
          <AnimatePresence>
            {media.length > 0 && (
              <MediaPreviewGrid media={media} onRemove={handleMediaRemove} />
            )}
          </AnimatePresence>

          {/* Tagged Items */}
          <AnimatePresence>
            {taggedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {taggedItems.map((tag) => (
                  <TagChip
                    key={tag.id}
                    tag={tag}
                    onRemove={() => handleTagRemove(tag.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Star Rating Input */}
          <AnimatePresence>
            {taggedItems.some(t => t.type === 'movie') && selectedRole && selectedRole !== "personal" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-[#1A1A1A] rounded-md p-3 border border-[#3A3A3A] flex items-center justify-between"
              >
                <span className="text-sm text-[#A0A0A0]">Rate this title:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setStarRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= starRating ? "text-yellow-500 fill-yellow-500" : "text-[#3A3A3A]"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          {isExpanded && (
            <div className="border-t border-[#3A3A3A]" />
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between">
            {/* Left: Action Buttons */}
            <div className="flex items-center gap-2">
              <MediaUploadButton onMediaAdd={handleMediaAdd} disabled={media.length >= 4} />
              <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
              <TagSearchButton onTagAdd={handleTagAdd} disabled={taggedItems.length >= 3} />
            </div>

            {/* Right: Character Counter + Post Button */}
            <div className="flex items-center gap-4">
              {isExpanded && (
                <CharacterCounter current={charCount} max={MAX_CHARS} />
              )}
              <PostButton
                onClick={handleSubmit}
                disabled={!canPost}
                isSubmitting={isPosting}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

