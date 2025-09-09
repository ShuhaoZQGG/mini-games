import { createClient } from './client'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'

export interface GameRoom {
  id: string
  game_type: string
  players: string[]
  max_players: number
  status: 'waiting' | 'playing' | 'finished'
  created_by: string
  created_at: string
  game_state?: any
}

export interface GameMove {
  player_id: string
  move_data: any
  timestamp: string
}

export class MultiplayerGameManager {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null
  private roomId: string | null = null

  async createRoom(gameType: string, maxPlayers: number = 2): Promise<GameRoom> {
    const roomId = `${gameType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const room: GameRoom = {
      id: roomId,
      game_type: gameType,
      players: [],
      max_players: maxPlayers,
      status: 'waiting',
      created_by: 'anonymous', // Will be replaced with actual user ID
      created_at: new Date().toISOString(),
    }

    // Create room in database
    const { data, error } = await (this.supabase
      .from('game_rooms') as any)
      .insert(room)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async joinRoom(roomId: string, playerId: string): Promise<RealtimeChannel> {
    this.roomId = roomId
    
    // Join the realtime channel
    this.channel = this.supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    })

    // Track presence
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState()
        console.log('Presence state:', state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Player joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Player left:', key, leftPresences)
      })

    // Subscribe to game moves
    this.channel.on('broadcast', { event: 'game_move' }, ({ payload }) => {
      console.log('Game move received:', payload)
    })

    await this.channel.subscribe()
    
    // Update room with new player
    await (this.supabase
      .from('game_rooms') as any)
      .update({ 
        players: (this.supabase.rpc as any)('array_append', { arr: 'players', elem: playerId })
      })
      .eq('id', roomId)

    return this.channel
  }

  async sendMove(moveData: any): Promise<void> {
    if (!this.channel) throw new Error('Not connected to a room')
    
    await this.channel.send({
      type: 'broadcast',
      event: 'game_move',
      payload: {
        player_id: 'current_player', // Will be replaced with actual user ID
        move_data: moveData,
        timestamp: new Date().toISOString(),
      },
    })
  }

  async updateGameState(gameState: any): Promise<void> {
    if (!this.roomId) throw new Error('Not in a room')
    
    await (this.supabase
      .from('game_rooms') as any)
      .update({ game_state: gameState })
      .eq('id', this.roomId)
  }

  async leaveRoom(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
      this.roomId = null
    }
  }

  getPresenceState(): RealtimePresenceState<any> {
    if (!this.channel) throw new Error('Not connected to a room')
    return this.channel.presenceState()
  }

  onGameMove(callback: (move: GameMove) => void): void {
    if (!this.channel) throw new Error('Not connected to a room')
    
    this.channel.on('broadcast', { event: 'game_move' }, ({ payload }) => {
      callback(payload as GameMove)
    })
  }

  onPlayerJoin(callback: (playerId: string) => void): void {
    if (!this.channel) throw new Error('Not connected to a room')
    
    this.channel.on('presence', { event: 'join' }, ({ key }) => {
      callback(key)
    })
  }

  onPlayerLeave(callback: (playerId: string) => void): void {
    if (!this.channel) throw new Error('Not connected to a room')
    
    this.channel.on('presence', { event: 'leave' }, ({ key }) => {
      callback(key)
    })
  }
}