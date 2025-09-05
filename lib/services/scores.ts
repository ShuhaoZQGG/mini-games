import { createClient, getGuestSession, getGuestName } from '@/lib/supabase/client'

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

// Mock data for development - will be replaced with actual Supabase queries
const mockLeaderboardData = [
  { id: '1', player_name: 'Player1', score: 9999, rank: 1 },
  { id: '2', player_name: 'Player2', score: 8500, rank: 2 },
  { id: '3', player_name: 'Player3', score: 7200, rank: 3 },
  { id: '4', player_name: 'Player4', score: 6800, rank: 4 },
  { id: '5', player_name: 'Player5', score: 5500, rank: 5 },
]

export async function submitScore({ gameId, score, metadata }: SubmitScoreParams) {
  try {
    // TODO: Implement when Supabase database is configured
    console.log('Score submission:', { gameId, score, metadata })
    
    // Store in localStorage for now
    const scores = JSON.parse(localStorage.getItem('game_scores') || '[]')
    scores.push({
      id: `mock_${Date.now()}`,
      game_id: gameId,
      score,
      player_name: getGuestName(),
      created_at: new Date().toISOString(),
      metadata
    })
    localStorage.setItem('game_scores', JSON.stringify(scores))
    
    return { 
      success: true, 
      data: scores[scores.length - 1]
    }
  } catch (error) {
    console.error('Error submitting score:', error)
    return { success: false, error: 'Failed to submit score' }
  }
}

export async function getLeaderboard({ 
  gameId, 
  period = 'all_time', 
  limit = 10 
}: LeaderboardParams) {
  try {
    // TODO: Implement when Supabase database is configured
    // Return mock data for now
    return { 
      success: true, 
      data: mockLeaderboardData.slice(0, limit) 
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return { success: false, error: 'Failed to fetch leaderboard', data: [] }
  }
}

export async function getPersonalBest(gameId: string) {
  try {
    // Get from localStorage for now
    const scores = JSON.parse(localStorage.getItem('game_scores') || '[]')
    const gameScores = scores.filter((s: any) => s.game_id === gameId)
    
    if (gameScores.length === 0) {
      return { success: false, data: null }
    }
    
    const best = gameScores.reduce((max: any, s: any) => 
      s.score > max.score ? s : max
    )
    
    return { success: true, data: best }
  } catch (error) {
    console.error('Error fetching personal best:', error)
    return { success: false, error: 'Failed to fetch personal best', data: null }
  }
}

export async function getRecentScores(gameId: string, limit: number = 5) {
  try {
    // Get from localStorage for now
    const scores = JSON.parse(localStorage.getItem('game_scores') || '[]')
    const gameScores = scores
      .filter((s: any) => s.game_id === gameId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
    
    return { success: true, data: gameScores }
  } catch (error) {
    console.error('Error fetching recent scores:', error)
    return { success: false, error: 'Failed to fetch recent scores', data: [] }
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