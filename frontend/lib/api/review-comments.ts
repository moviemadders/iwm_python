/**
 * Review Comments API Client
 * Handles creating, listing, and liking comments on reviews
 */

import { getAccessToken } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

const API_BASE = getApiUrl()

function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    }
    const token = getAccessToken()
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }
    return headers
}

export interface CommentCreateData {
    content: string
    parentId?: string
}

/**
 * Create a new comment on a review
 */
export async function createComment(reviewId: string, data: CommentCreateData) {
    try {
        const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}/comments`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `Failed to create comment: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error("Error creating comment:", error)
        throw error
    }
}

/**
 * Get comments for a review
 */
export async function getComments(
    reviewId: string,
    parentId?: string,
    page: number = 1,
    limit: number = 50
) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) })
        if (parentId) params.append("parentId", parentId)

        const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}/comments?${params.toString()}`, {
            headers: getAuthHeaders(),
            cache: "no-store",
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch comments: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error("Error fetching comments:", error)
        throw error
    }
}

/**
 * Like a comment
 */
export async function likeComment(reviewId: string, commentId: string) {
    try {
        const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}/comments/${commentId}/like`, {
            method: "POST",
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `Failed to like comment: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error("Error liking comment:", error)
        throw error
    }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(reviewId: string, commentId: string) {
    try {
        const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}/comments/${commentId}/like`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `Failed to unlike comment: ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error("Error unliking comment:", error)
        throw error
    }
}
