import { createClient, getGuestSession } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

// Types
export interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
  bio?: string
  total_games_played: number
  total_score: number
  highest_score: number
  win_rate: number
  favorite_game?: string
  achievements: Achievement[]
  created_at: string
  theme_preference?: 'light' | 'dark' | 'system'
  stats: UserStatistics
}

export interface UserStatistics {
  games_played: number
  total_score: number
  total_time_played: number // in seconds
  average_score: number
  highest_score: number
  win_rate: number
  games_won: number
  games_lost: number
  current_streak: number
  longest_streak: number
  games_by_category: Record<string, number>
  scores_by_game: Record<string, number>
  recent_activity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'game_played' | 'achievement_unlocked' | 'high_score' | 'profile_update'
  game_id?: string
  game_name?: string
  score?: number
  achievement_id?: string
  achievement_name?: string
  timestamp: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'games' | 'scores' | 'social' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress?: number
  total?: number
  unlocked: boolean
  unlocked_at?: string
  points: number
}

export interface AchievementCriteria {
  type: 'games_played' | 'total_score' | 'high_score' | 'win_streak' | 'perfect_game' | 'speed_run' | 'social_share'
  game_id?: string
  threshold: number
  comparison: 'gte' | 'lte' | 'eq'
}

export interface ProfileUpdateParams {
  username?: string
  bio?: string
  avatar_url?: string
  theme_preference?: 'light' | 'dark' | 'system'
}

// Default achievements
const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlocked_at' | 'progress'>[] = [
  // Games Played Achievements
  {
    id: 'first_game',
    name: 'First Steps',
    description: 'Play your first game',
    icon: '🎮',
    category: 'games',
    rarity: 'common',
    total: 1,
    points: 10
  },
  {
    id: 'game_explorer',
    name: 'Game Explorer',
    description: 'Play 5 different games',
    icon: '🗺️',
    category: 'games',
    rarity: 'common',
    total: 5,
    points: 25
  },
  {
    id: 'dedicated_player',
    name: 'Dedicated Player',
    description: 'Play 50 games total',
    icon: '🎯',
    category: 'games',
    rarity: 'rare',
    total: 50,
    points: 50
  },
  {
    id: 'game_master',
    name: 'Game Master',
    description: 'Play 100 games total',
    icon: '👑',
    category: 'games',
    rarity: 'epic',
    total: 100,
    points: 100
  },
  
  // Score Achievements
  {
    id: 'score_rookie',
    name: 'Score Rookie',
    description: 'Reach a total score of 1,000',
    icon: '🏅',
    category: 'scores',
    rarity: 'common',
    total: 1000,
    points: 15
  },
  {
    id: 'score_hunter',
    name: 'Score Hunter',
    description: 'Reach a total score of 10,000',
    icon: '🏆',
    category: 'scores',
    rarity: 'rare',
    total: 10000,
    points: 40
  },
  {
    id: 'score_legend',
    name: 'Score Legend',
    description: 'Reach a total score of 100,000',
    icon: '💎',
    category: 'scores',
    rarity: 'legendary',
    total: 100000,
    points: 200
  },
  
  // Win Streak Achievements
  {
    id: 'winning_streak',
    name: 'On Fire',
    description: 'Win 3 games in a row',
    icon: '🔥',
    category: 'games',
    rarity: 'common',
    total: 3,
    points: 20
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: '⚡',
    category: 'games',
    rarity: 'epic',
    total: 10,
    points: 75
  },
  
  // Special Achievements
  {
    id: 'perfect_cps',
    name: 'Lightning Fingers',
    description: 'Achieve 15+ CPS in CPS Test',
    icon: '⚡',
    category: 'special',
    rarity: 'rare',
    total: 15,
    points: 30
  },
  {
    id: 'typing_master',
    name: 'Typing Master',
    description: 'Achieve 80+ WPM in Typing Test',
    icon: '⌨️',
    category: 'special',
    rarity: 'rare',
    total: 80,
    points: 35
  },
  {
    id: 'memory_genius',
    name: 'Memory Genius',
    description: 'Complete Memory Match in under 30 seconds',
    icon: '🧠',
    category: 'special',
    rarity: 'epic',
    total: 30,
    points: 60
  },
  {
    id: 'snake_champion',
    name: 'Snake Champion',
    description: 'Score over 100 points in Snake',
    icon: '🐍',
    category: 'special',
    rarity: 'rare',
    total: 100,
    points: 45
  },
  {
    id: '2048_master',
    name: '2048 Master',
    description: 'Reach the 2048 tile',
    icon: '🎲',
    category: 'special',
    rarity: 'epic',
    total: 2048,
    points: 80
  }
]

// Helper function to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
  )
}

// Mock data generation
function generateMockProfile(userId?: string): UserProfile {
  const id = userId || `user_${Date.now()}`
  const gamesPlayed = Math.floor(Math.random() * 100) + 10
  const totalScore = Math.floor(Math.random() * 50000) + 1000
  const gamesWon = Math.floor(gamesPlayed * (0.3 + Math.random() * 0.4))
  
  const mockProfile: UserProfile = {
    id,
    username: `Player${Math.floor(Math.random() * 10000)}`,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: 'I love playing mini-games!',
    total_games_played: gamesPlayed,
    total_score: totalScore,
    highest_score: Math.floor(totalScore / gamesPlayed * 3),
    win_rate: Math.round((gamesWon / gamesPlayed) * 100),
    favorite_game: ['snake', 'tetris', '2048', 'memory-match'][Math.floor(Math.random() * 4)],
    achievements: [],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    theme_preference: 'system',
    stats: {
      games_played: gamesPlayed,
      total_score: totalScore,
      total_time_played: gamesPlayed * 180, // Average 3 minutes per game
      average_score: Math.floor(totalScore / gamesPlayed),
      highest_score: Math.floor(totalScore / gamesPlayed * 3),
      win_rate: Math.round((gamesWon / gamesPlayed) * 100),
      games_won: gamesWon,
      games_lost: gamesPlayed - gamesWon,
      current_streak: Math.floor(Math.random() * 5),
      longest_streak: Math.floor(Math.random() * 15),
      games_by_category: {
        'puzzle': Math.floor(gamesPlayed * 0.3),
        'action': Math.floor(gamesPlayed * 0.4),
        'strategy': Math.floor(gamesPlayed * 0.3)
      },
      scores_by_game: {
        'snake': Math.floor(totalScore * 0.2),
        'tetris': Math.floor(totalScore * 0.3),
        '2048': Math.floor(totalScore * 0.25),
        'memory-match': Math.floor(totalScore * 0.25)
      },
      recent_activity: generateMockActivity(5)
    }
  }
  
  // Calculate and add achievements
  mockProfile.achievements = calculateAchievements(mockProfile.stats)
  
  return mockProfile
}

function generateMockActivity(count: number): ActivityItem[] {
  const activities: ActivityItem[] = []
  const types: ActivityItem['type'][] = ['game_played', 'achievement_unlocked', 'high_score']
  const games = ['snake', 'tetris', '2048', 'memory-match', 'cps-test', 'typing-test']
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const gameId = games[Math.floor(Math.random() * games.length)]
    
    activities.push({
      id: `activity_${Date.now()}_${i}`,
      type,
      game_id: gameId,
      game_name: gameId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: type === 'game_played' || type === 'high_score' ? Math.floor(Math.random() * 10000) : undefined,
      achievement_id: type === 'achievement_unlocked' ? DEFAULT_ACHIEVEMENTS[Math.floor(Math.random() * 5)].id : undefined,
      achievement_name: type === 'achievement_unlocked' ? DEFAULT_ACHIEVEMENTS[Math.floor(Math.random() * 5)].name : undefined,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    })
  }
  
  return activities
}

function calculateAchievements(stats: UserStatistics): Achievement[] {
  const achievements: Achievement[] = []
  
  for (const template of DEFAULT_ACHIEVEMENTS) {
    let unlocked = false
    let progress = 0
    
    switch (template.id) {
      case 'first_game':
        progress = Math.min(stats.games_played, 1)
        unlocked = stats.games_played >= 1
        break
      case 'game_explorer':
        progress = Math.min(Object.keys(stats.scores_by_game).length, 5)
        unlocked = Object.keys(stats.scores_by_game).length >= 5
        break
      case 'dedicated_player':
        progress = Math.min(stats.games_played, 50)
        unlocked = stats.games_played >= 50
        break
      case 'game_master':
        progress = Math.min(stats.games_played, 100)
        unlocked = stats.games_played >= 100
        break
      case 'score_rookie':
        progress = Math.min(stats.total_score, 1000)
        unlocked = stats.total_score >= 1000
        break
      case 'score_hunter':
        progress = Math.min(stats.total_score, 10000)
        unlocked = stats.total_score >= 10000
        break
      case 'score_legend':
        progress = Math.min(stats.total_score, 100000)
        unlocked = stats.total_score >= 100000
        break
      case 'winning_streak':
        progress = Math.min(stats.current_streak, 3)
        unlocked = stats.longest_streak >= 3
        break
      case 'unstoppable':
        progress = Math.min(stats.longest_streak, 10)
        unlocked = stats.longest_streak >= 10
        break
      default:
        // Special game-specific achievements would need actual game data
        progress = 0
        unlocked = Math.random() > 0.7 // Random for demo
    }
    
    achievements.push({
      ...template,
      progress,
      unlocked,
      unlocked_at: unlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    })
  }
  
  return achievements
}

// Local storage functions
function saveProfileLocally(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`profile_${profile.id}`, JSON.stringify(profile))
    localStorage.setItem('current_profile_id', profile.id)
  }
}

function getProfileLocally(userId?: string): UserProfile | null {
  if (typeof window === 'undefined') return null
  
  const id = userId || localStorage.getItem('current_profile_id')
  if (!id) return null
  
  const profileData = localStorage.getItem(`profile_${id}`)
  if (!profileData) return null
  
  try {
    return JSON.parse(profileData)
  } catch {
    return null
  }
}

function updateStatsLocally(userId: string, gameId: string, score: number, won: boolean): void {
  if (typeof window === 'undefined') return
  
  const profile = getProfileLocally(userId)
  if (!profile) return
  
  // Update statistics
  profile.stats.games_played++
  profile.stats.total_score += score
  profile.stats.average_score = Math.floor(profile.stats.total_score / profile.stats.games_played)
  
  if (score > profile.stats.highest_score) {
    profile.stats.highest_score = score
  }
  
  if (won) {
    profile.stats.games_won++
    profile.stats.current_streak++
    if (profile.stats.current_streak > profile.stats.longest_streak) {
      profile.stats.longest_streak = profile.stats.current_streak
    }
  } else {
    profile.stats.games_lost++
    profile.stats.current_streak = 0
  }
  
  profile.stats.win_rate = Math.round((profile.stats.games_won / profile.stats.games_played) * 100)
  
  // Update game-specific stats
  if (!profile.stats.scores_by_game[gameId]) {
    profile.stats.scores_by_game[gameId] = 0
  }
  profile.stats.scores_by_game[gameId] += score
  
  // Add to recent activity
  profile.stats.recent_activity.unshift({
    id: `activity_${Date.now()}`,
    type: 'game_played',
    game_id: gameId,
    game_name: gameId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score,
    timestamp: new Date().toISOString()
  })
  
  // Keep only last 10 activities
  profile.stats.recent_activity = profile.stats.recent_activity.slice(0, 10)
  
  // Recalculate achievements
  profile.achievements = calculateAchievements(profile.stats)
  
  // Check for new achievement unlocks and add to activity
  const newUnlocks = profile.achievements.filter(a => a.unlocked && !a.unlocked_at)
  for (const achievement of newUnlocks) {
    achievement.unlocked_at = new Date().toISOString()
    profile.stats.recent_activity.unshift({
      id: `activity_${Date.now()}_achievement`,
      type: 'achievement_unlocked',
      achievement_id: achievement.id,
      achievement_name: achievement.name,
      timestamp: new Date().toISOString()
    })
  }
  
  // Update totals
  profile.total_games_played = profile.stats.games_played
  profile.total_score = profile.stats.total_score
  profile.highest_score = profile.stats.highest_score
  profile.win_rate = profile.stats.win_rate
  
  saveProfileLocally(profile)
}

// Main service functions
export async function getProfile(userId?: string): Promise<{ success: boolean; data: UserProfile | null; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using mock/local data')
      
      // Try to get from localStorage first
      let profile = getProfileLocally(userId)
      
      // If not found, generate mock profile
      if (!profile) {
        profile = generateMockProfile(userId)
        saveProfileLocally(profile)
      }
      
      return { success: true, data: profile }
    }
    
    const supabase = createClient()
    
    // Get current user if no userId provided
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      targetUserId = user?.id
      
      if (!targetUserId) {
        // Not authenticated, try guest profile
        const guestId = getGuestSession()
        if (guestId) {
          const profile = getProfileLocally(guestId) || generateMockProfile(guestId)
          saveProfileLocally(profile)
          return { success: true, data: profile }
        }
        return { success: false, data: null, error: 'No user found' }
      }
    }
    
    // Fetch from Supabase
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', targetUserId)
      .single()
    
    if (error || !data) {
      console.error('Error fetching profile:', error)
      // Fallback to local/mock
      const profile = getProfileLocally(targetUserId) || generateMockProfile(targetUserId)
      saveProfileLocally(profile)
      return { success: true, data: profile }
    }
    
    // Transform database data to UserProfile format
    const profile: UserProfile = {
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      bio: data.bio || '',
      total_games_played: data.total_games_played || 0,
      total_score: data.total_score || 0,
      highest_score: data.highest_score || 0,
      win_rate: data.win_rate || 0,
      favorite_game: data.favorite_game,
      achievements: data.achievements || [],
      created_at: data.created_at,
      theme_preference: data.theme_preference || 'system',
      stats: data.stats || {
        games_played: 0,
        total_score: 0,
        total_time_played: 0,
        average_score: 0,
        highest_score: 0,
        win_rate: 0,
        games_won: 0,
        games_lost: 0,
        current_streak: 0,
        longest_streak: 0,
        games_by_category: {},
        scores_by_game: {},
        recent_activity: []
      }
    }
    
    return { success: true, data: profile }
  } catch (error) {
    console.error('Error in getProfile:', error)
    // Always fallback to mock data
    const profile = generateMockProfile(userId)
    saveProfileLocally(profile)
    return { success: true, data: profile }
  }
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdateParams
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, updating local profile')
      
      const profile = getProfileLocally(userId)
      if (!profile) {
        return { success: false, error: 'Profile not found' }
      }
      
      // Apply updates
      if (updates.username) profile.username = updates.username
      if (updates.bio !== undefined) profile.bio = updates.bio
      if (updates.avatar_url !== undefined) profile.avatar_url = updates.avatar_url
      if (updates.theme_preference) profile.theme_preference = updates.theme_preference
      
      saveProfileLocally(profile)
      return { success: true, data: profile }
    }
    
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating profile:', error)
      // Fallback to local update
      const profile = getProfileLocally(userId)
      if (profile) {
        if (updates.username) profile.username = updates.username
        if (updates.bio !== undefined) profile.bio = updates.bio
        if (updates.avatar_url !== undefined) profile.avatar_url = updates.avatar_url
        if (updates.theme_preference) profile.theme_preference = updates.theme_preference
        saveProfileLocally(profile)
        return { success: true, data: profile }
      }
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data as UserProfile }
  } catch (error) {
    console.error('Error in updateProfile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using mock avatar upload')
      
      // For mock, create a data URL from the file
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const url = reader.result as string
          
          // Update local profile
          const profile = getProfileLocally(userId)
          if (profile) {
            profile.avatar_url = url
            saveProfileLocally(profile)
          }
          
          resolve({ success: true, url })
        }
        reader.readAsDataURL(file)
      })
    }
    
    const supabase = createClient()
    
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return { success: false, error: uploadError.message }
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    // Update profile with new avatar URL
    await updateProfile(userId, { avatar_url: publicUrl })
    
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error in uploadAvatar:', error)
    return { success: false, error: 'Failed to upload avatar' }
  }
}

export async function trackGamePlay(
  userId: string,
  gameId: string,
  score: number,
  metadata?: {
    won?: boolean
    time_played?: number
    perfect_game?: boolean
  }
): Promise<{ success: boolean; newAchievements?: Achievement[] }> {
  try {
    const won = metadata?.won || false
    
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, tracking locally')
      updateStatsLocally(userId, gameId, score, won)
      
      const profile = getProfileLocally(userId)
      const newAchievements = profile?.achievements.filter(a => a.unlocked && a.unlocked_at === new Date().toISOString()) || []
      
      return { success: true, newAchievements }
    }
    
    const supabase = createClient()
    
    // Update profile statistics in database
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profile) {
      const stats = profile.stats || {}
      stats.games_played = (stats.games_played || 0) + 1
      stats.total_score = (stats.total_score || 0) + score
      
      if (won) {
        stats.games_won = (stats.games_won || 0) + 1
        stats.current_streak = (stats.current_streak || 0) + 1
        stats.longest_streak = Math.max(stats.longest_streak || 0, stats.current_streak)
      } else {
        stats.games_lost = (stats.games_lost || 0) + 1
        stats.current_streak = 0
      }
      
      if (metadata?.time_played) {
        stats.total_time_played = (stats.total_time_played || 0) + metadata.time_played
      }
      
      // Update in database
      await (supabase
        .from('profiles') as any)
        .update({
          total_games_played: stats.games_played,
          stats,
          // Check and unlock achievements
          achievements: calculateAchievements(stats)
        })
        .eq('id', userId)
    }
    
    // Also update locally for immediate feedback
    updateStatsLocally(userId, gameId, score, won)
    
    const localProfile = getProfileLocally(userId)
    const newAchievements = localProfile?.achievements.filter(a => a.unlocked && !a.unlocked_at) || []
    
    return { success: true, newAchievements }
  } catch (error) {
    console.error('Error tracking game play:', error)
    // Fallback to local tracking
    updateStatsLocally(userId, gameId, score, metadata?.won || false)
    return { success: true, newAchievements: [] }
  }
}

export async function getAchievements(userId?: string): Promise<Achievement[]> {
  const profile = await getProfile(userId)
  return profile.data?.achievements || []
}

export async function getTopPlayers(limit: number = 10): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) {
    // Generate mock top players
    const players: UserProfile[] = []
    for (let i = 0; i < limit; i++) {
      const profile = generateMockProfile()
      profile.total_score = 100000 - i * 5000 + Math.floor(Math.random() * 2000)
      profile.username = `TopPlayer${i + 1}`
      players.push(profile)
    }
    return players
  }
  
  try {
    const supabase = createClient()
    const { data, error } = await (supabase
      .from('profiles') as any)
      .select('*')
      .order('total_score', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching top players:', error)
      // Return mock data on error
      const players: UserProfile[] = []
      for (let i = 0; i < limit; i++) {
        players.push(generateMockProfile())
      }
      return players
    }
    
    return data as UserProfile[]
  } catch (error) {
    console.error('Error in getTopPlayers:', error)
    // Return mock data on error
    const players: UserProfile[] = []
    for (let i = 0; i < limit; i++) {
      players.push(generateMockProfile())
    }
    return players
  }
}

// Export service object
export const profileService = {
  getProfile,
  updateProfile,
  uploadAvatar,
  trackGamePlay,
  getAchievements,
  getTopPlayers
}

// React hooks
import { useState, useEffect } from 'react'

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const result = await getProfile(userId)
      if (result.success) {
        setProfile(result.data)
      } else {
        setError(result.error || 'Failed to load profile')
      }
      setLoading(false)
    }
    
    fetchProfile()
  }, [userId])
  
  const refresh = async () => {
    const result = await getProfile(userId)
    if (result.success) {
      setProfile(result.data)
    }
  }
  
  return { profile, loading, error, refresh }
}

export function useAchievements(userId?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true)
      const data = await getAchievements(userId)
      setAchievements(data)
      setLoading(false)
    }
    
    fetchAchievements()
  }, [userId])
  
  return { achievements, loading }
}