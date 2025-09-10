// Type definitions for game categorization system

export type CategoryType = 
  | 'quick'
  | 'puzzle'
  | 'card'
  | 'strategy'
  | 'arcade'
  | 'skill'
  | 'memory'
  | 'casual'
  | 'word'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type PlayerCount = '1' | '2' | '2+'

export interface GameCategory {
  id: CategoryType
  name: string
  slug: string
  icon: string
  description: string
  color: string
  games: GameMetadata[]
}

export interface GameMetadata {
  id: string
  name: string
  slug: string
  description: string
  category: CategoryType
  tags: string[]
  difficulty: DifficultyLevel
  avgPlayTime: number // in minutes
  playerCount: PlayerCount
  thumbnail: string
  path: string
  rating?: number // optional rating out of 5
  playCount?: number // optional play count for popularity
  featured?: boolean // optional featured flag
}

export interface CategoryFilter {
  categories?: CategoryType[]
  difficulty?: DifficultyLevel[]
  playerCount?: PlayerCount[]
  minPlayTime?: number
  maxPlayTime?: number
  tags?: string[]
  searchQuery?: string
}

export interface GameStats {
  totalGames: number
  categoryBreakdown: Record<CategoryType, number>
  difficultyBreakdown: Record<DifficultyLevel, number>
  averagePlayTime: number
  totalPlayCount: number
}