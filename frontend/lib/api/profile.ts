/**
 * Profile API Client
 * Fetches user profile data from the FastAPI backend
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

/**
 * Get user profile data by username
 */
export async function getUserProfile(username: string) {
  const response = await fetch(`${API_BASE}/api/v1/users/${username}`, {
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Upload avatar image file
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE}/api/v1/upload/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to upload avatar: ${response.statusText}`)
  }

  const data = await response.json()
  return data.url
}

/**
 * Upload banner/cover image file
 */
export async function uploadBanner(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE}/api/v1/upload/banner`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to upload banner: ${response.statusText}`)
  }

  const data = await response.json()
  return data.url
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: {
  name?: string
  bio?: string
  location?: string
  website?: string
  avatarUrl?: string
  bannerUrl?: string
}) {
  const response = await fetch(`${API_BASE}/api/v1/users/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name: data.name,
      bio: data.bio,
      location: data.location,
      website: data.website,
      avatarUrl: data.avatarUrl,
      bannerUrl: data.bannerUrl,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to update profile: ${response.statusText}`)
  }

  return response.json()
}


/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId: string, page: number = 1, limit: number = 100) {
  const response = await fetch(
    `${API_BASE}/api/v1/watchlist?userId=${userId}&page=${page}&limit=${limit}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch watchlist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user's favorites
 */
export async function getUserFavorites(userId: string, page: number = 1, limit: number = 100) {
  const response = await fetch(
    `${API_BASE}/api/v1/favorites?userId=${userId}&type=movie&page=${page}&limit=${limit}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user's collections
 */
export async function getUserCollections(userId: string, page: number = 1, limit: number = 100) {
  const response = await fetch(
    `${API_BASE}/api/v1/collections?userId=${userId}&page=${page}&limit=${limit}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string, page: number = 1, limit: number = 100) {
  const response = await fetch(
    `${API_BASE}/api/v1/reviews?userId=${userId}&page=${page}&limit=${limit}&sortBy=date_desc`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user's viewing history
 * Note: This endpoint may need to be created in the backend
 */
export async function getUserHistory(userId: string, page: number = 1, limit: number = 100) {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/watchlist?userId=${userId}&status=watched&page=${page}&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching user history:", error)
    return []
  }
}

/**
 * Get user's activity feed
 * Note: This endpoint may need to be created in the backend
 */
export async function getUserActivity(userId: string, page: number = 1, limit: number = 20) {
  try {
    // Combine recent reviews, watchlist additions, and pulses
    const [reviews, watchlist, pulses] = await Promise.all([
      getUserReviews(userId, 1, 10),
      getUserWatchlist(userId, 1, 10),
      import("./pulses").then(m => m.getFeed({ userId, limit: 10 })).catch(() => []),
    ])

    // Transform into activity feed format
    const activities = [
      ...reviews.map((review: any) => ({
        id: `review-${review.id}`,
        type: "review",
        timestamp: review.createdAt || review.date,
        data: review,
      })),
      ...watchlist.map((item: any) => ({
        id: `watchlist-${item.id}`,
        type: "watchlist",
        timestamp: item.dateAdded,
        data: item,
      })),
      ...pulses.map((pulse: any) => ({
        id: `pulse-${pulse.id}`,
        type: "pulse",
        timestamp: pulse.timestamp,
        content: pulse.content.text,
        data: pulse,
      })),
    ]

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return activities.slice(0, limit)
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return []
  }
}

/**
 * Get user stats (counts for reviews, watchlist, favorites, collections)
 */
export async function getUserStats(userId: string) {
  try {
    const [reviews, watchlist, favorites, collections] = await Promise.all([
      getUserReviews(userId, 1, 1),
      getUserWatchlist(userId, 1, 1),
      getUserFavorites(userId, 1, 1),
      getUserCollections(userId, 1, 1),
    ])

    return {
      reviews: reviews.length || 0,
      watchlist: watchlist.length || 0,
      favorites: favorites.length || 0,
      collections: collections.length || 0,
      following: 0, // TODO: Implement following/followers
      followers: 0,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return {
      reviews: 0,
      watchlist: 0,
      favorites: 0,
      collections: 0,
      following: 0,
      followers: 0,
    }
  }
}

/**
 * Add movie to watchlist
 */
export async function addToWatchlist(movieId: string, userId: string, priority: string = "medium") {
  const response = await fetch(`${API_BASE}/api/v1/watchlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      movieId,
      userId,
      status: "want-to-watch",
      priority,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to add to watchlist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Remove movie from watchlist
 */
export async function removeFromWatchlist(watchlistId: string) {
  const response = await fetch(`${API_BASE}/api/v1/watchlist/${watchlistId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to remove from watchlist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Mark watchlist item as watched
 */
export async function markAsWatched(watchlistId: string) {
  const response = await fetch(`${API_BASE}/api/v1/watchlist/${watchlistId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "watched",
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to mark as watched: ${response.statusText}`)
  }

  return response.json()
}

