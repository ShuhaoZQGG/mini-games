/**
 * Spectator Service
 * Manages real-time game spectating, viewer tracking, and live chat
 */

import { createClient } from '@/lib/supabase/client'
import { getTournamentRealtimeService } from './tournament-realtime'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface Spectator {
  id?: string
  gameSessionId: string
  tournamentMatchId?: string
  viewerId?: string
  viewerGuestId?: string
  joinedAt: Date
  leftAt?: Date
  durationSeconds?: number
}

export interface SpectatorChatMessage {
  id?: string
  gameSessionId: string
  tournamentMatchId?: string
  senderId: string
  senderName: string
  message: string
  sentAt: Date
  isDeleted?: boolean
}

export interface SpectatorStatistics {
  totalViewers: number
  currentViewers: number
  peakViewers: number
  totalChatMessages: number
  averageViewDuration: number
}

export interface SpectatorUpdate {
  type: 'spectator_joined' | 'spectator_left' | 'viewer_count_update' | 
        'chat_message' | 'game_state_update'
  gameSessionId?: string
  viewerId?: string
  viewerGuestId?: string
  data?: any
  timestamp: Date
}

export interface SpectatorSubscription {
  gameSessionId: string
  callback: (update: SpectatorUpdate) => void
  unsubscribe: () => void
}

interface GameStateUpdate {
  type: 'game_state_update'
  gameSessionId: string
  data: any
  timestamp: Date
}

class SpectatorService {
  private spectators: Map<string, Spectator[]> = new Map()
  private chatMessages: Map<string, SpectatorChatMessage[]> = new Map()
  private subscriptions: Map<string, SpectatorSubscription[]> = new Map()
  private peakViewers: Map<string, number> = new Map()
  private nextId = 1

  /**
   * Clear all data (for testing)
   */
  clearAll() {
    this.spectators.clear()
    this.chatMessages.clear()
    this.subscriptions.clear()
    this.peakViewers.clear()
    this.nextId = 1
  }

  /**
   * Start spectating a game session
   */
  async startSpectating(params: {
    gameSessionId: string
    tournamentMatchId?: string
    userId?: string
    guestId?: string
  }): Promise<Spectator | null> {
    try {
      // Validate that either userId or guestId is provided
      if (!params.userId && !params.guestId) {
        console.error('Either userId or guestId must be provided')
        return null
      }

      // Check for duplicate spectator
      const sessionSpectators = this.spectators.get(params.gameSessionId) || []
      const existing = sessionSpectators.find(s => 
        (params.userId && s.viewerId === params.userId) ||
        (params.guestId && s.viewerGuestId === params.guestId)
      )

      if (existing && !existing.leftAt) {
        return null // Already spectating
      }

      const spectator: Spectator = {
        id: `spectator_${this.nextId++}`,
        gameSessionId: params.gameSessionId,
        tournamentMatchId: params.tournamentMatchId,
        viewerId: params.userId,
        viewerGuestId: params.guestId,
        joinedAt: new Date()
      }

      // Save to database if available
      if (supabase) {
        const { data, error } = await (supabase
          .from('spectators') as any)
          .insert({
            game_session_id: params.gameSessionId,
            tournament_match_id: params.tournamentMatchId,
            viewer_id: params.userId,
            viewer_guest_id: params.guestId,
            joined_at: spectator.joinedAt
          })
          .select()
          .single()

        if (!error && data) {
          spectator.id = data.id
        }
      }

      // Add to local cache
      sessionSpectators.push(spectator)
      this.spectators.set(params.gameSessionId, sessionSpectators)

      // Update peak viewers
      const currentCount = await this.getActiveSpectatorCount(params.gameSessionId)
      const currentPeak = this.peakViewers.get(params.gameSessionId) || 0
      if (currentCount > currentPeak) {
        this.peakViewers.set(params.gameSessionId, currentCount)
      }

      // Notify subscribers
      this.notifySubscribers(params.gameSessionId, {
        type: 'spectator_joined',
        gameSessionId: params.gameSessionId,
        viewerId: params.userId,
        viewerGuestId: params.guestId,
        timestamp: new Date()
      })

      // Broadcast viewer count update
      const realtimeService = getTournamentRealtimeService()
      await realtimeService.broadcastUpdate({
        type: 'participant_joined',
        tournamentId: params.gameSessionId,
        data: { viewerCount: currentCount },
        timestamp: new Date()
      })

      return spectator
    } catch (error) {
      console.error('Failed to start spectating:', error)
      return null
    }
  }

  /**
   * Stop spectating a game session
   */
  async stopSpectating(
    gameSessionId: string, 
    viewerId?: string,
    guestId?: string
  ): Promise<boolean> {
    try {
      const sessionSpectators = this.spectators.get(gameSessionId) || []
      const spectator = sessionSpectators.find(s => 
        (viewerId && s.viewerId === viewerId) ||
        (guestId && s.viewerGuestId === guestId)
      )

      if (!spectator || spectator.leftAt) {
        return false
      }

      spectator.leftAt = new Date()
      spectator.durationSeconds = Math.floor(
        (spectator.leftAt.getTime() - spectator.joinedAt.getTime()) / 1000
      )

      // Update database if available
      if (supabase && spectator.id) {
        await (supabase
          .from('spectators') as any)
          .update({
            left_at: spectator.leftAt
          })
          .eq('id', spectator.id)
      }

      // Notify subscribers
      this.notifySubscribers(gameSessionId, {
        type: 'spectator_left',
        gameSessionId,
        viewerId,
        viewerGuestId: guestId,
        timestamp: new Date()
      })

      // Broadcast viewer count update
      const currentCount = await this.getActiveSpectatorCount(gameSessionId)
      const realtimeService = getTournamentRealtimeService()
      await realtimeService.broadcastUpdate({
        type: 'participant_left',
        tournamentId: gameSessionId,
        data: { viewerCount: currentCount },
        timestamp: new Date()
      })

      return true
    } catch (error) {
      console.error('Failed to stop spectating:', error)
      return false
    }
  }

  /**
   * Get active spectators for a game session
   */
  async getActiveSpectators(gameSessionId: string): Promise<Spectator[]> {
    try {
      if (supabase) {
        const { data, error } = await (supabase
          .from('spectators') as any)
          .select('*')
          .eq('game_session_id', gameSessionId)
          .is('left_at', null)

        if (!error && data) {
          return data.map((d: any) => this.mapSpectatorFromDatabase(d))
        }
      }

      // Fallback to local cache
      const sessionSpectators = this.spectators.get(gameSessionId) || []
      return sessionSpectators.filter(s => !s.leftAt)
    } catch (error) {
      console.error('Failed to get active spectators:', error)
      return []
    }
  }

  /**
   * Get active spectator count
   */
  async getActiveSpectatorCount(gameSessionId: string): Promise<number> {
    const spectators = await this.getActiveSpectators(gameSessionId)
    return spectators.length
  }

  /**
   * Broadcast game state to spectators
   */
  async broadcastGameState(
    gameSessionId: string,
    gameState: any
  ): Promise<boolean> {
    try {
      const realtimeService = getTournamentRealtimeService()
      
      if (!realtimeService.isRealtimeConnected()) {
        return false
      }

      const viewerCount = await this.getActiveSpectatorCount(gameSessionId)
      
      const update: GameStateUpdate = {
        type: 'game_state_update',
        gameSessionId,
        data: {
          ...gameState,
          viewerCount
        },
        timestamp: new Date()
      }

      await realtimeService.broadcastUpdate(update as any)

      // Notify local subscribers
      this.notifySubscribers(gameSessionId, update as SpectatorUpdate)

      return true
    } catch (error) {
      console.error('Failed to broadcast game state:', error)
      return false
    }
  }

  /**
   * Send chat message
   */
  async sendChatMessage(params: {
    gameSessionId: string
    tournamentMatchId?: string
    senderId: string
    senderName: string
    message: string
  }): Promise<SpectatorChatMessage | null> {
    try {
      // Validate message
      if (!params.message || params.message.length === 0) {
        return null
      }

      if (params.message.length > 500) {
        return null
      }

      const chatMessage: SpectatorChatMessage = {
        id: `chat_${this.nextId++}`,
        gameSessionId: params.gameSessionId,
        tournamentMatchId: params.tournamentMatchId,
        senderId: params.senderId,
        senderName: params.senderName,
        message: params.message,
        sentAt: new Date()
      }

      // Save to database if available
      if (supabase) {
        const { data, error } = await (supabase
          .from('spectator_chat') as any)
          .insert({
            game_session_id: params.gameSessionId,
            tournament_match_id: params.tournamentMatchId,
            sender_id: params.senderId,
            sender_name: params.senderName,
            message: params.message,
            sent_at: chatMessage.sentAt
          })
          .select()
          .single()

        if (!error && data) {
          chatMessage.id = data.id
        }
      }

      // Add to local cache
      const sessionMessages = this.chatMessages.get(params.gameSessionId) || []
      sessionMessages.push(chatMessage)
      this.chatMessages.set(params.gameSessionId, sessionMessages)

      // Notify subscribers
      this.notifySubscribers(params.gameSessionId, {
        type: 'chat_message',
        gameSessionId: params.gameSessionId,
        data: chatMessage,
        timestamp: new Date()
      })

      return chatMessage
    } catch (error) {
      console.error('Failed to send chat message:', error)
      return null
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(
    gameSessionId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<SpectatorChatMessage[]> {
    try {
      if (supabase) {
        let query = (supabase
          .from('spectator_chat') as any)
          .select('*')
          .eq('game_session_id', gameSessionId)
          .eq('is_deleted', false)
          .order('sent_at', { ascending: true })

        if (options?.limit) {
          query = query.limit(options.limit)
        }

        if (options?.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
        }

        const { data, error } = await query

        if (!error && data) {
          return data.map((d: any) => this.mapChatMessageFromDatabase(d))
        }
      }

      // Fallback to local cache
      let messages = this.chatMessages.get(gameSessionId) || []
      messages = messages.filter(m => !m.isDeleted)

      if (options?.offset !== undefined) {
        const limit = options.limit || 50
        messages = messages.slice(options.offset, options.offset + limit)
      }

      return messages
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return []
    }
  }

  /**
   * Delete chat message
   */
  async deleteChatMessage(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Find the message
      let found = false
      for (const [sessionId, messages] of this.chatMessages.entries()) {
        const message = messages.find(m => m.id === messageId)
        if (message) {
          // Check if user owns the message
          if (message.senderId !== userId) {
            return false
          }

          message.isDeleted = true
          found = true

          // Update database if available
          if (supabase) {
            await (supabase
              .from('spectator_chat') as any)
              .update({ is_deleted: true })
              .eq('id', messageId)
          }

          break
        }
      }

      return found
    } catch (error) {
      console.error('Failed to delete chat message:', error)
      return false
    }
  }

  /**
   * Get spectator statistics for a game session
   */
  async getSpectatorStatistics(gameSessionId: string): Promise<SpectatorStatistics> {
    try {
      const allSpectators = this.spectators.get(gameSessionId) || []
      const activeSpectators = allSpectators.filter(s => !s.leftAt)
      const messages = this.chatMessages.get(gameSessionId) || []
      const activeMessages = messages.filter(m => !m.isDeleted)

      // Calculate average view duration
      let totalDuration = 0
      let countWithDuration = 0
      allSpectators.forEach(s => {
        if (s.durationSeconds) {
          totalDuration += s.durationSeconds
          countWithDuration++
        } else if (!s.leftAt) {
          // Still watching - calculate current duration
          const currentDuration = Math.floor(
            (Date.now() - s.joinedAt.getTime()) / 1000
          )
          totalDuration += currentDuration
          countWithDuration++
        }
      })

      const averageViewDuration = countWithDuration > 0 
        ? totalDuration / countWithDuration 
        : 0

      return {
        totalViewers: allSpectators.length,
        currentViewers: activeSpectators.length,
        peakViewers: this.peakViewers.get(gameSessionId) || activeSpectators.length,
        totalChatMessages: activeMessages.length,
        averageViewDuration
      }
    } catch (error) {
      console.error('Failed to get spectator statistics:', error)
      return {
        totalViewers: 0,
        currentViewers: 0,
        peakViewers: 0,
        totalChatMessages: 0,
        averageViewDuration: 0
      }
    }
  }

  /**
   * Get tournament match statistics
   */
  async getTournamentMatchStatistics(
    tournamentMatchId: string
  ): Promise<SpectatorStatistics> {
    try {
      // Find all spectators for this tournament match
      const matchSpectators: Spectator[] = []
      for (const [_, spectators] of this.spectators.entries()) {
        spectators.forEach(s => {
          if (s.tournamentMatchId === tournamentMatchId) {
            matchSpectators.push(s)
          }
        })
      }

      const activeSpectators = matchSpectators.filter(s => !s.leftAt)

      return {
        totalViewers: matchSpectators.length,
        currentViewers: activeSpectators.length,
        peakViewers: matchSpectators.length, // Simplified for now
        totalChatMessages: 0, // Would need to track by match
        averageViewDuration: 0
      }
    } catch (error) {
      console.error('Failed to get tournament match statistics:', error)
      return {
        totalViewers: 0,
        currentViewers: 0,
        peakViewers: 0,
        totalChatMessages: 0,
        averageViewDuration: 0
      }
    }
  }

  /**
   * Subscribe to game session updates
   */
  async subscribeToGameSession(
    gameSessionId: string,
    callback: (update: SpectatorUpdate) => void
  ): Promise<SpectatorSubscription | null> {
    try {
      const subscription: SpectatorSubscription = {
        gameSessionId,
        callback,
        unsubscribe: () => {
          this.unsubscribeFromGameSession(gameSessionId, subscription)
        }
      }

      const existing = this.subscriptions.get(gameSessionId) || []
      existing.push(subscription)
      this.subscriptions.set(gameSessionId, existing)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to game session:', error)
      return null
    }
  }

  /**
   * Unsubscribe from game session
   */
  private unsubscribeFromGameSession(
    gameSessionId: string,
    subscription: SpectatorSubscription
  ): void {
    const subs = this.subscriptions.get(gameSessionId) || []
    const filtered = subs.filter(s => s !== subscription)
    
    if (filtered.length > 0) {
      this.subscriptions.set(gameSessionId, filtered)
    } else {
      this.subscriptions.delete(gameSessionId)
    }
  }

  /**
   * Notify subscribers of updates
   */
  private notifySubscribers(gameSessionId: string, update: SpectatorUpdate): void {
    const subscribers = this.subscriptions.get(gameSessionId) || []
    subscribers.forEach(sub => {
      try {
        sub.callback(update)
      } catch (error) {
        console.error('Error in spectator update callback:', error)
      }
    })
  }

  /**
   * Helper: Map spectator from database
   */
  private mapSpectatorFromDatabase(data: any): Spectator {
    return {
      id: data.id,
      gameSessionId: data.game_session_id,
      tournamentMatchId: data.tournament_match_id,
      viewerId: data.viewer_id,
      viewerGuestId: data.viewer_guest_id,
      joinedAt: new Date(data.joined_at),
      leftAt: data.left_at ? new Date(data.left_at) : undefined,
      durationSeconds: data.duration_seconds
    }
  }

  /**
   * Helper: Map chat message from database
   */
  private mapChatMessageFromDatabase(data: any): SpectatorChatMessage {
    return {
      id: data.id,
      gameSessionId: data.game_session_id,
      tournamentMatchId: data.tournament_match_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      message: data.message,
      sentAt: new Date(data.sent_at),
      isDeleted: data.is_deleted
    }
  }
}

// Export singleton instance
export const spectatorService = new SpectatorService()