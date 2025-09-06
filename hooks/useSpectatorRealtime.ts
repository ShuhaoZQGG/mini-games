/**
 * useSpectatorRealtime Hook
 * React hook for real-time spectator updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { spectatorService, SpectatorUpdate, SpectatorChatMessage } from '@/lib/services/spectator'

export interface SpectatorRealtimeState {
  isConnected: boolean
  viewerCount: number
  gameState: any
  chatMessages: SpectatorChatMessage[]
  isLoading: boolean
  error: string | null
}

export function useSpectatorRealtime(
  gameSessionId: string,
  userId?: string,
  guestId?: string
) {
  const [state, setState] = useState<SpectatorRealtimeState>({
    isConnected: false,
    viewerCount: 0,
    gameState: null,
    chatMessages: [],
    isLoading: true,
    error: null
  })

  const subscriptionRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle spectator updates
  const handleUpdate = useCallback((update: SpectatorUpdate) => {
    setState(prev => {
      switch (update.type) {
        case 'spectator_joined':
        case 'spectator_left':
        case 'viewer_count_update':
          // Update viewer count
          spectatorService.getActiveSpectatorCount(gameSessionId).then(count => {
            setState(p => ({ ...p, viewerCount: count }))
          })
          return prev

        case 'chat_message':
          // Add new chat message
          return {
            ...prev,
            chatMessages: [...prev.chatMessages, update.data as SpectatorChatMessage]
          }

        case 'game_state_update':
          // Update game state
          return {
            ...prev,
            gameState: update.data,
            viewerCount: update.data?.viewerCount || prev.viewerCount
          }

        default:
          return prev
      }
    })
  }, [gameSessionId])

  // Initialize connection
  const initConnection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Start spectating
      const spectator = await spectatorService.startSpectating({
        gameSessionId,
        userId,
        guestId
      })

      if (!spectator) {
        // Already spectating or error
        console.warn('Could not start spectating - may already be active')
      }

      // Subscribe to updates
      const subscription = await spectatorService.subscribeToGameSession(
        gameSessionId,
        handleUpdate
      )

      if (subscription) {
        subscriptionRef.current = subscription
        setState(prev => ({ ...prev, isConnected: true }))
      }

      // Load initial data
      const [viewerCount, chatHistory] = await Promise.all([
        spectatorService.getActiveSpectatorCount(gameSessionId),
        spectatorService.getChatHistory(gameSessionId, { limit: 50 })
      ])

      setState(prev => ({
        ...prev,
        viewerCount,
        chatMessages: chatHistory,
        isLoading: false,
        isConnected: true
      }))
    } catch (error) {
      console.error('Failed to initialize spectator connection:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to connect to live stream',
        isConnected: false
      }))

      // Schedule reconnection
      scheduleReconnect()
    }
  }, [gameSessionId, userId, guestId, handleUpdate])

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...')
      initConnection()
    }, 5000)
  }, [initConnection])

  // Cleanup connection
  const cleanup = useCallback(async () => {
    // Unsubscribe from updates
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    // Stop spectating
    if (userId || guestId) {
      await spectatorService.stopSpectating(gameSessionId, userId, guestId)
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState({
      isConnected: false,
      viewerCount: 0,
      gameState: null,
      chatMessages: [],
      isLoading: false,
      error: null
    })
  }, [gameSessionId, userId, guestId])

  // Setup effect
  useEffect(() => {
    initConnection()

    return () => {
      cleanup()
    }
  }, [gameSessionId, userId, guestId])

  // Send chat message
  const sendMessage = useCallback(async (message: string) => {
    if (!userId || !message.trim()) {
      return false
    }

    try {
      const chatMessage = await spectatorService.sendChatMessage({
        gameSessionId,
        senderId: userId,
        senderName: 'User', // Would be fetched from user profile in real app
        message: message.trim()
      })

      if (chatMessage) {
        // Message will be added via subscription update
        return true
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }

    return false
  }, [gameSessionId, userId])

  // Delete chat message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) {
      return false
    }

    try {
      const result = await spectatorService.deleteChatMessage(messageId, userId)
      
      if (result) {
        // Remove from local state
        setState(prev => ({
          ...prev,
          chatMessages: prev.chatMessages.filter(m => m.id !== messageId)
        }))
      }

      return result
    } catch (error) {
      console.error('Failed to delete message:', error)
      return false
    }
  }, [userId])

  return {
    ...state,
    sendMessage,
    deleteMessage,
    reconnect: initConnection
  }
}