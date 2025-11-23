"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MovieContextBar } from "./movie-context-bar"
import { RatingInput } from "./rating-input"
import { ReviewEditor } from "./review-editor"
import { ReviewMetadata } from "./review-metadata"
import { MediaUploader } from "./media-uploader"
import { ReviewGuidelines } from "./review-guidelines"
import { ActionButtons } from "./action-buttons"
import { useToast } from "@/hooks/use-toast"
import { submitReview } from "@/lib/api/reviews"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { GifPicker } from "./gif-picker"
import { GifDisplay } from "./gif-display"

interface MovieReviewCreationProps {
  movie: any
  onSubmit?: (review: any) => void
  onCancel: () => void
  isModal?: boolean
}

export function MovieReviewCreation({ movie, onSubmit, onCancel, isModal = false }: MovieReviewCreationProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false)

  const isVerified = true // Mock verification status

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      })
      return
    }

    if (reviewText.length < 50) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 50 characters for your review.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if user is authenticated
      const user = await getCurrentUser()

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a review.",
          variant: "destructive",
        })
        // Redirect to login with return URL
        router.push(`/login?redirect=/movies/${movie.id}/review/create`)
        return
      }

      console.log("Submitting review for movie:", movie.id)
      console.log("User:", user.username)
      console.log("Rating:", rating)
      console.log("Review length:", reviewText.length)

      // Submit review to backend API
      const reviewData = {
        content: reviewText,
        rating: rating,
        hasSpoilers: containsSpoilers,
        gifUrl: selectedGif,
      }

      const result = await submitReview(movie.id, reviewData, user.id)

      console.log("Review submitted successfully:", result)

      // Show success toast
      toast({
        title: "Review Published!",
        description: "Your review has been successfully posted.",
      })

      // Call onSubmit callback if provided (for modal usage)
      if (onSubmit) {
        onSubmit(result)
      }

      // Redirect to movie page to see the review
      router.push(`/movies/${movie.id}`)

    } catch (error) {
      console.error("Error submitting review:", error)

      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    setIsDraft(true)
    // Save to localStorage or API
    localStorage.setItem(
      `review-draft-${movie.id}`,
      JSON.stringify({
        rating,
        reviewText,
        containsSpoilers,
        savedAt: new Date().toISOString(),
      }),
    )

    toast({
      title: "Draft Saved",
      description: "Your review draft has been saved.",
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`bg-siddu-bg-card rounded-lg ${isModal ? "" : "shadow-xl"}`}
    >
      <motion.div variants={itemVariants}>
        <MovieContextBar movie={movie} />
      </motion.div>

      <div className="p-6 md:p-8 space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-siddu-text-light mb-2">Write Your Review</h2>
          <p className="text-siddu-text-subtle">Share your thoughts on {movie.title}</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <RatingInput value={rating} onChange={setRating} movieTitle={movie.title} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReviewEditor value={reviewText} onChange={setReviewText} movieTitle={movie.title} />
        </motion.div>

        {/* GIF Display */}
        {selectedGif && (
          <motion.div variants={itemVariants}>
            <GifDisplay gifUrl={selectedGif} onRemove={() => setSelectedGif(null)} />
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <ReviewMetadata
            containsSpoilers={containsSpoilers}
            onSpoilerToggle={setContainsSpoilers}
            isVerified={isVerified}
            movieId={movie.id}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MediaUploader
            files={uploadedMedia}
            onFilesChange={setUploadedMedia}
            onOpenGifPicker={() => setIsGifPickerOpen(true)}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReviewGuidelines />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ActionButtons
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            canSubmit={rating > 0 && reviewText.length >= 50}
            rating={rating}
            reviewLength={reviewText.length}
          />
        </motion.div>
      </div>

      {/* GIF Picker Modal */}
      <GifPicker
        isOpen={isGifPickerOpen}
        onClose={() => setIsGifPickerOpen(false)}
        onSelectGif={(gifUrl) => setSelectedGif(gifUrl)}
      />
    </motion.div>
  )
}
