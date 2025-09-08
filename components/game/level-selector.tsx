'use client';

import { useState, useEffect } from 'react';
import { Lock, Star, Trophy, ChevronRight, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameLevel, UserLevelProgress, Difficulty } from '@/lib/types/levels';
import { levelService } from '@/lib/services/levels';
import { useAuth } from '@/hooks/use-auth';

interface LevelSelectorProps {
  gameId: string;
  gameName: string;
  onLevelSelect: (level: GameLevel) => void;
  currentLevel?: number;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-500',
  medium: 'bg-blue-500',
  hard: 'bg-amber-500',
  expert: 'bg-purple-500',
  master: 'bg-red-500'
};

const difficultyBadgeVariants: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  hard: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  expert: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  master: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function LevelSelector({ gameId, gameName, onLevelSelect, currentLevel = 1 }: LevelSelectorProps) {
  const { user } = useAuth();
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [progress, setProgress] = useState<UserLevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel);

  useEffect(() => {
    loadLevelData();
  }, [gameId, user]);

  const loadLevelData = async () => {
    setLoading(true);
    try {
      const gameLevels = await levelService.getGameLevels(gameId);
      setLevels(gameLevels);

      if (user) {
        const userProgress = await levelService.getUserProgress(user.id, gameId);
        setProgress(userProgress);
      } else {
        // Load local progress for guest users
        const localProgress = localStorage.getItem(`progress_${gameId}`);
        if (localProgress) {
          setProgress(JSON.parse(localProgress));
        }
      }
    } catch (error) {
      console.error('Error loading level data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLevelUnlocked = (levelNumber: number): boolean => {
    if (!progress) return levelNumber === 1;
    return progress.unlockedLevels.includes(levelNumber);
  };

  const getLevelStars = (levelNumber: number): number => {
    if (!progress) return 0;
    return progress.stars[levelNumber] || 0;
  };

  const getLevelScore = (levelNumber: number): number => {
    if (!progress) return 0;
    return progress.levelScores[levelNumber] || 0;
  };

  const calculateOverallProgress = (): number => {
    if (!progress || levels.length === 0) return 0;
    const completedLevels = Object.keys(progress.stars).length;
    return (completedLevels / levels.length) * 100;
  };

  const handleLevelSelect = (level: GameLevel) => {
    if (isLevelUnlocked(level.levelNumber)) {
      setSelectedLevel(level.levelNumber);
      onLevelSelect(level);
    }
  };

  const renderStars = (count: number, total = 3) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < count
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600'
            )}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{gameName} - Choose Your Challenge</CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Trophy className="h-4 w-4 mr-1" />
            {progress?.totalStars || 0} Stars
          </Badge>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium">{Math.round(calculateOverallProgress())}%</span>
          </div>
          <Progress value={calculateOverallProgress()} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {levels.map((level) => {
              const unlocked = isLevelUnlocked(level.levelNumber);
              const stars = getLevelStars(level.levelNumber);
              const score = getLevelScore(level.levelNumber);
              const isSelected = selectedLevel === level.levelNumber;

              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: level.levelNumber * 0.05 }}
                >
                  <Card
                    className={cn(
                      'relative cursor-pointer transition-all hover:shadow-lg',
                      unlocked ? 'hover:scale-105' : 'opacity-60',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => handleLevelSelect(level)}
                  >
                    <CardContent className="p-4">
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
                          <Lock className="h-8 w-8 text-white" />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">Level {level.levelNumber}</h3>
                          <p className="text-sm text-muted-foreground">{level.name}</p>
                        </div>
                        <Badge className={cn('ml-2', difficultyBadgeVariants[level.difficulty])}>
                          {level.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {stars > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stars:</span>
                            {renderStars(stars)}
                          </div>
                        )}
                        
                        {score > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Best:</span>
                            <span className="text-sm font-medium">{score.toLocaleString()}</span>
                          </div>
                        )}

                        {level.config.timeLimit && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{level.config.timeLimit}s</span>
                          </div>
                        )}

                        {level.config.target && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            <span>Target: {level.config.target}</span>
                          </div>
                        )}
                      </div>

                      {unlocked && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          variant={isSelected ? 'default' : 'outline'}
                        >
                          {isSelected ? 'Selected' : 'Play'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}

                      {!unlocked && level.unlockRequirement && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          <p className="text-xs text-center text-muted-foreground">
                            {level.unlockRequirement.type === 'stars' && 
                              `Need ${level.unlockRequirement.value} stars on Level ${level.unlockRequirement.previousLevel}`}
                            {level.unlockRequirement.type === 'score' && 
                              `Score ${level.unlockRequirement.value} to unlock`}
                            {level.unlockRequirement.type === 'completion' && 
                              `Complete Level ${level.unlockRequirement.previousLevel}`}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {levels.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No levels available for this game.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}