/**
 * Analytics Service - Plausible Analytics Integration
 * Privacy-focused analytics for tracking user behavior and game metrics
 */

import { createClient } from '@/lib/supabase/client';

interface PlausibleEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
  url?: string;
  domain?: string;
  referrer?: string | null;
  width?: number;
}

interface GameEvent {
  gameId: string;
  action: 'start' | 'complete' | 'quit' | 'pause' | 'resume';
  score?: number;
  duration?: number;
  level?: string;
  difficulty?: string;
}

interface SocialEvent {
  platform: string;
  contentType: 'score' | 'achievement' | 'challenge' | 'leaderboard';
  gameId?: string;
  success: boolean;
}

interface UserEvent {
  action: 'signup' | 'login' | 'logout' | 'profile_update' | 'settings_change';
  method?: string;
  success: boolean;
}

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint (INP)
}

class AnalyticsService {
  private domain: string;
  private apiEndpoint: string;
  private enabled: boolean;
  private debugMode: boolean;
  private queue: PlausibleEvent[] = [];
  private isOnline: boolean = true;
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'mini-games.app';
    this.apiEndpoint = process.env.NEXT_PUBLIC_PLAUSIBLE_API || 'https://plausible.io/api/event';
    this.enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
    this.debugMode = process.env.NODE_ENV === 'development';
    this.sessionId = this.generateSessionId();

    // Initialize online status monitoring
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Track page views automatically
      this.trackPageView();

      // Listen for route changes in Next.js
      if (typeof window !== 'undefined') {
        const handleRouteChange = () => this.trackPageView();
        window.addEventListener('popstate', handleRouteChange);
      }

      // Set up user identification
      this.identifyUser();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async identifyUser() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    } catch (error) {
      // User not authenticated, continue as anonymous
      this.userId = null;
    }
  }

  private async sendEvent(event: PlausibleEvent) {
    if (!this.enabled) {
      if (this.debugMode) {
        console.log('[Analytics Debug]', event);
      }
      return;
    }

    // Queue event if offline
    if (!this.isOnline) {
      this.queue.push(event);
      this.saveQueueToStorage();
      return;
    }

    try {
      const payload = {
        name: event.name,
        url: event.url || window.location.href,
        domain: event.domain || this.domain,
        referrer: event.referrer || document.referrer || null,
        width: event.width || window.innerWidth,
        props: {
          ...event.props,
          session_id: this.sessionId,
          user_id: this.userId,
        }
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '127.0.0.1', // Privacy-focused: don't send real IP
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok && this.debugMode) {
        console.error('[Analytics Error]', response.statusText);
      }
    } catch (error) {
      if (this.debugMode) {
        console.error('[Analytics Error]', error);
      }
      // Queue failed events for retry
      this.queue.push(event);
      this.saveQueueToStorage();
    }
  }

  private saveQueueToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('analytics_queue', JSON.stringify(this.queue));
      } catch (error) {
        // Storage might be full, clear old data
        this.queue = this.queue.slice(-50); // Keep only last 50 events
      }
    }
  }

  private loadQueueFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('analytics_queue');
        if (stored) {
          this.queue = JSON.parse(stored);
          localStorage.removeItem('analytics_queue');
        }
      } catch (error) {
        // Invalid data, ignore
      }
    }
  }

  private async flushQueue() {
    this.loadQueueFromStorage();
    const events = [...this.queue];
    this.queue = [];
    
    for (const event of events) {
      await this.sendEvent(event);
    }
  }

  // Public tracking methods

  trackPageView(url?: string) {
    this.sendEvent({
      name: 'pageview',
      url: url || window.location.href,
    });
  }

  trackGame(event: GameEvent) {
    const eventName = `game_${event.action}`;
    this.sendEvent({
      name: eventName,
      props: {
        game_id: event.gameId,
        score: event.score || 0,
        duration: event.duration || 0,
        level: event.level || '',
        difficulty: event.difficulty || '',
      }
    });

    // Track high scores
    if (event.action === 'complete' && event.score) {
      this.checkAndTrackHighScore(event.gameId, event.score);
    }
  }

  trackSocial(event: SocialEvent) {
    this.sendEvent({
      name: 'social_share',
      props: {
        platform: event.platform,
        content_type: event.contentType,
        game_id: event.gameId || '',
        success: event.success ? 1 : 0,
      }
    });
  }

  trackUser(event: UserEvent) {
    this.sendEvent({
      name: `user_${event.action}`,
      props: {
        method: event.method || '',
        success: event.success ? 1 : 0,
      }
    });

    // Update user ID on login/logout
    if (event.action === 'login' && event.success) {
      this.identifyUser();
    } else if (event.action === 'logout') {
      this.userId = null;
    }
  }

  trackAchievement(achievementId: string, points: number) {
    this.sendEvent({
      name: 'achievement_unlocked',
      props: {
        achievement_id: achievementId,
        points: points,
      }
    });
  }

  trackChallenge(action: 'created' | 'accepted' | 'completed' | 'declined', gameId?: string) {
    this.sendEvent({
      name: `challenge_${action}`,
      props: {
        game_id: gameId || '',
      }
    });
  }

  trackTournament(action: 'joined' | 'created' | 'completed' | 'left', tournamentId: string, placement?: number) {
    this.sendEvent({
      name: `tournament_${action}`,
      props: {
        tournament_id: tournamentId,
        placement: placement || 0,
      }
    });
  }

  trackSearch(query: string, category: 'games' | 'players' | 'tournaments') {
    this.sendEvent({
      name: 'search',
      props: {
        query: query.substring(0, 100), // Limit query length
        category: category,
      }
    });
  }

  trackError(error: Error, context?: string) {
    this.sendEvent({
      name: 'error',
      props: {
        message: error.message.substring(0, 200),
        context: context || 'unknown',
        stack: this.debugMode ? error.stack?.substring(0, 500) || '' : '',
      }
    });
  }

  trackPerformance(metrics: PerformanceMetrics) {
    this.sendEvent({
      name: 'performance',
      props: {
        lcp: Math.round(metrics.lcp),
        fid: Math.round(metrics.fid),
        cls: Math.round(metrics.cls * 1000) / 1000,
        fcp: Math.round(metrics.fcp),
        ttfb: Math.round(metrics.ttfb),
        inp: metrics.inp ? Math.round(metrics.inp) : 0,
      }
    });
  }

  trackCustom(eventName: string, props?: Record<string, string | number | boolean>) {
    this.sendEvent({
      name: eventName,
      props: props || {},
    });
  }

  // Helper methods

  private async checkAndTrackHighScore(gameId: string, score: number) {
    try {
      const highScoreKey = `highscore_${gameId}`;
      const previousHigh = parseInt(localStorage.getItem(highScoreKey) || '0');
      
      if (score > previousHigh) {
        localStorage.setItem(highScoreKey, score.toString());
        this.sendEvent({
          name: 'new_high_score',
          props: {
            game_id: gameId,
            score: score,
            previous: previousHigh,
          }
        });
      }
    } catch (error) {
      // LocalStorage might not be available
    }
  }

  // Funnel tracking for conversion analysis
  trackFunnel(step: string, funnelName: string) {
    this.sendEvent({
      name: 'funnel_step',
      props: {
        funnel: funnelName,
        step: step,
      }
    });
  }

  // Goal tracking
  trackGoal(goalName: string, value?: number) {
    this.sendEvent({
      name: `goal_${goalName}`,
      props: {
        value: value || 1,
      }
    });
  }

  // Session timing
  trackTiming(category: string, variable: string, time: number) {
    this.sendEvent({
      name: 'timing',
      props: {
        category: category,
        variable: variable,
        time: Math.round(time),
      }
    });
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

// Export service and helper functions
export default analytics;

export const trackGame = (event: GameEvent) => analytics.trackGame(event);
export const trackSocial = (event: SocialEvent) => analytics.trackSocial(event);
export const trackUser = (event: UserEvent) => analytics.trackUser(event);
export const trackAchievement = (id: string, points: number) => analytics.trackAchievement(id, points);
export const trackChallenge = (action: 'created' | 'accepted' | 'completed' | 'declined', gameId?: string) => 
  analytics.trackChallenge(action, gameId);
export const trackTournament = (action: 'joined' | 'created' | 'completed' | 'left', id: string, placement?: number) =>
  analytics.trackTournament(action, id, placement);
export const trackPerformance = (metrics: PerformanceMetrics) => analytics.trackPerformance(metrics);
export const trackCustom = (name: string, props?: Record<string, string | number | boolean>) => 
  analytics.trackCustom(name, props);