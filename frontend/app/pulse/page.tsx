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

// Mock data imports
import { mockPulsePosts } from '@/lib/pulse/mock-pulse-posts'
import { mockTrendingTopics } from '@/lib/pulse/mock-trending-topics'
import { mockSuggestedUsers } from '@/lib/pulse/mock-suggested-users'
import { mockTrendingMovies } from '@/lib/pulse/mock-trending-movies'
import { mockTrendingCricket } from '@/lib/pulse/mock-trending-cricket'
import { mockComments } from '@/lib/pulse/mock-comments'
import { mockCurrentUser, mockUserDailyStats } from '@/lib/pulse/mock-user-stats'

const POSTS_PER_PAGE = 20

export default function PulsePage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you')
  const [posts, setPosts] = useState<PulsePost[]>([])
  const [allPosts, setAllPosts] = useState<PulsePost[]>([])
  const [comments, setComments] = useState<Record<string, PulseComment[]>>({})
  const [pagination, setPagination] = useState({
    page: 1,
    has_more: true,
    is_loading_more: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trendingTopics, setTrendingTopics] = useState(mockTrendingTopics)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      const useBackend = process.env.NEXT_PUBLIC_ENABLE_BACKEND === 'true' && !!apiBase

      try {
        if (useBackend && apiBase) {
          const response = await fetch(`${apiBase}/api/v1/pulse/feed?tab=${activeTab}`)
          if (!response.ok) throw new Error(`Failed: ${response.statusText}`)
          const data = await response.json()
          setAllPosts(data.posts || [])
          setPosts((data.posts || []).slice(0, POSTS_PER_PAGE))
          setComments(data.comments || {})
        } else {
          throw new Error('Backend not configured')
        }
      } catch (err) {
        console.warn('Backend fetch failed, using mock data:', err)

        // Filter posts by tab
        let filteredPosts = [...mockPulsePosts]
        if (activeTab === 'movies') {
          filteredPosts = filteredPosts.filter((post) =>
            post.tagged_items.some((tag) => tag.type === 'movie') ||
            post.content.toLowerCase().includes('movie') ||
            post.content.toLowerCase().includes('film')
          )
        } else if (activeTab === 'cricket') {
          filteredPosts = filteredPosts.filter((post) =>
            post.tagged_items.some((tag) => tag.type === 'cricket_match') ||
            post.content.toLowerCase().includes('cricket')
          )
        }

        console.log('Setting mock posts:', filteredPosts.length, 'posts')
        setAllPosts(filteredPosts)
        setPosts(filteredPosts.slice(0, POSTS_PER_PAGE))
        setComments(mockComments)
        setPagination({
          page: 1,
          has_more: filteredPosts.length > POSTS_PER_PAGE,
          is_loading_more: false,
        })
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab])

  // Fetch trending topics from backend
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      const useBackend = process.env.NEXT_PUBLIC_ENABLE_BACKEND === 'true' && !!apiBase

      if (!useBackend) return

      try {
        const response = await fetch(`${apiBase}/api/v1/pulse/trending-topics?window=7d&limit=5`)
        if (!response.ok) throw new Error('Failed to fetch trending topics')
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setTrendingTopics(data)
        }
      } catch (error) {
        console.warn('Failed to fetch trending topics, using mock data:', error)
      }
    }

    fetchTrendingTopics()
  }, [])


  // Load more posts (infinite scroll)
  const handleLoadMore = () => {
    if (pagination.is_loading_more || !pagination.has_more) return

    setPagination((prev) => ({ ...prev, is_loading_more: true }))

    setTimeout(() => {
      const nextPage = pagination.page + 1
      const startIndex = nextPage * POSTS_PER_PAGE
      const endIndex = startIndex + POSTS_PER_PAGE
      const newPosts = allPosts.slice(startIndex, endIndex)

      setPosts((prev) => [...prev, ...newPosts])
      setPagination({
        page: nextPage,
        has_more: endIndex < allPosts.length,
        is_loading_more: false,
      })
    }, 1000)
  }

  // Refresh feed function
  const refreshFeed = () => {
    // Reload the page to fetch fresh data
    window.location.reload()
  }

  // Handle new post submission
  const handlePostSubmit = (content: string, media: PulseMedia[], taggedItems: TaggedItem[]) => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      const newPost: PulsePost = {
        id: `post-new-${Date.now()}`,
        type: 'original',
        author: mockCurrentUser,
        content,
        media,
        tagged_items: taggedItems,
        like_count: 0,
        comment_count: 0,
        echo_count: 0,
        bookmark_count: 0,
        view_count: 0,
        created_at: new Date().toISOString(),
        is_liked: false,
        is_echoed: false,
        is_bookmarked: false,
      }

      setPosts((prev) => [newPost, ...prev])
      setIsSubmitting(false)
    }, 1000)
  }

  // Handle like
  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            is_liked: !post.is_liked,
            like_count: post.is_liked ? post.like_count - 1 : post.like_count + 1,
          }
          : post
      )
    )
  }

  // Handle comment
  const handleComment = (postId: string, content: string) => {
    const newComment: PulseComment = {
      id: `comment-new-${Date.now()}`,
      post_id: postId,
      author: mockCurrentUser,
      content,
      like_count: 0,
      created_at: new Date().toISOString(),
      is_liked: false,
    }

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }))

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      )
    )
  }

  // Handle echo
  const handleEcho = (postId: string, type: 'echo' | 'quote_echo', quoteContent?: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            is_echoed: true,
            echo_count: post.echo_count + 1,
          }
          : post
      )
    )
  }

  // Handle bookmark
  const handleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
            ...post,
            is_bookmarked: !post.is_bookmarked,
            bookmark_count: post.is_bookmarked
              ? post.bookmark_count - 1
              : post.bookmark_count + 1,
          }
          : post
      )
    )
  }

  // Handle topic click
  const handleTopicClick = (hashtag: string) => {
    console.log('Filter by hashtag:', hashtag)
    // TODO: Implement hashtag filtering
  }

  // Handle follow
  const handleFollow = (userId: string) => {
    console.log('Follow user:', userId)
    // TODO: Implement follow functionality
  }

  return (
    <PulsePageLayout
      leftSidebar={
        <PulseLeftSidebar
          currentUser={mockCurrentUser}
          userStats={mockUserDailyStats}
        />
      }
      mainFeed={
        <PulseMainFeed
          composer={
            <PulseComposer
              currentUser={mockCurrentUser}
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
  )
}
