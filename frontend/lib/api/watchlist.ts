/**
 * Watchlist API Client
 * Manages user watchlist operations
 */

import { getAuthHeaders } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

// Resolve API base URL via centralized helper with localhost/LAN awareness
const API_BASE = getApiUrl()

export interface WatchlistItemData {
  userId: string
  movieId: string
  status?: "want-to-watch" | "watching" | "watched"
  priority?: "high" | "medium" | "low"
  progress?: number
  rating?: number
}

/**
 * Add a movie to user's watchlist
 */
export async function addToWatchlist(
  userId: string,
  movieId: string,
  status: string = "want-to-watch"
) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/watchlist`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId,
        movieId,
        status,
        priority: "medium",
        progress: 0,
      }),
    })

    if (!response.ok) {
      // If backend says conflict or generic error, attempt idempotent fallback
      const status = response.status
      // Try parse JSON detail; ignore errors
      const errorData = await response.json().catch(() => ({} as any))

      if (status === 409 || status === 500) {
        // Fetch existing item and return it as success
        const list = await getUserWatchlist(userId, 1, 1000)
        const items = list.items || list || []
        const existing = items.find((it: any) => it.movieId === movieId || it.movie_id === movieId)
        if (existing) return existing
      }

      throw new Error(errorData.detail || `Failed to add to watchlist: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    throw error
  }
}

/**
 * Remove a movie from user's watchlist
 */
export async function removeFromWatchlist(watchlistId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/watchlist/${watchlistId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to remove from watchlist: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    throw error
  }
}

/**
 * Update a watchlist item
 */
export async function updateWatchlistItem(
  watchlistId: string,
  updates: Partial<WatchlistItemData>
) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/watchlist/${watchlistId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Failed to update watchlist item: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error updating watchlist item:", error)
    throw error
  }
}

/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId: string, page: number = 1, limit: number = 100) {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/watchlist?userId=${userId}&page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    throw error
  }
}

/**
 * Check if a movie is in user's watchlist
 */
export async function isInWatchlist(userId: string, movieId: string): Promise<boolean> {
  try {
    const watchlist = await getUserWatchlist(userId, 1, 1000)
    const items = watchlist.items || watchlist || []
    return items.some((item: any) => item.movieId === movieId || item.movie_id === movieId)
  } catch (error) {
    console.error("Error checking watchlist:", error)
    return false
  }
}

/**
 * Get a specific watchlist item for a movie
 */
export async function getWatchlistItem(userId: string, movieId: string): Promise<any> {
  try {
    const watchlist = await getUserWatchlist(userId, 1, 1000)
    const items = watchlist.items || watchlist || []
    return items.find((item: any) => item.movieId === movieId || item.movie_id === movieId)
  } catch (error) {
    console.error("Error getting watchlist item:", error)
    return null
  }
}

