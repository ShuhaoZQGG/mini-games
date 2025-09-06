/**
 * Tournament History Service
 * Manages tournament history tracking, statistics, and friend leaderboards
 */

import { createClient } from '@/lib/supabase/client'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface TournamentHistoryEntry {
  id?: string
  tournamentId: string
  userId: string
  gameSlug?: string
  placement: number
  matchesPlayed: number
  matchesWon: number
  totalScore: number
  entryFee?: number
  prizeWon?: number
  winRate?: number
  completedAt: Date
}

export interface TournamentStatistics {
  totalTournaments: number
  tournamentsWon: number
  winRate: number
  averagePlacement: number
  bestPlacement: number
  totalPrizeWon: number
  totalMatchesPlayed: number
  totalMatchesWon: number
  matchWinRate: number
  favoriteGame?: string
  gamesPlayed: Record<string, number>
}

export interface PrivateTournament {
  id: string
  tournamentId?: string
  name: string
  gameSlug: string
  organizerId: string
  maxParticipants: number
  isPrivate: boolean
  friendsOnly?: boolean
  accessCode?: string
  passwordHash?: string
  allowedUsers?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface FriendLeaderboardEntry {
  userId: string
  username?: string
  displayName?: string
  avatarUrl?: string
  tournamentsPlayed: number
  tournamentsWon: number
  avgPlacement: number
  totalWinnings: number
  games: string[]
  rank?: number
}

export interface SearchFilters {
  gameSlug?: string
  minPlacement?: number
  maxPlacement?: number
  entryFee?: 'free' | 'paid'
  startDate?: Date
  endDate?: Date
  sortBy?: 'date' | 'placement' | 'score'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

class TournamentHistoryService {
  private history: Map<string, TournamentHistoryEntry[]> = new Map()
  private privateTournaments: Map<string, PrivateTournament> = new Map()
  private nextId = 1

  /**
   * Clear all data (for testing)
   */
  clearAll() {
    this.history.clear()
    this.privateTournaments.clear()
    this.nextId = 1
  }

  /**
   * Record tournament completion
   */
  async recordTournamentCompletion(entry: TournamentHistoryEntry): Promise<TournamentHistoryEntry | null> {
    try {
      // Check for duplicate entry
      const userHistory = this.history.get(entry.userId) || []
      const duplicate = userHistory.find(h => h.tournamentId === entry.tournamentId)
      if (duplicate) {
        return null
      }

      // Calculate win rate
      const winRate = entry.matchesPlayed > 0 
        ? (entry.matchesWon / entry.matchesPlayed) * 100 
        : 0

      const historyEntry: TournamentHistoryEntry = {
        ...entry,
        id: `history_${this.nextId++}`,
        winRate: Number(winRate.toFixed(2))
      }

      if (supabase) {
        const { data, error } = await (supabase
          .from('tournament_history') as any)
          .insert({
            tournament_id: entry.tournamentId,
            user_id: entry.userId,
            game_slug: entry.gameSlug || 'unknown',
            placement: entry.placement,
            matches_played: entry.matchesPlayed,
            matches_won: entry.matchesWon,
            total_score: entry.totalScore,
            entry_fee: entry.entryFee || 0,
            prize_won: entry.prizeWon || 0,
            completed_at: entry.completedAt
          })
          .select()
          .single()

        if (!error && data) {
          const result = this.mapFromDatabase(data)
          this.addToLocalCache(result)
          return result
        }
      }

      // Fallback to local storage
      this.addToLocalCache(historyEntry)
      return historyEntry
    } catch (error) {
      console.error('Failed to record tournament completion:', error)
      return null
    }
  }

  /**
   * Get user tournament history
   */
  async getUserTournamentHistory(
    userId: string, 
    filters?: SearchFilters
  ): Promise<TournamentHistoryEntry[]> {
    try {
      if (supabase) {
        let query = (supabase
          .from('tournament_history') as any)
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })

        if (filters?.startDate) {
          query = query.gte('completed_at', filters.startDate.toISOString())
        }
        if (filters?.endDate) {
          query = query.lte('completed_at', filters.endDate.toISOString())
        }
        if (filters?.limit) {
          query = query.limit(filters.limit)
        }
        if (filters?.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }

        const { data, error } = await query

        if (!error && data) {
          return data.map((d: any) => this.mapFromDatabase(d))
        }
      }

      // Fallback to local storage - make a copy to avoid mutating the original
      let history = [...(this.history.get(userId) || [])]
      
      // Apply filters
      if (filters?.startDate) {
        history = history.filter(h => h.completedAt >= filters.startDate!)
      }
      if (filters?.endDate) {
        history = history.filter(h => h.completedAt <= filters.endDate!)
      }

      // Sort by completed date (newest first)
      history.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())

      // Apply pagination
      if (filters?.offset !== undefined) {
        const limit = filters.limit || 10
        history = history.slice(filters.offset, filters.offset + limit)
      }

      return history
    } catch (error) {
      console.error('Failed to get tournament history:', error)
      return []
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<TournamentStatistics> {
    try {
      const history = await this.getUserTournamentHistory(userId)
      
      if (history.length === 0) {
        return {
          totalTournaments: 0,
          tournamentsWon: 0,
          winRate: 0,
          averagePlacement: 0,
          bestPlacement: 0,
          totalPrizeWon: 0,
          totalMatchesPlayed: 0,
          totalMatchesWon: 0,
          matchWinRate: 0,
          gamesPlayed: {}
        }
      }

      const gamesPlayed: Record<string, number> = {}
      let totalPrizeWon = 0
      let totalMatchesPlayed = 0
      let totalMatchesWon = 0
      let tournamentsWon = 0
      let bestPlacement = Infinity
      let placementSum = 0

      history.forEach(h => {
        // Count games
        const game = h.gameSlug || 'unknown'
        gamesPlayed[game] = (gamesPlayed[game] || 0) + 1

        // Calculate stats
        if (h.placement === 1) tournamentsWon++
        if (h.placement < bestPlacement) bestPlacement = h.placement
        placementSum += h.placement
        totalPrizeWon += h.prizeWon || 0
        totalMatchesPlayed += h.matchesPlayed
        totalMatchesWon += h.matchesWon
      })

      // Find favorite game
      let favoriteGame: string | undefined
      let maxGames = 0
      for (const [game, count] of Object.entries(gamesPlayed)) {
        if (count > maxGames) {
          maxGames = count
          favoriteGame = game
        }
      }

      return {
        totalTournaments: history.length,
        tournamentsWon,
        winRate: history.length > 0 ? (tournamentsWon / history.length) * 100 : 0,
        averagePlacement: history.length > 0 ? placementSum / history.length : 0,
        bestPlacement: bestPlacement === Infinity ? 0 : bestPlacement,
        totalPrizeWon,
        totalMatchesPlayed,
        totalMatchesWon,
        matchWinRate: totalMatchesPlayed > 0 ? (totalMatchesWon / totalMatchesPlayed) * 100 : 0,
        favoriteGame,
        gamesPlayed
      }
    } catch (error) {
      console.error('Failed to get user statistics:', error)
      return {
        totalTournaments: 0,
        tournamentsWon: 0,
        winRate: 0,
        averagePlacement: 0,
        bestPlacement: 0,
        totalPrizeWon: 0,
        totalMatchesPlayed: 0,
        totalMatchesWon: 0,
        matchWinRate: 0,
        gamesPlayed: {}
      }
    }
  }

  /**
   * Get friend leaderboard
   */
  async getFriendLeaderboard(
    userId: string,
    friendIds: string[],
    options?: {
      gameSlug?: string
      sortBy?: 'wins' | 'placement' | 'winnings'
    }
  ): Promise<FriendLeaderboardEntry[]> {
    try {
      // Don't include duplicates if userId is already in friendIds
      const uniqueFriendIds = friendIds.filter(id => id !== userId)
      const allUserIds = [userId, ...uniqueFriendIds]
      const leaderboard: FriendLeaderboardEntry[] = []

      for (const id of allUserIds) {
        const history = await this.getUserTournamentHistory(id)
        
        // Filter by game if specified
        const filteredHistory = options?.gameSlug
          ? history.filter(h => h.gameSlug === options.gameSlug)
          : history

        if (filteredHistory.length === 0) continue

        const games = new Set<string>()
        let tournamentsWon = 0
        let totalWinnings = 0
        let placementSum = 0

        filteredHistory.forEach(h => {
          if (h.gameSlug) games.add(h.gameSlug)
          if (h.placement === 1) tournamentsWon++
          totalWinnings += h.prizeWon || 0
          placementSum += h.placement
        })

        leaderboard.push({
          userId: id,
          tournamentsPlayed: filteredHistory.length,
          tournamentsWon,
          avgPlacement: filteredHistory.length > 0 ? placementSum / filteredHistory.length : 0,
          totalWinnings,
          games: Array.from(games)
        })
      }

      // Sort leaderboard
      if (options?.sortBy === 'wins') {
        leaderboard.sort((a, b) => b.tournamentsWon - a.tournamentsWon)
      } else if (options?.sortBy === 'placement') {
        leaderboard.sort((a, b) => a.avgPlacement - b.avgPlacement)
      } else if (options?.sortBy === 'winnings') {
        leaderboard.sort((a, b) => b.totalWinnings - a.totalWinnings)
      } else {
        // Default: sort by tournaments won, then by average placement
        leaderboard.sort((a, b) => {
          if (b.tournamentsWon !== a.tournamentsWon) {
            return b.tournamentsWon - a.tournamentsWon
          }
          return a.avgPlacement - b.avgPlacement
        })
      }

      // Add ranks
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return leaderboard
    } catch (error) {
      console.error('Failed to get friend leaderboard:', error)
      return []
    }
  }

  /**
   * Create private tournament
   */
  async createPrivateTournament(params: {
    name: string
    gameSlug: string
    organizerId: string
    maxParticipants: number
    isPrivate: boolean
    friendsOnly?: boolean
    allowedUsers?: string[]
    password?: string
  }): Promise<PrivateTournament | null> {
    try {
      const accessCode = this.generateAccessCode()
      
      const tournament: PrivateTournament = {
        id: `private_${this.nextId++}`,
        name: params.name,
        gameSlug: params.gameSlug,
        organizerId: params.organizerId,
        maxParticipants: params.maxParticipants,
        isPrivate: params.isPrivate,
        friendsOnly: params.friendsOnly,
        accessCode: params.isPrivate ? accessCode : undefined,
        passwordHash: params.password,
        allowedUsers: params.allowedUsers || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (supabase) {
        const { data, error } = await (supabase
          .from('private_tournaments') as any)
          .insert({
            tournament_id: `tournament_${Date.now()}`,
            name: params.name,
            game_slug: params.gameSlug,
            organizer_id: params.organizerId,
            max_participants: params.maxParticipants,
            is_private: params.isPrivate,
            friends_only: params.friendsOnly,
            access_code: tournament.accessCode,
            password_hash: params.password,
            allowed_users: params.allowedUsers || []
          })
          .select()
          .single()

        if (!error && data) {
          const result = this.mapPrivateTournamentFromDatabase(data)
          this.privateTournaments.set(result.id, result)
          return result
        }
      }

      // Fallback to local storage
      this.privateTournaments.set(tournament.id, tournament)
      return tournament
    } catch (error) {
      console.error('Failed to create private tournament:', error)
      return null
    }
  }

  /**
   * Validate tournament access
   */
  async validateTournamentAccess(
    tournamentId: string,
    userId: string,
    accessCode?: string,
    password?: string
  ): Promise<boolean> {
    try {
      const tournament = this.privateTournaments.get(tournamentId)
      
      if (!tournament || !tournament.isPrivate) {
        return true
      }

      // Check if user is organizer
      if (tournament.organizerId === userId) {
        return true
      }

      // Check access code
      if (tournament.accessCode && accessCode === tournament.accessCode) {
        // Check friends-only restriction
        if (tournament.friendsOnly) {
          return tournament.allowedUsers?.includes(userId) || false
        }
        return true
      }

      // Check password
      if (tournament.passwordHash && password === tournament.passwordHash) {
        if (tournament.friendsOnly) {
          return tournament.allowedUsers?.includes(userId) || false
        }
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to validate tournament access:', error)
      return false
    }
  }

  /**
   * Search tournament history
   */
  async searchTournamentHistory(
    userId: string,
    filters: SearchFilters
  ): Promise<TournamentHistoryEntry[]> {
    try {
      let history = await this.getUserTournamentHistory(userId)

      // Apply filters
      if (filters.gameSlug) {
        history = history.filter(h => h.gameSlug === filters.gameSlug)
      }

      if (filters.minPlacement !== undefined) {
        history = history.filter(h => h.placement >= filters.minPlacement!)
      }

      if (filters.maxPlacement !== undefined) {
        history = history.filter(h => h.placement <= filters.maxPlacement!)
      }

      if (filters.entryFee === 'free') {
        history = history.filter(h => (h.entryFee || 0) === 0)
      } else if (filters.entryFee === 'paid') {
        history = history.filter(h => (h.entryFee || 0) > 0)
      }

      // Sort
      if (filters.sortBy === 'placement') {
        history.sort((a, b) => {
          const diff = filters.sortOrder === 'desc' 
            ? b.placement - a.placement 
            : a.placement - b.placement
          return diff
        })
      } else if (filters.sortBy === 'score') {
        history.sort((a, b) => {
          const diff = filters.sortOrder === 'asc' 
            ? a.totalScore - b.totalScore 
            : b.totalScore - a.totalScore
          return diff
        })
      } else if (filters.sortBy === 'date') {
        // Sort by date
        history.sort((a, b) => {
          const diff = filters.sortOrder === 'asc'
            ? a.completedAt.getTime() - b.completedAt.getTime()
            : b.completedAt.getTime() - a.completedAt.getTime()
          return diff
        })
      }

      return history
    } catch (error) {
      console.error('Failed to search tournament history:', error)
      return []
    }
  }

  /**
   * Helper: Generate access code
   */
  private generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  /**
   * Helper: Add to local cache
   */
  private addToLocalCache(entry: TournamentHistoryEntry) {
    const userHistory = this.history.get(entry.userId) || []
    userHistory.push(entry)
    this.history.set(entry.userId, userHistory)
  }

  /**
   * Helper: Map from database
   */
  private mapFromDatabase(data: any): TournamentHistoryEntry {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      userId: data.user_id,
      gameSlug: data.game_slug,
      placement: data.placement,
      matchesPlayed: data.matches_played,
      matchesWon: data.matches_won,
      totalScore: data.total_score,
      entryFee: data.entry_fee,
      prizeWon: data.prize_won,
      winRate: data.win_rate,
      completedAt: new Date(data.completed_at)
    }
  }

  /**
   * Helper: Map private tournament from database
   */
  private mapPrivateTournamentFromDatabase(data: any): PrivateTournament {
    return {
      id: data.id,
      tournamentId: data.tournament_id,
      name: data.name,
      gameSlug: data.game_slug,
      organizerId: data.organizer_id,
      maxParticipants: data.max_participants,
      isPrivate: data.is_private,
      friendsOnly: data.friends_only,
      accessCode: data.access_code,
      passwordHash: data.password_hash,
      allowedUsers: data.allowed_users,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

// Export singleton instance
export const tournamentHistoryService = new TournamentHistoryService()