import * as Sentry from '@sentry/nextjs';
import { CaptureContext } from '@sentry/types';

// Sentry configuration types
interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  debug: boolean;
  enabled: boolean;
}

// Initialize Sentry
export const initSentry = (config?: Partial<SentryConfig>) => {
  const defaultConfig: SentryConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    enabled: process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled || !finalConfig.dsn) {
    console.log('Sentry monitoring is disabled or DSN not provided');
    return;
  }

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    tracesSampleRate: finalConfig.tracesSampleRate,
    debug: finalConfig.debug,
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: ['localhost', /^https:\/\/yourserver\.io\/api/],
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        // Mask all text and inputs by default for privacy
        maskAllText: true,
        maskAllInputs: true,
        // Capture 10% of all sessions
        sessionSampleRate: 0.1,
        // Capture 100% of sessions with an error
        errorSampleRate: 1.0,
      }),
    ],

    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out non-error events in production
      if (finalConfig.environment === 'production' && event.level !== 'error') {
        return null;
      }

      // Filter out certain errors
      const error = hint.originalException;
      if (error && error instanceof Error) {
        // Filter out network errors that are expected
        if (error.message?.includes('Network request failed')) {
          return null;
        }
        // Filter out user cancellation errors
        if (error.message?.includes('User cancelled')) {
          return null;
        }
      }

      // Add user context
      if (typeof window !== 'undefined') {
        const user = getUserContext();
        if (user) {
          event.user = user;
        }
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Don't log sensitive form data
      if (breadcrumb.category === 'ui.input' && breadcrumb.message?.includes('password')) {
        return null;
      }

      return breadcrumb;
    },
  });
};

// Helper to get user context
const getUserContext = () => {
  // This should be replaced with actual user data from your auth system
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
        };
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Custom error boundary for React components
export class ErrorBoundary extends Sentry.ErrorBoundary {
  constructor(props: any) {
    super(props);
  }
}

// Capture exception helper
export const captureException = (
  error: Error | string,
  context?: CaptureContext
) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    console.error('Error captured (Sentry disabled):', error);
    return;
  }

  Sentry.captureException(error, context);
};

// Capture message helper
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info'
) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    console.log(`Message captured (Sentry disabled) [${level}]:`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

// Add breadcrumb helper
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
};

// Set user context
export const setUser = (user: Sentry.User | null) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    return;
  }

  Sentry.setUser(user);
};

// Set extra context
export const setContext = (key: string, context: any) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    return;
  }

  Sentry.setContext(key, context);
};

// Performance monitoring helpers
export const startTransaction = (
  name: string,
  op: string = 'navigation'
) => {
  if (process.env.NEXT_PUBLIC_ENABLE_MONITORING !== 'true') {
    return null;
  }

  return Sentry.startTransaction({ name, op });
};

// Profiling helper for expensive operations
export const profileOperation = async <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const transaction = startTransaction(name, 'task');
  
  if (transaction) {
    transaction.setData('metadata', metadata);
  }

  try {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    if (transaction) {
      transaction.setMeasurement('duration', duration, 'millisecond');
      transaction.finish();
    }

    // Log slow operations
    if (duration > 1000) {
      captureMessage(`Slow operation: ${name} took ${duration}ms`, 'warning');
    }

    return result;
  } catch (error) {
    if (transaction) {
      transaction.setStatus('internal_error');
      transaction.finish();
    }
    throw error;
  }
};

// Game-specific error tracking
export const trackGameError = (
  gameId: string,
  error: Error,
  context?: {
    score?: number;
    level?: number;
    duration?: number;
    [key: string]: any;
  }
) => {
  captureException(error, {
    tags: {
      game_id: gameId,
      type: 'game_error',
    },
    contexts: {
      game: {
        id: gameId,
        ...context,
      },
    },
  });
};

// Tournament error tracking
export const trackTournamentError = (
  tournamentId: string,
  error: Error,
  context?: {
    round?: number;
    matchId?: string;
    [key: string]: any;
  }
) => {
  captureException(error, {
    tags: {
      tournament_id: tournamentId,
      type: 'tournament_error',
    },
    contexts: {
      tournament: {
        id: tournamentId,
        ...context,
      },
    },
  });
};

// Achievement tracking
export const trackAchievementUnlock = (
  achievementId: string,
  achievementName: string,
  userId: string
) => {
  addBreadcrumb({
    message: `Achievement unlocked: ${achievementName}`,
    category: 'achievement',
    level: 'info',
    data: {
      achievement_id: achievementId,
      user_id: userId,
    },
  });
};

// Performance metrics tracking
export const trackPerformanceMetric = (
  metric: string,
  value: number,
  unit: string = 'millisecond'
) => {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  if (transaction) {
    transaction.setMeasurement(metric, value, unit);
  }
};

// API call monitoring
export const monitorAPICall = async <T>(
  endpoint: string,
  method: string,
  call: () => Promise<T>
): Promise<T> => {
  const transaction = startTransaction(`API ${method} ${endpoint}`, 'http');
  
  if (transaction) {
    transaction.setTag('http.method', method);
    transaction.setTag('http.url', endpoint);
  }

  try {
    const startTime = performance.now();
    const result = await call();
    const duration = performance.now() - startTime;

    if (transaction) {
      transaction.setStatus('ok');
      transaction.setMeasurement('http.response_time', duration, 'millisecond');
      transaction.finish();
    }

    // Track slow API calls
    if (duration > 3000) {
      captureMessage(
        `Slow API call: ${method} ${endpoint} took ${duration}ms`,
        'warning'
      );
    }

    return result;
  } catch (error) {
    if (transaction) {
      transaction.setStatus('internal_error');
      transaction.finish();
    }

    captureException(error as Error, {
      tags: {
        api_endpoint: endpoint,
        api_method: method,
      },
    });

    throw error;
  }
};

// Custom metrics for game platform
export const GameMetrics = {
  trackGameStart: (gameId: string, userId: string) => {
    addBreadcrumb({
      message: `Game started: ${gameId}`,
      category: 'game',
      level: 'info',
      data: { game_id: gameId, user_id: userId },
    });
  },

  trackGameEnd: (
    gameId: string,
    userId: string,
    score: number,
    duration: number
  ) => {
    addBreadcrumb({
      message: `Game ended: ${gameId}`,
      category: 'game',
      level: 'info',
      data: {
        game_id: gameId,
        user_id: userId,
        score,
        duration,
      },
    });

    // Track performance metrics
    trackPerformanceMetric(`game.${gameId}.duration`, duration);
    trackPerformanceMetric(`game.${gameId}.score`, score, 'none');
  },

  trackLeaderboardUpdate: (gameId: string, rank: number) => {
    addBreadcrumb({
      message: `Leaderboard updated`,
      category: 'leaderboard',
      level: 'info',
      data: { game_id: gameId, rank },
    });
  },

  trackTournamentJoin: (tournamentId: string, userId: string) => {
    addBreadcrumb({
      message: `Tournament joined`,
      category: 'tournament',
      level: 'info',
      data: { tournament_id: tournamentId, user_id: userId },
    });
  },

  trackMatchResult: (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    loserId: string
  ) => {
    addBreadcrumb({
      message: `Match completed`,
      category: 'tournament',
      level: 'info',
      data: {
        tournament_id: tournamentId,
        match_id: matchId,
        winner_id: winnerId,
        loser_id: loserId,
      },
    });
  },
};

// Export Sentry instance for direct access if needed
export { Sentry };