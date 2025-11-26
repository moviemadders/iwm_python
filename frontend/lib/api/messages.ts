/**
 * Direct Messages API Client
 * Handles all message and conversation-related API calls
 */

import type {
    Conversation,
    Message,
    UnreadCountResponse,
} from '@/types/pulse'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// ============================================================================
// CONVERSATIONS
// ============================================================================

/**
 * Create a new conversation with specified users
 */
export async function createConversation(userIds: string[]): Promise<Conversation> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/messages/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ userIds }),
    })

    if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get all conversations for current user
 */
export async function getConversations(page = 1, limit = 20): Promise<Conversation[]> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/messages/conversations?page=${page}&limit=${limit}`,
        {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/messages/conversations/${conversationId}`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Delete a conversation (removes current user as participant)
 */
export async function deleteConversation(conversationId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/messages/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`)
    }
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Send a message in a conversation
 */
export async function sendMessage(
    conversationId: string,
    content: string,
    mediaUrl?: string
): Promise<Message> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/messages/conversations/${conversationId}/messages`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ content, mediaUrl }),
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get messages from a conversation
 */
export async function getMessages(
    conversationId: string,
    page = 1,
    limit = 50
): Promise<Message[]> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
        {
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Mark all messages in a conversation as read
 */
export async function markMessagesRead(conversationId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(
        `${API_BASE}/messages/conversations/${conversationId}/read`,
        {
            method: 'PUT',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`)
    }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.statusText}`)
    }
}

/**
 * Get unread message count for current user
 */
export async function getUnreadMessageCount(): Promise<number> {
    const token = localStorage.getItem('access_token')

    const response = await fetch(`${API_BASE}/messages/unread-count`, {
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`)
    }

    const data: UnreadCountResponse = await response.json()
    return data.unreadCount
}
