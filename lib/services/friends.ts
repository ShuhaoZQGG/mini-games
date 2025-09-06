/**
 * Friend System Service
 * Manages friend relationships, requests, and social interactions
 */

import { createClient } from '@/lib/supabase/client'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface Friend {
  id: string
  username: string
  avatarUrl?: string
  status: 'online' | 'offline' | 'playing'
  currentGame?: string
  lastSeen: Date
  friendSince: Date
}

export interface FriendRequest {
  id: string
  fromUserId: string
  fromUsername: string
  fromAvatarUrl?: string
  toUserId: string
  toUsername: string
  message?: string
  createdAt: Date
  status: 'pending' | 'accepted' | 'rejected'
}

export interface FriendActivity {
  id: string
  userId: string
  username: string
  avatarUrl?: string
  type: 'game_played' | 'achievement_unlocked' | 'high_score' | 'challenge_sent'
  gameSlug?: string
  gameTitle?: string
  score?: number
  achievement?: string
  timestamp: Date
}

export interface FriendStats {
  totalFriends: number
  onlineFriends: number
  pendingRequests: number
  recentActivities: FriendActivity[]
}

class FriendService {
  private friends: Map<string, Friend> = new Map()
  private friendRequests: Map<string, FriendRequest> = new Map()
  private activities: FriendActivity[] = []
  private currentUserId: string | null = null

  /**
   * Initialize friend service for a user
   */
  async initialize(userId: string) {
    this.currentUserId = userId
    await this.loadFriends()
    await this.loadFriendRequests()
    await this.loadRecentActivities()
  }

  /**
   * Get all friends
   */
  async getFriends(): Promise<Friend[]> {
    try {
      // Try to load from Supabase
      if (supabase) {
        const { data, error } = await (supabase
          .from('friendships') as any)
          .select('*, friend:profiles!friend_id(*)')
          .eq('user_id', this.currentUserId || '')
          .eq('status', 'accepted')

        if (!error && data) {
          this.friends.clear()
          data.forEach((friendship: any) => {
            const friend: Friend = {
              id: friendship.friend_id,
              username: friendship.friend.username,
              avatarUrl: friendship.friend.avatar_url,
              status: this.getOnlineStatus(friendship.friend.last_seen),
              currentGame: friendship.friend.current_game,
              lastSeen: new Date(friendship.friend.last_seen),
              friendSince: new Date(friendship.created_at)
            }
            this.friends.set(friend.id, friend)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load friends from Supabase:', error)
    }

    // Return from cache or mock data
    if (this.friends.size === 0) {
      this.loadMockFriends()
    }

    return Array.from(this.friends.values())
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      if (supabase) {
        const { data, error } = await (supabase
          .from('friend_requests') as any)
          .select('*, from_user:profiles!from_user_id(*)')
          .eq('to_user_id', this.currentUserId || '')
          .eq('status', 'pending')

        if (!error && data) {
          this.friendRequests.clear()
          data.forEach((request: any) => {
            const friendRequest: FriendRequest = {
              id: request.id,
              fromUserId: request.from_user_id,
              fromUsername: request.from_user.username,
              fromAvatarUrl: request.from_user.avatar_url,
              toUserId: request.to_user_id,
              toUsername: request.to_user?.username || 'You',
              message: request.message,
              createdAt: new Date(request.created_at),
              status: request.status
            }
            this.friendRequests.set(friendRequest.id, friendRequest)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error)
    }

    // Return from cache or mock data
    if (this.friendRequests.size === 0) {
      this.loadMockFriendRequests()
    }

    return Array.from(this.friendRequests.values())
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(toUsername: string, message?: string): Promise<boolean> {
    try {
      if (supabase) {
        // First, find the user by username
        const { data: userData, error: userError } = await (supabase
          .from('profiles') as any)
          .select('user_id')
          .eq('username', toUsername)
          .single()

        if (userError || !userData) {
          throw new Error('User not found')
        }

        // Check if already friends or request exists
        const { data: existingFriendship } = await (supabase
          .from('friendships') as any)
          .select('id')
          .eq('user_id', this.currentUserId || '')
          .eq('friend_id', userData.user_id)
          .single()

        if (existingFriendship) {
          throw new Error('Already friends with this user')
        }

        // Send the request
        const { error } = await (supabase
          .from('friend_requests') as any)
          .insert({
            from_user_id: this.currentUserId,
            to_user_id: userData.user_id,
            message,
            status: 'pending'
          })

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('Failed to send friend request:', error)
    }

    // Mock implementation
    const mockRequest: FriendRequest = {
      id: `req_${Date.now()}`,
      fromUserId: this.currentUserId || 'user_1',
      fromUsername: 'You',
      toUserId: `user_${toUsername}`,
      toUsername,
      message,
      createdAt: new Date(),
      status: 'pending'
    }
    
    this.friendRequests.set(mockRequest.id, mockRequest)
    return true
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const request = this.friendRequests.get(requestId)
      if (!request) return false

      if (supabase) {
        // Update request status
        const { error: updateError } = await (supabase
          .from('friend_requests') as any)
          .update({ status: 'accepted' })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Create bidirectional friendship
        const { error: friendshipError } = await (supabase
          .from('friendships') as any)
          .insert([
            { user_id: request.toUserId, friend_id: request.fromUserId },
            { user_id: request.fromUserId, friend_id: request.toUserId }
          ])

        if (friendshipError) throw friendshipError
      }

      // Update local state
      request.status = 'accepted'
      const newFriend: Friend = {
        id: request.fromUserId,
        username: request.fromUsername,
        avatarUrl: request.fromAvatarUrl,
        status: 'online',
        lastSeen: new Date(),
        friendSince: new Date()
      }
      
      this.friends.set(newFriend.id, newFriend)
      this.friendRequests.delete(requestId)
      
      return true
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      return false
    }
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      if (supabase) {
        const { error } = await (supabase
          .from('friend_requests') as any)
          .update({ status: 'rejected' })
          .eq('id', requestId)

        if (error) throw error
      }

      this.friendRequests.delete(requestId)
      return true
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      return false
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendId: string): Promise<boolean> {
    try {
      if (supabase) {
        // Delete bidirectional friendship
        const { error } = await (supabase
          .from('friendships') as any)
          .delete()
          .or(`and(user_id.eq.${this.currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${this.currentUserId})`)

        if (error) throw error
      }

      this.friends.delete(friendId)
      return true
    } catch (error) {
      console.error('Failed to remove friend:', error)
      return false
    }
  }

  /**
   * Get friend activities
   */
  async getFriendActivities(limit: number = 20): Promise<FriendActivity[]> {
    try {
      if (supabase) {
        const friendIds = Array.from(this.friends.keys())
        
        const { data, error } = await (supabase
          .from('activities') as any)
          .select('*, user:profiles!user_id(*)')
          .in('user_id', friendIds)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          this.activities = data.map((activity: any) => ({
            id: activity.id,
            userId: activity.user_id,
            username: activity.user.username,
            avatarUrl: activity.user.avatar_url,
            type: activity.type,
            gameSlug: activity.game_slug,
            gameTitle: activity.game_title,
            score: activity.score,
            achievement: activity.achievement,
            timestamp: new Date(activity.created_at)
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load friend activities:', error)
    }

    // Return from cache or mock data
    if (this.activities.length === 0) {
      this.loadMockActivities()
    }

    return this.activities
  }

  /**
   * Get friend statistics
   */
  async getFriendStats(): Promise<FriendStats> {
    const friends = await this.getFriends()
    const requests = await this.getFriendRequests()
    const activities = await this.getFriendActivities(10)

    return {
      totalFriends: friends.length,
      onlineFriends: friends.filter(f => f.status === 'online').length,
      pendingRequests: requests.length,
      recentActivities: activities
    }
  }

  /**
   * Check if users are friends
   */
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friends = await this.getFriends()
    return friends.some(f => f.id === userId2)
  }

  /**
   * Get online status based on last seen
   */
  private getOnlineStatus(lastSeen: string | Date): 'online' | 'offline' | 'playing' {
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    
    if (diffMinutes < 5) return 'online'
    return 'offline'
  }

  /**
   * Load friends from storage
   */
  private async loadFriends() {
    try {
      const stored = localStorage.getItem('friends')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.forEach((friend: any) => {
          friend.lastSeen = new Date(friend.lastSeen)
          friend.friendSince = new Date(friend.friendSince)
          this.friends.set(friend.id, friend)
        })
      }
    } catch (error) {
      console.error('Failed to load friends from storage:', error)
    }
  }

  /**
   * Load friend requests from storage
   */
  private async loadFriendRequests() {
    try {
      const stored = localStorage.getItem('friendRequests')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.forEach((request: any) => {
          request.createdAt = new Date(request.createdAt)
          this.friendRequests.set(request.id, request)
        })
      }
    } catch (error) {
      console.error('Failed to load friend requests from storage:', error)
    }
  }

  /**
   * Load recent activities from storage
   */
  private async loadRecentActivities() {
    try {
      const stored = localStorage.getItem('friendActivities')
      if (stored) {
        this.activities = JSON.parse(stored).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load activities from storage:', error)
    }
  }

  /**
   * Load mock friends for demo
   */
  private loadMockFriends() {
    const mockFriends: Friend[] = [
      {
        id: 'friend_1',
        username: 'ProGamer123',
        status: 'online',
        currentGame: 'cps-test',
        lastSeen: new Date(),
        friendSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'friend_2',
        username: 'SpeedRunner',
        status: 'playing',
        currentGame: 'typing-test',
        lastSeen: new Date(),
        friendSince: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'friend_3',
        username: 'PuzzleMaster',
        status: 'offline',
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
        friendSince: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    ]

    mockFriends.forEach(friend => this.friends.set(friend.id, friend))
  }

  /**
   * Load mock friend requests for demo
   */
  private loadMockFriendRequests() {
    const mockRequests: FriendRequest[] = [
      {
        id: 'req_1',
        fromUserId: 'user_4',
        fromUsername: 'NewPlayer',
        toUserId: this.currentUserId || 'user_1',
        toUsername: 'You',
        message: 'Hey! Want to play together?',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'pending'
      }
    ]

    mockRequests.forEach(request => this.friendRequests.set(request.id, request))
  }

  /**
   * Load mock activities for demo
   */
  private loadMockActivities() {
    this.activities = [
      {
        id: 'act_1',
        userId: 'friend_1',
        username: 'ProGamer123',
        type: 'high_score',
        gameSlug: 'cps-test',
        gameTitle: 'CPS Test',
        score: 12,
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'act_2',
        userId: 'friend_2',
        username: 'SpeedRunner',
        type: 'achievement_unlocked',
        achievement: 'Speed Demon',
        gameSlug: 'typing-test',
        gameTitle: 'Typing Test',
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        id: 'act_3',
        userId: 'friend_3',
        username: 'PuzzleMaster',
        type: 'game_played',
        gameSlug: 'sudoku',
        gameTitle: 'Sudoku',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem('friends', JSON.stringify(Array.from(this.friends.values())))
      localStorage.setItem('friendRequests', JSON.stringify(Array.from(this.friendRequests.values())))
      localStorage.setItem('friendActivities', JSON.stringify(this.activities))
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  }
}

// Export singleton instance
export const friendService = new FriendService()