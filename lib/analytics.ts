interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: string
}

interface GameAnalytics {
  gameId: string
  sessionStart: string
  sessionEnd?: string
  duration?: number
  score?: number
  level?: number
  completed?: boolean
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = []
  private sessionId: string
  private gameSession: GameAnalytics | null = null
  private flushInterval: NodeJS.Timeout | null = null
  private enabled: boolean = false

  constructor() {
    this.sessionId = this.generateSessionId()
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    
    if (this.enabled && typeof window !== 'undefined') {
      this.startFlushInterval()
      this.attachEventListeners()
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 30000) // Flush every 30 seconds
  }

  private attachEventListeners() {
    if (typeof window === 'undefined') return

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush()
      }
    })

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      }
    }

    this.queue.push(event)

    // Auto-flush if queue is getting large
    if (this.queue.length >= 20) {
      this.flush()
    }
  }

  startGameSession(gameId: string) {
    if (!this.enabled) return

    // End previous session if exists
    if (this.gameSession) {
      this.endGameSession()
    }

    this.gameSession = {
      gameId,
      sessionStart: new Date().toISOString()
    }

    this.track('game_start', {
      gameId,
      sessionStart: this.gameSession.sessionStart
    })
  }

  endGameSession(score?: number, level?: number, completed = false) {
    if (!this.enabled || !this.gameSession) return

    const sessionEnd = new Date().toISOString()
    const duration = new Date(sessionEnd).getTime() - 
                    new Date(this.gameSession.sessionStart).getTime()

    this.gameSession = {
      ...this.gameSession,
      sessionEnd,
      duration,
      score,
      level,
      completed
    }

    this.track('game_end', {
      gameId: this.gameSession.gameId,
      duration: Math.floor(duration / 1000), // Convert to seconds
      score,
      level,
      completed
    })

    // Store in user preferences for recommendations
    if (typeof window !== 'undefined') {
      import('./userPreferences').then(({ userPreferences }) => {
        userPreferences.recordGamePlay(
          this.gameSession!.gameId,
          Math.floor(duration / 1000),
          score
        )
      })
    }

    this.gameSession = null
  }

  trackGameAction(action: string, data?: Record<string, any>) {
    if (!this.enabled || !this.gameSession) return

    this.track('game_action', {
      gameId: this.gameSession.gameId,
      action,
      ...data
    })
  }

  trackClick(elementId: string, elementType: string) {
    this.track('click', {
      elementId,
      elementType
    })
  }

  trackSearch(query: string, resultsCount: number) {
    this.track('search', {
      query,
      resultsCount
    })
  }

  trackCategory(category: string, action: 'view' | 'filter') {
    this.track('category_interaction', {
      category,
      action
    })
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  trackPageView(pageName: string) {
    this.track('page_view', {
      pageName,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    })
  }

  private async flush() {
    if (!this.enabled || this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      })

      if (!response.ok) {
        // Re-add events to queue if failed
        this.queue.unshift(...events)
      }
    } catch (error) {
      console.error('Failed to send analytics:', error)
      // Re-add events to queue if failed
      this.queue.unshift(...events)
    }
  }

  getSessionMetrics() {
    return {
      sessionId: this.sessionId,
      queueLength: this.queue.length,
      currentGame: this.gameSession?.gameId || null,
      enabled: this.enabled
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

export const analytics = new AnalyticsService()