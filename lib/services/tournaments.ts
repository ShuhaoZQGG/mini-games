/**
 * Tournament System Service
 * Manages competitive tournaments and brackets
 */

import { createClient } from '@/lib/supabase/client'
import { challengeService } from './challenges'

// Create supabase client - will be null if not configured
const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null

export interface Tournament {
  id: string
  name: string
  description?: string
  gameSlug: string
  gameTitle: string
  organizerId: string
  organizerName: string
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  maxParticipants: number
  currentParticipants: number
  status: 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  registrationDeadline: Date
  prizePool?: string
  rules?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TournamentParticipant {
  tournamentId: string
  userId: string
  username: string
  avatarUrl?: string
  seed?: number
  status: 'registered' | 'checked_in' | 'eliminated' | 'winner'
  currentRound?: number
  wins: number
  losses: number
  score?: number
  registeredAt: Date
}

export interface TournamentMatch {
  id: string
  tournamentId: string
  round: number
  matchNumber: number
  player1Id?: string
  player1Name?: string
  player1Score?: number
  player2Id?: string
  player2Name?: string
  player2Score?: number
  winnerId?: string
  status: 'pending' | 'ready' | 'in_progress' | 'completed'
  scheduledAt?: Date
  completedAt?: Date
}

export interface TournamentBracket {
  tournamentId: string
  rounds: TournamentRound[]
}

export interface TournamentRound {
  roundNumber: number
  name: string // e.g., "Quarter Finals", "Semi Finals", "Finals"
  matches: TournamentMatch[]
}

export interface TournamentStats {
  totalTournaments: number
  tournamentsWon: number
  tournamentsParticipated: number
  winRate: number
  averagePlacement: number
  favoriteGame?: string
  bestPlacement: number
  totalPrizeWon?: string
}

class TournamentService {
  private tournaments: Map<string, Tournament> = new Map()
  private participants: Map<string, TournamentParticipant[]> = new Map()
  private matches: Map<string, TournamentMatch[]> = new Map()
  private currentUserId: string | null = null

  /**
   * Initialize tournament service for a user
   */
  async initialize(userId: string) {
    this.currentUserId = userId
    await this.loadTournaments()
  }

  /**
   * Create a new tournament
   */
  async createTournament(params: {
    name: string
    description?: string
    gameSlug: string
    gameTitle: string
    format: Tournament['format']
    maxParticipants: number
    startDate: Date
    registrationDeadline: Date
    prizePool?: string
    rules?: string[]
  }): Promise<Tournament | null> {
    try {
      const tournament: Tournament = {
        id: `tournament_${Date.now()}`,
        name: params.name,
        description: params.description,
        gameSlug: params.gameSlug,
        gameTitle: params.gameTitle,
        organizerId: this.currentUserId || 'user_1',
        organizerName: 'Tournament Organizer',
        format: params.format,
        maxParticipants: params.maxParticipants,
        currentParticipants: 0,
        status: 'upcoming',
        startDate: params.startDate,
        registrationDeadline: params.registrationDeadline,
        prizePool: params.prizePool,
        rules: params.rules,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Update status based on dates
      const now = new Date()
      if (now < params.registrationDeadline) {
        tournament.status = 'registration'
      }

      if (supabase) {
        const { data, error } = await (supabase
          .from('tournaments') as any)
          .insert(tournament)
          .select()
          .single()

        if (!error && data) {
          const result = data as any
          this.tournaments.set(result.id, result)
          this.saveToStorage()
          return result as Tournament
        }
      }

      // Fallback to local storage
      this.tournaments.set(tournament.id, tournament)
      this.saveToStorage()
      return tournament
    } catch (error) {
      console.error('Failed to create tournament:', error)
      return null
    }
  }

  /**
   * Register for a tournament
   */
  async registerForTournament(tournamentId: string): Promise<boolean> {
    try {
      const tournament = this.tournaments.get(tournamentId)
      if (!tournament) return false

      if (tournament.status !== 'registration') {
        throw new Error('Tournament registration is closed')
      }

      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new Error('Tournament is full')
      }

      const participant: TournamentParticipant = {
        tournamentId,
        userId: this.currentUserId || 'user_1',
        username: 'Player',
        status: 'registered',
        wins: 0,
        losses: 0,
        registeredAt: new Date()
      }

      if (supabase) {
        const { error } = await (supabase
          .from('tournament_participants') as any)
          .insert(participant)

        if (error) throw error
      }

      // Update local data
      const participants = this.participants.get(tournamentId) || []
      participants.push(participant)
      this.participants.set(tournamentId, participants)
      
      tournament.currentParticipants++
      this.saveToStorage()
      
      return true
    } catch (error) {
      console.error('Failed to register for tournament:', error)
      return false
    }
  }

  /**
   * Start a tournament (organizer only)
   */
  async startTournament(tournamentId: string): Promise<boolean> {
    try {
      const tournament = this.tournaments.get(tournamentId)
      if (!tournament) return false

      if (tournament.organizerId !== this.currentUserId) {
        throw new Error('Only the organizer can start the tournament')
      }

      if (tournament.currentParticipants < 2) {
        throw new Error('Need at least 2 participants to start')
      }

      tournament.status = 'in_progress'
      
      // Generate initial bracket
      await this.generateBracket(tournamentId)

      if (supabase) {
        const { error } = await (supabase
          .from('tournaments') as any)
          .update({ status: 'in_progress' })
          .eq('id', tournamentId)

        if (error) throw error
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to start tournament:', error)
      return false
    }
  }

  /**
   * Generate tournament bracket
   */
  private async generateBracket(tournamentId: string): Promise<void> {
    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) return

    const participants = this.participants.get(tournamentId) || []
    
    if (tournament.format === 'single_elimination') {
      await this.generateSingleEliminationBracket(tournamentId, participants)
    } else if (tournament.format === 'round_robin') {
      await this.generateRoundRobinBracket(tournamentId, participants)
    }
  }

  /**
   * Generate single elimination bracket
   */
  private async generateSingleEliminationBracket(
    tournamentId: string,
    participants: TournamentParticipant[]
  ): Promise<void> {
    // Shuffle and seed participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    shuffled.forEach((p, i) => p.seed = i + 1)

    // Calculate number of rounds
    const numRounds = Math.ceil(Math.log2(participants.length))
    const matches: TournamentMatch[] = []

    // Generate first round matches
    let matchNumber = 0
    for (let i = 0; i < shuffled.length; i += 2) {
      const match: TournamentMatch = {
        id: `match_${tournamentId}_1_${matchNumber}`,
        tournamentId,
        round: 1,
        matchNumber: matchNumber++,
        player1Id: shuffled[i]?.userId,
        player1Name: shuffled[i]?.username,
        player2Id: shuffled[i + 1]?.userId,
        player2Name: shuffled[i + 1]?.username,
        status: shuffled[i + 1] ? 'ready' : 'completed', // Bye if odd number
        winnerId: shuffled[i + 1] ? undefined : shuffled[i].userId
      }
      matches.push(match)
    }

    // Generate placeholder matches for subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round)
      for (let i = 0; i < matchesInRound; i++) {
        const match: TournamentMatch = {
          id: `match_${tournamentId}_${round}_${i}`,
          tournamentId,
          round,
          matchNumber: i,
          status: 'pending'
        }
        matches.push(match)
      }
    }

    this.matches.set(tournamentId, matches)
  }

  /**
   * Generate round robin bracket
   */
  private async generateRoundRobinBracket(
    tournamentId: string,
    participants: TournamentParticipant[]
  ): Promise<void> {
    const matches: TournamentMatch[] = []
    let matchNumber = 0

    // Generate all possible matches
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const match: TournamentMatch = {
          id: `match_${tournamentId}_rr_${matchNumber}`,
          tournamentId,
          round: 1, // Round robin is single round
          matchNumber: matchNumber++,
          player1Id: participants[i].userId,
          player1Name: participants[i].username,
          player2Id: participants[j].userId,
          player2Name: participants[j].username,
          status: 'ready'
        }
        matches.push(match)
      }
    }

    this.matches.set(tournamentId, matches)
  }

  /**
   * Submit match result
   */
  async submitMatchResult(
    matchId: string,
    winnerId: string,
    player1Score?: number,
    player2Score?: number
  ): Promise<boolean> {
    try {
      // Find the match
      let foundMatch: TournamentMatch | null = null
      let tournamentId: string | null = null

      for (const [tid, matches] of this.matches.entries()) {
        const match = matches.find(m => m.id === matchId)
        if (match) {
          foundMatch = match
          tournamentId = tid
          break
        }
      }

      if (!foundMatch || !tournamentId) return false

      // Update match
      foundMatch.winnerId = winnerId
      foundMatch.player1Score = player1Score
      foundMatch.player2Score = player2Score
      foundMatch.status = 'completed'
      foundMatch.completedAt = new Date()

      // Update participant stats
      const participants = this.participants.get(tournamentId) || []
      const winner = participants.find(p => p.userId === winnerId)
      const loser = participants.find(p => 
        p.userId === foundMatch!.player1Id || p.userId === foundMatch!.player2Id
      )
      
      if (winner) winner.wins++
      if (loser) loser.losses++

      // Advance winner to next round (for elimination tournaments)
      const tournament = this.tournaments.get(tournamentId)
      if (tournament?.format === 'single_elimination') {
        await this.advanceWinner(tournamentId, foundMatch.round, foundMatch.matchNumber, winnerId)
      }

      if (supabase) {
        const { error } = await (supabase
          .from('tournament_matches') as any)
          .update({
            winner_id: winnerId,
            player1_score: player1Score,
            player2_score: player2Score,
            status: 'completed',
            completed_at: foundMatch.completedAt
          })
          .eq('id', matchId)

        if (error) throw error
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Failed to submit match result:', error)
      return false
    }
  }

  /**
   * Advance winner to next round
   */
  private async advanceWinner(
    tournamentId: string,
    currentRound: number,
    matchNumber: number,
    winnerId: string
  ): Promise<void> {
    const matches = this.matches.get(tournamentId) || []
    const participants = this.participants.get(tournamentId) || []
    const winner = participants.find(p => p.userId === winnerId)
    if (!winner) return

    // Find next round match
    const nextRound = currentRound + 1
    const nextMatchNumber = Math.floor(matchNumber / 2)
    const nextMatch = matches.find(m => 
      m.round === nextRound && m.matchNumber === nextMatchNumber
    )

    if (nextMatch) {
      // Determine if winner goes to player1 or player2 slot
      if (matchNumber % 2 === 0) {
        nextMatch.player1Id = winnerId
        nextMatch.player1Name = winner.username
      } else {
        nextMatch.player2Id = winnerId
        nextMatch.player2Name = winner.username
      }

      // Update match status if both players are set
      if (nextMatch.player1Id && nextMatch.player2Id) {
        nextMatch.status = 'ready'
      }
    }
  }

  /**
   * Get tournament bracket
   */
  async getTournamentBracket(tournamentId: string): Promise<TournamentBracket | null> {
    try {
      const tournament = this.tournaments.get(tournamentId)
      if (!tournament) return null

      const matches = this.matches.get(tournamentId) || []
      
      // Group matches by round
      const roundsMap = new Map<number, TournamentMatch[]>()
      matches.forEach(match => {
        const roundMatches = roundsMap.get(match.round) || []
        roundMatches.push(match)
        roundsMap.set(match.round, roundMatches)
      })

      // Create rounds array
      const rounds: TournamentRound[] = []
      const numRounds = Math.max(...Array.from(roundsMap.keys()))
      
      for (let i = 1; i <= numRounds; i++) {
        const roundName = this.getRoundName(i, numRounds, tournament.format)
        rounds.push({
          roundNumber: i,
          name: roundName,
          matches: roundsMap.get(i) || []
        })
      }

      return {
        tournamentId,
        rounds
      }
    } catch (error) {
      console.error('Failed to get tournament bracket:', error)
      return null
    }
  }

  /**
   * Get round name based on tournament format
   */
  private getRoundName(round: number, totalRounds: number, format: Tournament['format']): string {
    if (format === 'round_robin') return 'Round Robin'
    
    const roundsFromEnd = totalRounds - round + 1
    switch (roundsFromEnd) {
      case 1: return 'Finals'
      case 2: return 'Semi Finals'
      case 3: return 'Quarter Finals'
      case 4: return 'Round of 16'
      case 5: return 'Round of 32'
      default: return `Round ${round}`
    }
  }

  /**
   * Get all tournaments
   */
  async getTournaments(filter?: 'upcoming' | 'active' | 'completed' | 'my_tournaments'): Promise<Tournament[]> {
    try {
      if (supabase) {
        let query = (supabase.from('tournaments') as any).select('*')
        
        if (filter === 'upcoming') {
          query = query.eq('status', 'registration')
        } else if (filter === 'active') {
          query = query.eq('status', 'in_progress')
        } else if (filter === 'completed') {
          query = query.eq('status', 'completed')
        } else if (filter === 'my_tournaments') {
          query = query.eq('organizer_id', this.currentUserId || '')
        }

        const { data, error } = await query

        if (!error && data) {
          this.tournaments.clear()
          data.forEach((tournament: any) => {
            tournament.startDate = new Date(tournament.start_date)
            tournament.registrationDeadline = new Date(tournament.registration_deadline)
            if (tournament.endDate) {
              tournament.endDate = new Date(tournament.end_date)
            }
            tournament.createdAt = new Date(tournament.created_at)
            tournament.updatedAt = new Date(tournament.updated_at)
            this.tournaments.set(tournament.id, tournament)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    }

    // Filter based on request
    let tournaments = Array.from(this.tournaments.values())
    
    if (filter === 'upcoming') {
      tournaments = tournaments.filter(t => t.status === 'registration')
    } else if (filter === 'active') {
      tournaments = tournaments.filter(t => t.status === 'in_progress')
    } else if (filter === 'completed') {
      tournaments = tournaments.filter(t => t.status === 'completed')
    } else if (filter === 'my_tournaments') {
      tournaments = tournaments.filter(t => t.organizerId === this.currentUserId)
    }

    return tournaments.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  /**
   * Get tournament details
   */
  async getTournamentDetails(tournamentId: string): Promise<Tournament | null> {
    try {
      if (supabase) {
        const { data, error } = await (supabase
          .from('tournaments') as any)
          .select('*')
          .eq('id', tournamentId)
          .single()

        if (!error && data) {
          const tournament = data as any
          tournament.startDate = new Date(tournament.start_date)
          tournament.registrationDeadline = new Date(tournament.registration_deadline)
          if (tournament.endDate) {
            tournament.endDate = new Date(tournament.end_date)
          }
          tournament.createdAt = new Date(tournament.created_at)
          tournament.updatedAt = new Date(tournament.updated_at)
          this.tournaments.set(tournament.id, tournament)
          return tournament as Tournament
        }
      }

      return this.tournaments.get(tournamentId) || null
    } catch (error) {
      console.error('Failed to get tournament details:', error)
      return null
    }
  }

  /**
   * Get tournament participants
   */
  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    try {
      if (supabase) {
        const { data, error } = await (supabase
          .from('tournament_participants') as any)
          .select('*')
          .eq('tournament_id', tournamentId)

        if (!error && data) {
          const participants = data.map((p: any) => ({
            ...p,
            registeredAt: new Date(p.registered_at)
          }))
          this.participants.set(tournamentId, participants)
          return participants
        }
      }

      return this.participants.get(tournamentId) || []
    } catch (error) {
      console.error('Failed to get tournament participants:', error)
      return []
    }
  }

  /**
   * Get user tournament stats
   */
  async getUserStats(): Promise<TournamentStats> {
    try {
      const allTournaments = Array.from(this.tournaments.values())
      const participatedTournaments: string[] = []
      let totalWins = 0
      let totalPlacements = 0
      const gameCount = new Map<string, number>()

      // Calculate stats from all tournaments
      for (const [tournamentId, participants] of this.participants.entries()) {
        const userParticipant = participants.find(p => p.userId === this.currentUserId)
        if (userParticipant) {
          participatedTournaments.push(tournamentId)
          
          if (userParticipant.status === 'winner') {
            totalWins++
          }

          // Track game frequency
          const tournament = this.tournaments.get(tournamentId)
          if (tournament) {
            const count = gameCount.get(tournament.gameSlug) || 0
            gameCount.set(tournament.gameSlug, count + 1)
          }
        }
      }

      // Find favorite game
      let favoriteGame: string | undefined
      let maxCount = 0
      for (const [game, count] of gameCount.entries()) {
        if (count > maxCount) {
          maxCount = count
          favoriteGame = game
        }
      }

      return {
        totalTournaments: allTournaments.length,
        tournamentsWon: totalWins,
        tournamentsParticipated: participatedTournaments.length,
        winRate: participatedTournaments.length > 0 
          ? Math.round((totalWins / participatedTournaments.length) * 100) 
          : 0,
        averagePlacement: 0, // Would need more complex calculation
        favoriteGame,
        bestPlacement: totalWins > 0 ? 1 : 999
      }
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return {
        totalTournaments: 0,
        tournamentsWon: 0,
        tournamentsParticipated: 0,
        winRate: 0,
        averagePlacement: 0,
        bestPlacement: 999
      }
    }
  }

  /**
   * Load tournaments from storage
   */
  private async loadTournaments() {
    try {
      const stored = localStorage.getItem('tournament_data')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore tournaments
        if (data.tournaments) {
          this.tournaments.clear()
          data.tournaments.forEach((tournament: any) => {
            tournament.startDate = new Date(tournament.startDate)
            tournament.registrationDeadline = new Date(tournament.registrationDeadline)
            if (tournament.endDate) {
              tournament.endDate = new Date(tournament.endDate)
            }
            tournament.createdAt = new Date(tournament.createdAt)
            tournament.updatedAt = new Date(tournament.updatedAt)
            this.tournaments.set(tournament.id, tournament)
          })
        }

        // Restore participants
        if (data.participants) {
          this.participants.clear()
          Object.entries(data.participants).forEach(([tournamentId, participants]: [string, any]) => {
            const participantList = participants.map((p: any) => ({
              ...p,
              registeredAt: new Date(p.registeredAt)
            }))
            this.participants.set(tournamentId, participantList)
          })
        }

        // Restore matches
        if (data.matches) {
          this.matches.clear()
          Object.entries(data.matches).forEach(([tournamentId, matches]: [string, any]) => {
            const matchList = matches.map((m: any) => ({
              ...m,
              scheduledAt: m.scheduledAt ? new Date(m.scheduledAt) : undefined,
              completedAt: m.completedAt ? new Date(m.completedAt) : undefined
            }))
            this.matches.set(tournamentId, matchList)
          })
        }
      }

      // Initialize with demo tournaments if empty
      if (this.tournaments.size === 0) {
        await this.initializeDemoData()
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    }
  }

  /**
   * Save tournaments to storage
   */
  private saveToStorage() {
    try {
      const data = {
        tournaments: Array.from(this.tournaments.values()),
        participants: Object.fromEntries(this.participants.entries()),
        matches: Object.fromEntries(this.matches.entries())
      }
      localStorage.setItem('tournament_data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save tournaments:', error)
    }
  }

  /**
   * Initialize demo tournament data
   */
  private async initializeDemoData() {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // CPS Test Championship
    const cpsChampionship: Tournament = {
      id: 'tournament_demo_1',
      name: 'CPS Test Championship',
      description: 'Test your clicking speed against the best!',
      gameSlug: 'cps-test',
      gameTitle: 'CPS Test',
      organizerId: 'organizer_1',
      organizerName: 'Admin',
      format: 'single_elimination',
      maxParticipants: 16,
      currentParticipants: 12,
      status: 'registration',
      startDate: tomorrow,
      registrationDeadline: tomorrow,
      prizePool: '$100',
      rules: [
        'No auto-clickers or macros',
        'Must use standard mouse',
        'Best of 3 rounds per match'
      ],
      createdAt: now,
      updatedAt: now
    }

    // Typing Speed Tournament
    const typingTournament: Tournament = {
      id: 'tournament_demo_2',
      name: 'Ultimate Typing Tournament',
      description: 'Prove your typing supremacy!',
      gameSlug: 'typing-test',
      gameTitle: 'Typing Test',
      organizerId: 'organizer_1',
      organizerName: 'Admin',
      format: 'round_robin',
      maxParticipants: 8,
      currentParticipants: 6,
      status: 'registration',
      startDate: nextWeek,
      registrationDeadline: nextWeek,
      prizePool: '$50',
      rules: [
        'Standard QWERTY keyboard only',
        'No copy-paste allowed',
        '60 second rounds'
      ],
      createdAt: now,
      updatedAt: now
    }

    // Memory Match Masters
    const memoryTournament: Tournament = {
      id: 'tournament_demo_3',
      name: 'Memory Match Masters',
      description: 'Test your memory skills!',
      gameSlug: 'memory-match',
      gameTitle: 'Memory Match',
      organizerId: 'organizer_2',
      organizerName: 'GameMaster',
      format: 'double_elimination',
      maxParticipants: 32,
      currentParticipants: 28,
      status: 'in_progress',
      startDate: now,
      registrationDeadline: now,
      prizePool: '$200',
      rules: [
        'Fastest completion time wins',
        'Same board for all players',
        'No external memory aids'
      ],
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: now
    }

    this.tournaments.set(cpsChampionship.id, cpsChampionship)
    this.tournaments.set(typingTournament.id, typingTournament)
    this.tournaments.set(memoryTournament.id, memoryTournament)

    // Add demo participants for the in-progress tournament
    const demoParticipants: TournamentParticipant[] = [
      {
        tournamentId: memoryTournament.id,
        userId: 'player_1',
        username: 'SpeedDemon',
        status: 'registered',
        seed: 1,
        wins: 2,
        losses: 0,
        currentRound: 3,
        registeredAt: now
      },
      {
        tournamentId: memoryTournament.id,
        userId: 'player_2',
        username: 'MemoryKing',
        status: 'registered',
        seed: 2,
        wins: 2,
        losses: 0,
        currentRound: 3,
        registeredAt: now
      },
      {
        tournamentId: memoryTournament.id,
        userId: 'player_3',
        username: 'QuickFingers',
        status: 'eliminated',
        seed: 3,
        wins: 1,
        losses: 1,
        currentRound: 2,
        registeredAt: now
      },
      {
        tournamentId: memoryTournament.id,
        userId: 'player_4',
        username: 'Lightning',
        status: 'eliminated',
        seed: 4,
        wins: 1,
        losses: 1,
        currentRound: 2,
        registeredAt: now
      }
    ]

    this.participants.set(memoryTournament.id, demoParticipants)

    // Add demo matches
    const demoMatches: TournamentMatch[] = [
      // Round 1
      {
        id: 'match_demo_1_1',
        tournamentId: memoryTournament.id,
        round: 1,
        matchNumber: 0,
        player1Id: 'player_1',
        player1Name: 'SpeedDemon',
        player1Score: 25,
        player2Id: 'player_4',
        player2Name: 'Lightning',
        player2Score: 30,
        winnerId: 'player_1',
        status: 'completed',
        completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'match_demo_1_2',
        tournamentId: memoryTournament.id,
        round: 1,
        matchNumber: 1,
        player1Id: 'player_2',
        player1Name: 'MemoryKing',
        player1Score: 22,
        player2Id: 'player_3',
        player2Name: 'QuickFingers',
        player2Score: 28,
        winnerId: 'player_2',
        status: 'completed',
        completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      // Round 2 (Semi Finals)
      {
        id: 'match_demo_2_1',
        tournamentId: memoryTournament.id,
        round: 2,
        matchNumber: 0,
        player1Id: 'player_1',
        player1Name: 'SpeedDemon',
        player2Id: 'player_2',
        player2Name: 'MemoryKing',
        status: 'ready'
      }
    ]

    this.matches.set(memoryTournament.id, demoMatches)

    this.saveToStorage()
  }
}

// Export singleton instance
export const tournamentService = new TournamentService()