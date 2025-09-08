/**
 * React hooks for analytics, A/B testing, and performance monitoring
 */

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import analytics, { trackGame, trackSocial, trackUser, trackAchievement, trackChallenge, trackTournament } from '@/lib/services/analytics';
import abTesting, { getVariant, isFeatureEnabled, getFeatureConfig, trackGoal } from '@/lib/services/ab-testing';
import performanceMonitoring from '@/lib/services/performance-monitoring';

/**
 * Hook to track page views automatically
 */
export function usePageTracking() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Track page view on route change
    if (pathname !== previousPathname.current) {
      analytics.trackPageView(pathname);
      previousPathname.current = pathname;
    }
  }, [pathname]);
}

/**
 * Hook to track game events
 */
export function useGameTracking(gameId: string) {
  const startTime = useRef<number>(0);

  const trackStart = useCallback(() => {
    startTime.current = Date.now();
    trackGame({
      gameId,
      action: 'start',
    });
  }, [gameId]);

  const trackComplete = useCallback((score: number, level?: string, difficulty?: string) => {
    const duration = startTime.current ? Date.now() - startTime.current : 0;
    trackGame({
      gameId,
      action: 'complete',
      score,
      duration,
      level,
      difficulty,
    });
  }, [gameId]);

  const trackQuit = useCallback(() => {
    const duration = startTime.current ? Date.now() - startTime.current : 0;
    trackGame({
      gameId,
      action: 'quit',
      duration,
    });
  }, [gameId]);

  const trackPause = useCallback(() => {
    trackGame({
      gameId,
      action: 'pause',
    });
  }, [gameId]);

  const trackResume = useCallback(() => {
    trackGame({
      gameId,
      action: 'resume',
    });
  }, [gameId]);

  // Track quit on unmount
  useEffect(() => {
    return () => {
      if (startTime.current > 0) {
        const duration = Date.now() - startTime.current;
        trackGame({
          gameId,
          action: 'quit',
          duration,
        });
      }
    };
  }, [gameId]);

  return {
    trackStart,
    trackComplete,
    trackQuit,
    trackPause,
    trackResume,
  };
}

/**
 * Hook for A/B testing experiments
 */
export function useExperiment(experimentId: string) {
  const variant = getVariant(experimentId);

  const trackConversion = useCallback((goalName: string, value?: any) => {
    trackGoal(goalName, value);
  }, []);

  return {
    variant,
    isControl: variant?.isControl || false,
    config: variant?.config || {},
    trackConversion,
  };
}

/**
 * Hook for feature flags
 */
export function useFeatureFlag(flagId: string) {
  const enabled = isFeatureEnabled(flagId);
  const config = getFeatureConfig(flagId);

  return {
    enabled,
    config: config || {},
  };
}

/**
 * Hook to track performance metrics
 */
export function usePerformanceTracking() {
  const hasTrackedInitialMetrics = useRef(false);

  useEffect(() => {
    if (!hasTrackedInitialMetrics.current) {
      // Wait for page to fully load before tracking metrics
      const handleLoad = () => {
        setTimeout(() => {
          const metrics = performanceMonitoring.getCoreWebVitals();
          
          // Only track metrics that have been collected
          Object.entries(metrics).forEach(([name, metric]) => {
            if (metric && metric.value) {
              console.log(`Core Web Vital - ${name}: ${metric.value}ms (${metric.rating})`);
            }
          });
        }, 1000);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }

      hasTrackedInitialMetrics.current = true;
    }
  }, []);

  const markTiming = useCallback((name: string) => {
    performanceMonitoring.mark(name);
  }, []);

  const measureTiming = useCallback((name: string, startMark: string, endMark: string) => {
    performanceMonitoring.measure(name, startMark, endMark);
  }, []);

  return {
    markTiming,
    measureTiming,
  };
}

/**
 * Hook to track social sharing
 */
export function useSocialTracking() {
  const trackShare = useCallback((platform: string, contentType: string, gameId?: string, success: boolean = true) => {
    trackSocial({
      platform,
      contentType: contentType as any,
      gameId,
      success,
    });
  }, []);

  return { trackShare };
}

/**
 * Hook to track user events
 */
export function useUserTracking() {
  const trackSignup = useCallback((method: string, success: boolean) => {
    trackUser({
      action: 'signup',
      method,
      success,
    });
  }, []);

  const trackLogin = useCallback((method: string, success: boolean) => {
    trackUser({
      action: 'login',
      method,
      success,
    });
  }, []);

  const trackLogout = useCallback(() => {
    trackUser({
      action: 'logout',
      success: true,
    });
  }, []);

  const trackProfileUpdate = useCallback((success: boolean) => {
    trackUser({
      action: 'profile_update',
      success,
    });
  }, []);

  const trackSettingsChange = useCallback((success: boolean) => {
    trackUser({
      action: 'settings_change',
      success,
    });
  }, []);

  return {
    trackSignup,
    trackLogin,
    trackLogout,
    trackProfileUpdate,
    trackSettingsChange,
  };
}

/**
 * Hook to track achievement unlocks
 */
export function useAchievementTracking() {
  const trackUnlock = useCallback((achievementId: string, points: number) => {
    trackAchievement(achievementId, points);
  }, []);

  return { trackUnlock };
}

/**
 * Hook to track challenge events
 */
export function useChallengeTracking() {
  const trackCreated = useCallback((gameId?: string) => {
    trackChallenge('created', gameId);
  }, []);

  const trackAccepted = useCallback((gameId?: string) => {
    trackChallenge('accepted', gameId);
  }, []);

  const trackCompleted = useCallback((gameId?: string) => {
    trackChallenge('completed', gameId);
  }, []);

  const trackDeclined = useCallback((gameId?: string) => {
    trackChallenge('declined', gameId);
  }, []);

  return {
    trackCreated,
    trackAccepted,
    trackCompleted,
    trackDeclined,
  };
}

/**
 * Hook to track tournament events
 */
export function useTournamentTracking() {
  const trackJoined = useCallback((tournamentId: string) => {
    trackTournament('joined', tournamentId);
  }, []);

  const trackCreated = useCallback((tournamentId: string) => {
    trackTournament('created', tournamentId);
  }, []);

  const trackCompleted = useCallback((tournamentId: string, placement: number) => {
    trackTournament('completed', tournamentId, placement);
  }, []);

  const trackLeft = useCallback((tournamentId: string) => {
    trackTournament('left', tournamentId);
  }, []);

  return {
    trackJoined,
    trackCreated,
    trackCompleted,
    trackLeft,
  };
}

/**
 * Combined hook for all analytics features
 */
export function useAnalytics(gameId?: string) {
  // Auto-track page views
  usePageTracking();

  // Initialize performance tracking
  usePerformanceTracking();

  // Get individual tracking functions
  const gameTracking = gameId ? useGameTracking(gameId) : null;
  const socialTracking = useSocialTracking();
  const userTracking = useUserTracking();
  const achievementTracking = useAchievementTracking();
  const challengeTracking = useChallengeTracking();
  const tournamentTracking = useTournamentTracking();

  return {
    game: gameTracking,
    social: socialTracking,
    user: userTracking,
    achievement: achievementTracking,
    challenge: challengeTracking,
    tournament: tournamentTracking,
    custom: analytics.trackCustom,
    funnel: analytics.trackFunnel,
    goal: analytics.trackGoal,
    timing: analytics.trackTiming,
  };
}