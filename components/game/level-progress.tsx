'use client';

import { Star, Trophy, Zap, TrendingUp, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { UserLevelProgress, GameLevel } from '@/lib/types/levels';

interface LevelProgressProps {
  progress: UserLevelProgress;
  levels: GameLevel[];
  currentLevel: number;
  className?: string;
}

export function LevelProgress({ progress, levels, currentLevel, className }: LevelProgressProps) {
  const totalPossibleStars = levels.length * 3;
  const starsPercentage = (progress.totalStars / totalPossibleStars) * 100;
  const levelsCompleted = Object.keys(progress.stars).length;
  const completionPercentage = (levelsCompleted / levels.length) * 100;
  
  const currentLevelData = levels.find(l => l.levelNumber === currentLevel);
  const currentLevelStars = progress.stars[currentLevel] || 0;
  const currentLevelScore = progress.levelScores[currentLevel] || 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Overall Progress
              </h3>
              <Badge variant="outline" className="font-mono">
                {levelsCompleted}/{levels.length} Levels
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Stars Collected</span>
                  <span className="font-medium">{progress.totalStars}/{totalPossibleStars}</span>
                </div>
                <Progress 
                  value={starsPercentage} 
                  className="h-2"
                  style={{
                    background: 'linear-gradient(to right, #fbbf24, #f59e0b)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Current Level Stats */}
          {currentLevelData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Current Level
                </h3>
                <Badge className={cn(
                  'capitalize',
                  currentLevelData.difficulty === 'easy' && 'bg-green-100 text-green-800',
                  currentLevelData.difficulty === 'medium' && 'bg-blue-100 text-blue-800',
                  currentLevelData.difficulty === 'hard' && 'bg-amber-100 text-amber-800',
                  currentLevelData.difficulty === 'expert' && 'bg-purple-100 text-purple-800',
                  currentLevelData.difficulty === 'master' && 'bg-red-100 text-red-800'
                )}>
                  {currentLevelData.difficulty}
                </Badge>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Level {currentLevel}: {currentLevelData.name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-5 w-5',
                          i < currentLevelStars
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-300 text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                {currentLevelScore > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Best Score:</span>
                    <span className="font-mono">{currentLevelScore.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Level Completion Map */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              Level Map
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => {
                const stars = progress.stars[level.levelNumber] || 0;
                const unlocked = progress.unlockedLevels.includes(level.levelNumber);
                const isCurrent = level.levelNumber === currentLevel;
                
                return (
                  <div
                    key={level.id}
                    className={cn(
                      'relative w-12 h-12 rounded-lg flex items-center justify-center transition-all',
                      unlocked ? 'bg-primary/10' : 'bg-muted',
                      isCurrent && 'ring-2 ring-primary ring-offset-2',
                      stars > 0 && 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20'
                    )}
                  >
                    <span className={cn(
                      'font-bold text-sm',
                      unlocked ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {level.levelNumber}
                    </span>
                    
                    {stars > 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center">
                        <span className="text-xs font-bold">{stars}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Goal */}
          {currentLevel < levels.length && (
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Next Goal</span>
              </div>
              
              {currentLevelStars < 3 ? (
                <p className="text-sm text-muted-foreground">
                  Earn {3 - currentLevelStars} more star{3 - currentLevelStars !== 1 ? 's' : ''} on Level {currentLevel} to unlock bonus rewards!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete Level {currentLevel + 1} to continue your journey!
                </p>
              )}
            </div>
          )}

          {/* Achievement Badges */}
          <div className="flex flex-wrap gap-2">
            {levelsCompleted >= 5 && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                5 Levels Complete
              </Badge>
            )}
            {progress.totalStars >= 10 && (
              <Badge variant="secondary" className="gap-1">
                <Star className="h-3 w-3" />
                10 Stars Earned
              </Badge>
            )}
            {Object.values(progress.stars).filter(s => s === 3).length >= 3 && (
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                Perfect Player
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}