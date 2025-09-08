/**
 * Spectator Mode Service
 * Manages live spectating of games and tournaments
 */

import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface SpectatorSession {
  id: string
  sessionType: 'game' | 'tournament'
  targetId: string // game_session_id or tournament_match_id
  hostUserId?: string
  hostUsername: string
  viewerCount: number
  maxViewers: number
  isActive: boolean
  startedAt: Date
  endedAt?: Date
  gameInfo?: {
    gameName?: string
    gameSlug?: string
    tournamentName?: string
    gameTitle?: string
    round?: number
    matchNumber?: number
  }
}

export interface SpectatorViewer {
  id: string
  sessionId: string
  viewerId?: string
  viewerName: string
  viewerType: 'registered' | 'guest'
  joinedAt: Date
  leftAt?: Date
}

export interface SpectatorMessage {
  id: string
  sessionId: string
  userId?: string
  username: string
  message: string
  messageType: 'chat' | 'system' | 'reaction'
  createdAt: Date
}

export interface GameState {
  gameSlug: string
  score: number
  timeElapsed?: number
  currentLevel?: number
  gameSpecificData?: any
  timestamp: number
}

class SpectatorService {
  private currentSession: SpectatorSession | null = null
  private viewers: Map<string, SpectatorViewer> = new Map()
  private messages: SpectatorMessage[] = []
  private channel: RealtimeChannel | null = null
  private gameStateCallback: ((state: GameState) => void) | null = null
  private chatCallback: ((message: SpectatorMessage) => void) | null = null
  private viewersCallback: ((viewers: SpectatorViewer[]) => void) | null = null

  /**
   * Start a spectator session for a game
   */
  async startGameSession(params: {
    gameSessionId: string
    hostUserId?: string
    hostUsername: string
    gameSlug: string
    gameName: string
  }): Promise<SpectatorSession | null> {
    try {
      const session: SpectatorSession = {
        id: `spectator_${Date.now()}`,
        sessionType: 'game',
        targetId: params.gameSessionId,
        hostUserId: params.hostUserId,
        hostUsername: params.hostUsername,
        viewerCount: 0,
        maxViewers: 100,
        isActive: true,
        startedAt: new Date(),
        gameInfo: {
          gameSlug: params.gameSlug,
          gameName: params.gameName
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_sessions')
          .insert({
            session_type: session.sessionType,
            target_id: session.targetId,
            host_user_id: session.hostUserId,
            host_username: session.hostUsername,
            viewer_count: 0,
            max_viewers: session.maxViewers,
            is_active: true
          } as any)
          .select()
          .single()

        if (!error && data) {
          session.id = (data as any).id
          this.currentSession = session
          await this.setupRealtimeChannel(session.id)
          return session
        }
      }

      // Fallback to local session
      this.currentSession = session
      this.saveToStorage()
      return session
    } catch (error) {
      console.error('Failed to start spectator session:', error)
      return null
    }
  }

  /**
   * Start a spectator session for a tournament match
   */
  async startTournamentSession(params: {
    matchId: string
    tournamentName: string
    gameTitle: string
    round: number
    matchNumber: number
    hostUserId?: string
    hostUsername: string
  }): Promise<SpectatorSession | null> {
    try {
      const session: SpectatorSession = {
        id: `spectator_tournament_${Date.now()}`,
        sessionType: 'tournament',
        targetId: params.matchId,
        hostUserId: params.hostUserId,
        hostUsername: params.hostUsername,
        viewerCount: 0,
        maxViewers: 500, // Higher limit for tournaments
        isActive: true,
        startedAt: new Date(),
        gameInfo: {
          tournamentName: params.tournamentName,
          gameTitle: params.gameTitle,
          round: params.round,
          matchNumber: params.matchNumber
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_sessions')
          .insert({
            session_type: session.sessionType,
            target_id: session.targetId,
            host_user_id: session.hostUserId,
            host_username: session.hostUsername,
            viewer_count: 0,
            max_viewers: session.maxViewers,
            is_active: true
          } as any)
          .select()
          .single()

        if (!error && data) {
          session.id = (data as any).id
          this.currentSession = session
          await this.setupRealtimeChannel(session.id)
          return session
        }
      }

      // Fallback to local session
      this.currentSession = session
      this.saveToStorage()
      return session
    } catch (error) {
      console.error('Failed to start tournament spectator session:', error)
      return null
    }
  }

  /**
   * Join an existing spectator session
   */
  async joinSession(sessionId: string, viewerName: string, viewerId?: string): Promise<boolean> {
    try {
      if (!sessionId) return false

      const viewer: SpectatorViewer = {
        id: `viewer_${Date.now()}`,
        sessionId,
        viewerId,
        viewerName,
        viewerType: viewerId ? 'registered' : 'guest',
        joinedAt: new Date()
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_viewers')
          .insert({
            session_id: sessionId,
            viewer_id: viewerId,
            viewer_name: viewerName,
            viewer_type: viewer.viewerType
          } as any)
          .select()
          .single()

        if (!error && data) {
          viewer.id = (data as any).id
          this.viewers.set(viewer.id, viewer)
          await this.setupRealtimeChannel(sessionId)
          
          // Send system message
          await this.sendMessage({
            message: `${viewerName} joined the session`,
            messageType: 'system'
          })
          
          return true
        }
      }

      // Fallback to local
      this.viewers.set(viewer.id, viewer)
      this.notifyViewersUpdate()
      return true
    } catch (error) {
      console.error('Failed to join spectator session:', error)
      return false
    }
  }

  /**
   * Leave a spectator session
   */
  async leaveSession(viewerId: string): Promise<void> {
    try {
      const viewer = this.viewers.get(viewerId)
      if (!viewer) return

      if (supabase && viewer.id) {
        await (supabase
          .from('spectator_viewers') as any)
          .update({ left_at: new Date().toISOString() })
          .eq('id', viewer.id)
      }

      this.viewers.delete(viewerId)
      this.notifyViewersUpdate()

      // Send system message
      await this.sendMessage({
        message: `${viewer.viewerName} left the session`,
        messageType: 'system'
      })

      // Cleanup channel if no viewers
      if (this.viewers.size === 0 && this.channel) {
        await this.channel.unsubscribe()
        this.channel = null
      }
    } catch (error) {
      console.error('Failed to leave spectator session:', error)
    }
  }

  /**
   * End a spectator session (host only)
   */
  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) return

      if (supabase) {
        await (supabase
          .from('spectator_sessions') as any)
          .update({ 
            is_active: false,
            ended_at: new Date().toISOString()
          })
          .eq('id', this.currentSession.id)
      }

      // Notify all viewers
      await this.sendMessage({
        message: 'Session ended by host',
        messageType: 'system'
      })

      // Cleanup
      if (this.channel) {
        await this.channel.unsubscribe()
        this.channel = null
      }

      this.currentSession = null
      this.viewers.clear()
      this.messages = []
      this.saveToStorage()
    } catch (error) {
      console.error('Failed to end spectator session:', error)
    }
  }

  /**
   * Send a chat message
   */
  async sendMessage(params: {
    message: string
    messageType?: 'chat' | 'system' | 'reaction'
    userId?: string
    username?: string
  }): Promise<void> {
    try {
      if (!this.currentSession) return

      const message: SpectatorMessage = {
        id: `msg_${Date.now()}`,
        sessionId: this.currentSession.id,
        userId: params.userId,
        username: params.username || 'System',
        message: params.message,
        messageType: params.messageType || 'chat',
        createdAt: new Date()
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_chat')
          .insert({
            session_id: this.currentSession.id,
            user_id: params.userId,
            username: message.username,
            message: message.message,
            message_type: message.messageType
          } as any)
          .select()
          .single()

        if (!error && data) {
          message.id = (data as any).id
          message.createdAt = new Date((data as any).created_at)
        }
      }

      this.messages.push(message)
      
      // Broadcast via realtime
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: message
        })
      }

      // Notify local callback
      if (this.chatCallback) {
        this.chatCallback(message)
      }

      // Keep only last 100 messages
      if (this.messages.length > 100) {
        this.messages = this.messages.slice(-100)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  /**
   * Broadcast game state update (host only)
   */
  async broadcastGameState(state: GameState): Promise<void> {
    try {
      if (!this.currentSession || !this.channel) return

      await this.channel.send({
        type: 'broadcast',
        event: 'game_state',
        payload: {
          ...state,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Failed to broadcast game state:', error)
    }
  }

  /**
   * Get active spectator sessions
   */
  async getActiveSessions(sessionType?: 'game' | 'tournament'): Promise<SpectatorSession[]> {
    try {
      if (supabase) {
        let query = supabase
          .from('spectator_sessions')
          .select('*')
          .eq('is_active', true)
          .order('viewer_count', { ascending: false })
          .limit(50)

        if (sessionType) {
          query = query.eq('session_type', sessionType)
        }

        const { data, error } = await query

        if (!error && data) {
          return data.map((session: any) => ({
            id: session.id,
            sessionType: session.session_type,
            targetId: session.target_id,
            hostUserId: session.host_user_id,
            hostUsername: session.host_username,
            viewerCount: session.viewer_count,
            maxViewers: session.max_viewers,
            isActive: session.is_active,
            startedAt: new Date(session.started_at),
            endedAt: session.ended_at ? new Date(session.ended_at) : undefined
          }))
        }
      }

      // Return demo data if no database
      return this.getDemoSessions()
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId: string): Promise<SpectatorSession | null> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (!error && data) {
          const session = data as any
          return {
            id: session.id,
            sessionType: session.session_type,
            targetId: session.target_id,
            hostUserId: session.host_user_id,
            hostUsername: session.host_username,
            viewerCount: session.viewer_count,
            maxViewers: session.max_viewers,
            isActive: session.is_active,
            startedAt: new Date(session.started_at),
            endedAt: session.ended_at ? new Date(session.ended_at) : undefined
          }
        }
      }

      return this.currentSession
    } catch (error) {
      console.error('Failed to get session details:', error)
      return null
    }
  }

  /**
   * Get session viewers
   */
  async getSessionViewers(sessionId: string): Promise<SpectatorViewer[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_viewers')
          .select('*')
          .eq('session_id', sessionId)
          .is('left_at', null)

        if (!error && data) {
          return data.map((viewer: any) => ({
            id: viewer.id,
            sessionId: viewer.session_id,
            viewerId: viewer.viewer_id,
            viewerName: viewer.viewer_name,
            viewerType: viewer.viewer_type,
            joinedAt: new Date(viewer.joined_at),
            leftAt: viewer.left_at ? new Date(viewer.left_at) : undefined
          }))
        }
      }

      return Array.from(this.viewers.values())
    } catch (error) {
      console.error('Failed to get session viewers:', error)
      return []
    }
  }

  /**
   * Get chat messages
   */
  async getChatMessages(sessionId: string, limit: number = 50): Promise<SpectatorMessage[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('spectator_chat')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) {
          return data.reverse().map((msg: any) => ({
            id: msg.id,
            sessionId: msg.session_id,
            userId: msg.user_id,
            username: msg.username,
            message: msg.message,
            messageType: msg.message_type,
            createdAt: new Date(msg.created_at)
          }))
        }
      }

      return this.messages.slice(-limit)
    } catch (error) {
      console.error('Failed to get chat messages:', error)
      return []
    }
  }

  /**
   * Setup realtime channel for live updates
   */
  private async setupRealtimeChannel(sessionId: string): Promise<void> {
    if (!supabase) return

    try {
      // Cleanup existing channel
      if (this.channel) {
        await this.channel.unsubscribe()
      }

      // Create new channel
      this.channel = supabase.channel(`spectator:${sessionId}`)

      // Subscribe to game state updates
      this.channel.on('broadcast', { event: 'game_state' }, (payload) => {
        if (this.gameStateCallback) {
          this.gameStateCallback(payload.payload as GameState)
        }
      })

      // Subscribe to chat messages
      this.channel.on('broadcast', { event: 'chat_message' }, (payload) => {
        const message = payload.payload as SpectatorMessage
        this.messages.push(message)
        if (this.chatCallback) {
          this.chatCallback(message)
        }
      })

      // Subscribe to viewer updates
      this.channel.on('broadcast', { event: 'viewer_update' }, (payload) => {
        this.notifyViewersUpdate()
      })

      // Subscribe to database changes
      this.channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'spectator_viewers',
          filter: `session_id=eq.${sessionId}`
        }, () => {
          this.notifyViewersUpdate()
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'spectator_chat',
          filter: `session_id=eq.${sessionId}`
        }, (payload) => {
          const msg = payload.new as any
          const message: SpectatorMessage = {
            id: msg.id,
            sessionId: msg.session_id,
            userId: msg.user_id,
            username: msg.username,
            message: msg.message,
            messageType: msg.message_type,
            createdAt: new Date(msg.created_at)
          }
          this.messages.push(message)
          if (this.chatCallback) {
            this.chatCallback(message)
          }
        })

      await this.channel.subscribe()
    } catch (error) {
      console.error('Failed to setup realtime channel:', error)
    }
  }

  /**
   * Set callback for game state updates
   */
  onGameStateUpdate(callback: (state: GameState) => void): void {
    this.gameStateCallback = callback
  }

  /**
   * Set callback for chat messages
   */
  onChatMessage(callback: (message: SpectatorMessage) => void): void {
    this.chatCallback = callback
  }

  /**
   * Set callback for viewer updates
   */
  onViewersUpdate(callback: (viewers: SpectatorViewer[]) => void): void {
    this.viewersCallback = callback
  }

  /**
   * Notify viewers update
   */
  private async notifyViewersUpdate(): Promise<void> {
    if (this.currentSession) {
      const viewers = await this.getSessionViewers(this.currentSession.id)
      if (this.viewersCallback) {
        this.viewersCallback(viewers)
      }
    }
  }

  /**
   * Get demo sessions for testing
   */
  private getDemoSessions(): SpectatorSession[] {
    return [
      {
        id: 'demo_session_1',
        sessionType: 'game',
        targetId: 'game_session_1',
        hostUsername: 'ProGamer123',
        viewerCount: 42,
        maxViewers: 100,
        isActive: true,
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        gameInfo: {
          gameName: 'CPS Test',
          gameSlug: 'cps-test'
        }
      },
      {
        id: 'demo_session_2',
        sessionType: 'tournament',
        targetId: 'match_1',
        hostUsername: 'TournamentHost',
        viewerCount: 156,
        maxViewers: 500,
        isActive: true,
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        gameInfo: {
          tournamentName: 'World Championship',
          gameTitle: 'Typing Test',
          round: 3,
          matchNumber: 2
        }
      },
      {
        id: 'demo_session_3',
        sessionType: 'game',
        targetId: 'game_session_2',
        hostUsername: 'SpeedRunner',
        viewerCount: 28,
        maxViewers: 100,
        isActive: true,
        startedAt: new Date(Date.now() - 5 * 60 * 1000),
        gameInfo: {
          gameName: 'Memory Match',
          gameSlug: 'memory-match'
        }
      }
    ]
  }

  /**
   * Save to local storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        currentSession: this.currentSession,
        viewers: Array.from(this.viewers.values()),
        messages: this.messages.slice(-100) // Keep last 100 messages
      }
      localStorage.setItem('spectator_data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save spectator data:', error)
    }
  }

  /**
   * Load from local storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('spectator_data')
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.currentSession) {
          this.currentSession = {
            ...data.currentSession,
            startedAt: new Date(data.currentSession.startedAt),
            endedAt: data.currentSession.endedAt ? new Date(data.currentSession.endedAt) : undefined
          }
        }

        if (data.viewers) {
          this.viewers.clear()
          data.viewers.forEach((viewer: any) => {
            this.viewers.set(viewer.id, {
              ...viewer,
              joinedAt: new Date(viewer.joinedAt),
              leftAt: viewer.leftAt ? new Date(viewer.leftAt) : undefined
            })
          })
        }

        if (data.messages) {
          this.messages = data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load spectator data:', error)
    }
  }

  /**
   * Cleanup on unmount
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe()
      this.channel = null
    }
    this.gameStateCallback = null
    this.chatCallback = null
    this.viewersCallback = null
  }
}

// Export singleton instance
export const spectatorService = new SpectatorService()