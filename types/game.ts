export interface GameLevel {
  id: number
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  config: any
}

export interface GameScore {
  score: number
  level: number
  streak?: number
  highScore?: number
  timestamp?: number
}

export interface GameStats {
  gamesPlayed: number
  totalScore: number
  bestScore: number
  averageScore: number
  winRate?: number
}