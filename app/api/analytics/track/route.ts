import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json()
    
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid events format' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user session if available
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Process and store events
    const processedEvents = events.map(event => ({
      ...event,
      user_id: userId,
      created_at: event.timestamp || new Date().toISOString()
    }))

    // Store in analytics table
    const { error } = await supabase
      .from('analytics_events')
      .insert(processedEvents)

    if (error) {
      console.error('Failed to store analytics:', error)
      return NextResponse.json(
        { error: 'Failed to store analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const period = searchParams.get('period') || '7d'
    const gameId = searchParams.get('gameId')
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '24h':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Build query
    let query = supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
    
    if (gameId) {
      query = query.eq('properties->>gameId', gameId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Calculate metrics
    const metrics = calculateMetrics(data || [])

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

function calculateMetrics(events: any[]) {
  const metrics = {
    totalEvents: events.length,
    uniqueSessions: new Set(events.map(e => e.properties?.sessionId)).size,
    gameStats: {} as Record<string, any>,
    popularGames: [] as Array<{ gameId: string; plays: number }>,
    averageSessionDuration: 0
  }

  const gamePlays: Record<string, number> = {}
  const gameDurations: Record<string, number[]> = {}

  events.forEach(event => {
    if (event.name === 'game_start') {
      const gameId = event.properties?.gameId
      if (gameId) {
        gamePlays[gameId] = (gamePlays[gameId] || 0) + 1
      }
    }

    if (event.name === 'game_end') {
      const gameId = event.properties?.gameId
      const duration = event.properties?.duration
      if (gameId && duration) {
        if (!gameDurations[gameId]) {
          gameDurations[gameId] = []
        }
        gameDurations[gameId].push(duration)
      }
    }
  })

  // Calculate game stats
  Object.keys(gamePlays).forEach(gameId => {
    const durations = gameDurations[gameId] || []
    metrics.gameStats[gameId] = {
      plays: gamePlays[gameId],
      averageDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
    }
  })

  // Get popular games
  metrics.popularGames = Object.entries(gamePlays)
    .map(([gameId, plays]) => ({ gameId, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)

  // Calculate average session duration
  const allDurations = Object.values(gameDurations).flat()
  if (allDurations.length > 0) {
    metrics.averageSessionDuration = 
      allDurations.reduce((a, b) => a + b, 0) / allDurations.length
  }

  return metrics
}