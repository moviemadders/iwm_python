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
