import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { 
  GameLevel, 
  UserLevelProgress, 
  LevelScore, 
  LevelUnlockResult,
  StarCriteria 
} from '@/lib/types/levels';

export class LevelService {
  private supabase = createClientComponentClient();

  async getGameLevels(gameId: string): Promise<GameLevel[]> {
    try {
      const { data, error } = await this.supabase
        .from('game_levels')
        .select('*')
        .eq('game_id', gameId)
        .order('level_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game levels:', error);
      // Return default levels if database fails
      return this.getDefaultLevels(gameId);
    }
  }

  async getUserProgress(userId: string, gameId: string): Promise<UserLevelProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_level_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Initialize progress if not exists
      if (!data) {
        return await this.initializeUserProgress(userId, gameId);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Return default progress for guest users
      return this.getDefaultProgress(gameId);
    }
  }

  async initializeUserProgress(userId: string, gameId: string): Promise<UserLevelProgress> {
    const defaultProgress: Partial<UserLevelProgress> = {
      userId,
      gameId,
      currentLevel: 1,
      unlockedLevels: [1],
      levelScores: {},
      stars: {},
      completionTimes: {},
      totalStars: 0
    };

    try {
      const { data, error } = await this.supabase
        .from('user_level_progress')
        .insert(defaultProgress)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing user progress:', error);
      return defaultProgress as UserLevelProgress;
    }
  }

  async saveScore(score: LevelScore, userId?: string): Promise<LevelUnlockResult | null> {
    if (!userId) {
      // Save to localStorage for guest users
      this.saveLocalScore(score);
      return null;
    }

    try {
      // Save score to database
      const { error: scoreError } = await this.supabase
        .from('game_scores')
        .insert({
          user_id: userId,
          game_id: score.gameId,
          score: score.score,
          level_number: score.levelNumber,
          stars: score.stars,
          level_config: score.levelConfig
        });

      if (scoreError) throw scoreError;

      // Update user progress
      const progress = await this.getUserProgress(userId, score.gameId);
      if (!progress) return null;

      const updatedProgress = { ...progress };
      
      // Update level scores
      const currentBest = updatedProgress.levelScores[score.levelNumber] || 0;
      if (score.score > currentBest) {
        updatedProgress.levelScores[score.levelNumber] = score.score;
      }

      // Update stars
      if (score.stars) {
        const currentStars = updatedProgress.stars[score.levelNumber] || 0;
        if (score.stars > currentStars) {
          updatedProgress.stars[score.levelNumber] = score.stars;
          updatedProgress.totalStars = Object.values(updatedProgress.stars)
            .reduce((sum, s) => sum + (s as number), 0);
        }
      }

      // Save updated progress
      const { error: progressError } = await this.supabase
        .from('user_level_progress')
        .update({
          level_scores: updatedProgress.levelScores,
          stars: updatedProgress.stars,
          total_stars: updatedProgress.totalStars
        })
        .eq('user_id', userId)
        .eq('game_id', score.gameId);

      if (progressError) throw progressError;

      // Check for level unlocks
      return await this.checkLevelUnlock(userId, score.gameId, score.levelNumber, score.score, score.stars || 0);
    } catch (error) {
      console.error('Error saving score:', error);
      return null;
    }
  }

  async checkLevelUnlock(
    userId: string, 
    gameId: string, 
    levelNumber: number, 
    score: number, 
    stars: number
  ): Promise<LevelUnlockResult> {
    try {
      const { data, error } = await this.supabase
        .rpc('check_level_unlock', {
          p_user_id: userId,
          p_game_id: gameId,
          p_level_number: levelNumber,
          p_score: score,
          p_stars: stars
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking level unlock:', error);
      return { unlocked: false, message: 'Error checking unlock status' };
    }
  }

  calculateStars(score: number, criteria: StarCriteria): 1 | 2 | 3 | 0 {
    if (score >= criteria.threeStars) return 3;
    if (score >= criteria.twoStars) return 2;
    if (score >= criteria.oneStar) return 1;
    return 0;
  }

  getStarCriteria(gameId: string, levelNumber: number): StarCriteria {
    // Define star criteria for each game and level
    const criteria: Record<string, Record<number, StarCriteria>> = {
      'cps-test': {
        1: { oneStar: 20, twoStars: 30, threeStars: 40 },
        2: { oneStar: 50, twoStars: 70, threeStars: 90 },
        3: { oneStar: 150, twoStars: 200, threeStars: 250 },
        4: { oneStar: 300, twoStars: 400, threeStars: 500 },
        5: { oneStar: 15, twoStars: 12, threeStars: 10 } // Time-based
      },
      'memory-match': {
        1: { oneStar: 100, twoStars: 200, threeStars: 300 },
        2: { oneStar: 200, twoStars: 400, threeStars: 600 },
        3: { oneStar: 300, twoStars: 600, threeStars: 900 },
        4: { oneStar: 400, twoStars: 800, threeStars: 1200 },
        5: { oneStar: 500, twoStars: 1000, threeStars: 1500 }
      },
      'snake': {
        1: { oneStar: 500, twoStars: 1000, threeStars: 2000 },
        2: { oneStar: 750, twoStars: 1500, threeStars: 3000 },
        3: { oneStar: 1000, twoStars: 2000, threeStars: 4000 },
        4: { oneStar: 1500, twoStars: 3000, threeStars: 5000 },
        5: { oneStar: 2000, twoStars: 4000, threeStars: 6000 }
      },
      'typing-test': {
        1: { oneStar: 25, twoStars: 35, threeStars: 45 },
        2: { oneStar: 40, twoStars: 55, threeStars: 70 },
        3: { oneStar: 55, twoStars: 75, threeStars: 95 },
        4: { oneStar: 70, twoStars: 95, threeStars: 120 },
        5: { oneStar: 50, twoStars: 65, threeStars: 80 }
      }
      // Add more games as needed
    };

    return criteria[gameId]?.[levelNumber] || { oneStar: 100, twoStars: 200, threeStars: 300 };
  }

  private saveLocalScore(score: LevelScore): void {
    const key = `level_scores_${score.gameId}`;
    const existingScores = this.getLocalScores(score.gameId);
    existingScores.push(score);
    
    // Keep only last 100 scores per game
    if (existingScores.length > 100) {
      existingScores.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(existingScores));
  }

  private getLocalScores(gameId: string): LevelScore[] {
    const key = `level_scores_${gameId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  private getDefaultLevels(gameId: string): GameLevel[] {
    // Return basic level structure for offline mode
    return [
      {
        id: '1',
        gameId,
        levelNumber: 1,
        name: 'Level 1',
        difficulty: 'easy',
        config: {}
      },
      {
        id: '2',
        gameId,
        levelNumber: 2,
        name: 'Level 2',
        difficulty: 'medium',
        config: {},
        unlockRequirement: { type: 'completion', value: 1, previousLevel: 1 }
      },
      {
        id: '3',
        gameId,
        levelNumber: 3,
        name: 'Level 3',
        difficulty: 'hard',
        config: {},
        unlockRequirement: { type: 'stars', value: 2, previousLevel: 2 }
      }
    ];
  }

  private getDefaultProgress(gameId: string): UserLevelProgress {
    // Return basic progress for guest users
    return {
      userId: 'guest',
      gameId,
      currentLevel: 1,
      unlockedLevels: [1],
      levelScores: {},
      stars: {},
      completionTimes: {},
      totalStars: 0
    };
  }

  async getLevelLeaderboard(gameId: string, levelNumber: number, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('level_leaderboards')
        .select('*')
        .eq('game_id', gameId)
        .eq('level_number', levelNumber)
        .order('best_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching level leaderboard:', error);
      return [];
    }
  }
}

export const levelService = new LevelService();