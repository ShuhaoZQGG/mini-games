import { createClient, getGuestSession, getGuestName } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export interface SubmitScoreParams {
  gameId: string
  score: number
  metadata?: Record<string, any>
}

export interface LeaderboardParams {
  gameId: string
  period?: 'all_time' | 'monthly' | 'weekly' | 'daily'
  limit?: number
}

export interface ScoreRecord {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
  metadata?: any
}

export interface LeaderboardRecord {
  id: string
  player_name: string
  score: number
  rank: number
}

// Helper function to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
  )
}

// Fallback functions for localStorage
function saveScoreLocally(gameId: string, score: number, metadata?: any): ScoreRecord {
  const scores = JSON.parse(localStorage.getItem('game_scores') || '[]')
  const newScore: ScoreRecord = {
    id: `local_${Date.now()}`,
    game_id: gameId,
    score,
    player_name: getGuestName(),
    created_at: new Date().toISOString(),
    metadata
  }
  scores.push(newScore)
  localStorage.setItem('game_scores', JSON.stringify(scores))
  return newScore
}

function getScoresLocally(gameId: string): ScoreRecord[] {
  const scores = JSON.parse(localStorage.getItem('game_scores') || '[]')
  return scores.filter((s: any) => s.game_id === gameId)
}

function generateMockLeaderboard(gameId: string, limit: number): LeaderboardRecord[] {
  // Generate consistent mock data based on game ID
  const baseScores = [9999, 8500, 7200, 6800, 5500, 4200, 3800, 2900, 2100, 1500]
  const players = ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8', 'Player9', 'Player10']
  
  return baseScores.slice(0, limit).map((score, index) => ({
    id: `mock_${gameId}_${index}`,
    player_name: players[index] || `Player${index + 1}`,
    score: score + Math.floor(Math.random() * 100), // Add some randomness
    rank: index + 1
  }))
}

export async function submitScore({ gameId, score, metadata }: SubmitScoreParams) {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using localStorage fallback')
      const localScore = saveScoreLocally(gameId, score, metadata)
      return { success: true, data: localScore }
    }

    const supabase = createClient()
    const guestSessionId = getGuestSession()
    const playerName = getGuestName()

    // Try to get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Insert score into Supabase
    const insertData: Database['public']['Tables']['scores']['Insert'] = {
      game_id: gameId,
      player_id: user?.id || null,
      guest_session_id: user ? null : guestSessionId,
      player_name: user?.user_metadata?.display_name || playerName,
      score,
      metadata: metadata || null
    }
    
    const { data, error } = await supabase
      .from('scores')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('Supabase error, falling back to localStorage:', error)
      // Fallback to localStorage if Supabase fails
      const localScore = saveScoreLocally(gameId, score, metadata)
      return { success: true, data: localScore, fallback: true }
    }

    console.log('Score submitted successfully to Supabase:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error submitting score:', error)
    
    // Always try localStorage fallback on error
    try {
      const localScore = saveScoreLocally(gameId, score, metadata)
      return { success: true, data: localScore, fallback: true }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return { success: false, error: 'Failed to submit score' }
    }
  }
}

export async function getLeaderboard({ 
  gameId, 
  period = 'all_time', 
  limit = 10 
}: LeaderboardParams) {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using mock data')
      const mockData = generateMockLeaderboard(gameId, limit)
      return { success: true, data: mockData }
    }

    const supabase = createClient()

    // Query leaderboard from Supabase
    const { data, error } = await supabase
      .from('leaderboards')
      .select('id, player_name, score, rank')
      .eq('game_id', gameId)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Supabase error, falling back to mock data:', error)
      // Fallback to mock data
      const mockData = generateMockLeaderboard(gameId, limit)
      return { success: true, data: mockData, fallback: true }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    
    // Fallback to mock data
    try {
      const mockData = generateMockLeaderboard(gameId, limit)
      return { success: true, data: mockData, fallback: true }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return { success: false, error: 'Failed to fetch leaderboard', data: [] }
    }
  }
}

export async function getPersonalBest(gameId: string) {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using localStorage')
      const localScores = getScoresLocally(gameId)
      
      if (localScores.length === 0) {
        return { success: false, data: null }
      }
      
      const best = localScores.reduce((max: any, s: any) => 
        s.score > max.score ? s : max
      )
      
      return { success: true, data: best }
    }

    const supabase = createClient()
    const guestSessionId = getGuestSession()
    
    // Try to get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(1)

    // Filter by user or guest session
    if (user) {
      query = query.eq('player_id', user.id)
    } else if (guestSessionId) {
      query = query.eq('guest_session_id', guestSessionId)
    } else {
      return { success: false, data: null }
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error, falling back to localStorage:', error)
      // Fallback to localStorage
      const localScores = getScoresLocally(gameId)
      if (localScores.length === 0) {
        return { success: false, data: null }
      }
      
      const best = localScores.reduce((max: any, s: any) => 
        s.score > max.score ? s : max
      )
      
      return { success: true, data: best, fallback: true }
    }

    return { success: true, data: data?.[0] || null }
  } catch (error) {
    console.error('Error fetching personal best:', error)
    
    // Fallback to localStorage
    try {
      const localScores = getScoresLocally(gameId)
      if (localScores.length === 0) {
        return { success: false, data: null }
      }
      
      const best = localScores.reduce((max: any, s: any) => 
        s.score > max.score ? s : max
      )
      
      return { success: true, data: best, fallback: true }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return { success: false, error: 'Failed to fetch personal best', data: null }
    }
  }
}

export async function getRecentScores(gameId: string, limit: number = 5) {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using localStorage')
      const localScores = getScoresLocally(gameId)
      const recentScores = localScores
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
      
      return { success: true, data: recentScores }
    }

    const supabase = createClient()
    const guestSessionId = getGuestSession()
    
    // Try to get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by user or guest session
    if (user) {
      query = query.eq('player_id', user.id)
    } else if (guestSessionId) {
      query = query.eq('guest_session_id', guestSessionId)
    } else {
      return { success: true, data: [] }
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error, falling back to localStorage:', error)
      // Fallback to localStorage
      const localScores = getScoresLocally(gameId)
      const recentScores = localScores
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
      
      return { success: true, data: recentScores, fallback: true }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching recent scores:', error)
    
    // Fallback to localStorage
    try {
      const localScores = getScoresLocally(gameId)
      const recentScores = localScores
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
      
      return { success: true, data: recentScores, fallback: true }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      return { success: false, error: 'Failed to fetch recent scores', data: [] }
    }
  }
}

// Export as a service object for easier use in games
export const scoreService = {
  saveScore: (gameId: string, score: number, metadata?: Record<string, any>) => {
    return submitScore({ gameId, score, metadata })
  },
  getLeaderboard,
  getPersonalBest,
  getRecentScores
}

// Utility function to sync localStorage scores to Supabase (for migration)
export async function syncLocalScoresToSupabase() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, skipping sync')
    return { success: false, message: 'Supabase not configured' }
  }

  try {
    const localScores = JSON.parse(localStorage.getItem('game_scores') || '[]')
    
    if (localScores.length === 0) {
      return { success: true, message: 'No local scores to sync', synced: 0 }
    }

    const supabase = createClient()
    let syncedCount = 0
    
    for (const score of localScores) {
      // Only sync scores that haven't been synced yet (local IDs start with 'local_')
      if (score.id.startsWith('local_')) {
        try {
          const syncData: Database['public']['Tables']['scores']['Insert'] = {
            game_id: score.game_id,
            player_id: null, // Local scores are always guest scores
            guest_session_id: getGuestSession(),
            player_name: score.player_name,
            score: score.score,
            metadata: score.metadata
          }
          
          const { error } = await supabase
            .from('scores')
            .insert(syncData as any)

          if (!error) {
            syncedCount++
          } else {
            console.error('Error syncing score:', error)
          }
        } catch (syncError) {
          console.error('Error syncing individual score:', syncError)
        }
      }
    }

    return { 
      success: true, 
      message: `Synced ${syncedCount} scores to Supabase`,
      synced: syncedCount,
      total: localScores.length
    }
  } catch (error) {
    console.error('Error syncing scores:', error)
    return { success: false, message: 'Failed to sync scores' }
  }
}