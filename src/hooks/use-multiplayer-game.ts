import { useState, useEffect, useCallback, useRef } from 'react'
import { MultiplayerGameManager, GameMove } from '@/lib/supabase/realtime'

interface UseMultiplayerGameOptions {
  gameType: string
  roomId?: string
  maxPlayers?: number
  onGameMove?: (move: GameMove) => void
  onPlayerJoin?: (playerId: string) => void
  onPlayerLeave?: (playerId: string) => void
}

interface UseMultiplayerGameReturn {
  isConnected: boolean
  roomId: string | null
  players: string[]
  gameState: any
  sendMove: (moveData: any) => Promise<void>
  updateGameState: (gameState: any) => Promise<void>
  createRoom: () => Promise<void>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: () => Promise<void>
  error: Error | null
}

export function useMultiplayerGame({
  gameType,
  roomId: initialRoomId,
  maxPlayers = 2,
  onGameMove,
  onPlayerJoin,
  onPlayerLeave,
}: UseMultiplayerGameOptions): UseMultiplayerGameReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null)
  const [players, setPlayers] = useState<string[]>([])
  const [gameState, setGameState] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const managerRef = useRef<MultiplayerGameManager | null>(null)
  const playerIdRef = useRef<string>(`player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    managerRef.current = new MultiplayerGameManager()
    
    return () => {
      if (managerRef.current) {
        managerRef.current.leaveRoom().catch(console.error)
      }
    }
  }, [])

  const createRoom = useCallback(async () => {
    if (!managerRef.current) return
    
    try {
      setError(null)
      const room = await managerRef.current.createRoom(gameType, maxPlayers)
      setRoomId(room.id)
      await joinRoom(room.id)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to create room:', err)
    }
  }, [gameType, maxPlayers])

  const joinRoom = useCallback(async (roomIdToJoin: string) => {
    if (!managerRef.current) return
    
    try {
      setError(null)
      await managerRef.current.joinRoom(roomIdToJoin, playerIdRef.current)
      
      // Set up event listeners
      if (onGameMove) {
        managerRef.current.onGameMove((move) => {
          onGameMove(move)
          // Update local game state if move contains state update
          if (move.move_data?.gameState) {
            setGameState(move.move_data.gameState)
          }
        })
      }
      
      if (onPlayerJoin) {
        managerRef.current.onPlayerJoin((playerId) => {
          setPlayers(prev => [...prev, playerId])
          onPlayerJoin(playerId)
        })
      }
      
      if (onPlayerLeave) {
        managerRef.current.onPlayerLeave((playerId) => {
          setPlayers(prev => prev.filter(id => id !== playerId))
          onPlayerLeave(playerId)
        })
      }
      
      setRoomId(roomIdToJoin)
      setIsConnected(true)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to join room:', err)
    }
  }, [onGameMove, onPlayerJoin, onPlayerLeave])

  const sendMove = useCallback(async (moveData: any) => {
    if (!managerRef.current) {
      throw new Error('Game manager not initialized')
    }
    
    try {
      setError(null)
      await managerRef.current.sendMove(moveData)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to send move:', err)
      throw err
    }
  }, [])

  const updateGameState = useCallback(async (newGameState: any) => {
    if (!managerRef.current) {
      throw new Error('Game manager not initialized')
    }
    
    try {
      setError(null)
      await managerRef.current.updateGameState(newGameState)
      setGameState(newGameState)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update game state:', err)
      throw err
    }
  }, [])

  const leaveRoom = useCallback(async () => {
    if (!managerRef.current) return
    
    try {
      setError(null)
      await managerRef.current.leaveRoom()
      setIsConnected(false)
      setRoomId(null)
      setPlayers([])
      setGameState(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to leave room:', err)
    }
  }, [])

  // Auto-join room if provided
  useEffect(() => {
    if (initialRoomId && !isConnected) {
      joinRoom(initialRoomId)
    }
  }, [initialRoomId, isConnected, joinRoom])

  return {
    isConnected,
    roomId,
    players,
    gameState,
    sendMove,
    updateGameState,
    createRoom,
    joinRoom,
    leaveRoom,
    error,
  }
}