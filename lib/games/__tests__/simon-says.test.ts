import { SimonSaysGame, Color, GameSpeed, GameState } from '../simon-says'

describe('SimonSaysGame', () => {
  let game: SimonSaysGame
  
  beforeEach(() => {
    game = new SimonSaysGame()
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
      expect(game.getSpeed()).toBe(GameSpeed.Normal)
      expect(game.getHighScore()).toBe(0)
    })

    it('should allow setting game speed', () => {
      game.setSpeed(GameSpeed.Fast)
      expect(game.getSpeed()).toBe(GameSpeed.Fast)
      
      game.setSpeed(GameSpeed.Expert)
      expect(game.getSpeed()).toBe(GameSpeed.Expert)
    })

    it('should have four colors available', () => {
      const colors = game.getColors()
      expect(colors).toHaveLength(4)
      expect(colors).toContain(Color.Red)
      expect(colors).toContain(Color.Blue)
      expect(colors).toContain(Color.Green)
      expect(colors).toContain(Color.Yellow)
    })
  })

  describe('Game Flow', () => {
    it('should start a new game correctly', () => {
      game.start()
      
      expect(game.getState()).toBe(GameState.ShowingSequence)
      expect(game.getLevel()).toBe(1)
      expect(game.getScore()).toBe(0)
      expect(game.getSequence()).toHaveLength(1)
    })

    it('should generate random sequences', () => {
      game.start()
      const sequence1 = [...game.getSequence()]
      
      game.reset()
      game.start()
      const sequence2 = [...game.getSequence()]
      
      // Sequences should be different (with high probability)
      // This might fail occasionally due to randomness
      expect(sequence1).not.toEqual(sequence2)
    })

    it('should add to sequence when level increases', () => {
      game.start()
      const initialLength = game.getSequence().length
      
      // Complete the first level
      const sequence = game.getSequence()
      game['setState'](GameState.PlayerInput)
      sequence.forEach(color => {
        game.handleInput(color)
      })
      
      // Should advance to next level
      expect(game.getLevel()).toBe(2)
      expect(game.getSequence().length).toBe(initialLength + 1)
    })

    it('should transition states correctly', () => {
      game.start()
      expect(game.getState()).toBe(GameState.ShowingSequence)
      
      // Wait for sequence to finish showing
      jest.advanceTimersByTime(2000)
      expect(game.getState()).toBe(GameState.PlayerInput)
    })
  })

  describe('Player Input', () => {
    beforeEach(() => {
      game.start()
      game['setState'](GameState.PlayerInput)
    })

    it('should accept correct input', () => {
      const sequence = game.getSequence()
      const firstColor = sequence[0]
      
      const result = game.handleInput(firstColor)
      expect(result).toBe(true)
      expect(game.getPlayerSequence()).toContain(firstColor)
    })

    it('should reject incorrect input', () => {
      const sequence = game.getSequence()
      const correctColor = sequence[0]
      
      // Find a color that's not the correct one
      const incorrectColor = [Color.Red, Color.Blue, Color.Green, Color.Yellow]
        .find(c => c !== correctColor)!
      
      const result = game.handleInput(incorrectColor)
      expect(result).toBe(false)
      expect(game.getState()).toBe(GameState.GameOver)
    })

    it('should complete level when full sequence is correct', () => {
      const sequence = [...game.getSequence()]
      const initialLevel = game.getLevel()
      
      sequence.forEach(color => {
        game.handleInput(color)
      })
      
      expect(game.getLevel()).toBe(initialLevel + 1)
      expect(game.getState()).toBe(GameState.ShowingSequence)
    })

    it('should not accept input when showing sequence', () => {
      game['setState'](GameState.ShowingSequence)
      
      const result = game.handleInput(Color.Red)
      expect(result).toBe(false)
      expect(game.getPlayerSequence()).toHaveLength(0)
    })

    it('should not accept input when game is over', () => {
      game['setState'](GameState.GameOver)
      
      const result = game.handleInput(Color.Red)
      expect(result).toBe(false)
    })
  })

  describe('Scoring System', () => {
    beforeEach(() => {
      game.start()
      game['setState'](GameState.PlayerInput)
    })

    it('should award points for correct inputs', () => {
      const sequence = game.getSequence()
      const initialScore = game.getScore()
      
      game.handleInput(sequence[0])
      
      expect(game.getScore()).toBeGreaterThan(initialScore)
    })

    it('should award more points at higher levels', () => {
      // Complete first level
      let sequence = [...game.getSequence()]
      sequence.forEach(color => game.handleInput(color))
      
      const scoreLevel1 = game.getScore()
      
      // Start level 2
      jest.advanceTimersByTime(2000)
      game['setState'](GameState.PlayerInput)
      
      // Get one correct input at level 2
      sequence = game.getSequence()
      game.handleInput(sequence[0])
      
      const scoreGainLevel2 = game.getScore() - scoreLevel1
      expect(scoreGainLevel2).toBeGreaterThan(10) // Base score at level 1
    })

    it('should award speed bonus for fast mode', () => {
      game.setSpeed(GameSpeed.Fast)
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      game.handleInput(sequence[0])
      
      const fastScore = game.getScore()
      
      // Compare with normal speed
      const normalGame = new SimonSaysGame()
      normalGame.start()
      normalGame['setState'](GameState.PlayerInput)
      const normalSequence = normalGame.getSequence()
      normalGame.handleInput(normalSequence[0])
      
      expect(fastScore).toBeGreaterThanOrEqual(normalGame.getScore())
    })

    it('should track high score', () => {
      game.start()
      game['setState'](GameState.PlayerInput)
      
      // Get some points
      const sequence = game.getSequence()
      sequence.forEach(color => game.handleInput(color))
      
      const score = game.getScore()
      
      // Game over
      game['setState'](GameState.GameOver)
      
      expect(game.getHighScore()).toBe(score)
      
      // Start new game
      game.reset()
      game.start()
      
      expect(game.getHighScore()).toBe(score)
    })
  })

  describe('Speed Settings', () => {
    it('should adjust display time based on speed', () => {
      const speeds = [
        { speed: GameSpeed.Slow, expectedTime: 1000 },
        { speed: GameSpeed.Normal, expectedTime: 800 },
        { speed: GameSpeed.Fast, expectedTime: 600 },
        { speed: GameSpeed.Expert, expectedTime: 400 }
      ]
      
      speeds.forEach(({ speed, expectedTime }) => {
        game.setSpeed(speed)
        expect(game.getDisplayTime()).toBe(expectedTime)
      })
    })

    it('should adjust pause time based on speed', () => {
      const speeds = [
        { speed: GameSpeed.Slow, expectedTime: 400 },
        { speed: GameSpeed.Normal, expectedTime: 300 },
        { speed: GameSpeed.Fast, expectedTime: 200 },
        { speed: GameSpeed.Expert, expectedTime: 100 }
      ]
      
      speeds.forEach(({ speed, expectedTime }) => {
        game.setSpeed(speed)
        expect(game.getPauseTime()).toBe(expectedTime)
      })
    })
  })

  describe('Sequence Display', () => {
    it('should notify when showing each color', () => {
      const callback = jest.fn()
      game.setSequenceCallback(callback)
      
      game.start()
      
      // Advance timer to trigger color displays
      const sequence = game.getSequence()
      sequence.forEach((_, index) => {
        jest.advanceTimersByTime(1100) // Display + pause time
        expect(callback).toHaveBeenCalledTimes(index + 1)
      })
    })

    it('should clear display between colors', () => {
      const callback = jest.fn()
      game.setSequenceCallback(callback)
      
      game.start()
      
      jest.advanceTimersByTime(800) // Display time
      expect(callback).toHaveBeenCalledWith(expect.any(String), true)
      
      jest.advanceTimersByTime(300) // Pause time
      expect(callback).toHaveBeenCalledWith(null, false)
    })
  })

  describe('Game State Management', () => {
    it('should reset game properly', () => {
      game.start()
      game['setState'](GameState.PlayerInput)
      
      // Make some progress
      const sequence = game.getSequence()
      game.handleInput(sequence[0])
      
      game.reset()
      
      expect(game.getState()).toBe(GameState.Ready)
      expect(game.getScore()).toBe(0)
      expect(game.getLevel()).toBe(1)
      expect(game.getSequence()).toHaveLength(0)
      expect(game.getPlayerSequence()).toHaveLength(0)
    })

    it('should handle game over state', () => {
      const callback = jest.fn()
      game.setGameOverCallback(callback)
      
      game.start()
      game['setState'](GameState.PlayerInput)
      
      // Make wrong input
      const sequence = game.getSequence()
      const wrongColor = [Color.Red, Color.Blue, Color.Green, Color.Yellow]
        .find(c => c !== sequence[0])!
      
      game.handleInput(wrongColor)
      
      expect(game.getState()).toBe(GameState.GameOver)
      expect(callback).toHaveBeenCalledWith(game.getScore(), game.getLevel())
    })

    it('should provide game statistics', () => {
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      game.handleInput(sequence[0])
      
      const stats = game.getStatistics()
      
      expect(stats).toHaveProperty('score')
      expect(stats).toHaveProperty('level')
      expect(stats).toHaveProperty('highScore')
      expect(stats).toHaveProperty('currentStreak')
      expect(stats).toHaveProperty('longestStreak')
      expect(stats.score).toBe(game.getScore())
      expect(stats.level).toBe(game.getLevel())
    })
  })

  describe('Sound and Visual Feedback', () => {
    it('should trigger sound callback on input', () => {
      const callback = jest.fn()
      game.setSoundCallback(callback)
      
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      game.handleInput(sequence[0])
      
      expect(callback).toHaveBeenCalledWith(sequence[0], true)
    })

    it('should trigger error sound on wrong input', () => {
      const callback = jest.fn()
      game.setSoundCallback(callback)
      
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      const wrongColor = [Color.Red, Color.Blue, Color.Green, Color.Yellow]
        .find(c => c !== sequence[0])!
      
      game.handleInput(wrongColor)
      
      expect(callback).toHaveBeenCalledWith(wrongColor, false)
    })

    it('should provide visual feedback timing', () => {
      const feedback = game.getVisualFeedback(Color.Red)
      
      expect(feedback).toHaveProperty('color')
      expect(feedback).toHaveProperty('duration')
      expect(feedback).toHaveProperty('intensity')
      expect(feedback.color).toBe(Color.Red)
    })
  })

  describe('Mobile and Touch Support', () => {
    it('should handle touch events', () => {
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      const result = game.handleTouch(sequence[0])
      
      expect(result).toBe(true)
      expect(game.getPlayerSequence()).toContain(sequence[0])
    })

    it('should prevent multiple simultaneous inputs', () => {
      game.start()
      game['setState'](GameState.PlayerInput)
      
      const sequence = game.getSequence()
      
      // Try to input multiple colors quickly
      game.handleInput(sequence[0])
      const secondResult = game.handleInput(sequence[0])
      
      // Second input should be ignored if too quick
      expect(game.getPlayerSequence()).toHaveLength(1)
    })

    it('should support gesture controls', () => {
      const swipeMap = game.getSwipeToColorMap()
      
      expect(swipeMap).toHaveProperty('up')
      expect(swipeMap).toHaveProperty('down')
      expect(swipeMap).toHaveProperty('left')
      expect(swipeMap).toHaveProperty('right')
      
      // Each direction should map to a color
      expect(Object.values(swipeMap)).toContain(Color.Red)
      expect(Object.values(swipeMap)).toContain(Color.Blue)
      expect(Object.values(swipeMap)).toContain(Color.Green)
      expect(Object.values(swipeMap)).toContain(Color.Yellow)
    })
  })
})