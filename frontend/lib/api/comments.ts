/**
 * Comment API functions
 */

import { getApiUrl, getAuthHeaders } from './index'

export interface CommentCreateData {
    content: string
}

export interface CommentResponse {
    id: string
    pulseId: number
    content: string
    createdAt: string
    user: {
        id: string
        displayName: string
        username: string
        avatarUrl: string | null
    }
}

export interface CommentsListResponse {
    comments: CommentResponse[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

export const commentsApi = {
    /**
     * Create a new comment on a pulse
     */
    createComment: async (pulseId: string, data: CommentCreateData): Promise<CommentResponse> => {
        const res = await fetch(`${getApiUrl()}/api/v1/pulse/${pulseId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to create comment')
        return res.json()
    },

    /**
     * List comments for a pulse
     */
    listComments: async (pulseId: string, page: number = 1, limit: number = 20): Promise<CommentsListResponse> => {
        const res = await fetch(`${getApiUrl()}/api/v1/pulse/${pulseId}/comments?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch comments')
        return res.json()
    },

    /**
     * Delete a comment
     */
    deleteComment: async (pulseId: string, commentId: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${getApiUrl()}/api/v1/pulse/${pulseId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to delete comment')
        return res.json()
    },
}
