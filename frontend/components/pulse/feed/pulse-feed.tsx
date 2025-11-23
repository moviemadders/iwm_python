'use client'

/**
 * Pulse Feed Component
 * Feed container with infinite scroll
 */

import { motion } from 'framer-motion'
import { PulsePost, PulseComment } from '@/types/pulse'
import PulseCard from '../pulse-card'  // Use the correct PulseCard that matches backend data
import InfiniteScrollTrigger from './infinite-scroll-trigger'
import LoadingSpinner from './loading-spinner'
import EmptyState from './empty-state'

interface PulseFeedProps {
  posts: PulsePost[]
  comments: Record<string, PulseComment[]>
  isLoading: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onEcho: (postId: string, type: 'echo' | 'quote_echo', quoteContent?: string) => void
  onBookmark: (postId: string) => void
  onPulseDeleted?: () => void
}

export default function PulseFeed({
  posts,
  comments,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onLike,
  onComment,
  onEcho,
  onBookmark,
  onPulseDeleted,
}: PulseFeedProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (posts.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Posts */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="flex flex-col gap-4"
      >
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <PulseCard
              pulse={post}
              onReaction={onLike}
              onComment={onComment}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <InfiniteScrollTrigger onIntersect={onLoadMore} isLoading={isLoadingMore} />
      )}

      {/* End Message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[#A0A0A0] font-['DM_Sans']">
          You're all caught up! 🎉
        </div>
      )}
    </div>
  )
}

