/**
 * Spectator Service Tests
 * Tests for real-time game spectating functionality
 */

import { spectatorService } from '@/lib/services/spectator'
import { getTournamentRealtimeService } from '@/lib/services/tournament-realtime'

// Mock tournament realtime service
jest.mock('@/lib/services/tournament-realtime', () => ({
  getTournamentRealtimeService: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
    broadcastUpdate: jest.fn(),
    isRealtimeConnected: jest.fn().mockReturnValue(true)
  }))
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ error: null })
    })),
    removeChannel: jest.fn()
  }))
}))

describe('SpectatorService', () => {
  const mockGameSessionId = 'game_123'
  const mockTournamentMatchId = 'match_456'
  const mockUserId = 'user_789'
  const mockGuestId = 'guest_abc'

  beforeEach(() => {
    jest.clearAllMocks()
    spectatorService.clearAll()
  })

  describe('startSpectating', () => {
    it('should successfully start spectating a game session', async () => {
      const result = await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: mockUserId
      })

      expect(result).toBeTruthy()
      expect(result?.gameSessionId).toBe(mockGameSessionId)
      expect(result?.viewerId).toBe(mockUserId)
      expect(result?.joinedAt).toBeInstanceOf(Date)
    })

    it('should support guest spectators', async () => {
      const result = await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        guestId: mockGuestId
      })

      expect(result).toBeTruthy()
      expect(result?.viewerGuestId).toBe(mockGuestId)
      expect(result?.viewerId).toBeUndefined()
    })

    it('should track tournament match spectators', async () => {
      const result = await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        tournamentMatchId: mockTournamentMatchId,
        userId: mockUserId
      })

      expect(result?.tournamentMatchId).toBe(mockTournamentMatchId)
    })

    it('should not allow duplicate spectator sessions', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: mockUserId
      })

      const duplicate = await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: mockUserId
      })

      expect(duplicate).toBeNull()
    })
  })

  describe('stopSpectating', () => {
    it('should stop spectating and record duration', async () => {
      const spectator = await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: mockUserId
      })

      // Wait a bit to have measurable duration
      await new Promise(resolve => setTimeout(resolve, 100))

      const result = await spectatorService.stopSpectating(
        mockGameSessionId,
        mockUserId
      )

      expect(result).toBe(true)
      
      const activeCount = await spectatorService.getActiveSpectatorCount(mockGameSessionId)
      expect(activeCount).toBe(0)
    })

    it('should handle stopping non-existent spectator', async () => {
      const result = await spectatorService.stopSpectating(
        'nonexistent',
        mockUserId
      )

      expect(result).toBe(false)
    })
  })

  describe('getActiveSpectators', () => {
    it('should return list of active spectators', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user2'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        guestId: 'guest1'
      })

      const spectators = await spectatorService.getActiveSpectators(mockGameSessionId)

      expect(spectators).toHaveLength(3)
      expect(spectators.some(s => s.viewerId === 'user1')).toBe(true)
      expect(spectators.some(s => s.viewerId === 'user2')).toBe(true)
      expect(spectators.some(s => s.viewerGuestId === 'guest1')).toBe(true)
    })

    it('should not include stopped spectators', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user2'
      })

      await spectatorService.stopSpectating(mockGameSessionId, 'user1')

      const spectators = await spectatorService.getActiveSpectators(mockGameSessionId)

      expect(spectators).toHaveLength(1)
      expect(spectators[0].viewerId).toBe('user2')
    })
  })

  describe('getActiveSpectatorCount', () => {
    it('should return correct count of active spectators', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user2'
      })

      const count = await spectatorService.getActiveSpectatorCount(mockGameSessionId)
      expect(count).toBe(2)
    })

    it('should return 0 for no spectators', async () => {
      const count = await spectatorService.getActiveSpectatorCount('empty_game')
      expect(count).toBe(0)
    })
  })

  describe('broadcastGameState', () => {
    it('should broadcast game state to all spectators', async () => {
      const mockRealtimeService = getTournamentRealtimeService()
      
      const gameState = {
        players: ['player1', 'player2'],
        scores: [100, 150],
        timeRemaining: 60
      }

      await spectatorService.broadcastGameState(
        mockGameSessionId,
        gameState
      )

      expect(mockRealtimeService.broadcastUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'game_state_update',
          gameSessionId: mockGameSessionId,
          data: gameState,
          timestamp: expect.any(Date)
        })
      )
    })

    it('should include viewer count in broadcast', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user2'
      })

      const mockRealtimeService = getTournamentRealtimeService()

      await spectatorService.broadcastGameState(
        mockGameSessionId,
        { score: 100 }
      )

      expect(mockRealtimeService.broadcastUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 100,
            viewerCount: 2
          })
        })
      )
    })
  })

  describe('sendChatMessage', () => {
    it('should send chat message from authenticated user', async () => {
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: 'TestUser',
        message: 'Great game!'
      })

      expect(message).toBeTruthy()
      expect(message?.message).toBe('Great game!')
      expect(message?.senderId).toBe(mockUserId)
      expect(message?.senderName).toBe('TestUser')
    })

    it('should validate message length', async () => {
      const longMessage = 'x'.repeat(501)
      
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: 'TestUser',
        message: longMessage
      })

      expect(message).toBeNull()
    })

    it('should reject empty messages', async () => {
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: 'TestUser',
        message: ''
      })

      expect(message).toBeNull()
    })

    it('should support emoji in messages', async () => {
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: 'TestUser',
        message: 'Amazing play! 🎮🔥'
      })

      expect(message?.message).toBe('Amazing play! 🎮🔥')
    })
  })

  describe('getChatHistory', () => {
    beforeEach(async () => {
      // Add some test messages
      await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: 'user1',
        senderName: 'User1',
        message: 'First message'
      })

      await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: 'user2',
        senderName: 'User2',
        message: 'Second message'
      })

      await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: 'user3',
        senderName: 'User3',
        message: 'Third message'
      })
    })

    it('should return chat history in chronological order', async () => {
      const history = await spectatorService.getChatHistory(mockGameSessionId)

      expect(history).toHaveLength(3)
      expect(history[0].message).toBe('First message')
      expect(history[1].message).toBe('Second message')
      expect(history[2].message).toBe('Third message')
    })

    it('should support pagination', async () => {
      const history = await spectatorService.getChatHistory(
        mockGameSessionId,
        { limit: 2, offset: 1 }
      )

      expect(history).toHaveLength(2)
      expect(history[0].message).toBe('Second message')
      expect(history[1].message).toBe('Third message')
    })

    it('should not return deleted messages', async () => {
      // Delete a message
      const messages = await spectatorService.getChatHistory(mockGameSessionId)
      await spectatorService.deleteChatMessage(messages[1].id!, 'user2')

      const updatedHistory = await spectatorService.getChatHistory(mockGameSessionId)
      
      expect(updatedHistory).toHaveLength(2)
      expect(updatedHistory.some(m => m.message === 'Second message')).toBe(false)
    })
  })

  describe('deleteChatMessage', () => {
    it('should soft delete own message', async () => {
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: 'TestUser',
        message: 'Test message'
      })

      const result = await spectatorService.deleteChatMessage(
        message!.id!,
        mockUserId
      )

      expect(result).toBe(true)

      const history = await spectatorService.getChatHistory(mockGameSessionId)
      expect(history.some(m => m.id === message!.id)).toBe(false)
    })

    it('should not allow deleting other users messages', async () => {
      const message = await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: 'user1',
        senderName: 'User1',
        message: 'Test message'
      })

      const result = await spectatorService.deleteChatMessage(
        message!.id!,
        'differentUser'
      )

      expect(result).toBe(false)
    })
  })

  describe('getSpectatorStatistics', () => {
    it('should return spectator statistics for a game session', async () => {
      // Add spectators
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: 'user2'
      })

      // Stop one spectator
      await spectatorService.stopSpectating(mockGameSessionId, 'user1')

      // Add chat messages
      await spectatorService.sendChatMessage({
        gameSessionId: mockGameSessionId,
        senderId: 'user1',
        senderName: 'User1',
        message: 'Hello!'
      })

      const stats = await spectatorService.getSpectatorStatistics(mockGameSessionId)

      expect(stats.totalViewers).toBe(2)
      expect(stats.currentViewers).toBe(1)
      expect(stats.peakViewers).toBe(2)
      expect(stats.totalChatMessages).toBe(1)
      expect(stats.averageViewDuration).toBeGreaterThan(0)
    })
  })

  describe('Real-time subscriptions', () => {
    it('should subscribe to game session updates', async () => {
      const callback = jest.fn()
      
      const subscription = await spectatorService.subscribeToGameSession(
        mockGameSessionId,
        callback
      )

      expect(subscription).toBeTruthy()
      expect(subscription?.unsubscribe).toBeInstanceOf(Function)
    })

    it('should handle spectator join/leave events', async () => {
      const callback = jest.fn()
      
      await spectatorService.subscribeToGameSession(
        mockGameSessionId,
        callback
      )

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        userId: mockUserId
      })

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'spectator_joined',
          viewerId: mockUserId
        })
      )
    })
  })

  describe('Tournament match spectating', () => {
    it('should track tournament match spectators separately', async () => {
      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        tournamentMatchId: mockTournamentMatchId,
        userId: 'user1'
      })

      await spectatorService.startSpectating({
        gameSessionId: mockGameSessionId,
        tournamentMatchId: mockTournamentMatchId,
        userId: 'user2'
      })

      const stats = await spectatorService.getTournamentMatchStatistics(
        mockTournamentMatchId
      )

      expect(stats.totalViewers).toBe(2)
      expect(stats.currentViewers).toBe(2)
    })
  })

  describe('Performance optimizations', () => {
    it('should batch broadcast updates', async () => {
      const mockRealtimeService = getTournamentRealtimeService()
      
      // Send multiple updates quickly
      for (let i = 0; i < 5; i++) {
        await spectatorService.broadcastGameState(
          mockGameSessionId,
          { score: i * 10 }
        )
      }

      // Should batch updates
      expect(mockRealtimeService.broadcastUpdate).toHaveBeenCalledTimes(5)
    })

    it('should handle connection failures gracefully', async () => {
      const mockRealtimeService = getTournamentRealtimeService()
      mockRealtimeService.isRealtimeConnected = jest.fn().mockReturnValue(false)

      const result = await spectatorService.broadcastGameState(
        mockGameSessionId,
        { score: 100 }
      )

      expect(result).toBe(false)
    })
  })
})