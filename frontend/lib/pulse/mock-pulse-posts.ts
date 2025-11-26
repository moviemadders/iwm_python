/**
 * Mock Pulse Posts Data
 * Simplified version with 20 posts
 */

import type { PulsePost, PulseUserInfo } from '@/types/pulse'

// Mock users
const mockUsers: PulseUserInfo[] = [
  {
    id: 'user-1',
    username: 'siddu_official',
    displayName: 'Siddu',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddu',
    isVerified: true,
    verificationLevel: 'industry',
    isFollowing: true,
  },
  {
    id: 'user-2',
    username: 'arjun_movies',
    displayName: 'Arjun Kapoor',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    isVerified: true,
    verificationLevel: 'industry',
    isFollowing: false,
  },
  {
    id: 'user-3',
    username: 'priya_cricket',
    displayName: 'Priya Sharma',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    isVerified: true,
    verificationLevel: 'industry',
    isFollowing: true,
  },
]

// Use static date for consistency during hydration
const BASE_DATE = new Date('2023-11-23T12:00:00Z')

const getTimestamp = (hoursAgo: number) => {
  const date = new Date(BASE_DATE)
  date.setHours(date.getHours() - hoursAgo)
  return date.toISOString()
}

export const mockPulsePosts: PulsePost[] = [
  {
    id: 'post-1',
    userId: 'user-1',
    userInfo: mockUsers[0],
    content: {
      text: 'Just watched The Shawshank Redemption for the 10th time. Still gives me chills! 🎬✨',
      media: [],
      hashtags: [],
    },
    engagement: {
      reactions: {
        love: 100,
        fire: 50,
        mindblown: 30,
        laugh: 20,
        sad: 10,
        angry: 24,
        total: 234,
      },
      comments: 45,
      shares: 12,
      hasCommented: false,
      hasShared: false,
      hasBookmarked: false,
    },
    timestamp: getTimestamp(1),
  },
  {
    id: 'post-2',
    userId: 'user-2',
    userInfo: mockUsers[1],
    content: {
      text: 'Inception is a masterpiece! The ending still haunts me. 🌀 #ChristopherNolan',
      media: [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
          thumbnail_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
          width: 1920,
          height: 1080,
          alt_text: 'Movie scene',
        },
      ],
      linkedContent: {
        type: 'movie',
        id: 'movie-1',
        title: 'Inception',
        posterUrl: 'https://placehold.co/500x750?text=Placeholder',
      },
      hashtags: ['ChristopherNolan'],
    },
    engagement: {
      reactions: {
        love: 200,
        fire: 100,
        mindblown: 100,
        laugh: 50,
        sad: 17,
        angry: 100,
        total: 567,
      },
      userReaction: 'love',
      comments: 89,
      shares: 34,
      hasCommented: true,
      hasShared: false,
      hasBookmarked: true,
    },
    timestamp: getTimestamp(2),
  },
  {
    id: 'post-3',
    userId: 'user-3',
    userInfo: mockUsers[2],
    content: {
      text: 'What an incredible match! India vs Australia - best cricket I have seen this year! 🏏🔥',
      media: [],
      linkedContent: {
        type: 'cricket_match',
        id: 'match-1',
        title: 'IND vs AUS',
      },
      hashtags: [],
    },
    engagement: {
      reactions: {
        love: 300,
        fire: 200,
        mindblown: 100,
        laugh: 100,
        sad: 92,
        angry: 100,
        total: 892,
      },
      userReaction: 'fire',
      comments: 156,
      shares: 67,
      hasCommented: false,
      hasShared: true,
      hasBookmarked: false,
    },
    timestamp: getTimestamp(3),
  },
]
