'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle, Pause, RotateCcw, Trophy, Zap } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  id: number;
}

interface Block {
  x: number;
  y: number;
  value: number;
  width: number;
  height: number;
  id: number;
  color: string;
}

export default function BallBlast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [cannonAngle, setCannonAngle] = useState(0);
  const [power, setPower] = useState(1);
  
  const { updateScore } = useGameStore();
  
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const BLOCK_WIDTH = 60;
  const BLOCK_HEIGHT = 30;
  const BALL_RADIUS = 5;
  const GRAVITY = 0.2;

  const generateBlocks = useCallback((level: number) => {
    const newBlocks: Block[] = [];
    const rows = Math.min(3 + Math.floor(level / 3), 8);
    const cols = 10;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.3) {
          const value = Math.ceil(Math.random() * (level * 2 + 5));
          const hue = (value * 10) % 360;
          newBlocks.push({
            x: col * (BLOCK_WIDTH + 10) + 50,
            y: row * (BLOCK_HEIGHT + 10) + 50,
            value,
            width: BLOCK_WIDTH,
            height: BLOCK_HEIGHT,
            id: row * cols + col,
            color: `hsl(${hue}, 70%, 50%)`
          });
        }
      }
    }
    return newBlocks;
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setIsPlaying(true);
    setIsPaused(false);
    setGameOver(false);
    setBalls([]);
    setBlocks(generateBlocks(1));
    setPower(1);
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      updateScore('ball-blast', score);
    }
  };

  const shootBall = () => {
    if (!isPlaying || isPaused) return;
    
    const speed = 10 + power * 5;
    const angleRad = (cannonAngle - 90) * Math.PI / 180;
    
    const newBall: Ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      vx: Math.cos(angleRad) * speed,
      vy: Math.sin(angleRad) * speed,
      id: Date.now()
    };
    
    setBalls(prev => [...prev, newBall]);
  };

  const updateGame = useCallback(() => {
    if (!canvasRef.current || !isPlaying || isPaused) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update and draw balls
    setBalls(prevBalls => {
      const updatedBalls = prevBalls.map(ball => {
        let newBall = { ...ball };
        newBall.vy += GRAVITY;
        newBall.x += newBall.vx;
        newBall.y += newBall.vy;
        
        // Bounce off walls
        if (newBall.x <= BALL_RADIUS || newBall.x >= CANVAS_WIDTH - BALL_RADIUS) {
          newBall.vx *= -0.8;
          newBall.x = newBall.x <= BALL_RADIUS ? BALL_RADIUS : CANVAS_WIDTH - BALL_RADIUS;
        }
        
        // Bounce off ceiling
        if (newBall.y <= BALL_RADIUS) {
          newBall.vy *= -0.8;
          newBall.y = BALL_RADIUS;
        }
        
        return newBall;
      }).filter(ball => ball.y < CANVAS_HEIGHT + 50);
      
      // Draw balls
      updatedBalls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
      
      return updatedBalls;
    });
    
    // Check collisions and draw blocks
    setBlocks(prevBlocks => {
      const updatedBlocks = [...prevBlocks];
      
      balls.forEach(ball => {
        updatedBlocks.forEach((block, index) => {
          if (
            ball.x + BALL_RADIUS > block.x &&
            ball.x - BALL_RADIUS < block.x + block.width &&
            ball.y + BALL_RADIUS > block.y &&
            ball.y - BALL_RADIUS < block.y + block.height
          ) {
            updatedBlocks[index] = { ...block, value: block.value - 1 };
            setScore(prev => prev + 10);
            
            // Bounce ball
            setBalls(prevBalls => 
              prevBalls.map(b => 
                b.id === ball.id 
                  ? { ...b, vy: -Math.abs(b.vy) * 0.8 }
                  : b
              )
            );
          }
        });
      });
      
      const remainingBlocks = updatedBlocks.filter(block => block.value > 0);
      
      // Draw blocks
      remainingBlocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // Draw block value
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          block.value.toString(),
          block.x + block.width / 2,
          block.y + block.height / 2
        );
      });
      
      // Check for level completion
      if (remainingBlocks.length === 0 && isPlaying) {
        setLevel(prev => prev + 1);
        setPower(prev => Math.min(prev + 0.5, 5));
        return generateBlocks(level + 1);
      }
      
      // Check if any block reached bottom
      if (remainingBlocks.some(block => block.y + block.height > CANVAS_HEIGHT - 100)) {
        endGame();
      }
      
      return remainingBlocks;
    });
    
    // Draw cannon
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    ctx.rotate(cannonAngle * Math.PI / 180);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(-10, -40, 20, 40);
    ctx.restore();
    
    // Draw cannon base
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#2d3748';
    ctx.fill();
    
    // Draw power indicator
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(20, CANVAS_HEIGHT - 30, power * 30, 10);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(20, CANVAS_HEIGHT - 30, 150, 10);
    
    animationRef.current = requestAnimationFrame(updateGame);
  }, [isPlaying, isPaused, balls, blocks, cannonAngle, power, level, generateBlocks, endGame]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused) {
      animationRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateGame, isPlaying, isPaused]);

  // Handle mouse movement for cannon angle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !isPlaying) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const angle = Math.atan2(y - (CANVAS_HEIGHT - 50), x - (CANVAS_WIDTH / 2));
      setCannonAngle(angle * 180 / Math.PI);
    };
    
    if (isPlaying) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPlaying]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('ballBlastHighScore');
    if (saved) setHighScore(Number(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('ballBlastHighScore', highScore.toString());
    }
  }, [highScore]);

  return (
    <Card className="max-w-5xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Ball Blast
        </h1>
        <p className="text-muted-foreground">
          Shoot balls to break the numbered blocks!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Zap className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-xl font-bold text-green-500">{highScore}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-border rounded-lg mx-auto cursor-crosshair"
          onClick={shootBall}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              {gameOver && (
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                  <p className="text-lg">Final Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-green-500 font-bold">New High Score!</p>
                  )}
                </div>
              )}
              <Button
                size="lg"
                onClick={startGame}
                className="gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                {gameOver ? 'Play Again' : 'Start Game'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isPlaying && (
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            variant="outline"
            className="gap-2"
          >
            <Pause className="w-4 h-4" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            onClick={endGame}
            variant="destructive"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            End Game
          </Button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Move mouse to aim, click to shoot!
      </div>
    </Card>
  );
}