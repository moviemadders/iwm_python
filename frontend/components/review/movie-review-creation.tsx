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
import { submitReview, updateReview } from "@/lib/api/reviews"
import { getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { GifPicker } from "./gif-picker"
import { GifDisplay } from "./gif-display"

interface MovieReviewCreationProps {
  movie: any
  onSubmit?: (review: any) => void
  onCancel: () => void
  isModal?: boolean
  initialData?: {
    rating: number
    content: string
    hasSpoilers: boolean
    gifUrl?: string | null
  }
  reviewId?: string
}

export function MovieReviewCreation({ movie, onSubmit, onCancel, isModal = false, initialData, reviewId }: MovieReviewCreationProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [reviewText, setReviewText] = useState(initialData?.content || "")
  const [containsSpoilers, setContainsSpoilers] = useState(initialData?.hasSpoilers || false)
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [selectedGif, setSelectedGif] = useState<string | null>(initialData?.gifUrl || null)
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
      const user = await getCurrentUser()

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a review.",
          variant: "destructive",
        })
        router.push(`/login?redirect=/movies/${movie.id}/review/${reviewId ? 'edit' : 'create'}`)
        return
      }

      console.log(reviewId ? "Updating review:" : "Submitting review for movie:", reviewId || movie.id)
      console.log("User:", user.username)
      console.log("Rating:", rating)
      console.log("Review length:", reviewText.length)

      const reviewData = {
        content: reviewText,
        rating: rating,
        hasSpoilers: containsSpoilers,
        gifUrl: selectedGif,
      }

      let result
      if (reviewId) {
        console.log("Updating review:", reviewId)
        result = await updateReview(reviewId, reviewData)
      } else {
        console.log("Creating new review")
        result = await submitReview(movie.id, reviewData, user.id)
      }

      console.log("Review submitted/updated successfully:", result)

      toast({
        title: reviewId ? "Review Updated!" : "Review Published!",
        description: reviewId ? "Your review has been successfully updated." : "Your review has been successfully posted.",
      })

      if (onSubmit) {
        onSubmit(result)
      }

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
        type: "spring" as const,
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
          <h2 className="text-2xl font-bold text-siddu-text-light mb-2">
            {reviewId ? "Edit Your Review" : "Write Your Review"}
          </h2>
          <p className="text-siddu-text-subtle">Share your thoughts on {movie.title}</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <RatingInput value={rating} onChange={setRating} movieTitle={movie.title} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReviewEditor value={reviewText} onChange={setReviewText} movieTitle={movie.title} />
        </motion.div>

        {/* GIF Display - Explicitly rendered when selectedGif is present */}
        {selectedGif && (
          <motion.div
            variants={itemVariants}
            className="w-full flex justify-center py-4"
          >
            <GifDisplay
              gifUrl={selectedGif}
              onRemove={() => {
                console.log("Removing GIF")
                setSelectedGif(null)
              }}
            />
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
