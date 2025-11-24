"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { isAuthenticated } from "@/lib/auth"
import { createComment, getComments, likeComment, unlikeComment } from "@/lib/api/review-comments"
import Image from "next/image"

interface CommentDTO {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string
  }
  likes: number
  userHasLiked: boolean
  replies?: CommentDTO[]
}

interface CommentsSectionProps {
  reviewId: string
  comments: CommentDTO[]
  commentsCount: number
}

export function CommentsSection({ reviewId, comments, commentsCount }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState<CommentDTO[]>(comments)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch comments on mount
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true)
      try {
        const data = await getComments(reviewId)
        setLocalComments(data.comments || [])
      } catch (error) {
        console.error("Failed to fetch comments:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchComments()
  }, [reviewId])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated()) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
      return
    }

    if (commentText.trim().length < 3) {
      return
    }

    setIsSubmitting(true)

    try {
      const newComment = await createComment(reviewId, { content: commentText.trim() })
      // Add to local state
      setLocalComments(prev => [...prev, newComment])
      setCommentText("")
    } catch (error) {
      console.error("Failed to post comment:", error)
      alert("Failed to post comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      id="comments-section"
      className="bg-[#151515] rounded-lg border border-[#3A3A3A] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-[#00BFFF]" />
          <h3 className="text-2xl font-bold font-inter text-[#E0E0E0]">
            Comments ({commentsCount})
          </h3>
        </div>

        {/* Comment Composer */}
        {isAuthenticated() ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <Textarea
              placeholder="Share your thoughts on this review..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="bg-[#282828] border-[#3A3A3A] text-[#E0E0E0] placeholder:text-[#A0A0A0] focus:border-[#00BFFF] focus:ring-[#00BFFF] resize-none mb-3"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A0A0A0] font-dmsans">
                {commentText.length < 3 ? "Minimum 3 characters" : `${commentText.length} characters`}
              </span>
              <Button
                type="submit"
                disabled={isSubmitting || commentText.trim().length < 3}
                className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-[#282828] rounded-lg p-6 text-center mb-8">
            <p className="text-[#A0A0A0] font-dmsans mb-4">
              Sign in to join the conversation
            </p>
            <Button
              onClick={() => {
                window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
              }}
              className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD]"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Comments List */}
        {localComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-[#3A3A3A] mx-auto mb-4" />
            <p className="text-[#A0A0A0] font-dmsans text-lg">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {localComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} reviewId={reviewId} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CommentCard({ comment, reviewId }: { comment: CommentDTO; reviewId?: string }) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [liked, setLiked] = useState(comment.userHasLiked)
  const [likeCount, setLikeCount] = useState(comment.likes)

  const formattedDate = new Date(comment.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const handleLike = async () => {
    if (!isAuthenticated()) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
      return
    }

    if (!reviewId) return

    try {
      if (liked) {
        await unlikeComment(reviewId, comment.id)
        setLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        await likeComment(reviewId, comment.id)
        setLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  const handleReply = () => {
    if (!isAuthenticated()) {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
      return
    }
    setShowReplyBox(!showReplyBox)
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reviewId || replyText.trim().length < 3) {
      return
    }

    setIsSubmittingReply(true)

    try {
      // Pass parentId to create a nested reply (YouTube style)
      await createComment(reviewId, {
        content: replyText.trim(),
        parentId: comment.id  // This makes it a reply to this comment
      })
      setReplyText("")
      setShowReplyBox(false)
      // Refresh page to show new reply
      window.location.reload()
    } catch (error) {
      console.error("Failed to post reply:", error)
      alert("Failed to post reply. Please try again.")
    } finally {
      setIsSubmittingReply(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Comment */}
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#3A3A3A]">
            {comment.author.avatarUrl ? (
              <Image
                src={comment.author.avatarUrl}
                alt={comment.author.username}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#E0E0E0] font-bold">
                {comment.author.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[#E0E0E0] font-inter">
              {comment.author.username}
            </span>
            <span className="text-sm text-[#A0A0A0] font-dmsans">
              {formattedDate}
            </span>
          </div>
          <p className="text-[#E0E0E0] font-dmsans mb-2">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={handleLike}
              className={`transition-colors font-dmsans ${liked ? "text-[#00BFFF]" : "text-[#A0A0A0] hover:text-[#00BFFF]"
                }`}
            >
              {liked ? "Liked" : "Like"} ({likeCount})
            </button>
            <button
              onClick={handleReply}
              className="text-[#A0A0A0] hover:text-[#00BFFF] transition-colors font-dmsans"
            >
              Reply
            </button>
          </div>

          {/* Reply Box */}
          {showReplyBox && (
            <motion.form
              onSubmit={handleSubmitReply}
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Textarea
                placeholder={`Reply to ${comment.author.username}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="bg-[#282828] border-[#3A3A3A] text-[#E0E0E0] placeholder:text-[#A0A0A0] focus:border-[#00BFFF] focus:ring-[#00BFFF] resize-none mb-2"
                disabled={isSubmittingReply}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowReplyBox(false)}
                  variant="ghost"
                  size="sm"
                  className="text-[#A0A0A0]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReply || replyText.trim().length < 3}
                  size="sm"
                  className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD] disabled:opacity-50"
                >
                  {isSubmittingReply ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </div>

      {/* Nested Replies (YouTube style - indented under parent) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 space-y-4 border-l-2 border-[#3A3A3A] pl-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              reviewId={reviewId}
            />
          ))}
        </div>
      )}
    </div>
  )
}


