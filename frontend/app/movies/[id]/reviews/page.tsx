"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"

// Import types
import type {
  ReviewTab,
  ReviewFilters,
  SortOption,
  PaginationState,
  OfficialReview,
  CriticReviewCard,
  UserReview,
  ReviewStats,
  MovieContext,
} from "@/types/review-page"

// Import API client
import { getMovieReviews, getReviewStats } from "@/lib/api/reviews"
import { getCurrentUser } from "@/lib/auth"

import { getApiUrl } from "@/lib/api-config"

// Import components (will be created next)
import ReviewHeader from "@/components/review-page/review-header"
import VoiceOfSidduSummary from "@/components/review-page/voice-of-siddu-summary"
import ReviewTabs from "@/components/review-page/review-tabs"
import SidduReviewTab from "@/components/review-page/siddu-review-tab"
import CriticReviewsTab from "@/components/review-page/critic-reviews-tab"
import UserReviewsTab from "@/components/review-page/user-reviews-tab"
import WriteReviewFAB from "@/components/review-page/write-review-fab"

export default function ReviewsPage() {
  const params = useParams()
  const movieId = params.id as string

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<ReviewTab>("siddu")

  // Data Loading
  const [isLoading, setIsLoading] = useState(true)
  const [movie, setMovie] = useState<MovieContext | null>(null)
  const [officialReview, setOfficialReview] = useState<OfficialReview | null>(null)
  const [criticReviews, setCriticReviews] = useState<CriticReviewCard[]>([])
  const [userReviews, setUserReviews] = useState<UserReview[]>([])
  const [allUserReviews, setAllUserReviews] = useState<UserReview[]>([]) // For filtering
  const [stats, setStats] = useState<ReviewStats | null>(null)

  // User Context
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined)
  const [userHasReviewed, setUserHasReviewed] = useState(false)
  const [requiresQuiz, setRequiresQuiz] = useState(false)

  // User Reviews Tab State
  const [filters, setFilters] = useState<ReviewFilters>({
    rating: "all",
    verification: "all",
    spoilers: "show_all",
  })
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    hasMore: true,
    isLoadingMore: false,
  })

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Fetch current user
        let user = null
        try {
          user = await getCurrentUser()
          setCurrentUserId(user?.id)
        } catch (error) {
          console.log("User not authenticated or getCurrentUser failed:", error)
          setCurrentUserId(undefined)
        }

        // Fetch movie data first
        const apiBase = getApiUrl()
        const movieResponse = await fetch(`${apiBase}/api/v1/movies/${movieId}`)
        let movieData = null
        if (movieResponse.ok) {
          movieData = await movieResponse.json()
          setMovie({
            id: movieData.id || movieId,
            title: movieData.title || "Movie",
            year: movieData.year || new Date().getFullYear(),
            posterUrl: movieData.poster_url || "/placeholder.svg",
            backdropUrl: movieData.backdrop_url || "/placeholder.svg",
            genres: movieData.genres || [],
            runtime: movieData.runtime || 0,
            director: movieData.director || "Unknown",
          })
        }

        // Fetch movie reviews from backend
        console.log("Fetching reviews for movie:", movieId)
        const reviewsData = await getMovieReviews(movieId, 1, 100)
        console.log("Reviews data received:", reviewsData)

        // Transform backend data to match component expectations
        if (reviewsData && Array.isArray(reviewsData)) {
          // Backend returns an array of reviews, categorize them
          const allReviews = reviewsData

          // Separate reviews by type (for now, all are user reviews since we don't have critic/official distinction)
          const userReviewsList = allReviews.map((review: any) => ({
            id: review.id,
            movie_id: movieId,
            user: {
              username: review.author.id, // Using ID as username for now
              display_name: review.author.name,
              avatar_url: review.author.avatarUrl || "/placeholder.svg",
              is_verified: review.isVerified || false,
            },
            rating: review.rating,
            content: review.content,
            contains_spoilers: review.hasSpoilers || false,
            helpful_count: review.helpfulVotes || 0,
            unhelpful_count: review.unhelpfulVotes || 0,
            comment_count: review.commentCount || 0,
            created_at: review.date,
            user_vote: null,
            gif_url: review.gifUrl || null,
          }))

          // Movie context already set from movieData fetch above
          // Only update if we didn't get movie data earlier
          if (!movieData && allReviews.length > 0 && allReviews[0].movie) {
            setMovie({
              id: allReviews[0].movie.id || movieId,
              title: allReviews[0].movie.title || "Movie",
              year: allReviews[0].movie.year || new Date().getFullYear(),
              posterUrl: allReviews[0].movie.posterUrl || "/placeholder.svg",
              backdropUrl: "/placeholder.svg",
              genres: allReviews[0].movie.genres || [],
              runtime: 0,
              director: "Unknown",
            })
          }

          // Set official review (none for now)
          setOfficialReview(null)

          // Fetch critic reviews
          try {
            const criticReviewsRes = await fetch(`${apiBase}/api/v1/critic-reviews/movie/${movieId}`)
            if (criticReviewsRes.ok) {
              const criticReviewsData = await criticReviewsRes.json()
              const criticReviewsList = (Array.isArray(criticReviewsData) ? criticReviewsData : []).map((review: any) => ({
                id: review.id,
                title: review.title,
                content: review.content,
                rating: review.numeric_rating || 0,
                critic: {
                  username: review.critic.username,
                  display_name: review.critic.display_name,
                  avatar_url: review.critic.logo_url,
                  is_verified: review.critic.is_verified,
                },
                published_at: review.published_at,
                view_count: review.view_count,
                like_count: review.like_count,
              }))
              setCriticReviews(criticReviewsList)
            }
          } catch (err) {
            console.warn("Failed to fetch critic reviews:", err)
            setCriticReviews([])
          }

          // Set user reviews
          setAllUserReviews(userReviewsList)
          setUserReviews(userReviewsList.slice(0, 20))

          // Calculate stats from reviews
          const totalReviews = userReviewsList.length
          const averageRating = totalReviews > 0
            ? userReviewsList.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
            : 0

          setStats({
            siddu_score: averageRating,
            totalReviews,
            averageRating,
            ratingDistribution: {},
            verifiedCount: userReviewsList.filter((r: any) => r.isVerified).length,
            sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
            total_reviews: {
              official: 0,
              critics: 0,
              users: totalReviews,
            },
          })

          // Check if current user has reviewed
          if (user) {
            const hasReviewed = userReviewsList.some((review: any) => review.user.username === user.id)
            setUserHasReviewed(hasReviewed)
          }

          setRequiresQuiz(false)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)

        // Set minimal fallback data
        setMovie({
          id: movieId,
          title: "Movie",
          year: new Date().getFullYear(),
          posterUrl: "/placeholder.svg",
          backdropUrl: "/placeholder.svg",
          genres: [],
          runtime: 0,
          director: "Unknown",
        })
        setOfficialReview(null)
        setCriticReviews([])
        setAllUserReviews([])
        setUserReviews([])
        setStats({
          siddu_score: 0,
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {},
          verifiedCount: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          total_reviews: {
            official: 0,
            critics: 0,
            users: 0,
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [movieId])

  // ============================================================================
  // FILTER & SORT LOGIC
  // ============================================================================

  useEffect(() => {
    let filtered = [...allUserReviews]

    // Apply rating filter
    if (filters.rating !== "all") {
      filtered = filtered.filter((review) => review.rating === Number(filters.rating))
    }

    // Apply verification filter
    if (filters.verification === "verified") {
      filtered = filtered.filter((review) => review.user.is_verified)
    } else if (filters.verification === "unverified") {
      filtered = filtered.filter((review) => !review.user.is_verified)
    }

    // Apply spoiler filter
    if (filters.spoilers === "hide_spoilers") {
      filtered = filtered.filter((review) => !review.contains_spoilers)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (review) =>
          review.content.toLowerCase().includes(query) ||
          review.user.display_name.toLowerCase().includes(query) ||
          review.user.username.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "highest_rated":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "lowest_rated":
        filtered.sort((a, b) => a.rating - b.rating)
        break
      case "most_helpful":
        filtered.sort((a, b) => b.helpful_count - a.helpful_count)
        break
      case "most_comments":
        filtered.sort((a, b) => b.comment_count - a.comment_count)
        break
    }

    // Update user reviews with first page
    setUserReviews(filtered.slice(0, 20))
    setPagination({
      page: 1,
      hasMore: filtered.length > 20,
      isLoadingMore: false,
    })
  }, [filters, sortBy, searchQuery, allUserReviews])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFilterChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleLoadMore = () => {
    // Implement infinite scroll
    setPagination((prev) => ({ ...prev, isLoadingMore: true }))

    setTimeout(() => {
      const nextPage = pagination.page + 1
      const startIndex = nextPage * 20
      const endIndex = startIndex + 20

      // Apply same filters to get filtered list
      let filtered = [...allUserReviews]
      // ... apply same filter logic as above ...

      const newReviews = filtered.slice(startIndex, endIndex)
      setUserReviews((prev) => [...prev, ...newReviews])
      setPagination({
        page: nextPage,
        hasMore: endIndex < filtered.length,
        isLoadingMore: false,
      })
    }, 500)
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading || !movie || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1A1A1A]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#00BFFF] border-r-transparent"></div>
          <p className="mt-4 text-[#E0E0E0]">Loading reviews...</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Header */}
      <ReviewHeader movie={movie} />

      {/* Voice of Siddu Verse Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <VoiceOfSidduSummary stats={stats} />
      </motion.div>

      {/* Tabbed Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReviewTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          reviewCounts={{
            official: stats?.total_reviews?.official || 0,
            critics: stats?.total_reviews?.critics || 0,
            users: stats?.total_reviews?.users || 0,
          }}
        />

        {/* Tab Content */}
        <div className="mt-8 pb-24">
          {activeTab === "siddu" && <SidduReviewTab review={officialReview} isLoading={false} />}

          {activeTab === "critics" && <CriticReviewsTab reviews={criticReviews} isLoading={false} />}

          {activeTab === "users" && (
            <UserReviewsTab
              reviews={userReviews}
              isLoading={false}
              filters={filters}
              sortBy={sortBy}
              searchQuery={searchQuery}
              pagination={pagination}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onSearchChange={handleSearchChange}
              onLoadMore={handleLoadMore}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>

      {/* Write Review FAB */}
      <WriteReviewFAB
        movieId={movieId}
        isLoggedIn={!!currentUserId}
        hasReviewed={userHasReviewed}
        requiresQuiz={requiresQuiz}
      />
    </div>
  )
}

