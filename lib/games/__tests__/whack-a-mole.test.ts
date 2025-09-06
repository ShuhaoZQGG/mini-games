import { WhackAMoleGame, HoleContent, PowerUp, GameState, Difficulty } from '../whack-a-mole'

describe('WhackAMoleGame', () => {
  let game: WhackAMoleGame
  
  beforeEach(() => {
    game = new WhackAMoleGame()
    jest.useFakeTimers()
  })
  
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(game.getState()).toBe(GameState.Ready)
      expect(game.getScore()).toBe(0)
      expect(game.getLevel()).toBe(1)
      expect(game.getLives()).toBe(3)
      expect(game.getCombo()).toBe(0)
      expect(game.getDifficulty()).toBe(Difficulty.Normal)
    })

    it('should have 9 holes in a 3x3 grid', () => {
      const holes = game.getHoles()
      expect(holes).toHaveLength(9)
      holes.forEach(hole => {
        expect(hole.content).toBe(HoleContent.Empty)
        expect(hole.isActive).toBe(false)
      })
    })

    it('should allow setting difficulty', () => {
      game.setDifficulty(Difficulty.Hard)
      expect(game.getDifficulty()).toBe(Difficulty.Hard)
      
      game.setDifficulty(Difficulty.Expert)
      expect(game.getDifficulty()).toBe(Difficulty.Expert)
    })
  })

  describe('Game Flow', () => {
    it('should start game correctly', () => {
      game.start()
      
      expect(game.getState()).toBe(GameState.Playing)
      expect(game.getScore()).toBe(0)
      expect(game.getLives()).toBe(3)
      expect(game.getTimeRemaining()).toBeGreaterThan(0)
    })

    it('should spawn moles periodically', () => {
      game.start()
      
      // Advance time to trigger mole spawning
      jest.advanceTimersByTime(1000)
      
      const holes = game.getHoles()
      const activeMoles = holes.filter(h => h.content === HoleContent.Mole && h.isActive)
      expect(activeMoles.length).toBeGreaterThan(0)
    })

    it('should increase spawn rate with level', () => {
      game.start()
      const initialSpawnRate = game['getSpawnRate']()
      
      // Increase level
      game['level'] = 5
      const higherLevelSpawnRate = game['getSpawnRate']()
      
      expect(higherLevelSpawnRate).toBeLessThan(initialSpawnRate)
    })

    it('should hide moles after duration', () => {
      game.start()
      
      // Spawn a mole
      game['spawnMole']()
      const holes = game.getHoles()
      const moleHole = holes.find(h => h.content === HoleContent.Mole)
      
      expect(moleHole).toBeDefined()
      expect(moleHole!.isActive).toBe(true)
      
      // Advance time past mole duration
      jest.advanceTimersByTime(3000)
      
      expect(moleHole!.isActive).toBe(false)
    })

    it('should end game when time runs out', () => {
      game.start()
      
      // Advance time to end of game
      jest.advanceTimersByTime(60000)
      
      expect(game.getState()).toBe(GameState.GameOver)
      expect(game.getTimeRemaining()).toBe(0)
    })
  })

  describe('Whacking Mechanics', () => {
    beforeEach(() => {
      game.start()
    })

    it('should score points for whacking moles', () => {
      // Spawn a mole at specific position
      const holeIndex = 4 // Center hole
      game['holes'][holeIndex] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const initialScore = game.getScore()
      const result = game.whack(holeIndex)
      
      expect(result.hit).toBe(true)
      expect(result.points).toBeGreaterThan(0)
      expect(game.getScore()).toBe(initialScore + result.points)
    })

    it('should not score for whacking empty holes', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.Empty,
        isActive: false,
        spawnTime: 0
      }
      
      const initialScore = game.getScore()
      const result = game.whack(holeIndex)
      
      expect(result.hit).toBe(false)
      expect(result.points).toBe(0)
      expect(game.getScore()).toBe(initialScore)
    })

    it('should reduce score for hitting bombs', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.Bomb,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const initialScore = game.getScore()
      const result = game.whack(holeIndex)
      
      expect(result.hit).toBe(true)
      expect(result.points).toBeLessThan(0)
      expect(game.getScore()).toBe(Math.max(0, initialScore + result.points))
    })

    it('should lose life when hitting bomb', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.Bomb,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const initialLives = game.getLives()
      game.whack(holeIndex)
      
      expect(game.getLives()).toBe(initialLives - 1)
    })

    it('should end game when lives reach zero', () => {
      // Hit bombs to lose all lives
      for (let i = 0; i < 3; i++) {
        game['holes'][i] = {
          content: HoleContent.Bomb,
          isActive: true,
          spawnTime: Date.now()
        }
        game.whack(i)
      }
      
      expect(game.getLives()).toBe(0)
      expect(game.getState()).toBe(GameState.GameOver)
    })
  })

  describe('Combo System', () => {
    beforeEach(() => {
      game.start()
    })

    it('should increase combo on consecutive hits', () => {
      for (let i = 0; i < 3; i++) {
        game['holes'][i] = {
          content: HoleContent.Mole,
          isActive: true,
          spawnTime: Date.now()
        }
        game.whack(i)
      }
      
      expect(game.getCombo()).toBe(3)
    })

    it('should apply combo multiplier to score', () => {
      // Build up combo
      for (let i = 0; i < 2; i++) {
        game['holes'][i] = {
          content: HoleContent.Mole,
          isActive: true,
          spawnTime: Date.now()
        }
        game.whack(i)
      }
      
      const combo = game.getCombo()
      expect(combo).toBe(2)
      
      // Next hit should have multiplier
      game['holes'][3] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const result = game.whack(3)
      const basePoints = 10
      expect(result.points).toBeGreaterThan(basePoints)
    })

    it('should reset combo on miss', () => {
      // Build combo
      game['holes'][0] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      game.whack(0)
      expect(game.getCombo()).toBe(1)
      
      // Miss
      game['holes'][1] = {
        content: HoleContent.Empty,
        isActive: false,
        spawnTime: 0
      }
      game.whack(1)
      
      expect(game.getCombo()).toBe(0)
    })

    it('should reset combo on hitting bomb', () => {
      // Build combo
      game['holes'][0] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      game.whack(0)
      expect(game.getCombo()).toBe(1)
      
      // Hit bomb
      game['holes'][1] = {
        content: HoleContent.Bomb,
        isActive: true,
        spawnTime: Date.now()
      }
      game.whack(1)
      
      expect(game.getCombo()).toBe(0)
    })
  })

  describe('Power-ups', () => {
    beforeEach(() => {
      game.start()
    })

    it('should spawn power-ups occasionally', () => {
      // Force power-up spawn
      game['spawnPowerUp']()
      
      const holes = game.getHoles()
      const powerUpHole = holes.find(h => 
        h.content === HoleContent.PowerUp && h.powerUp !== undefined
      )
      
      expect(powerUpHole).toBeDefined()
    })

    it('should apply double score power-up', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.PowerUp,
        powerUp: PowerUp.DoubleScore,
        isActive: true,
        spawnTime: Date.now()
      }
      
      game.whack(holeIndex)
      
      // Next mole should give double points
      game['holes'][5] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const result = game.whack(5)
      expect(result.points).toBeGreaterThanOrEqual(20) // Base 10 * 2
    })

    it('should apply freeze time power-up', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.PowerUp,
        powerUp: PowerUp.FreezeTime,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const timeBefore = game.getTimeRemaining()
      game.whack(holeIndex)
      
      // Advance time
      jest.advanceTimersByTime(5000)
      
      // Time should be frozen or extended
      const timeAfter = game.getTimeRemaining()
      expect(timeAfter).toBeGreaterThanOrEqual(timeBefore)
    })

    it('should apply multi-hit power-up', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.PowerUp,
        powerUp: PowerUp.MultiHit,
        isActive: true,
        spawnTime: Date.now()
      }
      
      game.whack(holeIndex)
      
      // Set up multiple moles
      for (let i = 0; i < 3; i++) {
        game['holes'][i] = {
          content: HoleContent.Mole,
          isActive: true,
          spawnTime: Date.now()
        }
      }
      
      // Single whack should hit multiple moles
      const result = game.whack(0)
      expect(result.hit).toBe(true)
      
      // Check if nearby moles were also hit
      const activeMoles = game.getHoles().filter(h => 
        h.content === HoleContent.Mole && h.isActive
      )
      expect(activeMoles.length).toBeLessThan(3)
    })

    it('should have power-up duration', () => {
      const holeIndex = 4
      game['holes'][holeIndex] = {
        content: HoleContent.PowerUp,
        powerUp: PowerUp.DoubleScore,
        isActive: true,
        spawnTime: Date.now()
      }
      
      game.whack(holeIndex)
      expect(game.getActivePowerUp()).toBe(PowerUp.DoubleScore)
      
      // Advance time past power-up duration
      jest.advanceTimersByTime(10000)
      
      expect(game.getActivePowerUp()).toBeNull()
    })
  })

  describe('Difficulty Scaling', () => {
    it('should adjust spawn rate based on difficulty', () => {
      const difficulties = [
        { level: Difficulty.Easy, expectedRate: 2000 },
        { level: Difficulty.Normal, expectedRate: 1500 },
        { level: Difficulty.Hard, expectedRate: 1000 },
        { level: Difficulty.Expert, expectedRate: 700 }
      ]
      
      difficulties.forEach(({ level, expectedRate }) => {
        game.setDifficulty(level)
        game.start()
        const rate = game['getSpawnRate']()
        expect(rate).toBeLessThanOrEqual(expectedRate)
        game.reset()
      })
    })

    it('should spawn more bombs at higher difficulty', () => {
      game.setDifficulty(Difficulty.Expert)
      game.start()
      
      // Spawn multiple times
      for (let i = 0; i < 20; i++) {
        game['spawnMole']()
      }
      
      const holes = game.getHoles()
      const bombs = holes.filter(h => h.content === HoleContent.Bomb)
      
      // Should have some bombs at expert difficulty
      expect(bombs.length).toBeGreaterThan(0)
    })

    it('should have shorter mole display time at higher difficulty', () => {
      const difficulties = [
        { level: Difficulty.Easy, expectedTime: 2000 },
        { level: Difficulty.Normal, expectedTime: 1500 },
        { level: Difficulty.Hard, expectedTime: 1000 },
        { level: Difficulty.Expert, expectedTime: 700 }
      ]
      
      difficulties.forEach(({ level, expectedTime }) => {
        game.setDifficulty(level)
        const displayTime = game['getMoleDisplayTime']()
        expect(displayTime).toBeLessThanOrEqual(expectedTime)
      })
    })
  })

  describe('Statistics and Scoring', () => {
    beforeEach(() => {
      game.start()
    })

    it('should track hits and misses', () => {
      // Hit a mole
      game['holes'][0] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      game.whack(0)
      
      // Miss
      game['holes'][1] = {
        content: HoleContent.Empty,
        isActive: false,
        spawnTime: 0
      }
      game.whack(1)
      
      const stats = game.getStatistics()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.accuracy).toBe(50)
    })

    it('should track highest combo', () => {
      // Build combo
      for (let i = 0; i < 5; i++) {
        game['holes'][i] = {
          content: HoleContent.Mole,
          isActive: true,
          spawnTime: Date.now()
        }
        game.whack(i)
      }
      
      const stats = game.getStatistics()
      expect(stats.highestCombo).toBe(5)
    })

    it('should calculate final score with bonuses', () => {
      // Play some game
      for (let i = 0; i < 3; i++) {
        game['holes'][i] = {
          content: HoleContent.Mole,
          isActive: true,
          spawnTime: Date.now()
        }
        game.whack(i)
      }
      
      const finalScore = game.calculateFinalScore()
      expect(finalScore).toBeGreaterThan(game.getScore())
    })

    it('should save high score', () => {
      // Score some points
      game['holes'][0] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      game.whack(0)
      
      const score = game.getScore()
      game['saveHighScore'](score)
      
      expect(game.getHighScore()).toBe(score)
    })
  })

  describe('Mobile and Touch Support', () => {
    it('should handle touch events', () => {
      game.start()
      
      game['holes'][4] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      
      const result = game.handleTouch(4)
      expect(result.hit).toBe(true)
    })

    it('should support multi-touch for multi-hit power-up', () => {
      game.start()
      
      // Activate multi-hit power-up
      game['activePowerUp'] = PowerUp.MultiHit
      game['powerUpEndTime'] = Date.now() + 5000
      
      // Set up multiple moles
      game['holes'][0] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      game['holes'][1] = {
        content: HoleContent.Mole,
        isActive: true,
        spawnTime: Date.now()
      }
      
      // Multi-touch both holes
      const results = game.handleMultiTouch([0, 1])
      
      expect(results).toHaveLength(2)
      expect(results[0].hit).toBe(true)
      expect(results[1].hit).toBe(true)
    })

    it('should provide haptic feedback info', () => {
      const feedback = game.getHapticFeedback(HoleContent.Mole)
      
      expect(feedback).toHaveProperty('intensity')
      expect(feedback).toHaveProperty('duration')
      expect(feedback.intensity).toBeGreaterThan(0)
      expect(feedback.duration).toBeGreaterThan(0)
    })
  })
})