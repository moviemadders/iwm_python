/**
 * User Stats API Client
 * Handles daily activity statistics
 */

import type { DailyStats, StatsRangeResponse } from '@/types/pulse'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Get today's activity stats for a user
 */
export async function getTodaysStats(userId: string): Promise<DailyStats> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/users/${userId}/stats/today`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch today's stats: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get last 7 days of activity stats
 */
export async function getWeeklyStats(userId: string): Promise<StatsRangeResponse> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/users/${userId}/stats/week`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch weekly stats: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get last 30 days of activity stats
 */
export async function getMonthlyStats(userId: string): Promise<StatsRangeResponse> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/users/${userId}/stats/month`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch monthly stats: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get stats for custom date range
 */
export async function getStatsRange(
    userId: string,
    startDate: string,
    endDate: string
): Promise<StatsRangeResponse> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/users/${userId}/stats/range?start_date=${startDate}&end_date=${endDate}`,
        {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to fetch stats range: ${response.statusText}`)
    }

    return response.json()
}
