"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Edit, ThumbsUp, ThumbsDown, Star, ChevronDown, ChevronUp, Check, Pencil, Trash2, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewForm } from "@/components/review-form"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { getMovieReviews, deleteReview } from "@/lib/api/reviews"
import { useToast } from "@/hooks/use-toast"
import { EditReviewModal } from "@/components/reviews/edit-review-modal"
import { useHaptic } from "@/hooks/use-haptic"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  userId: string
  username: string
  avatarUrl?: string
  rating: number
  verified: boolean
  date: string
  content: string
  containsSpoilers: boolean
  helpfulCount: number
  unhelpfulCount: number
  userVote?: "helpful" | "unhelpful" | null
}

interface ReviewSystemSectionProps {
  movie: {
    id: string
    title: string
    sidduScore?: number
    reviewCount?: number
    ratingDistribution?: {
      rating: number
      count: number
    }[]
    sentimentAnalysis?: {
      positive: number
      neutral: number
      negative: number
      keyPhrases: string[]
    }
    reviews?: Review[]
  }
}

export function ReviewSystemSection({ movie }: ReviewSystemSectionProps) {
  const [activeFilter, setActiveFilter] = useState("latest")
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({})
  const [visibleSpoilers, setVisibleSpoilers] = useState<Record<string, boolean>>({})
  const [reviewVotes, setReviewVotes] = useState<Record<string, "helpful" | "unhelpful" | null>>({})
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const { toast } = useToast()
  const { trigger } = useHaptic()

  // Safe defaults
  const distribution = Array.isArray(movie.ratingDistribution) ? movie.ratingDistribution : []
  const sentiments = movie.sentimentAnalysis || { positive: 0, neutral: 0, negative: 0, keyPhrases: [] }

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }
    fetchUser()
  }, [])

  // Fetch reviews from backend
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoadingReviews(true)
      try {
        const data = await getMovieReviews(movie.id, 1, 50)

        // Transform backend data to match component expectations
        // Backend returns a flat array of reviews
        const userReviewsList = Array.isArray(data) ? data : []
        const transformedReviews = userReviewsList.map((r: any) => ({
          id: r.id || r.external_id,
          userId: r.author?.id || r.user?.id || r.userId || "",
          username: r.author?.name || r.user?.name || "Anonymous",
          avatarUrl: r.author?.avatarUrl || r.user?.avatarUrl || null,
          rating: r.rating,
          verified: r.isVerified || false,
          date: new Date(r.date || r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          content: r.content,
          containsSpoilers: r.hasSpoilers || r.has_spoilers || false,
          helpfulCount: r.helpfulVotes || r.helpful_votes || 0,
          unhelpfulCount: r.unhelpfulVotes || r.unhelpful_votes || 0,
        }))

        setReviews(transformedReviews)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        // Use fallback reviews from movie prop
        setReviews(Array.isArray(movie.reviews) ? movie.reviews : [])
      } finally {
        setIsLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [movie.id, movie.reviews, activeFilter])

  // Find the max count for scaling the distribution bars
  const maxCount = distribution.length ? Math.max(...distribution.map((item) => item.count)) : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const barVariants = {
    hidden: { width: 0 },
    visible: (custom: number) => ({
      width: `${(custom / maxCount) * 100}%`,
      transition: { duration: 0.5, ease: "easeOut" },
    }),
  }

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
    trigger("light")
  }

  const toggleSpoilerVisibility = (reviewId: string) => {
    setVisibleSpoilers((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
    trigger("medium")
  }

  const handleVote = (reviewId: string, voteType: "helpful" | "unhelpful") => {
    setReviewVotes((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] === voteType ? null : voteType,
    }))
    trigger("light")
  }

  const handleDeleteReview = async (reviewId: string) => {
    trigger("heavy")
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return
    }

    setDeletingReviewId(reviewId)
    try {
      await deleteReview(reviewId)
      toast({
        title: "Review deleted",
        description: "Your review has been successfully deleted.",
      })
      // Remove the review from the list
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      trigger("success")
    } catch (error: any) {
      trigger("error")
      toast({
        title: "Error",
        description: error.message || "Failed to delete review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingReviewId(null)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < rating ? "text-[#FFD700] fill-[#FFD700]" : "text-gray-700"}`} />
    ))
  }

  return (
    <motion.section
      className="w-full max-w-7xl mx-auto px-4 py-8 md:py-16 relative z-10"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Section Title */}
      <motion.div className="flex items-center gap-4 mb-8" variants={itemVariants}>
        <div className="h-8 w-1 bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary)]" />
        <h2 className="text-2xl md:text-3xl font-bold font-inter text-white tracking-tight">
          User Reviews
        </h2>
      </motion.div>

      {/* Rating Summary Card - Glassmorphism */}
      <motion.div className="glass-panel rounded-2xl p-6 md:p-8 mb-12" variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column: SidduScore and Count */}
          <div className="flex flex-col items-center md:items-start justify-center">
            <div className="flex items-center gap-6 mb-6">
              <motion.div
                className="relative group"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="bg-black border border-[var(--primary)] text-[var(--primary)] rounded-2xl h-32 w-32 flex flex-col items-center justify-center font-inter shadow-[0_0_30px_-10px_var(--primary)]">
                  <span className="text-5xl font-bold">{movie.sidduScore}</span>
                  <span className="text-xs uppercase tracking-widest mt-1 opacity-80">Siddu Score</span>
                </div>
              </motion.div>
              
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-1">Overall Rating</h3>
                <p className="text-gray-400 font-dmsans text-lg">{movie.reviewCount} Verified Reviews</p>
              </div>
            </div>
            
            <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} className="w-full md:w-auto">
              <Button
                onClick={() => {
                  trigger("light")
                  if (!isAuthenticated()) {
                    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
                  } else {
                    setShowReviewForm(true)
                  }
                }}
                className="w-full md:w-auto bg-[var(--primary)] text-black hover:bg-[var(--primary)]/90 font-bold font-inter h-12 px-8 rounded-xl shadow-[0_0_20px_-5px_var(--primary)]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Distribution and Sentiment */}
          <div className="space-y-8">
            {/* Rating Distribution */}
            <div>
              <h3 className="text-white font-inter font-medium text-lg mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-[var(--secondary)]" /> Rating Breakdown
              </h3>
              <div className="space-y-3">
                {distribution.slice(0, 5).map((item, index) => (
                  <div key={item.rating} className="flex items-center gap-3 group">
                    <span className="text-gray-400 font-mono w-6 text-right text-sm">{item.rating}</span>
                    <div className="h-2 bg-white/5 rounded-full flex-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                        custom={item.count}
                        variants={barVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                      />
                    </div>
                    <span className="text-gray-500 font-mono w-8 text-xs">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div>
              <h3 className="text-white font-inter font-medium text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--primary)]" /> Community Sentiment
              </h3>
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-[var(--primary)] font-bold">{sentiments.positive}% Positive</span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">{sentiments.neutral}% Neutral</span>
                <span className="text-gray-600">|</span>
                <span className="text-[var(--secondary)]">{sentiments.negative}% Negative</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sentiments.keyPhrases.map((phrase, index) => (
                  <motion.span
                    key={index}
                    className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium hover:border-[var(--primary)]/50 hover:text-[var(--primary)] transition-colors cursor-default"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {phrase}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Review Filters */}
      <motion.div className="mb-8" variants={itemVariants}>
        <Tabs defaultValue={activeFilter} onValueChange={(val) => { setActiveFilter(val); trigger("light"); }} className="w-full">
          <TabsList className="bg-transparent border-b border-white/10 w-full justify-start overflow-x-auto pb-0 h-auto p-0 gap-6">
            {["latest", "top", "verified", "spoiler-free"].map((filter) => (
              <TabsTrigger
                key={filter}
                value={filter}
                className="data-[state=active]:text-[var(--primary)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--primary)] data-[state=active]:bg-transparent rounded-none px-0 pb-3 font-inter text-gray-400 hover:text-white transition-colors capitalize bg-transparent"
              >
                {filter.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Review Cards */}
      {isLoadingReviews ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <p className="text-gray-400 font-dmsans text-lg mb-4">No reviews yet</p>
          <p className="text-gray-500 font-dmsans">Be the first to share your thoughts about this movie!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <motion.div key={review.id} variants={itemVariants} custom={index} transition={{ delay: 0.2 + index * 0.1 }}>
              <Card className="bg-[#111] border border-white/5 hover:border-[var(--primary)]/30 transition-all duration-300 h-full flex flex-col group">
                <div className="p-6 flex-1 flex flex-col">
                  {/* Review Header */}
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10">
                        {review.avatarUrl ? (
                          <Image
                            src={review.avatarUrl || "/placeholder.svg"}
                            alt={review.username}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                            {review.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-inter font-bold text-white group-hover:text-[var(--primary)] transition-colors">{review.username}</h4>
                        <span className="text-gray-500 text-xs font-mono">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        {review.verified && (
                          <div className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] px-2 py-0.5 rounded-full flex items-center border border-[var(--primary)]/20">
                            <Check className="w-3 h-3 mr-1" />
                            VERIFIED
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-6 flex-1">
                    {review.containsSpoilers && !visibleSpoilers[review.id] ? (
                      <div className="bg-white/5 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                        <p className="text-[var(--secondary)] font-bold mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[var(--secondary)] animate-pulse" />
                            Spoiler Alert
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-button border-white/10 text-gray-300 hover:text-white"
                          onClick={() => toggleSpoilerVisibility(review.id)}
                        >
                          Reveal Content
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <p
                          className={cn(
                            "text-gray-300 font-dmsans leading-relaxed",
                            !expandedReviews[review.id] && review.content.length > 300 ? "line-clamp-4" : ""
                          )}
                        >
                          {review.content}
                        </p>
                        {review.content.length > 300 && (
                          <button
                            onClick={() => toggleExpandReview(review.id)}
                            className="text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors mt-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                          >
                            {expandedReviews[review.id] ? (
                              <>
                                Show Less <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                Read More <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                        {review.containsSpoilers && visibleSpoilers[review.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-white text-xs mt-2 h-auto p-0"
                            onClick={() => toggleSpoilerVisibility(review.id)}
                          >
                            Hide Spoilers
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Review Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="text-xs font-medium text-gray-500">Helpful?</div>
                    <div className="flex items-center gap-4">
                      <button
                        className={cn(
                            "flex items-center gap-1.5 text-sm transition-colors",
                            reviewVotes[review.id] === "helpful" ? "text-[var(--primary)]" : "text-gray-500 hover:text-white"
                        )}
                        onClick={() => handleVote(review.id, "helpful")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpfulCount + (reviewVotes[review.id] === "helpful" ? 1 : 0)}</span>
                      </button>
                      <button
                        className={cn(
                            "flex items-center gap-1.5 text-sm transition-colors",
                            reviewVotes[review.id] === "unhelpful" ? "text-[var(--secondary)]" : "text-gray-500 hover:text-white"
                        )}
                        onClick={() => handleVote(review.id, "unhelpful")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{review.unhelpfulCount + (reviewVotes[review.id] === "unhelpful" ? 1 : 0)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit/Delete Buttons */}
                  {currentUser?.id === review.userId && (
                    <div className="flex gap-2 pt-3 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setEditingReview(review)
                            trigger("light")
                        }}
                        className="flex-1 border-white/10 hover:bg-white/5 text-gray-300"
                      >
                        <Pencil className="w-3 h-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingReviewId === review.id}
                        className="flex-1 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        {deletingReviewId === review.id ? (
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
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <ReviewForm
            movieId={movie.id}
            movieTitle={movie.title}
            onClose={() => setShowReviewForm(false)}
            onSuccess={() => {
              trigger("success")
              // Refresh reviews logic...
              const fetchReviews = async () => {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
                try {
                  const response = await fetch(`${apiBase}/api/v1/reviews?movieId=${movie.id}&limit=50&sortBy=date_desc`)
                  if (response.ok) {
                    const data = await response.json()
                    const transformedReviews = Array.isArray(data) ? data.map((r: any) => ({
                      id: r.id,
                      userId: r.author?.id || "",
                      username: r.author?.name || "Anonymous",
                      avatarUrl: r.author?.avatarUrl || null,
                      rating: r.rating,
                      verified: r.isVerified || false,
                      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                      content: r.content,
                      containsSpoilers: r.hasSpoilers || false,
                      helpfulCount: r.helpfulVotes || 0,
                      unhelpfulCount: r.unhelpfulVotes || 0,
                    })) : []
                    setReviews(transformedReviews)
                  }
                } catch (error) {
                  console.error("Error refreshing reviews:", error)
                }
              }
              fetchReviews()
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Review Modal */}
      {editingReview && (
        <EditReviewModal
          review={{
            id: editingReview.id,
            title: "",
            content: editingReview.content,
            rating: editingReview.rating,
            hasSpoilers: editingReview.containsSpoilers,
            author: {
              id: editingReview.userId,
              name: editingReview.username,
              avatarUrl: editingReview.avatarUrl || "",
            },
            movie: {
              id: movie.id,
              title: movie.title,
            },
            date: editingReview.date,
            helpfulVotes: editingReview.helpfulCount,
            unhelpfulVotes: editingReview.unhelpfulCount,
            commentCount: 0,
            isVerified: editingReview.verified,
          }}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            trigger("success")
            setEditingReview(null)
            // Refresh reviews logic...
            const fetchReviews = async () => {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
                try {
                  const response = await fetch(`${apiBase}/api/v1/reviews?movieId=${movie.id}&limit=50&sortBy=date_desc`)
                  if (response.ok) {
                    const data = await response.json()
                    const transformedReviews = Array.isArray(data) ? data.map((r: any) => ({
                      id: r.id,
                      userId: r.author?.id || "",
                      username: r.author?.name || "Anonymous",
                      avatarUrl: r.author?.avatarUrl || null,
                      rating: r.rating,
                      verified: r.isVerified || false,
                      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                      content: r.content,
                      containsSpoilers: r.hasSpoilers || false,
                      helpfulCount: r.helpfulVotes || 0,
                      unhelpfulCount: r.unhelpfulVotes || 0,
                    })) : []
                    setReviews(transformedReviews)
                  }
                } catch (error) {
                  console.error("Error refreshing reviews:", error)
                }
              }
              fetchReviews()
          }}
        />
      )}
    </motion.section>
  )
}
