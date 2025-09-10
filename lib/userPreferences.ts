import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserPreferences {
  userId?: string
  favoriteGames: string[]
  theme: 'light' | 'dark' | 'system'
  soundEnabled: boolean
  musicEnabled: boolean
  difficulty: Record<string, 'easy' | 'medium' | 'hard'>
  playHistory: Array<{
    gameId: string
    playedAt: string
    duration: number
    score?: number
  }>
  lastPlayed?: string
  gamesPlayed: number
  totalPlayTime: number
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteGames: [],
  theme: 'system',
  soundEnabled: true,
  musicEnabled: true,
  difficulty: {},
  playHistory: [],
  gamesPlayed: 0,
  totalPlayTime: 0
}

class UserPreferencesService {
  private supabase = createClientComponentClient()
  private preferences: UserPreferences = DEFAULT_PREFERENCES
  private localStorageKey = 'mini-games-preferences'

  async initialize(userId?: string) {
    if (userId) {
      await this.loadFromDatabase(userId)
    } else {
      this.loadFromLocalStorage()
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.localStorageKey)
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load preferences from localStorage:', error)
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.preferences))
    } catch (error) {
      console.error('Failed to save preferences to localStorage:', error)
    }
  }

  private async loadFromDatabase(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (data) {
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...data.preferences,
          userId
        }
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES, userId }
        await this.saveToDatabase()
      }
    } catch (error) {
      console.error('Failed to load preferences from database:', error)
      this.loadFromLocalStorage()
    }
  }

  private async saveToDatabase() {
    if (!this.preferences.userId) {
      this.saveToLocalStorage()
      return
    }

    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: this.preferences.userId,
          preferences: this.preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to save preferences to database:', error)
      this.saveToLocalStorage()
    }
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  async setTheme(theme: 'light' | 'dark' | 'system') {
    this.preferences.theme = theme
    await this.save()
  }

  async toggleSound() {
    this.preferences.soundEnabled = !this.preferences.soundEnabled
    await this.save()
  }

  async toggleMusic() {
    this.preferences.musicEnabled = !this.preferences.musicEnabled
    await this.save()
  }

  async addFavoriteGame(gameId: string) {
    if (!this.preferences.favoriteGames.includes(gameId)) {
      this.preferences.favoriteGames.push(gameId)
      await this.save()
    }
  }

  async removeFavoriteGame(gameId: string) {
    this.preferences.favoriteGames = this.preferences.favoriteGames.filter(
      id => id !== gameId
    )
    await this.save()
  }

  isFavorite(gameId: string): boolean {
    return this.preferences.favoriteGames.includes(gameId)
  }

  async setGameDifficulty(gameId: string, difficulty: 'easy' | 'medium' | 'hard') {
    this.preferences.difficulty[gameId] = difficulty
    await this.save()
  }

  getGameDifficulty(gameId: string): 'easy' | 'medium' | 'hard' {
    return this.preferences.difficulty[gameId] || 'medium'
  }

  async recordGamePlay(gameId: string, duration: number, score?: number) {
    this.preferences.playHistory.push({
      gameId,
      playedAt: new Date().toISOString(),
      duration,
      score
    })

    this.preferences.lastPlayed = gameId
    this.preferences.gamesPlayed++
    this.preferences.totalPlayTime += duration

    // Keep only last 100 play history entries
    if (this.preferences.playHistory.length > 100) {
      this.preferences.playHistory = this.preferences.playHistory.slice(-100)
    }

    await this.save()
  }

  getPlayHistory(limit?: number): UserPreferences['playHistory'] {
    const history = [...this.preferences.playHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  getMostPlayedGames(limit = 5): Array<{ gameId: string; count: number }> {
    const counts: Record<string, number> = {}
    
    this.preferences.playHistory.forEach(entry => {
      counts[entry.gameId] = (counts[entry.gameId] || 0) + 1
    })

    return Object.entries(counts)
      .map(([gameId, count]) => ({ gameId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  getRecentlyPlayedGames(limit = 5): string[] {
    const recent = new Set<string>()
    const history = [...this.preferences.playHistory].reverse()

    for (const entry of history) {
      recent.add(entry.gameId)
      if (recent.size >= limit) break
    }

    return Array.from(recent)
  }

  private async save() {
    if (this.preferences.userId) {
      await this.saveToDatabase()
    } else {
      this.saveToLocalStorage()
    }
  }

  async syncWithUser(userId: string) {
    const localPrefs = { ...this.preferences }
    
    await this.loadFromDatabase(userId)
    
    // Merge local preferences with database preferences
    if (localPrefs.playHistory.length > 0) {
      this.preferences.playHistory = [
        ...this.preferences.playHistory,
        ...localPrefs.playHistory
      ].slice(-100)
    }

    if (localPrefs.favoriteGames.length > 0) {
      this.preferences.favoriteGames = [
        ...new Set([...this.preferences.favoriteGames, ...localPrefs.favoriteGames])
      ]
    }

    this.preferences.userId = userId
    await this.saveToDatabase()
  }
}

export const userPreferences = new UserPreferencesService()