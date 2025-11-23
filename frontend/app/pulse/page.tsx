'use client'

/**
 * Pulse Feed Page
 * Main social feed page with composer, tabs, and infinite scroll
 */

import { useState, useEffect } from 'react'
import { FeedTab, PulsePost, PulseComment, PulseMedia, TaggedItem } from '@/types/pulse'
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

  // Fetch feed data
  const fetchFeed = async (page = 1, refresh = false) => {
    try {
      if (page === 1) setIsLoading(true)

      const data = await pulseApi.getPulseFeed({
        filter: activeTab === 'for_you' ? 'latest' : activeTab as any,
        page,
        limit: POSTS_PER_PAGE
      })

      if (refresh || page === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }

      setPagination({
        page: data.pagination?.current_page || page,
        has_more: data.pagination?.has_more ?? (data.posts?.length === POSTS_PER_PAGE),
        is_loading_more: false
      })
    } catch (err) {
      console.error('Failed to fetch feed:', err)
      // Fallback to mock data on error? Or just show error?
      // For now, let's keep the mock fallback for smoother dev experience if backend is down
      if (page === 1) {
        // Filter posts by tab (mock logic)
        let filteredPosts = [...mockPulsePosts]
        if (activeTab === 'movies') {
          filteredPosts = filteredPosts.filter((post) =>
            post.content.linkedContent?.type === 'movie' ||
            post.content.text.toLowerCase().includes('movie')
          )
        } else if (activeTab === 'cricket') {
          filteredPosts = filteredPosts.filter((post) =>
            post.content.linkedContent?.type === 'cricket_match' ||
            post.content.text.toLowerCase().includes('cricket')
          )
        }
        setPosts(filteredPosts.slice(0, POSTS_PER_PAGE))
        setPagination({ page: 1, has_more: false, is_loading_more: false })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed(1, true)
  }, [activeTab])

  // Fetch trending topics
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // We don't have a dedicated trending API yet in the client, but let's assume we might
        // For now, keep mock trending
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
        contentMedia: media.map(m => JSON.stringify(m)), // Backend expects strings? Or we need to fix backend to accept objects?
        // Backend expects contentMedia as List[str]. Let's assume URLs for now.
        // But wait, our backend model stores JSON string for media.
        // The create endpoint expects List[str].
        // Let's just send empty list for now as media upload isn't fully implemented
        linkedMovieId: taggedItems.find(t => t.type === 'movie')?.id,
        hashtags: [] // TODO: Extract hashtags
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
    // TODO: Implement hashtag filtering
  }

  // Handle follow
  const handleFollow = async (userId: string) => {
    // This is tricky because userId here might be ID or username depending on context
    // Our API expects username.
    // Let's assume for now we don't implement follow from the sidebar suggestions yet as they are mock data
    console.log('Follow user:', userId)
  }

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
            suggestedUsers={mockSuggestedUsers}
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

