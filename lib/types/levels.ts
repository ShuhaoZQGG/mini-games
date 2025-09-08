export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export interface GameLevel {
  id: string;
  gameId: string;
  levelNumber: number;
  name: string;
  difficulty: Difficulty;
  config: Record<string, any>;
  unlockRequirement?: {
    type: 'score' | 'completion' | 'stars' | 'wins' | 'accuracy';
    value: number;
    previousLevel?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UserLevelProgress {
  id?: string;
  userId: string;
  gameId: string;
  currentLevel: number;
  unlockedLevels: number[];
  levelScores: Record<number, number>;
  stars: Record<number, 1 | 2 | 3>;
  completionTimes: Record<number, number>;
  totalStars: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LevelScore {
  gameId: string;
  levelNumber: number;
  score: number;
  stars?: 1 | 2 | 3;
  levelConfig?: Record<string, any>;
  timestamp: string;
}

export interface LevelUnlockResult {
  unlocked: boolean;
  level?: number;
  message: string;
}

export interface LevelLeaderboardEntry {
  gameId: string;
  levelNumber: number;
  levelName: string;
  difficulty: Difficulty;
  userId: string;
  username: string;
  avatarUrl?: string;
  bestScore: number;
  bestStars: number;
  firstPlayed: string;
  lastPlayed: string;
  playCount: number;
}

export interface StarCriteria {
  oneStar: number;
  twoStars: number;
  threeStars: number;
}

export interface LevelConfig {
  // CPS Test
  duration?: number;
  clickTarget?: number;
  mode?: string;
  target?: number;
  
  // Memory Match
  gridSize?: string;
  pairs?: number;
  timeLimit?: number | null;
  flipLimit?: number;
  
  // Snake
  speed?: number | string;
  obstacles?: boolean;
  mazeLayout?: number;
  portals?: boolean;
  
  // Typing Test
  wordType?: string;
  targetWPM?: number;
  
  // 2048
  targetTile?: number;
  
  // Sudoku
  hints?: number;
  
  // Reaction Time
  rounds?: number;
  minDelay?: number;
  maxDelay?: number;
  targetTime?: number;
  
  // Tic-Tac-Toe & Connect Four
  aiDifficulty?: string;
  boardSize?: number;
  columns?: number;
  rows?: number;
  winCondition?: number;
  connectTarget?: number;
  
  // Minesweeper
  width?: number;
  height?: number;
  mines?: number;
  
  // Word Search
  wordCount?: number;
  themed?: boolean;
  
  // Tetris
  startLevel?: number;
  ghostPiece?: boolean;
  endless?: boolean;
  
  // Aim Trainer
  targetCount?: number;
  targetSize?: string;
  movement?: boolean;
  
  // Breakout
  ballSpeed?: number;
  paddleSize?: string;
  multiBall?: boolean;
  
  // Mental Math
  operations?: string[];
  timePerQuestion?: number;
  
  // Solitaire
  drawCount?: number;
  scoring?: string;
  passes?: number;
  moveLimit?: number;
  
  // Simon Says
  startLength?: number;
  colors?: number;
  
  // Whack-a-Mole
  moleSpeed?: string;
  moleCount?: number;
  multiMole?: boolean;
}