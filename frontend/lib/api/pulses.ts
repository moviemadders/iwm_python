/**
 * Pulses API Client
 * Handles pulse creation and deletion
 */

import { getAccessToken } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

const API_BASE = getApiUrl()

export interface PulseCreateData {
  contentText: string
  contentMedia?: string[]
  linkedMovieId?: string
  hashtags?: string[]
  postedAsRole?: string
  starRating?: number
}

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

/**
 * Get pulse feed
 */
export async function getFeed(params: {
  filter?: "latest" | "popular" | "following" | "trending"
  window?: "24h" | "7d" | "30d"
  page?: number
  limit?: number
  hashtag?: string
  linkedMovieId?: string
  userId?: string
} = {}) {
  const searchParams = new URLSearchParams()
  if (params.filter) searchParams.append("filter", params.filter)
  if (params.window) searchParams.append("window", params.window)
  if (params.page) searchParams.append("page", params.page.toString())
  if (params.limit) searchParams.append("limit", params.limit.toString())
  if (params.hashtag) searchParams.append("hashtag", params.hashtag)
  if (params.linkedMovieId) searchParams.append("linkedMovieId", params.linkedMovieId)
  if (params.userId) searchParams.append("userId", params.userId)

  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/feed?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to get feed: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error getting feed:", error)
    throw error
  }
}

/**
 * Get pulses for a specific movie
 */
export async function getMoviePulses(movieId: string, page = 1) {
  return getFeed({ linkedMovieId: movieId, page })
}

/**
 * Create a new pulse
 */
export async function createPulse(data: PulseCreateData) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to create pulse: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error creating pulse:", error)
    throw error
  }
}

/**
 * Delete a pulse
 */
export async function deletePulse(pulseId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to delete pulse: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error deleting pulse:", error)
    throw error
  }
}

/**
 * Bookmark a pulse
 */
export async function bookmarkPulse(pulseId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/bookmark`, {
      method: "POST",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to bookmark pulse: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error bookmarking pulse:", error)
    throw error
  }
}

/**
 * Unbookmark a pulse
 */
export async function unbookmarkPulse(pulseId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/bookmark`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to unbookmark pulse: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error unbookmarking pulse:", error)
    throw error
  }
}

/**
 * Toggle reaction on a pulse
 */
export async function toggleReaction(pulseId: string, type: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/reactions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ type }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to toggle reaction: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error toggling reaction:", error)
    throw error
  }
}

/**
 * Add a comment to a pulse
 */
export async function createComment(pulseId: string, content: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
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
 * Get comments for a pulse
 */
export async function getComments(pulseId: string, page = 1) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/comments?page=${page}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to get comments: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error getting comments:", error)
    throw error
  }
}

// ============================================================================
// COMMENT LIKES (NEW)
// ============================================================================

/**
 * Like a comment
 */
export async function likeComment(commentId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/comments/${commentId}/like`, {
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
export async function unlikeComment(commentId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/comments/${commentId}/like`, {
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

// ============================================================================
// ENHANCED SHARE TRACKING (NEW)
// ============================================================================

/**
 * Create a tracked share with optional quote
 */
export async function createShare(
  pulseId: string,
  shareType: 'echo' | 'quote_echo' = 'echo',
  quoteContent?: string
) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/share-detailed`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ shareType, quoteContent }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to create share: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error creating share:", error)
    throw error
  }
}

/**
 * Get users who shared a pulse
 */
export async function getShares(pulseId: string, page = 1, limit = 20) {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/pulse/${pulseId}/shares?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to get shares: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error getting shares:", error)
    throw error
  }
}

/**
 * Delete a share
 */
export async function deleteShare(pulseId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/pulse/${pulseId}/share-detailed`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to delete share: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error deleting share:", error)
    throw error
  }
}

