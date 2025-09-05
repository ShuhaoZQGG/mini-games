'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SnakeGame, Direction } from '@/lib/games/snake';
import { GameState } from '@/lib/games/types';
import { scoreService } from '@/lib/services/scores';
import { useGameEvents, broadcastGameEvent } from '@/components/game-events';
import RealtimeLeaderboard from '@/components/realtime-leaderboard';
import { PresenceIndicator } from '@/components/presence-indicator';
import { GameEvents } from '@/components/game-events';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Trophy, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function SnakeWithRealtime() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SnakeGame | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastSubmittedScore, setLastSubmittedScore] = useState<number | null>(null);
  
  // Real-time features
  const { events, broadcast } = useGameEvents('snake');

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

    // Draw food with pulsing effect
    const food = game.getFood();
    const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
    ctx.fillStyle = '#ef4444';
    ctx.globalAlpha = pulse;
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
    ctx.globalAlpha = 1;

    // Draw snake with gradient
    const snake = game.getSnake();
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Head with gradient
        const gradient = ctx.createLinearGradient(
          segment.x * CELL_SIZE,
          segment.y * CELL_SIZE,
          segment.x * CELL_SIZE + CELL_SIZE,
          segment.y * CELL_SIZE + CELL_SIZE
        );
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, '#16a34a');
        ctx.fillStyle = gradient;
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
      ctx.fillText('Press Space to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
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
      ctx.font = '14px sans-serif';
      ctx.fillText('Press Space to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    }
  }, []);

  const gameLoop = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    const currentState = game.getState();
    const currentScore = game.getScore();

    setGameState(currentState);
    setScore(currentScore);
    setHighScore(game.getHighScore());
    drawGame();

    // Check for game over and submit score
    if (currentState === GameState.GAME_OVER && currentScore > 0 && currentScore !== lastSubmittedScore) {
      submitScore(currentScore);
      setLastSubmittedScore(currentScore);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [drawGame, lastSubmittedScore]);

  const submitScore = async (finalScore: number) => {
    const result = await scoreService.saveScore('snake', finalScore, {
      duration: Date.now(),
      difficulty: 'normal'
    });

    if (result.success) {
      toast.success(`Score submitted: ${finalScore} points!`);
      
      // Broadcast game ended event
      broadcast('game_ended', { score: finalScore });
    }
  };

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
      } else if (game.getState() === GameState.GAME_OVER) {
        handleRestart();
      }
    }
  }, []);

  useEffect(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('snake_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleStart = () => {
    if (!canvasRef.current) return;

    gameRef.current = new SnakeGame();
    gameRef.current.start();
    setLastSubmittedScore(null);
    
    // Broadcast game started event
    broadcast('game_started', null);
    
    gameLoop();
  };

  const handlePause = () => {
    if (gameRef.current && gameState === GameState.PLAYING) {
      gameRef.current.pause();
    }
  };

  const handleResume = () => {
    if (gameRef.current && gameState === GameState.PAUSED) {
      gameRef.current.resume();
    }
  };

  const handleRestart = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    handleStart();
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Snake Game</h1>
        <p className="text-muted-foreground">
          Real-time leaderboard • Live players • Instant updates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Game Board</span>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    Score: <span className="font-bold text-lg">{score}</span>
                  </div>
                  <div className="text-sm">
                    Best: <span className="font-bold text-lg">{highScore}</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                Use arrow keys or WASD to control the snake
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border-2 border-gray-700 rounded-lg shadow-lg"
                />
                
                <div className="flex gap-2">
                  {gameState === GameState.READY && (
                    <Button onClick={handleStart} size="lg">
                      <Play className="mr-2 h-4 w-4" />
                      Start Game
                    </Button>
                  )}
                  {gameState === GameState.PLAYING && (
                    <Button onClick={handlePause} variant="secondary">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  {gameState === GameState.PAUSED && (
                    <Button onClick={handleResume}>
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
                    <Button onClick={handleRestart} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  )}
                  {gameState === GameState.GAME_OVER && (
                    <Button onClick={handleRestart} size="lg">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Play Again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Events Feed */}
          <GameEvents gameId="snake" variant="feed" maxEvents={5} />
        </div>

        {/* Sidebar with Real-time Features */}
        <div className="space-y-4">
          {/* Presence Indicator */}
          <PresenceIndicator gameId="snake" variant="compact" />

          {/* Real-time Leaderboard */}
          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leaderboard">
                <Trophy className="w-4 h-4 mr-1" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Zap className="w-4 h-4 mr-1" />
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard">
              <RealtimeLeaderboard 
                gameId="snake" 
                gameName="Snake"
                formatScore={(s) => s.toLocaleString()}
                showPresence={false}
              />
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <GameEvents gameId="snake" variant="minimal" maxEvents={10} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Toast notifications for game events */}
      <GameEvents gameId="snake" variant="toast" position="top-right" />
    </div>
  );
}