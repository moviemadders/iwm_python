'use client'

/**
 * Comment List Component
 * Displays comments with pagination
 */

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { CommentResponse } from '@/lib/api/comments'

interface CommentListProps {
    comments: CommentResponse[]
    currentUserId?: string
    onDelete?: (commentId: string) => Promise<void>
    onLoadMore?: () => void
    hasMore?: boolean
    isLoadingMore?: boolean
}

export default function CommentList({
    comments,
    currentUserId,
    onDelete,
    onLoadMore,
    hasMore = false,
    isLoadingMore = false,
}: CommentListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (commentId: string) => {
        if (!onDelete) return
        setDeletingId(commentId)
        try {
            await onDelete(commentId)
        } finally {
            setDeletingId(null)
        }
    }

    if (comments.length === 0) {
        return (
            <div className="text-center text-[#A0A0A0] py-8">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {comments.map((comment) => (
                    <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3"
                    >
                        {/* Avatar */}
                        <img
                            src={comment.user.avatarUrl || '/placeholder.svg'}
                            alt={comment.user.displayName}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                        />

                        {/* Comment Content */}
                        <div className="flex-1 bg-[#1A1A1A] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[#E0E0E0]">
                                        {comment.user.displayName}
                                    </span>
                                    <span className="text-xs text-[#A0A0A0]">
                                        @{comment.user.username}
                                    </span>
                                    <span className="text-xs text-[#A0A0A0]">
                                        · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>

                                {/* Delete Button (only for own comments) */}
                                {currentUserId === comment.user.id && onDelete && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        disabled={deletingId === comment.id}
                                        className="text-[#A0A0A0] hover:text-red-500 transition-colors"
                                    >
                                        {deletingId === comment.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                )}
                            </div>

                            <p className="text-sm text-[#E0E0E0] whitespace-pre-line">{comment.content}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Load More Button */}
            {hasMore && onLoadMore && (
                <div className="text-center">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="text-sm text-[#00BFFF] hover:underline disabled:opacity-50"
                    >
                        {isLoadingMore ? 'Loading...' : 'Load more comments'}
                    </button>
                </div>
            )}
        </div>
    )
}
