/**
 * Pulse Notifications API Client
 * Handles social notifications for follows, likes, comments, shares
 */

import type {
    NotificationsResponse,
    NotificationUnreadCountResponse,
} from '@/types/pulse'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Get notifications for current user
 */
export async function getNotifications(
    unreadOnly = false,
    page = 1,
    limit = 20
): Promise<NotificationsResponse> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/pulse/notifications?unread_only=${unreadOnly}&page=${page}&limit=${limit}`,
        {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/pulse/notifications/unread-count`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`)
    }

    const data: NotificationUnreadCountResponse = await response.json()
    return data.unreadCount
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/pulse/notifications/${notificationId}/read`,
        {
            method: 'PUT',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<number> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/pulse/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.statusText}`)
    }

    const data = await response.json()
    return data.markedCount
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/pulse/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`)
    }
}
