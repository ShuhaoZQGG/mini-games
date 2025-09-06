/**
 * Tournament History Service Tests
 * Tests for tournament history tracking and statistics
 */

import { tournamentHistoryService } from '@/lib/services/tournament-history'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => null)
}))

describe('TournamentHistoryService', () => {
  beforeEach(() => {
    // Clear all data before each test
    tournamentHistoryService.clearAll()
    jest.clearAllMocks()
  })

  describe('Recording Tournament History', () => {
    it('should record tournament completion', async () => {
      const historyEntry = {
        tournamentId: 'tournament_123',
        userId: 'user_456',
        placement: 1,
        matchesPlayed: 5,
        matchesWon: 4,
        totalScore: 2450,
        completedAt: new Date('2025-01-06T12:00:00Z')
      }

      const result = await tournamentHistoryService.recordTournamentCompletion(historyEntry)
      
      expect(result).toBeTruthy()
      expect(result?.id).toBeDefined()
      expect(result?.placement).toBe(1)
      expect(result?.matchesWon).toBe(4)
    })

    it('should prevent duplicate history entries', async () => {
      const historyEntry = {
        tournamentId: 'tournament_123',
        userId: 'user_456',
        placement: 1,
        matchesPlayed: 5,
        matchesWon: 4,
        totalScore: 2450,
        completedAt: new Date()
      }

      await tournamentHistoryService.recordTournamentCompletion(historyEntry)
      const duplicate = await tournamentHistoryService.recordTournamentCompletion(historyEntry)
      
      expect(duplicate).toBeNull()
    })

    it('should calculate win rate correctly', async () => {
      const historyEntry = {
        tournamentId: 'tournament_123',
        userId: 'user_456',
        placement: 2,
        matchesPlayed: 6,
        matchesWon: 4,
        totalScore: 1850,
        completedAt: new Date()
      }

      const result = await tournamentHistoryService.recordTournamentCompletion(historyEntry)
      
      expect(result?.winRate).toBeCloseTo(66.67, 1)
    })
  })

  describe('Fetching Tournament History', () => {
    beforeEach(async () => {
      // Add test data
      const entries = [
        {
          tournamentId: 'tournament_1',
          userId: 'user_456',
          placement: 1,
          matchesPlayed: 5,
          matchesWon: 5,
          totalScore: 3000,
          completedAt: new Date('2025-01-01')
        },
        {
          tournamentId: 'tournament_2',
          userId: 'user_456',
          placement: 3,
          matchesPlayed: 4,
          matchesWon: 2,
          totalScore: 1500,
          completedAt: new Date('2025-01-02')
        },
        {
          tournamentId: 'tournament_3',
          userId: 'user_456',
          placement: 2,
          matchesPlayed: 6,
          matchesWon: 4,
          totalScore: 2200,
          completedAt: new Date('2025-01-03')
        }
      ]

      for (const entry of entries) {
        await tournamentHistoryService.recordTournamentCompletion(entry)
      }
    })

    it('should fetch user tournament history', async () => {
      const history = await tournamentHistoryService.getUserTournamentHistory('user_456')
      
      expect(history).toHaveLength(3)
      expect(history[0].completedAt).toEqual(new Date('2025-01-03'))
      expect(history[2].completedAt).toEqual(new Date('2025-01-01'))
    })

    it('should filter history by date range', async () => {
      const history = await tournamentHistoryService.getUserTournamentHistory('user_456', {
        startDate: new Date('2025-01-02'),
        endDate: new Date('2025-01-03')
      })
      
      expect(history).toHaveLength(2)
      expect(history[0].tournamentId).toBe('tournament_3')
      expect(history[1].tournamentId).toBe('tournament_2')
    })

    it('should paginate tournament history', async () => {
      const page1 = await tournamentHistoryService.getUserTournamentHistory('user_456', {
        limit: 2,
        offset: 0
      })
      
      const page2 = await tournamentHistoryService.getUserTournamentHistory('user_456', {
        limit: 2,
        offset: 2
      })
      
      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      expect(page1[0].tournamentId).not.toBe(page2[0].tournamentId)
    })
  })

  describe('Tournament Statistics', () => {
    beforeEach(async () => {
      // Add comprehensive test data
      const entries = [
        {
          tournamentId: 'tournament_1',
          userId: 'user_456',
          gameSlug: 'cps-test',
          placement: 1,
          matchesPlayed: 5,
          matchesWon: 5,
          totalScore: 3000,
          prizeWon: 100,
          completedAt: new Date('2025-01-01')
        },
        {
          tournamentId: 'tournament_2',
          userId: 'user_456',
          gameSlug: 'snake',
          placement: 3,
          matchesPlayed: 4,
          matchesWon: 2,
          totalScore: 1500,
          prizeWon: 25,
          completedAt: new Date('2025-01-02')
        },
        {
          tournamentId: 'tournament_3',
          userId: 'user_456',
          gameSlug: 'cps-test',
          placement: 2,
          matchesPlayed: 6,
          matchesWon: 4,
          totalScore: 2200,
          prizeWon: 50,
          completedAt: new Date('2025-01-03')
        },
        {
          tournamentId: 'tournament_4',
          userId: 'user_456',
          gameSlug: 'cps-test',
          placement: 5,
          matchesPlayed: 3,
          matchesWon: 1,
          totalScore: 800,
          prizeWon: 0,
          completedAt: new Date('2025-01-04')
        }
      ]

      for (const entry of entries) {
        await tournamentHistoryService.recordTournamentCompletion(entry)
      }
    })

    it('should calculate overall statistics', async () => {
      const stats = await tournamentHistoryService.getUserStatistics('user_456')
      
      expect(stats.totalTournaments).toBe(4)
      expect(stats.tournamentsWon).toBe(1)
      expect(stats.winRate).toBeCloseTo(25, 1)
      expect(stats.averagePlacement).toBeCloseTo(2.75, 2)
      expect(stats.bestPlacement).toBe(1)
      expect(stats.totalPrizeWon).toBe(175)
    })

    it('should identify favorite game', async () => {
      const stats = await tournamentHistoryService.getUserStatistics('user_456')
      
      expect(stats.favoriteGame).toBe('cps-test')
      expect(stats.gamesPlayed['cps-test']).toBe(3)
      expect(stats.gamesPlayed['snake']).toBe(1)
    })

    it('should calculate match statistics', async () => {
      const stats = await tournamentHistoryService.getUserStatistics('user_456')
      
      expect(stats.totalMatchesPlayed).toBe(18)
      expect(stats.totalMatchesWon).toBe(12)
      expect(stats.matchWinRate).toBeCloseTo(66.67, 1)
    })

    it('should handle empty history gracefully', async () => {
      const stats = await tournamentHistoryService.getUserStatistics('nonexistent_user')
      
      expect(stats.totalTournaments).toBe(0)
      expect(stats.tournamentsWon).toBe(0)
      expect(stats.winRate).toBe(0)
      expect(stats.averagePlacement).toBe(0)
      expect(stats.favoriteGame).toBeUndefined()
    })
  })

  describe('Friend Leaderboards', () => {
    beforeEach(async () => {
      // Add tournament history for multiple users
      const users = ['user_1', 'user_2', 'user_3', 'user_4']
      const tournaments = ['tournament_1', 'tournament_2', 'tournament_3']
      
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < tournaments.length; j++) {
          await tournamentHistoryService.recordTournamentCompletion({
            tournamentId: tournaments[j],
            userId: users[i],
            gameSlug: 'cps-test',
            placement: (i + j) % 4 + 1,
            matchesPlayed: 5,
            matchesWon: 5 - i,
            totalScore: (4 - i) * 1000,
            prizeWon: i === 0 ? 100 : i === 1 ? 50 : 0,
            completedAt: new Date(`2025-01-0${j + 1}`)
          })
        }
      }
    })

    it('should get friend-only tournament rankings', async () => {
      const friendIds = ['user_1', 'user_2', 'user_3']
      const leaderboard = await tournamentHistoryService.getFriendLeaderboard('user_1', friendIds)
      
      expect(leaderboard).toHaveLength(3)
      expect(leaderboard[0].userId).toBe('user_1')
      expect(leaderboard[0].tournamentsWon).toBeGreaterThanOrEqual(0)
    })

    it('should rank friends by tournament wins', async () => {
      const friendIds = ['user_1', 'user_2', 'user_3']
      const leaderboard = await tournamentHistoryService.getFriendLeaderboard('user_1', friendIds, {
        sortBy: 'wins'
      })
      
      expect(leaderboard[0].tournamentsWon).toBeGreaterThanOrEqual(leaderboard[1].tournamentsWon)
      expect(leaderboard[1].tournamentsWon).toBeGreaterThanOrEqual(leaderboard[2].tournamentsWon)
    })

    it('should filter friend leaderboard by game', async () => {
      const friendIds = ['user_1', 'user_2', 'user_3']
      const leaderboard = await tournamentHistoryService.getFriendLeaderboard('user_1', friendIds, {
        gameSlug: 'cps-test'
      })
      
      expect(leaderboard.length).toBeGreaterThan(0)
      leaderboard.forEach(entry => {
        expect(entry.games).toContain('cps-test')
      })
    })
  })

  describe('Private Tournaments', () => {
    it('should create private tournament with access code', async () => {
      const privateTournament = await tournamentHistoryService.createPrivateTournament({
        name: 'Friends Only Tournament',
        gameSlug: 'cps-test',
        organizerId: 'user_456',
        maxParticipants: 8,
        isPrivate: true,
        friendsOnly: true
      })
      
      expect(privateTournament).toBeTruthy()
      expect(privateTournament?.accessCode).toBeDefined()
      expect(privateTournament?.accessCode).toMatch(/^[A-Z0-9]{6}$/)
      expect(privateTournament?.isPrivate).toBe(true)
      expect(privateTournament?.friendsOnly).toBe(true)
    })

    it('should validate access code for private tournament', async () => {
      const privateTournament = await tournamentHistoryService.createPrivateTournament({
        name: 'Private Tournament',
        gameSlug: 'snake',
        organizerId: 'user_456',
        maxParticipants: 16,
        isPrivate: true
      })
      
      const canJoin = await tournamentHistoryService.validateTournamentAccess(
        privateTournament!.id,
        'user_789',
        privateTournament!.accessCode
      )
      
      expect(canJoin).toBe(true)
    })

    it('should reject invalid access code', async () => {
      const privateTournament = await tournamentHistoryService.createPrivateTournament({
        name: 'Private Tournament',
        gameSlug: 'snake',
        organizerId: 'user_456',
        maxParticipants: 16,
        isPrivate: true
      })
      
      const canJoin = await tournamentHistoryService.validateTournamentAccess(
        privateTournament!.id,
        'user_789',
        'WRONG1'
      )
      
      expect(canJoin).toBe(false)
    })

    it('should enforce friends-only restriction', async () => {
      const privateTournament = await tournamentHistoryService.createPrivateTournament({
        name: 'Friends Tournament',
        gameSlug: 'cps-test',
        organizerId: 'user_456',
        maxParticipants: 8,
        isPrivate: true,
        friendsOnly: true,
        allowedUsers: ['user_123', 'user_789']
      })
      
      const friendCanJoin = await tournamentHistoryService.validateTournamentAccess(
        privateTournament!.id,
        'user_123',
        privateTournament!.accessCode
      )
      
      const strangerCanJoin = await tournamentHistoryService.validateTournamentAccess(
        privateTournament!.id,
        'user_999',
        privateTournament!.accessCode
      )
      
      expect(friendCanJoin).toBe(true)
      expect(strangerCanJoin).toBe(false)
    })
  })

  describe('Tournament Search and Filters', () => {
    beforeEach(async () => {
      // Create various tournaments for filtering
      const tournaments = [
        {
          tournamentId: 'tournament_1',
          userId: 'user_456',
          gameSlug: 'cps-test',
          placement: 1,
          matchesPlayed: 5,
          matchesWon: 5,
          totalScore: 3000,
          entryFee: 0,
          completedAt: new Date('2025-01-01')
        },
        {
          tournamentId: 'tournament_2',
          userId: 'user_456',
          gameSlug: 'snake',
          placement: 2,
          matchesPlayed: 4,
          matchesWon: 3,
          totalScore: 2000,
          entryFee: 10,
          completedAt: new Date('2025-01-05')
        },
        {
          tournamentId: 'tournament_3',
          userId: 'user_456',
          gameSlug: 'cps-test',
          placement: 5,
          matchesPlayed: 3,
          matchesWon: 1,
          totalScore: 800,
          entryFee: 5,
          completedAt: new Date('2025-01-10')
        }
      ]

      for (const tournament of tournaments) {
        await tournamentHistoryService.recordTournamentCompletion(tournament)
      }
    })

    it('should search tournaments by game', async () => {
      const results = await tournamentHistoryService.searchTournamentHistory('user_456', {
        gameSlug: 'cps-test'
      })
      
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.gameSlug).toBe('cps-test')
      })
    })

    it('should filter by placement range', async () => {
      const results = await tournamentHistoryService.searchTournamentHistory('user_456', {
        minPlacement: 1,
        maxPlacement: 2
      })
      
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.placement).toBeGreaterThanOrEqual(1)
        expect(result.placement).toBeLessThanOrEqual(2)
      })
    })

    it('should filter by entry fee', async () => {
      const freeResults = await tournamentHistoryService.searchTournamentHistory('user_456', {
        entryFee: 'free'
      })
      
      const paidResults = await tournamentHistoryService.searchTournamentHistory('user_456', {
        entryFee: 'paid'
      })
      
      expect(freeResults).toHaveLength(1)
      expect(freeResults[0].entryFee).toBe(0)
      
      expect(paidResults).toHaveLength(2)
      paidResults.forEach(result => {
        expect(result.entryFee).toBeGreaterThan(0)
      })
    })

    it('should sort results by different criteria', async () => {
      const byDate = await tournamentHistoryService.searchTournamentHistory('user_456', {
        sortBy: 'date',
        sortOrder: 'desc'
      })
      
      const byPlacement = await tournamentHistoryService.searchTournamentHistory('user_456', {
        sortBy: 'placement',
        sortOrder: 'asc'
      })
      
      expect(byDate[0].completedAt).toEqual(new Date('2025-01-10'))
      expect(byPlacement[0].placement).toBe(1)
    })
  })
})