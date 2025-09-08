'use client';

import { useState, useEffect, useRef } from 'react';
import { CPSTestGame } from '@/lib/games/cps-test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShareCard } from '@/components/social/share-card';
import { LevelSelector } from '@/components/game/level-selector';
import { LevelProgress } from '@/components/game/level-progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { levelService } from '@/lib/services/levels';
import { useAuth } from '@/hooks/use-auth';
import type { GameLevel, UserLevelProgress } from '@/lib/types/levels';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function CPSTestWithLevels() {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [progress, setProgress] = useState<UserLevelProgress | null>(null);
  const [game, setGame] = useState<CPSTestGame | null>(null);
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCPS, setFinalCPS] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const clickAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLevelData();
  }, [user]);

  useEffect(() => {
    if (selectedLevel) {
      initializeGame(selectedLevel);
    }
  }, [selectedLevel]);

  const loadLevelData = async () => {
    const gameLevels = await levelService.getGameLevels('cps-test');
    setLevels(gameLevels);
    
    if (user) {
      const userProgress = await levelService.getUserProgress(user.id, 'cps-test');
      setProgress(userProgress);
    }
  };

  const initializeGame = (level: GameLevel) => {
    const config = level.config;
    const duration = config.duration ? config.duration * 1000 : 10000;
    const newGame = new CPSTestGame(duration);
    
    newGame.setUpdateCallback((clicks, timeLeft) => {
      setClicks(clicks);
      setTimeLeft(timeLeft);
    });

    newGame.setCompleteCallback(async (cps) => {
      const score = config.clickTarget ? clicks : cps;
      setFinalScore(score);
      setFinalCPS(cps);
      setIsGameOver(true);
      setIsPlaying(false);
      
      if (score > highScore) {
        setHighScore(score);
      }

      // Calculate stars
      const criteria = levelService.getStarCriteria('cps-test', level.levelNumber);
      const stars = levelService.calculateStars(score, criteria);
      setEarnedStars(stars);

      // Save score and check for unlocks
      if (user) {
        const unlockResult = await levelService.saveScore({
          gameId: 'cps-test',
          levelNumber: level.levelNumber,
          score,
          stars: stars > 0 ? stars as (1 | 2 | 3) : undefined,
          levelConfig: config,
          timestamp: new Date().toISOString()
        }, user.id);

        if (unlockResult?.unlocked) {
          setShowUnlock(true);
          setUnlockMessage(unlockResult.message);
          setTimeout(() => setShowUnlock(false), 5000);
          // Reload progress
          loadLevelData();
        }
      }
    });

    setGame(newGame);
    setTimeLeft(duration);
  };

  const handleStart = () => {
    if (!game || !selectedLevel) return;
    
    setClicks(0);
    setTimeLeft(selectedLevel.config.duration ? selectedLevel.config.duration * 1000 : 10000);
    setIsGameOver(false);
    setIsPlaying(true);
    setFinalScore(0);
    setFinalCPS(0);
    setEarnedStars(0);
    game.start();
  };

  const handleClick = () => {
    if (isPlaying && !isGameOver && game) {
      game.handleInput('click');
    }
  };

  const handleReset = () => {
    if (!game || !selectedLevel) return;
    
    game.reset();
    setClicks(0);
    setTimeLeft(selectedLevel.config.duration ? selectedLevel.config.duration * 1000 : 10000);
    setIsPlaying(false);
    setIsGameOver(false);
    setFinalScore(0);
    setFinalCPS(0);
    setEarnedStars(0);
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1);
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1 justify-center">
        {Array.from({ length: 3 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-8 w-8 transition-all',
              i < count
                ? 'fill-yellow-400 text-yellow-400 animate-pulse'
                : 'fill-gray-300 text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const currentCPS = isPlaying && game ? game.getCPS() : finalCPS;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Tabs defaultValue="play" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="levels">Choose Level</TabsTrigger>
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="levels">
          <LevelSelector
            gameId="cps-test"
            gameName="CPS Test"
            onLevelSelect={setSelectedLevel}
            currentLevel={selectedLevel?.levelNumber}
          />
        </TabsContent>

        <TabsContent value="play">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl">CPS Test</CardTitle>
                {selectedLevel && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Level {selectedLevel.levelNumber}</Badge>
                    <Badge className={cn(
                      selectedLevel.difficulty === 'easy' && 'bg-green-500',
                      selectedLevel.difficulty === 'medium' && 'bg-blue-500',
                      selectedLevel.difficulty === 'hard' && 'bg-amber-500',
                      selectedLevel.difficulty === 'expert' && 'bg-purple-500',
                      selectedLevel.difficulty === 'master' && 'bg-red-500'
                    )}>
                      {selectedLevel.name}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedLevel ? (
                <div className="text-center py-8">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground mb-4">Please select a level to start playing</p>
                  <Button onClick={() => (document.querySelector('[value="levels"]') as HTMLElement)?.click()}>
                    Choose Level
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedLevel.config.clickTarget ? 'Clicks' : 'Clicks'}
                      </p>
                      <p className="text-2xl font-bold">{clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedLevel.config.clickTarget ? 'Target' : 'Time Left'}
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedLevel.config.clickTarget 
                          ? selectedLevel.config.clickTarget 
                          : `${formatTime(timeLeft)}s`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CPS</p>
                      <p className="text-2xl font-bold">{currentCPS}</p>
                    </div>
                  </div>

                  <div
                    ref={clickAreaRef}
                    className={cn(
                      'relative h-64 md:h-96 rounded-lg flex items-center justify-center cursor-pointer',
                      'transition-all duration-200 select-none',
                      isPlaying && !isGameOver 
                        ? 'bg-primary hover:bg-primary/90 active:scale-95' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                    onClick={handleClick}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {!isPlaying && !isGameOver && (
                      <div className="text-center">
                        <p className="text-xl mb-4">Click Start to begin</p>
                        <Button onClick={handleStart} size="lg">
                          Start Test
                        </Button>
                      </div>
                    )}
                    
                    {isPlaying && !isGameOver && (
                      <div className="text-white text-center">
                        <p className="text-4xl font-bold mb-2">Click here!</p>
                        <p className="text-xl">As fast as you can</p>
                      </div>
                    )}
                    
                    {isGameOver && (
                      <div className="text-center">
                        <p className="text-2xl mb-2">Game Over!</p>
                        {earnedStars > 0 && renderStars(earnedStars)}
                        <p className="text-4xl font-bold my-4">{finalCPS} CPS</p>
                        {selectedLevel.config.clickTarget && (
                          <p className="text-lg mb-2">Time: {formatTime(10000 - timeLeft)}s</p>
                        )}
                        <p className="text-lg mb-4">High Score: {highScore}</p>
                        <div className="space-x-4">
                          <Button onClick={handleStart} size="lg">
                            Try Again
                          </Button>
                          <Button onClick={handleReset} variant="outline" size="lg">
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedLevel && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Level Goals:</h3>
                      <div className="space-y-2 text-sm">
                        {selectedLevel.config.duration && (
                          <p>• Duration: {selectedLevel.config.duration} seconds</p>
                        )}
                        {selectedLevel.config.clickTarget && (
                          <p>• Click {selectedLevel.config.clickTarget} times as fast as possible</p>
                        )}
                        {selectedLevel.config.target && (
                          <div className="flex items-center gap-4">
                            <span>• Star Targets:</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">⭐ {Math.round(selectedLevel.config.target * 0.6)}</Badge>
                              <Badge variant="outline">⭐⭐ {Math.round(selectedLevel.config.target * 0.8)}</Badge>
                              <Badge variant="outline">⭐⭐⭐ {selectedLevel.config.target}</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isGameOver && finalCPS > 0 && (
                    <ShareCard
                      gameTitle="CPS Test"
                      gameSlug="cps-test"
                      score={finalScore}
                      level={selectedLevel.levelNumber}
                      achievement={
                        earnedStars === 3 ? 'Perfect Score!' : 
                        earnedStars === 2 ? 'Great Performance!' : 
                        earnedStars === 1 ? 'Good Job!' : undefined
                      }
                      showPreview={false}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          {progress && levels.length > 0 ? (
            <LevelProgress
              progress={progress}
              levels={levels}
              currentLevel={selectedLevel?.levelNumber || 1}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  {user ? 'Loading progress...' : 'Sign in to track your progress'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Level Unlock Notification */}
      <AnimatePresence>
        {showUnlock && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <p className="font-medium">{unlockMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}