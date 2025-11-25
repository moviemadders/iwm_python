'use client'

/**
 * Pulse Feed Page
 * Main social feed page with composer, tabs, and infinite scroll
 */

import { useState, useEffect } from 'react'
import { FeedTab, PulsePost, PulseComment, PulseMedia, TaggedItem, SuggestedUser } from '@/types/pulse'
import PulsePageLayout from '@/components/pulse/pulse-page-layout'
import PulseLeftSidebar from '@/components/pulse/left-sidebar/pulse-left-sidebar'
import PulseRightSidebar from '@/components/pulse/right-sidebar/pulse-right-sidebar'
import PulseMainFeed from '@/components/pulse/main-feed/pulse-main-feed'
import PulseComposer from '@/components/pulse/composer/pulse-composer'
import FeedTabs from '@/components/pulse/feed/feed-tabs'
import PulseFeed from '@/components/pulse/feed/pulse-feed'
import NoSSR from '@/components/no-ssr'

// Mock data imports
import { mockPulsePosts } from '@/lib/pulse/mock-pulse-posts'
import { mockTrendingTopics } from '@/lib/pulse/mock-trending-topics'
import { mockSuggestedUsers } from '@/lib/pulse/mock-suggested-users'
import { mockTrendingMovies } from '@/lib/pulse/mock-trending-movies'
import { mockTrendingCricket } from '@/lib/pulse/mock-trending-cricket'
import { mockComments } from '@/lib/pulse/mock-comments'
import { mockCurrentUser, mockUserDailyStats } from '@/lib/pulse/mock-user-stats'

import { pulseApi } from '@/lib/api'
import { getCurrentUser, User } from '@/lib/auth'

const POSTS_PER_PAGE = 20

export default function PulsePage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you')
  const [posts, setPosts] = useState<PulsePost[]>([])
  const [allPosts, setAllPosts] = useState<PulsePost[]>([]) // Keep for client-side filtering fallback if needed
  const [comments, setComments] = useState<Record<string, PulseComment[]>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    has_more: true,
    is_loading_more: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trendingTopics, setTrendingTopics] = useState(mockTrendingTopics)
  const [currentUser, setCurrentUser] = useState<any>(mockCurrentUser) // Fallback to mock until loaded

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setCurrentUser({
            ...mockCurrentUser, // Keep mock stats for now if backend doesn't provide them
            id: user.id,
            username: user.username || user.email.split('@')[0],
            display_name: user.name,
            avatar_url: user.avatarUrl || mockCurrentUser.avatar_url,
          })
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      }
    }
    fetchUser()
  }, [])

  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null)

  // Fetch feed data
  const fetchFeed = async (page = 1, refresh = false) => {
    try {
      if (page === 1) setIsLoading(true)

      let filter = 'latest';
      let linkedType: string | undefined = undefined;

      if (activeTab === 'for_you') filter = 'latest';
      else if (activeTab === 'following') filter = 'following';
      else if (activeTab === 'movies') {
        filter = 'latest';
        linkedType = 'movie';
      }
      else if (activeTab === 'cricket') {
        filter = 'latest';
        linkedType = 'cricket';
      }

      console.log('🔍 Fetching feed with params:', { filter, page, limit: POSTS_PER_PAGE, hashtag: selectedHashtag, linkedType })

      const data = await pulseApi.getPulseFeed({
        filter: filter as any,
        page,
        limit: POSTS_PER_PAGE,
        hashtag: selectedHashtag || undefined,
        linkedType
      })

      console.log('✅ Feed data received:', data)

      // API returns array directly
      const newPosts = Array.isArray(data) ? data : (data.posts || [])

      console.log('📊 Parsed posts:', newPosts.length, 'posts')

      if (refresh || page === 1) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }

      setPagination(prev => ({
        ...prev,
        has_more: newPosts.length === POSTS_PER_PAGE,
        page: page + 1,
        is_loading_more: false
      }))

    } catch (err) {
      console.error('❌ Failed to fetch feed:', err)
      console.error('Error details:', err instanceof Error ? err.message : String(err))

      // Show empty state instead of falling back to mock data
      if (page === 1) {
        setPosts([])
        setPagination({ page: 1, has_more: false, is_loading_more: false })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed(1, true)
  }, [activeTab, selectedHashtag])

  // Fetch trending topics
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const topics = await pulseApi.getTrendingTopics('7d', 10)
        if (topics && topics.length > 0) {
          setTrendingTopics(topics)
        }
      } catch (err) {
        console.warn('Failed to fetch trending topics', err)
      }
    }
    fetchTrending()
  }, [])


  // Load more posts
  const handleLoadMore = () => {
    if (pagination.is_loading_more || !pagination.has_more) return
    setPagination((prev) => ({ ...prev, is_loading_more: true }))
    fetchFeed(pagination.page + 1)
  }

  // Refresh feed
  const refreshFeed = () => {
    fetchFeed(1, true)
  }

  // Handle new post submission
  const handlePostSubmit = async (content: string, media: PulseMedia[], taggedItems: TaggedItem[]) => {
    setIsSubmitting(true)
    try {
      await pulseApi.createPulse({
        contentText: content,
        contentMedia: media.map(m => typeof m === 'string' ? m : JSON.stringify(m)),
        linkedMovieId: taggedItems.find(t => t.type === 'movie')?.id,
        hashtags: content.match(/#[a-zA-Z0-9_]+/g) || []
      })
      refreshFeed()
    } catch (err) {
      console.error('Failed to create post:', err)
      alert('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle like
  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !!post.engagement.userReaction;
          return {
            ...post,
            engagement: {
              ...post.engagement,
              userReaction: isLiked ? undefined : 'love',
              reactions: {
                ...post.engagement.reactions,
                total: isLiked ? post.engagement.reactions.total - 1 : post.engagement.reactions.total + 1,
                love: isLiked ? post.engagement.reactions.love - 1 : post.engagement.reactions.love + 1
              }
            }
          }
        }
        return post;
      })
    )

    try {
      await pulseApi.toggleReaction(postId, 'love')
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
      // Revert on error?
      refreshFeed() // Sync with server
    }
  }

  // Handle comment
  const handleComment = async (postId: string, content: string) => {
    try {
      const newComment = await pulseApi.addComment(postId, content)

      // Update comments state
      setComments((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }))

      // Update post comment count
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
              ...post,
              engagement: {
                ...post.engagement,
                comments: post.engagement.comments + 1,
                hasCommented: true
              }
            }
            : post
        )
      )
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  // Handle echo (Share)
  const handleEcho = async (postId: string, type: 'echo' | 'quote_echo', quoteContent?: string) => {
    try {
      await pulseApi.sharePulse(postId)
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
              ...post,
              engagement: {
                ...post.engagement,
                shares: post.engagement.shares + 1,
                hasShared: true
              }
            }
            : post
        )
      )
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  // Handle bookmark
  const handleBookmark = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newBookmarked = !post.engagement.hasBookmarked
          return {
            ...post,
            engagement: {
              ...post.engagement,
              hasBookmarked: newBookmarked
            }
          }
        }
        return post
      })
    )

    try {
      const post = posts.find(p => p.id === postId)
      if (post?.engagement.hasBookmarked) {
        await pulseApi.unbookmarkPulse(postId)
      } else {
        await pulseApi.bookmarkPulse(postId)
      }
    } catch (err) {
      console.error('Failed to bookmark:', err)
      refreshFeed()
    }
  }

  // Handle topic click
  const handleTopicClick = (hashtag: string) => {
    console.log('Filter by hashtag:', hashtag)
    if (selectedHashtag === hashtag) {
      setSelectedHashtag(null) // Toggle off
    } else {
      setSelectedHashtag(hashtag)
    }
  }

  // Handle follow
  const handleFollow = async (username: string) => {
    try {
      await pulseApi.followUser(username)
      // Optimistically update suggested users or show toast
      // For now, just log success
      console.log('Followed user:', username)
      // Ideally we should update the suggestedUsers list to remove the followed user or mark as followed
      // But suggestedUsers is currently mock data.
    } catch (err) {
      console.error('Failed to follow user:', err)
    }
  }

  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>(mockSuggestedUsers)

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const users = await pulseApi.getSuggestedUsers(5)
        if (users && users.length > 0) {
          // Map backend user to PulseUser
          const mappedUsers: SuggestedUser[] = users.map((u: any) => ({
            user: {
              id: u.id,
              username: u.username,
              display_name: u.name,
              avatar_url: u.avatarUrl || '/placeholder.svg?height=50&width=50',
              is_verified: u.isVerified || false,
              bio: u.bio,
              follower_count: u.stats?.followers || 0,
              following_count: u.stats?.following || 0,
              pulse_count: 0, // Not returned by backend yet
              created_at: u.joinedDate
            },
            reason: "Suggested for you", // Static reason for now
            mutual_followers_count: 0 // Not implemented yet
          }))
          setSuggestedUsers(mappedUsers)
        }
      } catch (err) {
        console.warn('Failed to fetch suggested users', err)
      }
    }
    fetchSuggested()
  }, [])

  return (
    <NoSSR>
      <PulsePageLayout
        leftSidebar={
          <PulseLeftSidebar
            currentUser={currentUser}
            userStats={mockUserDailyStats}
          />
        }
        mainFeed={
          <PulseMainFeed
            composer={
              <PulseComposer
                currentUser={currentUser}
                onSubmit={handlePostSubmit}
                isSubmitting={isSubmitting}
                onPulseCreated={refreshFeed}
              />
            }
            tabs={<FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />}
            feed={
              <PulseFeed
                posts={posts}
                comments={comments}
                isLoading={isLoading}
                hasMore={pagination.has_more}
                isLoadingMore={pagination.is_loading_more}
                onLoadMore={handleLoadMore}
                onLike={handleLike}
                onComment={handleComment}
                onEcho={handleEcho}
                onBookmark={handleBookmark}
                onPulseDeleted={refreshFeed}
              />
            }
          />
        }
        rightSidebar={
          <PulseRightSidebar
            trendingTopics={trendingTopics}
            suggestedUsers={suggestedUsers}
            trendingMovies={mockTrendingMovies}
            trendingCricket={mockTrendingCricket}
            onTopicClick={handleTopicClick}
            onFollow={handleFollow}
          />
        }
      />
    </NoSSR>
  )
}

