/**
 * TypeScript type definitions for Movie Reviews Page
 * Consolidates Official Siddu Review, Critic Reviews, and User Reviews
 */

// ============================================================================
// OFFICIAL SIDDU REVIEW TYPES
// ============================================================================

export interface OfficialReview {
  id: number
  movie_id: number
  author: {
    name: string
    title: string
    avatar_url: string
  }
  rating: number // 0-10
  content: string // Rich text (Markdown or HTML)
  published_at: string // ISO 8601
  read_time_minutes: number
  featured_image_url?: string
  embedded_media?: EmbeddedMedia[]
}

export interface EmbeddedMedia {
  type: 'image' | 'video'
  url: string
  caption?: string
}

// ============================================================================
// CRITIC REVIEW TYPES (Reusing from types/critic.ts)
// ============================================================================

export interface CriticReviewCard {
  id: number
  movie_id: number
  critic: {
    username: string
    display_name: string
    avatar_url: string
    is_verified: boolean
  }
  rating: number // 0-10
  excerpt: string // 150 chars max
  slug: string
  published_at: string
}

// ============================================================================
// USER REVIEW TYPES
// ============================================================================

export interface UserReview {
  id: number
  movie_id: number
  user: {
    username: string
    display_name: string
    avatar_url: string
    is_verified: boolean
  }
  rating: number // 1-5 stars
  content: string
  contains_spoilers: boolean
  helpful_count: number
  unhelpful_count: number
  comment_count: number
  created_at: string
  user_vote?: 'helpful' | 'unhelpful' | null
  gif_url?: string | null
}

// ============================================================================
// REVIEW STATISTICS TYPES
// ============================================================================

export interface ReviewStats {
  siddu_score: number // 0-10 (weighted average)
  total_reviews: {
    official: number
    critics: number
    users: number
  }
  rating_distribution: {
    5: RatingDistributionItem
    4: RatingDistributionItem
    3: RatingDistributionItem
    2: RatingDistributionItem
    1: RatingDistributionItem
  }
  sentiment_analysis: {
    positive: number // percentage
    neutral: number
    negative: number
  }
  top_keywords: Keyword[]
}

export interface RatingDistributionItem {
  count: number
  percentage: number
}

export interface Keyword {
  keyword: string
  count: number
  sentiment: 'positive' | 'neutral' | 'negative'
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'
export type VerificationFilter = 'all' | 'verified' | 'unverified'
export type SpoilerFilter = 'show_all' | 'hide_spoilers'

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'highest_rated'
  | 'lowest_rated'
  | 'most_helpful'
  | 'most_comments'

export interface ReviewFilters {
  rating: RatingFilter
  verification: VerificationFilter
  spoilers: SpoilerFilter
}

// ============================================================================
// TAB TYPES
// ============================================================================

export type ReviewTab = 'siddu' | 'critics' | 'users'

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationState {
  page: number
  hasMore: boolean
  isLoadingMore: boolean
}

// ============================================================================
// MOVIE CONTEXT TYPES
// ============================================================================

export interface MovieContext {
  id: number
  external_id: string
  title: string
  year: string
  poster_url: string
  backdrop_url?: string
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface ReviewHeaderProps {
  movie: MovieContext
}

export interface VoiceOfSidduSummaryProps {
  stats: ReviewStats
}

export interface ReviewTabsProps {
  activeTab: ReviewTab
  onTabChange: (tab: ReviewTab) => void
  reviewCounts: {
    official: number
    critics: number
    users: number
  }
}

export interface SidduReviewTabProps {
  review: OfficialReview | null
  isLoading: boolean
}

export interface CriticReviewsTabProps {
  reviews: CriticReviewCard[]
  isLoading: boolean
}

export interface UserReviewsTabProps {
  reviews: UserReview[]
  isLoading: boolean
  filters: ReviewFilters
  sortBy: SortOption
  searchQuery: string
  pagination: PaginationState
  onFilterChange: (filters: ReviewFilters) => void
  onSortChange: (sort: SortOption) => void
  onSearchChange: (query: string) => void
  onLoadMore: () => void
  currentUserId?: number
}

export interface ReviewFilterBarProps {
  filters: ReviewFilters
  sortBy: SortOption
  searchQuery: string
  onFilterChange: (filters: ReviewFilters) => void
  onSortChange: (sort: SortOption) => void
  onSearchChange: (query: string) => void
}

export interface UserReviewCardProps {
  review: UserReview
  isCurrentUser: boolean
  onHelpfulClick: (reviewId: number) => void
  onUnhelpfulClick: (reviewId: number) => void
}

export interface CriticReviewCardProps {
  review: CriticReviewCard
}

export interface OfficialReviewCardProps {
  review: OfficialReview
}

export interface WriteReviewFABProps {
  movieId: string
  isLoggedIn: boolean
  hasReviewed: boolean
  requiresQuiz: boolean
}

export interface RatingDistributionChartProps {
  distribution: ReviewStats['rating_distribution']
}

export interface SentimentAnalysisChartProps {
  sentiment: ReviewStats['sentiment_analysis']
}

export interface KeywordTagCloudProps {
  keywords: Keyword[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ReviewsPageData {
  movie: MovieContext
  official_review: OfficialReview | null
  critic_reviews: CriticReviewCard[]
  user_reviews: UserReview[]
  stats: ReviewStats
  current_user_id?: number
  user_has_reviewed: boolean
  requires_quiz: boolean
}

