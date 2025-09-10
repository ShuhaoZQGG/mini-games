import type { GameCategory, GameMetadata, CategoryType } from './categories'
import { GAME_CATEGORIES, getCategoryById, getGamesByCategory, getGameMetadata } from '../data/gameMetadata'

describe('Game Categories Type System', () => {
  describe('GameCategory Interface', () => {
    it('should have required properties', () => {
      const category: GameCategory = {
        id: 'puzzle',
        name: 'Puzzle Games',
        slug: 'puzzle',
        icon: '🧩',
        description: 'Brain-teasing puzzles',
        color: 'purple',
        games: []
      }

      expect(category.id).toBeDefined()
      expect(category.name).toBeDefined()
      expect(category.slug).toBeDefined()
      expect(category.icon).toBeDefined()
      expect(category.description).toBeDefined()
      expect(category.color).toBeDefined()
      expect(category.games).toBeDefined()
    })
  })

  describe('GameMetadata Interface', () => {
    it('should have required game properties', () => {
      const game: GameMetadata = {
        id: '2048',
        name: '2048',
        slug: '2048',
        description: 'Slide tiles to reach 2048',
        category: 'puzzle',
        tags: ['logic', 'numbers', 'sliding'],
        difficulty: 'medium',
        avgPlayTime: 10,
        playerCount: '1',
        thumbnail: '/thumbnails/2048.png',
        path: '/games/2048'
      }

      expect(game.id).toBeDefined()
      expect(game.name).toBeDefined()
      expect(game.slug).toBeDefined()
      expect(game.description).toBeDefined()
      expect(game.category).toBeDefined()
      expect(game.tags).toBeInstanceOf(Array)
      expect(game.difficulty).toMatch(/easy|medium|hard/)
      expect(game.avgPlayTime).toBeGreaterThan(0)
      expect(game.playerCount).toMatch(/1|2|2\+/)
      expect(game.path).toBeDefined()
    })
  })

  describe('CategoryType Enum', () => {
    it('should include all expected categories', () => {
      const expectedCategories: CategoryType[] = [
        'quick',
        'puzzle',
        'card',
        'strategy',
        'arcade',
        'skill',
        'memory',
        'casual',
        'word'
      ]

      expectedCategories.forEach(category => {
        expect(['quick', 'puzzle', 'card', 'strategy', 'arcade', 'skill', 'memory', 'casual', 'word']).toContain(category)
      })
    })
  })
})

describe('Game Metadata Functions', () => {
  describe('getCategoryById', () => {
    it('should return correct category by id', () => {
      const puzzleCategory = getCategoryById('puzzle')
      expect(puzzleCategory).toBeDefined()
      expect(puzzleCategory?.id).toBe('puzzle')
      expect(puzzleCategory?.name).toBe('Puzzle Games')
    })

    it('should return undefined for invalid category id', () => {
      const invalidCategory = getCategoryById('invalid-category')
      expect(invalidCategory).toBeUndefined()
    })
  })

  describe('getGamesByCategory', () => {
    it('should return games for a valid category', () => {
      const puzzleGames = getGamesByCategory('puzzle')
      expect(puzzleGames).toBeInstanceOf(Array)
      expect(puzzleGames.length).toBeGreaterThan(0)
      
      puzzleGames.forEach(game => {
        expect(game.category).toBe('puzzle')
      })
    })

    it('should return empty array for invalid category', () => {
      const games = getGamesByCategory('invalid' as CategoryType)
      expect(games).toEqual([])
    })
  })

  describe('getGameMetadata', () => {
    it('should return metadata for existing game', () => {
      const game = getGameMetadata('2048')
      expect(game).toBeDefined()
      expect(game?.id).toBe('2048')
      expect(game?.name).toBe('2048')
      expect(game?.category).toBe('puzzle')
    })

    it('should return undefined for non-existing game', () => {
      const game = getGameMetadata('non-existing-game')
      expect(game).toBeUndefined()
    })
  })

  describe('GAME_CATEGORIES', () => {
    it('should contain all required categories', () => {
      const requiredCategories = ['quick', 'puzzle', 'card', 'strategy', 'arcade', 'skill', 'memory', 'casual', 'word']
      
      requiredCategories.forEach(categoryId => {
        const category = GAME_CATEGORIES.find(cat => cat.id === categoryId)
        expect(category).toBeDefined()
      })
    })

    it('should have games assigned to each category', () => {
      GAME_CATEGORIES.forEach(category => {
        expect(category.games).toBeInstanceOf(Array)
        expect(category.games.length).toBeGreaterThan(0)
      })
    })

    it('should have unique category ids', () => {
      const ids = GAME_CATEGORIES.map(cat => cat.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have proper color assignments', () => {
      const validColors = ['emerald', 'purple', 'red', 'blue', 'amber', 'cyan', 'pink', 'orange', 'indigo']
      
      GAME_CATEGORIES.forEach(category => {
        expect(validColors).toContain(category.color)
      })
    })
  })

  describe('Game Count Validation', () => {
    it('should have at least 32 games total', () => {
      const allGames = new Set<string>()
      
      GAME_CATEGORIES.forEach(category => {
        category.games.forEach(game => {
          allGames.add(game.id)
        })
      })
      
      expect(allGames.size).toBeGreaterThanOrEqual(32)
    })

    it('should categorize all existing games', () => {
      const expectedGames = [
        'cps-test', 'reaction-time', 'aim-trainer', 'memory-match', 'typing-test',
        'tic-tac-toe', 'minesweeper', 'snake', '2048', 'sudoku',
        'connect-four', 'word-search', 'tetris', 'breakout', 'pacman',
        'space-invaders', 'pattern-memory', 'color-switch', 'sliding-puzzle', 'crossword',
        'solitaire', 'simon-says', 'whack-a-mole', 'blackjack', 'video-poker',
        'flappy-bird', 'stack-tower', 'doodle-jump', 'jigsaw', 'pinball', 'nonogram'
      ]

      expectedGames.forEach(gameId => {
        const game = getGameMetadata(gameId)
        expect(game).toBeDefined()
        expect(game?.category).toBeDefined()
      })
    })
  })
})