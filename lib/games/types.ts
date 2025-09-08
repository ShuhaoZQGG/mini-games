export interface Game {
  id: string
  name: string
  slug: string
  description: string
  category: GameCategory
  instructions: string
  thumbnail?: string
  minPlayers: number
  maxPlayers: number
}

export enum GameCategory {
  SPEED = 'speed',
  PUZZLE = 'puzzle',
  STRATEGY = 'strategy',
  CARD = 'card',
  TYPING = 'typing',
  MATH = 'math',
  CASUAL = 'casual',
}

export interface GameScore {
  id: string
  userId?: string
  gameId: string
  score: number
  timestamp: Date
  metadata?: Record<string, any>
}

export enum GameState {
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

export interface GameStatus {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  startTime?: Date
  endTime?: Date
}

export interface LeaderboardEntry {
  rank: number
  userId?: string
  username: string
  score: number
  timestamp: Date
}