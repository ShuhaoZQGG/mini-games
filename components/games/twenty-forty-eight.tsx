'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TwentyFortyEightGame, Direction } from '@/lib/games/twenty-forty-eight';
import { GameState } from '@/lib/games/types';
import { cn } from '@/lib/utils';
import { ShareCard } from '@/components/social/share-card';

export function TwentyFortyEight() {
  const gameRef = useRef<TwentyFortyEightGame | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const updateGameDisplay = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    setGameState(game.getState());
    setGrid([...game.getGrid()]);
    setScore(game.getScore());
    setHighScore(game.getHighScore());
    setHasWon(game.hasWon());
    setCanUndo(game.canUndo());
    
    if (game.hasWon() && !showWinDialog) {
      setShowWinDialog(true);
    }
  }, [showWinDialog]);

  const handleMove = useCallback((direction: Direction) => {
    const game = gameRef.current;
    if (!game || game.getState() !== GameState.PLAYING) return;
    
    const moved = game.move(direction);
    if (moved) {
      updateGameDisplay();
    }
  }, [updateGameDisplay]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const directionMap: Record<string, Direction> = {
      'ArrowUp': 'UP',
      'ArrowDown': 'DOWN',
      'ArrowLeft': 'LEFT',
      'ArrowRight': 'RIGHT',
      'w': 'UP',
      's': 'DOWN',
      'a': 'LEFT',
      'd': 'RIGHT',
      'W': 'UP',
      'S': 'DOWN',
      'A': 'LEFT',
      'D': 'RIGHT'
    };

    if (directionMap[e.key]) {
      e.preventDefault();
      handleMove(directionMap[e.key]);
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      handleUndo();
    }
  }, [handleMove]);

  useEffect(() => {
    gameRef.current = new TwentyFortyEightGame();
    updateGameDisplay();

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, updateGameDisplay]);

  const handleStart = () => {
    if (!gameRef.current) return;
    gameRef.current.start();
    setShowWinDialog(false);
    updateGameDisplay();
  };

  const handleReset = () => {
    if (!gameRef.current) return;
    gameRef.current.reset();
    setShowWinDialog(false);
    updateGameDisplay();
  };

  const handleUndo = () => {
    if (!gameRef.current || !canUndo) return;
    gameRef.current.undo();
    updateGameDisplay();
  };

  const handleContinue = () => {
    if (!gameRef.current) return;
    gameRef.current.continueAfterWin();
    setShowWinDialog(false);
  };

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        handleMove(deltaX > 0 ? 'RIGHT' : 'LEFT');
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        handleMove(deltaY > 0 ? 'DOWN' : 'UP');
      }
    }
    
    setTouchStart(null);
  };

  const getTileColor = (value: number): string => {
    const colors: Record<number, string> = {
      0: 'bg-gray-200',
      2: 'bg-gray-300',
      4: 'bg-gray-400',
      8: 'bg-orange-300',
      16: 'bg-orange-400',
      32: 'bg-orange-500',
      64: 'bg-orange-600',
      128: 'bg-yellow-300',
      256: 'bg-yellow-400',
      512: 'bg-yellow-500',
      1024: 'bg-yellow-600',
      2048: 'bg-green-500',
    };
    return colors[value] || 'bg-purple-500';
  };

  const getTileTextColor = (value: number): string => {
    return value >= 8 ? 'text-white' : 'text-gray-700';
  };

  const getTileTextSize = (value: number): string => {
    if (value >= 1024) return 'text-2xl';
    if (value >= 128) return 'text-3xl';
    return 'text-4xl';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>2048</CardTitle>
        <CardDescription>
          Join the tiles to reach 2048! Use arrow keys or WASD to move tiles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <span className="font-semibold">Score: {score}</span>
            <span className="text-muted-foreground">Best: {highScore}</span>
          </div>
          <div className="space-x-2">
            {gameState === GameState.READY && (
              <Button onClick={handleStart}>New Game</Button>
            )}
            {gameState === GameState.PLAYING && (
              <>
                <Button onClick={handleReset}>New Game</Button>
                <Button 
                  variant="outline" 
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  Undo (Z)
                </Button>
              </>
            )}
            {gameState === GameState.GAME_OVER && (
              <Button onClick={handleStart}>Try Again</Button>
            )}
          </div>
        </div>

        {showWinDialog && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Congratulations!</strong>
            <span className="block sm:inline"> You&apos;ve reached 2048!</span>
            <div className="mt-2 space-x-2">
              <Button size="sm" onClick={handleContinue}>Continue Playing</Button>
              <Button size="sm" variant="outline" onClick={handleReset}>New Game</Button>
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Game Over!</strong>
              <span className="block sm:inline"> No more moves available.</span>
            </div>
            <ShareCard
              gameTitle="2048"
              gameSlug="2048"
              score={score}
            />
          </>
        )}

        <div 
          className="bg-gray-300 p-2 rounded-lg touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    'aspect-square flex items-center justify-center rounded font-bold transition-all duration-150',
                    getTileColor(cell),
                    getTileTextColor(cell),
                    getTileTextSize(cell)
                  )}
                >
                  {cell > 0 && cell}
                </div>
              ))
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Desktop: Arrow keys or WASD to move, Z to undo</p>
          <p>Mobile: Swipe to move tiles</p>
        </div>
      </CardContent>
    </Card>
  );
}