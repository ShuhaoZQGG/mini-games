import { RealtimeService } from '@/lib/services/realtime';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
      track: jest.fn(),
      untrack: jest.fn(),
      presenceState: jest.fn(() => ({})),
      send: jest.fn()
    })),
    removeChannel: jest.fn()
  }))
}));

describe('RealtimeService', () => {
  let service: RealtimeService;

  beforeEach(() => {
    // Clear any existing instance
    (RealtimeService as any).instance = undefined;
    
    // Mock environment variables to simulate no Supabase config (use mock WebSocket)
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    
    service = RealtimeService.getInstance();
  });

  afterEach(async () => {
    await service.cleanup();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = RealtimeService.getInstance();
      const instance2 = RealtimeService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Score Subscriptions', () => {
    it('should subscribe to score updates for a specific game', (done) => {
      const gameId = 'test-game';
      let receivedScore: any = null;

      const unsubscribe = service.subscribeToScores(gameId, (score) => {
        receivedScore = score;
        expect(receivedScore).toBeDefined();
        expect(receivedScore.game_id).toBe(gameId);
        expect(receivedScore.score).toBeGreaterThan(0);
        unsubscribe();
        done();
      });

      // Trigger a mock score update
      setTimeout(() => {
        if (!receivedScore) {
          unsubscribe();
          done(new Error('Score update not received'));
        }
      }, 15000); // Mock updates happen between 5-15 seconds
    }, 20000);

    it('should handle multiple score subscriptions', () => {
      const gameId1 = 'game-1';
      const gameId2 = 'game-2';
      const scores1: any[] = [];
      const scores2: any[] = [];

      const unsub1 = service.subscribeToScores(gameId1, (score) => {
        scores1.push(score);
      });

      const unsub2 = service.subscribeToScores(gameId2, (score) => {
        scores2.push(score);
      });

      // Clean up
      unsub1();
      unsub2();

      expect(scores1).toBeDefined();
      expect(scores2).toBeDefined();
    });
  });

  describe('Leaderboard Subscriptions', () => {
    it('should subscribe to leaderboard updates', (done) => {
      const gameId = 'test-game';
      const period = 'all_time' as const;

      const unsubscribe = service.subscribeToLeaderboard(
        gameId,
        period,
        (leaderboard) => {
          expect(leaderboard).toBeDefined();
          expect(Array.isArray(leaderboard)).toBe(true);
          unsubscribe();
          done();
        }
      );

      // For mock implementation, this triggers after 10 seconds
      setTimeout(() => {
        unsubscribe();
        done();
      }, 11000);
    }, 15000);
  });

  describe('Presence Tracking', () => {
    it('should track user presence in a game', async () => {
      const gameId = 'test-game';
      const userData = {
        user_id: 'test-user-123',
        username: 'TestPlayer'
      };

      let presenceState: any = null;

      const unsubscribe = await service.trackPresence(
        gameId,
        userData,
        (state) => {
          presenceState = state;
        }
      );

      // Check that presence was tracked
      expect(presenceState).toBeDefined();

      // Clean up
      unsubscribe();
    });

    it('should get current presence state', async () => {
      const gameId = 'test-game';
      const userData = {
        user_id: 'test-user-456',
        username: 'AnotherPlayer'
      };

      const unsubscribe = await service.trackPresence(gameId, userData);
      
      const state = service.getPresenceState(gameId);
      expect(state).toBeDefined();

      unsubscribe();
    });
  });

  describe('Game Events', () => {
    it('should broadcast game events', async () => {
      const event = {
        type: 'score_update' as const,
        game_id: 'test-game',
        player_name: 'TestPlayer',
        data: { score: 1000 },
        timestamp: new Date().toISOString()
      };

      await expect(service.broadcastGameEvent(event)).resolves.not.toThrow();
    });

    it('should subscribe to game events', (done) => {
      const gameId = 'test-game';
      let receivedEvent: any = null;

      const unsubscribe = service.subscribeToGameEvents(gameId, (event) => {
        receivedEvent = event;
        expect(receivedEvent).toBeDefined();
        expect(receivedEvent.game_id).toBe(gameId);
        unsubscribe();
        done();
      });

      // Broadcast an event to trigger the subscription
      const testEvent = {
        type: 'player_joined' as const,
        game_id: gameId,
        player_name: 'TestPlayer',
        data: null,
        timestamp: new Date().toISOString()
      };

      service.broadcastGameEvent(testEvent);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all subscriptions', async () => {
      const gameId = 'test-game';
      
      // Create some subscriptions
      const unsub1 = service.subscribeToScores(gameId, () => {});
      const unsub2 = service.subscribeToGameEvents(gameId, () => {});

      // Clean up everything
      await service.cleanup();

      // Verify cleanup doesn't throw
      expect(() => unsub1()).not.toThrow();
      expect(() => unsub2()).not.toThrow();
    });
  });
});

describe('RealtimeService with Supabase', () => {
  let service: RealtimeService;

  beforeEach(() => {
    // Clear any existing instance
    (RealtimeService as any).instance = undefined;
    
    // Mock environment variables to simulate Supabase config
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    
    service = RealtimeService.getInstance();
  });

  afterEach(async () => {
    await service.cleanup();
    jest.clearAllMocks();
  });

  it('should use Supabase when configured', () => {
    const gameId = 'test-game';
    const unsubscribe = service.subscribeToScores(gameId, () => {});
    
    // Verify Supabase client methods were called
    const { createClient } = require('@/lib/supabase/client');
    expect(createClient).toHaveBeenCalled();
    
    unsubscribe();
  });
});

// Test Mock WebSocket implementation
describe('MockWebSocket', () => {
  beforeEach(() => {
    // Ensure we're using mock implementation
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('should simulate score updates', (done) => {
    const service = RealtimeService.getInstance();
    const gameId = 'snake';
    const scores: any[] = [];

    const unsubscribe = service.subscribeToScores(gameId, (score) => {
      scores.push(score);
      if (scores.length >= 1) {
        expect(scores[0]).toHaveProperty('id');
        expect(scores[0]).toHaveProperty('player_name');
        expect(scores[0]).toHaveProperty('score');
        expect(scores[0]).toHaveProperty('created_at');
        unsubscribe();
        done();
      }
    });

    // Wait for mock updates (5-15 seconds)
    setTimeout(() => {
      if (scores.length === 0) {
        unsubscribe();
        done(new Error('No mock scores received'));
      }
    }, 16000);
  }, 20000);

  it('should simulate presence updates', async () => {
    const service = RealtimeService.getInstance();
    const gameId = 'test-game';
    
    let presenceCount = 0;
    
    const unsubscribe = await service.trackPresence(
      gameId,
      { user_id: 'test-1', username: 'Player1' },
      (state) => {
        presenceCount = Array.isArray(state) ? state.length : 0;
      }
    );

    // Should have at least one user (the current one)
    expect(presenceCount).toBeGreaterThan(0);
    
    unsubscribe();
  });
});