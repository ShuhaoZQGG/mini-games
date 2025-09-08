import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

// Types for real-time events
export interface RealtimeScore {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}

export interface PresenceData {
  user_id: string
  username: string
  game_id?: string
  status: 'online' | 'playing' | 'idle'
  joined_at: string
}

export interface GameEvent {
  type: 'score_update' | 'player_joined' | 'player_left' | 'game_started' | 'game_ended'
  game_id: string
  player_name?: string
  data: any
  timestamp: string
}

// Mock WebSocket implementation for fallback
class MockWebSocket {
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private presence: Map<string, PresenceData[]> = new Map()
  private mockInterval?: NodeJS.Timeout
  private isConnected = false

  connect() {
    this.isConnected = true
    console.log('Mock WebSocket connected')
    
    // Simulate real-time score updates
    this.mockInterval = setInterval(() => {
      if (this.isConnected) {
        this.simulateScoreUpdate()
      }
    }, 5000 + Math.random() * 10000) // Random interval between 5-15 seconds
  }

  disconnect() {
    this.isConnected = false
    if (this.mockInterval) {
      clearInterval(this.mockInterval)
    }
    console.log('Mock WebSocket disconnected')
  }

  subscribe(channel: string, callback: (data: any) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)?.add(callback)
    
    console.log(`Mock WebSocket subscribed to channel: ${channel}`)
    return () => {
      this.listeners.get(channel)?.delete(callback)
    }
  }

  private simulateScoreUpdate() {
    const mockScore: RealtimeScore = {
      id: `mock_${Date.now()}`,
      game_id: 'snake', // Random game for simulation
      player_name: `Player${Math.floor(Math.random() * 1000)}`,
      score: Math.floor(Math.random() * 10000),
      created_at: new Date().toISOString()
    }

    // Notify all score listeners
    this.listeners.get('scores')?.forEach(callback => {
      callback({
        eventType: 'INSERT',
        new: mockScore
      })
    })
  }

  simulatePresenceUpdate(gameId: string, action: 'join' | 'leave') {
    const presence: PresenceData = {
      user_id: `user_${Date.now()}`,
      username: `Player${Math.floor(Math.random() * 1000)}`,
      game_id: gameId,
      status: action === 'join' ? 'playing' : 'online',
      joined_at: new Date().toISOString()
    }

    if (!this.presence.has(gameId)) {
      this.presence.set(gameId, [])
    }

    const gamePresence = this.presence.get(gameId) || []
    
    if (action === 'join') {
      gamePresence.push(presence)
    } else {
      const index = gamePresence.findIndex(p => p.user_id === presence.user_id)
      if (index > -1) {
        gamePresence.splice(index, 1)
      }
    }

    this.presence.set(gameId, gamePresence)

    // Notify presence listeners
    this.listeners.get(`presence:${gameId}`)?.forEach(callback => {
      callback({
        type: action === 'join' ? 'presence_joined' : 'presence_left',
        data: presence,
        presenceState: gamePresence
      })
    })
  }

  getPresence(gameId: string): PresenceData[] {
    return this.presence.get(gameId) || []
  }

  broadcast(channel: string, event: GameEvent) {
    this.listeners.get(channel)?.forEach(callback => {
      callback(event)
    })
  }
}

// Main Realtime Service Class
export class RealtimeService {
  private static instance: RealtimeService
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private mockWebSocket?: MockWebSocket
  private isSupabaseConfigured: boolean

  private constructor() {
    this.isSupabaseConfigured = this.checkSupabaseConfig()
    
    if (!this.isSupabaseConfigured) {
      console.log('Supabase not configured, using mock WebSocket for real-time features')
      this.mockWebSocket = new MockWebSocket()
      this.mockWebSocket.connect()
    }
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  private checkSupabaseConfig(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
    )
  }

  // Subscribe to score updates for a specific game
  subscribeToScores(gameId: string, callback: (score: RealtimeScore) => void) {
    if (!this.isSupabaseConfigured) {
      // Use mock WebSocket
      return this.mockWebSocket!.subscribe('scores', (data) => {
        if (data.new && data.new.game_id === gameId) {
          callback(data.new)
        }
      })
    }

    // Use Supabase Realtime
    const channelName = `scores:${gameId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'scores',
            filter: `game_id=eq.${gameId}`
          },
          (payload) => {
            if (payload.new) {
              callback(payload.new as RealtimeScore)
            }
          }
        )
        .subscribe()

      this.channels.set(channelName, channel)
    }

    return () => {
      this.unsubscribeFromChannel(channelName)
    }
  }

  // Subscribe to leaderboard updates
  subscribeToLeaderboard(
    gameId: string, 
    period: 'all_time' | 'monthly' | 'weekly' | 'daily',
    callback: (leaderboard: any) => void
  ) {
    if (!this.isSupabaseConfigured) {
      // Mock implementation - simulate periodic updates
      const interval = setInterval(async () => {
        // Fetch latest leaderboard data
        const { getLeaderboard } = await import('./scores')
        const result = await getLeaderboard({ gameId, period, limit: 10 })
        if (result.success) {
          callback(result.data)
        }
      }, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }

    // Use Supabase Realtime
    const channelName = `leaderboard:${gameId}:${period}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leaderboards',
            filter: `game_id=eq.${gameId},period=eq.${period}`
          },
          async () => {
            // Fetch updated leaderboard
            const { getLeaderboard } = await import('./scores')
            const result = await getLeaderboard({ gameId, period, limit: 10 })
            if (result.success) {
              callback(result.data)
            }
          }
        )
        .subscribe()

      this.channels.set(channelName, channel)
    }

    return () => {
      this.unsubscribeFromChannel(channelName)
    }
  }

  // Presence tracking for online players
  async trackPresence(
    gameId: string,
    userData: { user_id: string; username: string },
    callback?: (state: RealtimePresenceState) => void
  ) {
    if (!this.isSupabaseConfigured) {
      // Mock presence
      this.mockWebSocket!.simulatePresenceUpdate(gameId, 'join')
      
      if (callback) {
        const presence = this.mockWebSocket!.getPresence(gameId)
        callback(presence as any)
      }

      return () => {
        this.mockWebSocket!.simulatePresenceUpdate(gameId, 'leave')
      }
    }

    // Use Supabase Presence
    const channelName = `presence:${gameId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase.channel(channelName)
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          if (callback) {
            callback(state)
          }
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const presenceData: PresenceData = {
              user_id: userData.user_id,
              username: userData.username,
              game_id: gameId,
              status: 'playing',
              joined_at: new Date().toISOString()
            }
            
            await channel.track(presenceData)
          }
        })

      this.channels.set(channelName, channel)
    }

    return () => {
      const channel = this.channels.get(channelName)
      if (channel) {
        channel.untrack()
        this.unsubscribeFromChannel(channelName)
      }
    }
  }

  // Get current presence state
  getPresenceState(gameId: string): RealtimePresenceState | PresenceData[] {
    if (!this.isSupabaseConfigured) {
      return this.mockWebSocket!.getPresence(gameId)
    }

    const channelName = `presence:${gameId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      return channel.presenceState()
    }
    
    return {}
  }

  // Broadcast game events
  async broadcastGameEvent(event: GameEvent) {
    if (!this.isSupabaseConfigured) {
      // Mock broadcast
      this.mockWebSocket!.broadcast(`game:${event.game_id}`, event)
      return
    }

    // Use Supabase broadcast
    const channelName = `game:${event.game_id}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase.channel(channelName)
      await channel.subscribe()
      this.channels.set(channelName, channel)
    }

    const channel = this.channels.get(channelName)
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'game_event',
        payload: event
      })
    }
  }

  // Subscribe to game events
  subscribeToGameEvents(gameId: string, callback: (event: GameEvent) => void) {
    if (!this.isSupabaseConfigured) {
      // Mock subscription
      return this.mockWebSocket!.subscribe(`game:${gameId}`, callback)
    }

    // Use Supabase broadcast
    const channelName = `game:${gameId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on('broadcast', { event: 'game_event' }, (payload) => {
          callback(payload.payload as GameEvent)
        })
        .subscribe()

      this.channels.set(channelName, channel)
    }

    return () => {
      this.unsubscribeFromChannel(channelName)
    }
  }

  // Clean up channel subscription
  private async unsubscribeFromChannel(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      await this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Clean up all subscriptions
  async cleanup() {
    if (!this.isSupabaseConfigured && this.mockWebSocket) {
      this.mockWebSocket.disconnect()
      return
    }

    const channels = Array.from(this.channels.entries())
    for (const [channelName, channel] of channels) {
      await this.supabase.removeChannel(channel)
    }
    this.channels.clear()
  }
}

// Export singleton instance helper
export const realtimeService = RealtimeService.getInstance()

// React hooks for real-time features
export function useRealtimeScores(gameId: string) {
  const [scores, setScores] = useState<RealtimeScore[]>([])
  
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToScores(gameId, (newScore) => {
      setScores(prev => [newScore, ...prev].slice(0, 10)) // Keep only latest 10
    })

    return () => {
      unsubscribe()
    }
  }, [gameId])

  return scores
}

export function useRealtimeLeaderboard(
  gameId: string,
  period: 'all_time' | 'monthly' | 'weekly' | 'daily' = 'all_time'
) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToLeaderboard(
      gameId,
      period,
      (data) => {
        setLeaderboard(data)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [gameId, period])

  return leaderboard
}

export function usePresence(gameId: string, userData?: { user_id: string; username: string }) {
  const [presence, setPresence] = useState<any>({})
  const [onlineCount, setOnlineCount] = useState(0)
  
  useEffect(() => {
    if (!userData) return

    let unsubscribe: (() => void) | undefined

    const setupPresence = async () => {
      unsubscribe = await realtimeService.trackPresence(
        gameId,
        userData,
        (state) => {
          setPresence(state)
          
          // Count online users
          const count = Array.isArray(state) 
            ? state.length 
            : Object.keys(state).reduce((acc, key) => acc + (state[key]?.length || 0), 0)
          
          setOnlineCount(count)
        }
      )
    }

    setupPresence()

    return () => {
      unsubscribe?.()
    }
  }, [gameId, userData?.user_id])

  return { presence, onlineCount }
}

// Import for use in components
import { useState, useEffect } from 'react'