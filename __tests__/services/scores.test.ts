import { scoreService } from '@/lib/services/scores'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('ScoreService', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('with localStorage fallback', () => {
    it('should save a score to localStorage', async () => {
      const gameId = 'test-game'
      const score = 100
      const metadata = { test: 'data' }

      const result = await scoreService.saveScore(gameId, score, metadata)
      
      expect(result).toBeTruthy()
      expect(result.gameId).toBe(gameId)
      expect(result.score).toBe(score)
    })

    it('should retrieve personal best from localStorage', async () => {
      const gameId = 'test-game'
      
      // Save multiple scores
      await scoreService.saveScore(gameId, 50)
      await scoreService.saveScore(gameId, 100)
      await scoreService.saveScore(gameId, 75)

      const personalBest = await scoreService.getPersonalBest(gameId)
      
      expect(personalBest).toBe(100)
    })

    it('should retrieve game stats from localStorage', async () => {
      const gameId = 'test-game'
      
      // Save multiple scores
      await scoreService.saveScore(gameId, 50)
      await scoreService.saveScore(gameId, 100)
      await scoreService.saveScore(gameId, 75)

      const stats = await scoreService.getGameStats(gameId)
      
      expect(stats.gameId).toBe(gameId)
      expect(stats.totalGames).toBe(3)
      expect(stats.highScore).toBe(100)
      expect(stats.averageScore).toBe(75)
      expect(stats.totalScore).toBe(225)
    })

    it('should retrieve all scores for a game from localStorage', async () => {
      const gameId = 'test-game'
      
      await scoreService.saveScore(gameId, 50)
      await scoreService.saveScore(gameId, 100)

      const scores = await scoreService.getAllScores(gameId)
      
      expect(scores).toHaveLength(2)
      expect(scores[0].score).toBe(100) // Should be sorted descending
      expect(scores[1].score).toBe(50)
    })

    it('should handle empty leaderboard gracefully', async () => {
      const leaderboard = await scoreService.getLeaderboard({
        gameId: 'non-existent-game'
      })
      
      expect(leaderboard).toEqual([])
    })

    it('should limit leaderboard results', async () => {
      const gameId = 'test-game'
      
      // Save 10 scores
      for (let i = 1; i <= 10; i++) {
        await scoreService.saveScore(gameId, i * 10)
      }

      const leaderboard = await scoreService.getLeaderboard({
        gameId,
        limit: 5
      })
      
      expect(leaderboard).toHaveLength(5)
      expect(leaderboard[0].score).toBe(100) // Highest score first
    })

    it('should retrieve global stats from localStorage', async () => {
      // Save scores for multiple games
      await scoreService.saveScore('game1', 100)
      await scoreService.saveScore('game1', 200)
      await scoreService.saveScore('game2', 300)

      const stats = await scoreService.getGlobalStats()
      
      expect(stats.totalGamesPlayed).toBe(3)
      expect(stats.uniqueGames).toBe(2)
      expect(stats.totalScore).toBe(600)
      expect(stats.averageScore).toBe(200)
    })
  })

  describe('error handling', () => {
    it('should handle invalid game ID gracefully', async () => {
      const personalBest = await scoreService.getPersonalBest('')
      expect(personalBest).toBe(0)
    })

    it('should handle invalid score value', async () => {
      const result = await scoreService.saveScore('test-game', -100)
      expect(result.score).toBe(-100) // Should still save negative scores for some games
    })

    it('should handle corrupted localStorage data', async () => {
      localStorageMock.setItem('mini-games-scores', 'invalid-json')
      
      const scores = await scoreService.getAllScores('test-game')
      expect(scores).toEqual([])
    })
  })

  describe('data migration', () => {
    it('should prepare scores for migration', async () => {
      // Save some scores
      await scoreService.saveScore('game1', 100)
      await scoreService.saveScore('game2', 200)

      const storedData = localStorageMock.getItem('mini-games-scores')
      expect(storedData).toBeTruthy()
      
      const parsed = JSON.parse(storedData!)
      expect(Object.keys(parsed)).toHaveLength(2)
    })
  })
})