/**
 * Tests for Analytics Service
 */

import analytics from '@/lib/services/analytics';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window properties
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/test' },
      writable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(document, 'referrer', {
      value: 'http://google.com',
      writable: true,
    });
  });

  describe('trackPageView', () => {
    it('should track page views', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackPageView('/games/snake');
      
      // In debug mode, it should log the event
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackGame', () => {
    it('should track game start events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackGame({
        gameId: 'snake',
        action: 'start',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should track game complete events with score', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackGame({
        gameId: 'snake',
        action: 'complete',
        score: 1000,
        duration: 60000,
        level: 'hard',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackSocial', () => {
    it('should track social sharing events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackSocial({
        platform: 'twitter',
        contentType: 'score',
        gameId: 'snake',
        success: true,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackUser', () => {
    it('should track user login events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackUser({
        action: 'login',
        method: 'google',
        success: true,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should track user signup events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackUser({
        action: 'signup',
        method: 'email',
        success: true,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackAchievement', () => {
    it('should track achievement unlocks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackAchievement('first_win', 10);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackChallenge', () => {
    it('should track challenge events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackChallenge('created', 'snake');
      analytics.trackChallenge('accepted', 'tetris');
      analytics.trackChallenge('completed', 'snake');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackTournament', () => {
    it('should track tournament events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackTournament('joined', 'tournament-123');
      analytics.trackTournament('completed', 'tournament-123', 3);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackPerformance', () => {
    it('should track performance metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackPerformance({
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 800,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('trackCustom', () => {
    it('should track custom events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      analytics.trackCustom('button_click', {
        button_id: 'start-game',
        page: '/home',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('offline handling', () => {
    it('should queue events when offline', () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      analytics.trackPageView('/offline-test');
      
      // Should save to localStorage when offline
      expect(setItemSpy).toHaveBeenCalledWith(
        'analytics_queue',
        expect.any(String)
      );
      
      setItemSpy.mockRestore();
    });
  });
});