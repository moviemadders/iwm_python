"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Edit, ThumbsUp, ThumbsDown, Star, ChevronDown, ChevronUp, Check, Pencil, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReviewForm } from "@/components/review-form"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { getMovieReviews, deleteReview } from "@/lib/api/reviews"
import { useToast } from "@/hooks/use-toast"
import { EditReviewModal } from "@/components/reviews/edit-review-modal"

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
  }

  const toggleSpoilerVisibility = (reviewId: string) => {
    setVisibleSpoilers((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleVote = (reviewId: string, voteType: "helpful" | "unhelpful") => {
    setReviewVotes((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] === voteType ? null : voteType,
    }))
  }

  const handleDeleteReview = async (reviewId: string) => {
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
    } catch (error: any) {
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
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-[#FFD700] fill-[#FFD700]" : "text-[#3A3A3A]"}`} />
    ))
  }

  return (
    <motion.section
      className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Section Title */}
      <motion.h2 className="text-2xl md:text-3xl font-bold font-inter text-[#E0E0E0] mb-6" variants={itemVariants}>
        Reviews
      </motion.h2>

      {/* Rating Summary */}
      <motion.div className="bg-[#151515] rounded-lg p-6 md:p-8 mb-8" variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: SidduScore and Count */}
          <div className="flex flex-col items-center md:items-start">
            <motion.div
              className="bg-[#00BFFF] text-[#1A1A1A] rounded-full h-24 w-24 flex items-center justify-center font-inter font-bold text-4xl mb-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
            >
              {movie.sidduScore}
            </motion.div>
            <p className="text-[#E0E0E0] font-dmsans text-lg mb-2">{movie.reviewCount} Verified Reviews</p>
            <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }} className="mt-4 md:mt-auto">
              <Button
                onClick={() => {
                  if (!isAuthenticated()) {
                    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname)
                  } else {
                    setShowReviewForm(true)
                  }
                }}
                className="bg-[#00BFFF] text-[#1A1A1A] hover:bg-[#00A3DD] font-inter"
              >
                <Edit className="mr-2 h-4 w-4" />
                Write a Review
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Distribution and Sentiment */}
          <div>
            {/* Rating Distribution */}
            <div className="mb-6">
              <h3 className="text-[#E0E0E0] font-inter font-medium text-lg mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {distribution.map((item, index) => (
                  <div key={item.rating} className="flex items-center gap-2">
                    <span className="text-[#A0A0A0] font-dmsans w-6 text-right">{item.rating}</span>
                    <div className="h-4 bg-[#282828] rounded-full flex-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-[#00BFFF]"
                        custom={item.count}
                        variants={barVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                      />
                    </div>
                    <span className="text-[#A0A0A0] font-dmsans w-10">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment Analysis */}
            <div>
              <h3 className="text-[#E0E0E0] font-inter font-medium text-lg mb-3">What People Are Saying</h3>
              <div className="flex gap-2 mb-3">
                <span className="text-[#00BFFF] font-dmsans">{sentiments.positive}% Positive</span>
                <span className="text-[#A0A0A0]">•</span>
                <span className="text-[#E0E0E0] font-dmsans">{sentiments.neutral}% Neutral</span>
                <span className="text-[#A0A0A0]">•</span>
                <span className="text-[#FF4500] font-dmsans">{sentiments.negative}% Negative</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sentiments.keyPhrases.map((phrase, index) => (
                  <motion.span
                    key={index}
                    className="bg-[#282828] text-[#E0E0E0] px-3 py-1 rounded-full text-sm font-dmsans"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
      <motion.div className="mb-6" variants={itemVariants}>
        <Tabs defaultValue={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <TabsList className="bg-[#1A1A1A] border-b border-[#282828] w-full justify-start overflow-x-auto pb-1 scrollbar-hide">
            <TabsTrigger
              value="latest"
              className="data-[state=active]:text-[#00BFFF] data-[state=active]:border-b-2 data-[state=active]:border-[#00BFFF] rounded-none px-4 font-inter"
            >
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="top"
              className="data-[state=active]:text-[#00BFFF] data-[state=active]:border-b-2 data-[state=active]:border-[#00BFFF] rounded-none px-4 font-inter"
            >
              Top Rated
            </TabsTrigger>
            <TabsTrigger
              value="verified"
              className="data-[state=active]:text-[#00BFFF] data-[state=active]:border-b-2 data-[state=active]:border-[#00BFFF] rounded-none px-4 font-inter"
            >
              Verified
            </TabsTrigger>
            <TabsTrigger
              value="spoiler-free"
              className="data-[state=active]:text-[#00BFFF] data-[state=active]:border-b-2 data-[state=active]:border-[#00BFFF] rounded-none px-4 font-inter"
            >
              Spoiler Free
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Review Cards */}
      {isLoadingReviews ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#282828] border-t-[#00BFFF] rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#A0A0A0] font-dmsans text-lg mb-4">No reviews yet</p>
          <p className="text-[#A0A0A0] font-dmsans">Be the first to share your thoughts about this movie!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review, index) => (
            <motion.div key={review.id} variants={itemVariants} custom={index} transition={{ delay: 0.2 + index * 0.1 }}>
              <Card className="bg-[#282828] border-none shadow-md hover:bg-[#2A2A2A] transition-colors">
                <div className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#3A3A3A]">
                        {review.avatarUrl ? (
                          <Image
                            src={review.avatarUrl || "/placeholder.svg"}
                            alt={review.username}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                            {review.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-inter font-medium text-[#E0E0E0] mr-2">{review.username}</h4>
                        {review.verified && (
                          <div className="bg-[#00BFFF]/10 text-[#00BFFF] text-xs px-2 py-0.5 rounded-full flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className="flex mr-3">{renderStars(review.rating)}</div>
                        <span className="text-[#A0A0A0] text-sm font-dmsans">{review.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    {review.containsSpoilers && !visibleSpoilers[review.id] ? (
                      <div className="bg-[#1A1A1A] p-4 rounded-md">
                        <p className="text-[#A0A0A0] font-dmsans mb-2">This review contains spoilers</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#3A3A3A] text-[#E0E0E0] hover:bg-[#3A3A3A] font-dmsans"
                          onClick={() => toggleSpoilerVisibility(review.id)}
                        >
                          Show Spoilers
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p
                          className={`text-[#E0E0E0] font-dmsans ${!expandedReviews[review.id] && review.content.length > 300 ? "line-clamp-4" : ""
                            }`}
                        >
                          {review.content}
                        </p>
                        {review.content.length > 300 && (
                          <button
                            onClick={() => toggleExpandReview(review.id)}
                            className="text-[#00BFFF] hover:text-[#00A3DD] transition-colors mt-2 font-dmsans text-sm flex items-center"
                          >
                            {expandedReviews[review.id] ? (
                              <>
                                Show Less <ChevronUp className="ml-1 w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Read More <ChevronDown className="ml-1 w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                        {review.containsSpoilers && visibleSpoilers[review.id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#3A3A3A] text-[#E0E0E0] hover:bg-[#3A3A3A] font-dmsans mt-2"
                            onClick={() => toggleSpoilerVisibility(review.id)}
                          >
                            Hide Spoilers
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Review Footer */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-dmsans text-[#A0A0A0]">Was this review helpful?</div>
                    <div className="flex items-center gap-4">
                      <button
                        className={`flex items-center gap-1 ${reviewVotes[review.id] === "helpful" ? "text-[#00BFFF]" : "text-[#A0A0A0]"
                          } hover:text-[#00BFFF] transition-colors`}
                        onClick={() => handleVote(review.id, "helpful")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpfulCount + (reviewVotes[review.id] === "helpful" ? 1 : 0)}</span>
                      </button>
                      <button
                        className={`flex items-center gap-1 ${reviewVotes[review.id] === "unhelpful" ? "text-[#FF4500]" : "text-[#A0A0A0]"
                          } hover:text-[#FF4500] transition-colors`}
                        onClick={() => handleVote(review.id, "unhelpful")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{review.unhelpfulCount + (reviewVotes[review.id] === "unhelpful" ? 1 : 0)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Edit/Delete Buttons - Only show if user owns the review */}
                  {currentUser?.id === review.userId && (
                    <div className="flex gap-2 pt-3 border-t border-[#3A3A3A] mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingReview(review)}
                        className="flex-1 border-[#3A3A3A] hover:bg-[#3A3A3A]"
                      >
                        <Pencil className="w-3 h-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingReviewId === review.id}
                        className="flex-1"
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
              // Refresh reviews after successful submission
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
            setEditingReview(null)
            // Refresh reviews
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
