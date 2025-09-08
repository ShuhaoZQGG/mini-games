'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SnakeGame, Direction } from '@/lib/games/snake';
import { GameState } from '@/lib/games/types';
import { ShareCard } from '@/components/social/share-card';

export function Snake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SnakeGame | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const CELL_SIZE = 20;
  const GRID_WIDTH = 20;
  const GRID_HEIGHT = 20;
  const CANVAS_WIDTH = GRID_WIDTH * CELL_SIZE;
  const CANVAS_HEIGHT = GRID_HEIGHT * CELL_SIZE;

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const game = gameRef.current;
    
    if (!canvas || !ctx || !game) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_WIDTH; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    const food = game.getFood();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );

    // Draw snake
    const snake = game.getSnake();
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#22c55e';
      } else {
        // Body
        ctx.fillStyle = '#16a34a';
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 2,
        segment.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });

    // Draw game over overlay
    if (game.getState() === GameState.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      
      ctx.font = '16px sans-serif';
      ctx.fillText(`Score: ${game.getScore()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }

    // Draw pause overlay
    if (game.getState() === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Paused', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, []);

  const gameLoop = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    setGameState(game.getState());
    setScore(game.getScore());
    setHighScore(game.getHighScore());
    drawGame();

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [drawGame]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const game = gameRef.current;
    if (!game) return;

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
      game.changeDirection(directionMap[e.key]);
    } else if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      if (game.getState() === GameState.PLAYING) {
        game.pause();
      } else if (game.getState() === GameState.PAUSED) {
        game.resume();
      }
    }
  }, []);

  useEffect(() => {
    gameRef.current = new SnakeGame();
    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameRef.current) {
        gameRef.current.cleanup();
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleStart = () => {
    if (!gameRef.current) return;
    gameRef.current.reset();
    gameRef.current.start();
  };

  const handlePauseResume = () => {
    if (!gameRef.current) return;
    if (gameState === GameState.PLAYING) {
      gameRef.current.pause();
    } else if (gameState === GameState.PAUSED) {
      gameRef.current.resume();
    }
  };

  const handleReset = () => {
    if (!gameRef.current) return;
    gameRef.current.reset();
  };

  // Touch controls for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !gameRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          gameRef.current.changeDirection('RIGHT');
        } else {
          gameRef.current.changeDirection('LEFT');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          gameRef.current.changeDirection('DOWN');
        } else {
          gameRef.current.changeDirection('UP');
        }
      }
    }
    
    setTouchStart(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Snake Game</CardTitle>
        <CardDescription>
          Use arrow keys or WASD to control the snake. Press Space or Escape to pause.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-4">
            <span className="font-semibold">Score: {score}</span>
            <span className="text-muted-foreground">High Score: {highScore}</span>
          </div>
          <div className="space-x-2">
            {gameState === GameState.READY && (
              <Button onClick={handleStart}>Start Game</Button>
            )}
            {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
              <>
                <Button onClick={handlePauseResume}>
                  {gameState === GameState.PLAYING ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="outline" onClick={handleReset}>Reset</Button>
              </>
            )}
            {gameState === GameState.GAME_OVER && (
              <>
                <ShareCard
                  gameTitle="Snake"
                  gameSlug="snake"
                  score={score}
                />
                <Button onClick={handleStart}>Play Again</Button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-border rounded-lg touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p className="mb-2">Desktop: Arrow keys or WASD to move</p>
          <p>Mobile: Swipe to change direction</p>
        </div>
      </CardContent>
    </Card>
  );
}