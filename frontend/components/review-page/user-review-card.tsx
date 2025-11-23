"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ThumbsUp, ThumbsDown, MessageCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Pencil, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserReviewCardProps } from "@/types/review-page"
import { me } from "@/lib/auth"
import { deleteReview } from "@/lib/api/reviews"
import { useToast } from "@/hooks/use-toast"
import { EditReviewModal } from "@/components/reviews/edit-review-modal"

export default function UserReviewCard({
  review,
  isCurrentUser,
  onHelpfulClick,
  onUnhelpfulClick,
}: UserReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSpoilerRevealed, setIsSpoilerRevealed] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count)
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpful_count)
  const [userVote, setUserVote] = useState<"helpful" | "unhelpful" | null>(review.user_vote || null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await me()
        setCurrentUser(user)
      } catch (error) {
        console.debug("User not authenticated")
      }
    }
    fetchUser()
  }, [])

  const handleHelpfulClick = () => {
    if (userVote === "helpful") {
      setHelpfulCount(helpfulCount - 1)
      setUserVote(null)
    } else {
      if (userVote === "unhelpful") {
        setUnhelpfulCount(unhelpfulCount - 1)
      }
      setHelpfulCount(helpfulCount + 1)
      setUserVote("helpful")
    }
    onHelpfulClick(review.id)
  }

  const handleUnhelpfulClick = () => {
    if (userVote === "unhelpful") {
      setUnhelpfulCount(unhelpfulCount - 1)
      setUserVote(null)
    } else {
      if (userVote === "helpful") {
        setHelpfulCount(helpfulCount - 1)
      }
      setUnhelpfulCount(unhelpfulCount + 1)
      setUserVote("unhelpful")
    }
    onUnhelpfulClick(review.id)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteReview(review.id)
      toast({
        title: "Success",
        description: "Review deleted successfully",
      })
      window.location.reload()
    } catch (error: any) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    toast({
      title: "Success",
      description: "Review updated successfully",
    })
    window.location.reload()
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-[#FFD700] fill-[#FFD700]" : "text-[#3A3A3A]"
          }`}
      />
    ))
  }

  const shouldTruncate = review.content.length > 300
  const displayContent = isExpanded || !shouldTruncate ? review.content : review.content.slice(0, 300) + "..."

  return (
    <div
      className={`bg-[#282828] rounded-lg border ${isCurrentUser ? "border-[#00BFFF] shadow-[0_0_15px_rgba(0,191,255,0.2)]" : "border-[#3A3A3A]"
        } p-6 transition-all duration-200`}
    >
      {/* User Info & Rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={review.user.avatar_url}
            alt={review.user.display_name}
            className="w-12 h-12 rounded-full border-2 border-[#3A3A3A]"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#E0E0E0] font-inter">
                {review.user.display_name}
              </h4>
              {review.user.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-[#00BFFF]" />
              )}
              {isCurrentUser && (
                <span className="px-2 py-0.5 rounded-full bg-[#00BFFF]/20 border border-[#00BFFF]/50 text-[#00BFFF] text-xs font-semibold">
                  Your Review
                </span>
              )}
            </div>
            <p className="text-sm text-[#A0A0A0]">@{review.user.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
      </div>

      {/* GIF Display - Show if review has a GIF */}
      {review.gif_url && (
        <div className="mb-4">
          <div className="relative rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#3A3A3A]">
            <img
              src={review.gif_url}
              alt="Review GIF"
              className="w-full max-h-80 object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Spoiler Warning */}
      {review.contains_spoilers && !isSpoilerRevealed && (
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-md bg-[#1A1A1A]/80 rounded-lg flex flex-col items-center justify-center z-10 p-6">
              <AlertTriangle className="w-12 h-12 text-[#F59E0B] mb-3" />
              <h4 className="text-lg font-semibold text-[#E0E0E0] font-inter mb-2">
                Contains Spoilers
              </h4>
              <p className="text-sm text-[#A0A0A0] text-center mb-4">
                This review contains spoilers. Click to reveal.
              </p>
              <Button
                onClick={() => setIsSpoilerRevealed(true)}
                className="bg-[#F59E0B] text-[#1A1A1A] hover:bg-[#D97706] font-semibold"
              >
                Reveal Spoilers
              </Button>
            </div>
            <div className="blur-sm select-none pointer-events-none">
              <p className="text-sm text-[#E0E0E0] leading-relaxed">{displayContent}</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Content */}
      {(!review.contains_spoilers || isSpoilerRevealed) && (
        <div className="mb-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={isExpanded ? "expanded" : "collapsed"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-[#E0E0E0] leading-relaxed whitespace-pre-wrap"
            >
              {displayContent}
            </motion.p>
          </AnimatePresence>

          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[#00BFFF] hover:text-[#00BFFF] hover:bg-[#00BFFF]/10 p-0 h-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Read More
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Footer: Timestamp & Actions */}
      <div className="pt-4 border-t border-[#3A3A3A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#A0A0A0]">
            {new Date(review.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <div className="flex items-center gap-4">
            {/* Helpful Button */}
            <button
              onClick={handleHelpfulClick}
              className={`flex items-center gap-1 text-sm ${userVote === "helpful" ? "text-[#10B981]" : "text-[#A0A0A0]"
                } hover:text-[#10B981] transition-colors`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{helpfulCount}</span>
            </button>

            {/* Unhelpful Button */}
            <button
              onClick={handleUnhelpfulClick}
              className={`flex items-center gap-1 text-sm ${userVote === "unhelpful" ? "text-[#EF4444]" : "text-[#A0A0A0]"
                } hover:text-[#EF4444] transition-colors`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{unhelpfulCount}</span>
            </button>

            {/* Comments */}
            <div className="flex items-center gap-1 text-sm text-[#A0A0A0]">
              <MessageCircle className="w-4 h-4" />
              <span>{review.comment_count}</span>
            </div>
          </div>
        </div>

        {/* Edit/Delete Buttons - Only show if user owns the review */}
        {currentUser?.id === review.user.id && (
          <div className="flex gap-2 pt-3 border-t border-[#3A3A3A]">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 border-[#3A3A3A] hover:bg-[#3A3A3A]"
            >
              <Pencil className="w-3 h-3 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditReviewModal
          review={{
            id: review.id,
            title: "",
            content: review.content,
            rating: review.rating,
            hasSpoilers: review.contains_spoilers,
          }}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

