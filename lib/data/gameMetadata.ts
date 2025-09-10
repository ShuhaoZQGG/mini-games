import type { GameCategory, GameMetadata, CategoryType } from '../types/categories'

// All games with metadata
const ALL_GAMES: GameMetadata[] = [
  // Quick Games (< 5 min)
  {
    id: 'cps-test',
    name: 'CPS Test',
    slug: 'cps-test',
    description: 'Test your clicking speed',
    category: 'quick',
    tags: ['speed', 'clicking', 'test'],
    difficulty: 'easy',
    avgPlayTime: 1,
    playerCount: '1',
    thumbnail: '/thumbnails/cps-test.png',
    path: '/games/cps-test'
  },
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    slug: 'reaction-time',
    description: 'Test your reflexes',
    category: 'quick',
    tags: ['speed', 'reflexes', 'test'],
    difficulty: 'easy',
    avgPlayTime: 2,
    playerCount: '1',
    thumbnail: '/thumbnails/reaction-time.png',
    path: '/games/reaction-time'
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    slug: 'whack-a-mole',
    description: 'Test your reflexes',
    category: 'quick',
    tags: ['speed', 'reflexes', 'arcade'],
    difficulty: 'easy',
    avgPlayTime: 3,
    playerCount: '1',
    thumbnail: '/thumbnails/whack-a-mole.png',
    path: '/games/whack-a-mole'
  },

  // Puzzle Games
  {
    id: 'sudoku',
    name: 'Sudoku',
    slug: 'sudoku',
    description: 'Number puzzle game',
    category: 'puzzle',
    tags: ['numbers', 'logic', 'classic'],
    difficulty: 'medium',
    avgPlayTime: 20,
    playerCount: '1',
    thumbnail: '/thumbnails/sudoku.png',
    path: '/games/sudoku'
  },
  {
    id: '2048',
    name: '2048',
    slug: '2048',
    description: 'Slide tiles to reach 2048',
    category: 'puzzle',
    tags: ['numbers', 'sliding', 'logic'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/2048.png',
    path: '/games/2048'
  },
  {
    id: 'sliding-puzzle',
    name: 'Sliding Puzzle',
    slug: 'sliding-puzzle',
    description: 'Classic 15-puzzle game',
    category: 'puzzle',
    tags: ['sliding', 'classic', 'logic'],
    difficulty: 'medium',
    avgPlayTime: 15,
    playerCount: '1',
    thumbnail: '/thumbnails/sliding-puzzle.png',
    path: '/games/sliding-puzzle'
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw Puzzle',
    slug: 'jigsaw',
    description: 'Piece together puzzles',
    category: 'puzzle',
    tags: ['visual', 'pieces', 'relaxing'],
    difficulty: 'medium',
    avgPlayTime: 25,
    playerCount: '1',
    thumbnail: '/thumbnails/jigsaw.png',
    path: '/games/jigsaw'
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    slug: 'nonogram',
    description: 'Picture logic puzzles',
    category: 'puzzle',
    tags: ['logic', 'grid', 'picture'],
    difficulty: 'hard',
    avgPlayTime: 30,
    playerCount: '1',
    thumbnail: '/thumbnails/nonogram.png',
    path: '/games/nonogram'
  },

  // Card Games
  {
    id: 'solitaire',
    name: 'Solitaire',
    slug: 'solitaire',
    description: 'Classic card game',
    category: 'card',
    tags: ['classic', 'patience', 'cards'],
    difficulty: 'easy',
    avgPlayTime: 15,
    playerCount: '1',
    thumbnail: '/thumbnails/solitaire.png',
    path: '/games/solitaire'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    slug: 'blackjack',
    description: 'Casino card game',
    category: 'card',
    tags: ['casino', 'cards', '21'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/blackjack.png',
    path: '/games/blackjack'
  },
  {
    id: 'video-poker',
    name: 'Video Poker',
    slug: 'video-poker',
    description: 'Jacks or Better poker',
    category: 'card',
    tags: ['casino', 'poker', 'cards'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/video-poker.png',
    path: '/games/video-poker'
  },

  // Strategy Games
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    slug: 'tic-tac-toe',
    description: 'Classic X and O game',
    category: 'strategy',
    tags: ['classic', 'simple', 'grid'],
    difficulty: 'easy',
    avgPlayTime: 5,
    playerCount: '2',
    thumbnail: '/thumbnails/tic-tac-toe.png',
    path: '/games/tic-tac-toe'
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    slug: 'connect-four',
    description: 'Get four in a row',
    category: 'strategy',
    tags: ['classic', 'grid', 'connect'],
    difficulty: 'easy',
    avgPlayTime: 10,
    playerCount: '2',
    thumbnail: '/thumbnails/connect-four.png',
    path: '/games/connect-four'
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    slug: 'minesweeper',
    description: 'Find all the mines',
    category: 'strategy',
    tags: ['classic', 'logic', 'mines'],
    difficulty: 'medium',
    avgPlayTime: 15,
    playerCount: '1',
    thumbnail: '/thumbnails/minesweeper.png',
    path: '/games/minesweeper'
  },

  // Arcade Classics
  {
    id: 'pacman',
    name: 'Pac-Man',
    slug: 'pacman',
    description: 'Classic arcade maze game',
    category: 'arcade',
    tags: ['classic', 'maze', 'ghosts'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/pacman.png',
    path: '/games/pacman'
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    slug: 'space-invaders',
    description: 'Defend Earth from aliens',
    category: 'arcade',
    tags: ['classic', 'shooting', 'aliens'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/space-invaders.png',
    path: '/games/space-invaders'
  },
  {
    id: 'breakout',
    name: 'Breakout',
    slug: 'breakout',
    description: 'Break all the bricks',
    category: 'arcade',
    tags: ['classic', 'paddle', 'bricks'],
    difficulty: 'easy',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/breakout.png',
    path: '/games/breakout'
  },
  {
    id: 'tetris',
    name: 'Tetris',
    slug: 'tetris',
    description: 'Stack falling blocks',
    category: 'arcade',
    tags: ['classic', 'blocks', 'falling'],
    difficulty: 'medium',
    avgPlayTime: 15,
    playerCount: '1',
    thumbnail: '/thumbnails/tetris.png',
    path: '/games/tetris'
  },
  {
    id: 'pinball',
    name: 'Pinball',
    slug: 'pinball',
    description: 'Classic arcade pinball',
    category: 'arcade',
    tags: ['classic', 'physics', 'flippers'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/pinball.png',
    path: '/games/pinball'
  },

  // Skill & Reflex
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    slug: 'aim-trainer',
    description: 'Test your accuracy',
    category: 'skill',
    tags: ['accuracy', 'mouse', 'training'],
    difficulty: 'medium',
    avgPlayTime: 5,
    playerCount: '1',
    thumbnail: '/thumbnails/aim-trainer.png',
    path: '/games/aim-trainer'
  },
  {
    id: 'typing-test',
    name: 'Typing Test',
    slug: 'typing-test',
    description: 'Test your typing speed',
    category: 'skill',
    tags: ['typing', 'speed', 'keyboard'],
    difficulty: 'easy',
    avgPlayTime: 5,
    playerCount: '1',
    thumbnail: '/thumbnails/typing-test.png',
    path: '/games/typing-test'
  },
  {
    id: 'color-switch',
    name: 'Color Switch',
    slug: 'color-switch',
    description: 'Match colors to survive',
    category: 'skill',
    tags: ['colors', 'timing', 'reflexes'],
    difficulty: 'hard',
    avgPlayTime: 5,
    playerCount: '1',
    thumbnail: '/thumbnails/color-switch.png',
    path: '/games/color-switch'
  },
  {
    id: 'snake',
    name: 'Snake',
    slug: 'snake',
    description: 'Classic snake game',
    category: 'skill',
    tags: ['classic', 'growing', 'grid'],
    difficulty: 'easy',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/snake.png',
    path: '/games/snake'
  },

  // Memory Games
  {
    id: 'memory-match',
    name: 'Memory Match',
    slug: 'memory-match',
    description: 'Match the cards',
    category: 'memory',
    tags: ['cards', 'matching', 'pairs'],
    difficulty: 'easy',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/memory-match.png',
    path: '/games/memory-match'
  },
  {
    id: 'simon-says',
    name: 'Simon Says',
    slug: 'simon-says',
    description: 'Memory pattern game',
    category: 'memory',
    tags: ['pattern', 'sequence', 'colors'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/simon-says.png',
    path: '/games/simon-says'
  },
  {
    id: 'pattern-memory',
    name: 'Pattern Memory',
    slug: 'pattern-memory',
    description: 'Test your memory skills',
    category: 'memory',
    tags: ['pattern', 'grid', 'visual'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/pattern-memory.png',
    path: '/games/pattern-memory'
  },

  // Casual Games
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    slug: 'flappy-bird',
    description: 'Navigate through pipes',
    category: 'casual',
    tags: ['endless', 'tapping', 'bird'],
    difficulty: 'hard',
    avgPlayTime: 5,
    playerCount: '1',
    thumbnail: '/thumbnails/flappy-bird.png',
    path: '/games/flappy-bird'
  },
  {
    id: 'doodle-jump',
    name: 'Doodle Jump',
    slug: 'doodle-jump',
    description: 'Jump to new heights',
    category: 'casual',
    tags: ['endless', 'jumping', 'platforms'],
    difficulty: 'medium',
    avgPlayTime: 10,
    playerCount: '1',
    thumbnail: '/thumbnails/doodle-jump.png',
    path: '/games/doodle-jump'
  },
  {
    id: 'stack-tower',
    name: 'Stack Tower',
    slug: 'stack-tower',
    description: 'Build the tallest tower',
    category: 'casual',
    tags: ['stacking', 'timing', 'tower'],
    difficulty: 'medium',
    avgPlayTime: 5,
    playerCount: '1',
    thumbnail: '/thumbnails/stack-tower.png',
    path: '/games/stack-tower'
  },

  // Word Games
  {
    id: 'word-search',
    name: 'Word Search',
    slug: 'word-search',
    description: 'Find hidden words',
    category: 'word',
    tags: ['words', 'search', 'grid'],
    difficulty: 'easy',
    avgPlayTime: 15,
    playerCount: '1',
    thumbnail: '/thumbnails/word-search.png',
    path: '/games/word-search'
  },
  {
    id: 'crossword',
    name: 'Crossword',
    slug: 'crossword',
    description: 'Word puzzle challenges',
    category: 'word',
    tags: ['words', 'clues', 'grid'],
    difficulty: 'medium',
    avgPlayTime: 30,
    playerCount: '1',
    thumbnail: '/thumbnails/crossword.png',
    path: '/games/crossword'
  },

  // Note: mental-math not included in categories as requested to focus on the 32 games listed
]

// Category definitions
export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'quick',
    name: 'Quick Games',
    slug: 'quick',
    icon: '⚡',
    description: 'Fast games under 5 minutes',
    color: 'emerald',
    games: ALL_GAMES.filter(game => game.category === 'quick')
  },
  {
    id: 'puzzle',
    name: 'Puzzle Games',
    slug: 'puzzle',
    icon: '🧩',
    description: 'Brain-teasing puzzles and logic games',
    color: 'purple',
    games: ALL_GAMES.filter(game => game.category === 'puzzle')
  },
  {
    id: 'card',
    name: 'Card Games',
    slug: 'card',
    icon: '🃏',
    description: 'Classic card games and casino favorites',
    color: 'red',
    games: ALL_GAMES.filter(game => game.category === 'card')
  },
  {
    id: 'strategy',
    name: 'Strategy Games',
    slug: 'strategy',
    icon: '♟️',
    description: 'Think ahead and plan your moves',
    color: 'blue',
    games: ALL_GAMES.filter(game => game.category === 'strategy')
  },
  {
    id: 'arcade',
    name: 'Arcade Classics',
    slug: 'arcade',
    icon: '👾',
    description: 'Retro arcade games and classics',
    color: 'amber',
    games: ALL_GAMES.filter(game => game.category === 'arcade')
  },
  {
    id: 'skill',
    name: 'Skill & Reflex',
    slug: 'skill',
    icon: '🎯',
    description: 'Test your skills and reflexes',
    color: 'cyan',
    games: ALL_GAMES.filter(game => game.category === 'skill')
  },
  {
    id: 'memory',
    name: 'Memory Games',
    slug: 'memory',
    icon: '🧠',
    description: 'Challenge your memory and concentration',
    color: 'pink',
    games: ALL_GAMES.filter(game => game.category === 'memory')
  },
  {
    id: 'casual',
    name: 'Casual Games',
    slug: 'casual',
    icon: '🎮',
    description: 'Relaxing and easy-going games',
    color: 'orange',
    games: ALL_GAMES.filter(game => game.category === 'casual')
  },
  {
    id: 'word',
    name: 'Word Games',
    slug: 'word',
    icon: '📝',
    description: 'Word puzzles and language games',
    color: 'indigo',
    games: ALL_GAMES.filter(game => game.category === 'word')
  }
]

// Helper functions
export function getCategoryById(id: string): GameCategory | undefined {
  return GAME_CATEGORIES.find(category => category.id === id)
}

export function getGamesByCategory(categoryId: CategoryType): GameMetadata[] {
  const category = GAME_CATEGORIES.find(cat => cat.id === categoryId)
  return category?.games || []
}

export function getGameMetadata(gameId: string): GameMetadata | undefined {
  return ALL_GAMES.find(game => game.id === gameId)
}

export function searchGames(query: string): GameMetadata[] {
  const lowerQuery = query.toLowerCase()
  return ALL_GAMES.filter(game => 
    game.name.toLowerCase().includes(lowerQuery) ||
    game.description.toLowerCase().includes(lowerQuery) ||
    game.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export function getPopularGames(limit: number = 8): GameMetadata[] {
  // For now, return a selection of games from different categories
  // In production, this would be based on actual play counts
  const popular = [
    getGameMetadata('cps-test'),
    getGameMetadata('2048'),
    getGameMetadata('snake'),
    getGameMetadata('tetris'),
    getGameMetadata('pacman'),
    getGameMetadata('solitaire'),
    getGameMetadata('memory-match'),
    getGameMetadata('flappy-bird')
  ].filter(Boolean) as GameMetadata[]
  
  return popular.slice(0, limit)
}

export function getFeaturedGames(): GameMetadata[] {
  // Return a curated list of featured games
  return [
    getGameMetadata('2048'),
    getGameMetadata('pacman'),
    getGameMetadata('tetris'),
    getGameMetadata('snake')
  ].filter(Boolean) as GameMetadata[]
}

// Export all games for other uses
export const ALL_GAMES_DATA = ALL_GAMES