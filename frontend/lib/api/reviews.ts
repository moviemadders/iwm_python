/**
 * Reviews API Client
 * Fetches review data from the FastAPI backend
 */

import { getAccessToken } from "@/lib/auth"
import { getApiUrl } from "@/lib/api-config"

// Resolve API base URL via centralized helper with localhost/LAN awareness
const API_BASE = getApiUrl()

export interface ReviewSubmitData {
  title?: string
  content: string
  rating: number
  hasSpoilers?: boolean
  gifUrl?: string | null
}

export interface ReviewUpdateData {
  title?: string
  content?: string
  rating?: number
  hasSpoilers?: boolean
  gifUrl?: string | null
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
 * Get all reviews for a specific movie
 */
export async function getMovieReviews(movieId: string, page: number = 1, limit: number = 20) {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/reviews?movieId=${movieId}&page=${page}&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching movie reviews:", error)
    throw error
  }
}

/**
 * Submit a new review for a movie
 */
export async function submitReview(movieId: string, reviewData: ReviewSubmitData, userId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/reviews`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        movieId,
        userId,
        title: reviewData.title || "",
        content: reviewData.content,
        rating: reviewData.rating,
        spoilers: reviewData.hasSpoilers || false,
        gifUrl: reviewData.gifUrl || null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to submit review: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error submitting review:", error)
    throw error
  }
}

/**
 * Update an existing review
 */
export async function updateReview(reviewId: string, reviewData: ReviewUpdateData) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to update review: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error updating review:", error)
    throw error
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to delete review: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}

/**
 * Get review statistics for a movie
 */
export async function getReviewStats(movieId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/movies/${movieId}/reviews/stats`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch review stats: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching review stats:", error)
    throw error
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/reviews/${reviewId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch review: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching review:", error)
    throw error
  }
}


/**
 * Get all reviews written by a user
 */
export async function getUserReviews(userId: string, page: number = 1, limit: number = 20, sortBy: string = "date_desc") {
  try {
    const params = new URLSearchParams({ userId, page: String(page), limit: String(limit), sortBy })
    const response = await fetch(`${API_BASE}/api/v1/reviews?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to fetch user reviews: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    throw error
  }
}

