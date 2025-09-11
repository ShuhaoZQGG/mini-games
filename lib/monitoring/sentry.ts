// NOTE: Install @sentry/nextjs when setting up production monitoring
// This is a stub implementation for build purposes
// To enable Sentry monitoring:
// 1. Run: npm install @sentry/nextjs
// 2. Uncomment the actual implementation below

// Stub types
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
type CaptureContext = any;
type Breadcrumb = any;
type User = any;

// Mock Sentry object
const Sentry = {
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  addBreadcrumb: () => {},
  setUser: () => {},
  setContext: () => {},
  startTransaction: () => null,
  getCurrentHub: () => ({ getScope: () => null }),
  ErrorBoundary: class ErrorBoundary extends Error {},
  BrowserTracing: class BrowserTracing {},
  Replay: class Replay {},
  nextRouterInstrumentation: () => {},
};

// Sentry configuration types
interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  debug: boolean;
  enabled: boolean;
}

// Initialize Sentry (stub)
export const initSentry = (config?: Partial<SentryConfig>) => {
  console.log('Sentry monitoring is disabled (stub implementation)');
};

// Helper to get user context
const getUserContext = () => {
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

// Custom error boundary for React components (stub)
export class ErrorBoundary extends Error {
  constructor(props: any) {
    super();
  }
}

// Capture exception helper (stub)
export const captureException = (
  error: Error | string,
  context?: CaptureContext
) => {
  console.error('Error captured (Sentry disabled):', error);
};

// Capture message helper (stub)
export const captureMessage = (
  message: string,
  level: SeverityLevel = 'info'
) => {
  console.log(`Message captured (Sentry disabled) [${level}]:`, message);
};

// Add breadcrumb helper (stub)
export const addBreadcrumb = (breadcrumb: Breadcrumb) => {
  // No-op
};

// Set user context (stub)
export const setUser = (user: User | null) => {
  // No-op
};

// Set extra context (stub)
export const setContext = (key: string, context: any) => {
  // No-op
};

// Performance monitoring helpers (stub)
export const startTransaction = (
  name: string,
  op: string = 'navigation'
) => {
  return null;
};

// Profiling helper for expensive operations (stub)
export const profileOperation = async <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  try {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Game-specific error tracking (stub)
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
  console.error(`Game error in ${gameId}:`, error, context);
};

// Tournament error tracking (stub)
export const trackTournamentError = (
  tournamentId: string,
  error: Error,
  context?: {
    round?: number;
    matchId?: string;
    [key: string]: any;
  }
) => {
  console.error(`Tournament error in ${tournamentId}:`, error, context);
};

// Achievement tracking (stub)
export const trackAchievementUnlock = (
  achievementId: string,
  achievementName: string,
  userId: string
) => {
  console.log(`Achievement unlocked: ${achievementName}`);
};

// Performance metrics tracking (stub)
export const trackPerformanceMetric = (
  metric: string,
  value: number,
  unit: string = 'millisecond'
) => {
  // No-op
};

// API call monitoring (stub)
export const monitorAPICall = async <T>(
  endpoint: string,
  method: string,
  call: () => Promise<T>
): Promise<T> => {
  try {
    const startTime = performance.now();
    const result = await call();
    const duration = performance.now() - startTime;

    // Track slow API calls
    if (duration > 3000) {
      console.warn(
        `Slow API call: ${method} ${endpoint} took ${duration}ms`
      );
    }

    return result;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Custom metrics for game platform (stub)
export const GameMetrics = {
  trackGameStart: (gameId: string, userId: string) => {
    console.log(`Game started: ${gameId}`);
  },

  trackGameEnd: (
    gameId: string,
    userId: string,
    score: number,
    duration: number
  ) => {
    console.log(`Game ended: ${gameId}, Score: ${score}, Duration: ${duration}ms`);
  },

  trackLeaderboardUpdate: (gameId: string, rank: number) => {
    console.log(`Leaderboard updated for ${gameId}, Rank: ${rank}`);
  },

  trackTournamentJoin: (tournamentId: string, userId: string) => {
    console.log(`Tournament ${tournamentId} joined by ${userId}`);
  },

  trackMatchResult: (
    tournamentId: string,
    matchId: string,
    winnerId: string,
    loserId: string
  ) => {
    console.log(`Match ${matchId} completed in tournament ${tournamentId}`);
  },
};

// Export Sentry instance for direct access if needed (stub)
export { Sentry };