/**
 * Siddu Pulse Feed - TypeScript Type Definitions
 * Complete type system for the social feed feature
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Pulse user profile with verification and stats
 */
export interface PulseUser {
  id: string
  username: string
  display_name: string
  avatar_url: string
  is_verified: boolean
  bio?: string
  follower_count: number
  following_count: number
  pulse_count: number
  created_at: string
}

/**
 * Current authenticated user with additional stats
 */
export interface CurrentUser extends PulseUser {
  email: string
  notification_count: number
  message_count: number
  bookmark_count: number
}

// ============================================================================
// MEDIA TYPES
// ============================================================================

/**
 * Media type enum
 */
export type MediaType = 'image' | 'video'

/**
 * Media item with metadata
 */
export interface PulseMedia {
  id: string
  type: MediaType
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
  duration?: number // For videos (in seconds)
  alt_text?: string
}

// ============================================================================
// TAGGED ITEM TYPES
// ============================================================================

/**
 * Tagged item type enum
 */
export type TaggedItemType = 'movie' | 'cricket_match'

/**
 * Movie tag
 */
export interface MovieTag {
  type: 'movie'
  id: string
  title: string
  year: number
  poster_url: string
  rating?: number
  genre?: string
}

/**
 * Cricket match tag
 */
export interface CricketMatchTag {
  type: 'cricket_match'
  id: string
  team1: string
  team2: string
  status: 'live' | 'upcoming' | 'completed'
  score?: string
  venue?: string
  start_time?: string
}

/**
 * Union type for all tagged items
 */
export type TaggedItem = MovieTag | CricketMatchTag

// ============================================================================
// POST TYPES
// ============================================================================

/**
 * Post type enum
 */
export type PulsePostType = 'original' | 'echo' | 'quote_echo'

/**
 * Main pulse post interface
 */
/**
 * Pulse user info (matching Backend DTO)
 */
export interface PulseUserInfo {
  id?: string
  username: string
  displayName: string
  avatarUrl: string
  isVerified: boolean
  verificationLevel?: string
  isFollowing?: boolean
}

/**
 * Main pulse post interface (matching Backend DTO)
 */
export interface PulsePost {
  id: string
  userId: string
  userInfo: PulseUserInfo
  content: {
    text: string
    media?: PulseMedia[]
    linkedContent?: {
      type: string
      id: string
      title: string
      posterUrl?: string
    }
    hashtags?: string[]
  }
  engagement: {
    reactions: {
      love: number
      fire: number
      mindblown: number
      laugh: number
      sad: number
      angry: number
      total: number
    }
    userReaction?: string
    comments: number
    shares: number
    hasCommented: boolean
    hasShared: boolean
    hasBookmarked: boolean
  }
  timestamp: string
  editedAt?: string
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

/**
 * Comment on a pulse post
 */
export interface PulseComment {
  id: string
  postId: string
  author: PulseUserInfo
  content: string
  like_count: number
  created_at: string
  is_liked: boolean
}

// ============================================================================
// TRENDING TYPES
// ============================================================================

/**
 * Trending hashtag topic
 */
export interface TrendingTopic {
  id: string
  hashtag: string
  pulse_count: number
  trend_rank: number
  is_rising: boolean
}

/**
 * Suggested user to follow
 */
export interface SuggestedUser {
  user: PulseUser
  reason: string // e.g., "Popular in Movies", "Followed by 3 people you follow"
  mutual_followers_count: number
}

/**
 * Trending movie
 */
export interface TrendingMovie {
  id: string
  title: string
  year: number
  poster_url: string
  rating: number
  genre: string
  pulse_count: number
  trend_rank: number
}

/**
 * Trending cricket match
 */
export interface TrendingCricketMatch {
  id: string
  team1: string
  team2: string
  team1_flag: string
  team2_flag: string
  status: 'live' | 'upcoming' | 'completed'
  score?: string
  venue: string
  start_time: string
  is_live: boolean
}

// ============================================================================
// FEED TYPES
// ============================================================================

/**
 * Feed tab types
 */
export type FeedTab = 'for_you' | 'following' | 'movies' | 'cricket'

/**
 * Feed filter options
 */
export interface FeedFilter {
  tab: FeedTab
  hashtag?: string
  user_id?: string
}

/**
 * Pagination state
 */
export interface PulsePagination {
  page: number
  has_more: boolean
  is_loading_more: boolean
}

// ============================================================================
// COMPOSER TYPES
// ============================================================================

/**
 * Composer state
 */
export interface ComposerState {
  content: string
  media: PulseMedia[]
  tagged_items: TaggedItem[]
  is_submitting: boolean
  is_expanded: boolean
}

/**
 * Character counter state
 */
export interface CharacterCounterState {
  current: number
  max: number
  status: 'safe' | 'warning' | 'error'
}

// ============================================================================
// INTERACTION TYPES
// ============================================================================

/**
 * Like action
 */
export interface LikeAction {
  post_id: string
  is_liked: boolean
}

/**
 * Comment action
 */
export interface CommentAction {
  post_id: string
  content: string
}

/**
 * Echo action
 */
export interface EchoAction {
  post_id: string
  type: 'echo' | 'quote_echo'
  quote_content?: string
}

/**
 * Bookmark action
 */
export interface BookmarkAction {
  post_id: string
  is_bookmarked: boolean
}

// ============================================================================
// STATS TYPES
// ============================================================================

/**
 * User daily activity stats
 */
export interface UserDailyStats {
  pulses_posted: number
  likes_received: number
  new_followers: number
  comments_received: number
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Pulse card props
 */
export interface PulseCardProps {
  post: PulsePost
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onEcho: (postId: string, type: 'echo' | 'quote_echo', quoteContent?: string) => void
  onBookmark: (postId: string) => void
  comments?: PulseComment[]
  isCommentSectionExpanded?: boolean
}

/**
 * Composer props
 */
export interface PulseComposerProps {
  onSubmit: (content: string, media: PulseMedia[], taggedItems: TaggedItem[]) => void
  currentUser: CurrentUser
  isSubmitting?: boolean
}

/**
 * Feed tabs props
 */
export interface FeedTabsProps {
  activeTab: FeedTab
  onTabChange: (tab: FeedTab) => void
}

/**
 * Trending topics props
 */
export interface TrendingTopicsProps {
  topics: TrendingTopic[]
  onTopicClick: (hashtag: string) => void
}

/**
 * Who to follow props
 */
export interface WhoToFollowProps {
  users: SuggestedUser[]
  onFollow: (userId: string) => void
}

/**
 * Trending movies props
 */
export interface TrendingMoviesProps {
  movies: TrendingMovie[]
}

/**
 * Trending cricket props
 */
export interface TrendingCricketProps {
  matches: TrendingCricketMatch[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Feed API response
 */
export interface FeedResponse {
  posts: PulsePost[]
  pagination: {
    current_page: number
    total_pages: number
    has_more: boolean
  }
}

/**
 * Comments API response
 */
export interface CommentsResponse {
  comments: PulseComment[]
  total_count: number
}

/**
 * Trending API response
 */
export interface TrendingResponse {
  topics: TrendingTopic[]
  users: SuggestedUser[]
  movies: TrendingMovie[]
  cricket: TrendingCricketMatch[]
}

