'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flag, RotateCcw, Play, Trophy, Target } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Hole {
  number: number;
  par: number;
  ballStart: Point;
  holePosition: Point;
  obstacles: { x: number; y: number; width: number; height: number }[];
  sandTraps: { x: number; y: number; radius: number }[];
}

const holes: Hole[] = [
  {
    number: 1,
    par: 2,
    ballStart: { x: 100, y: 300 },
    holePosition: { x: 600, y: 300 },
    obstacles: [],
    sandTraps: []
  },
  {
    number: 2,
    par: 3,
    ballStart: { x: 100, y: 400 },
    holePosition: { x: 600, y: 200 },
    obstacles: [{ x: 350, y: 250, width: 50, height: 200 }],
    sandTraps: []
  },
  {
    number: 3,
    par: 3,
    ballStart: { x: 100, y: 300 },
    holePosition: { x: 650, y: 300 },
    obstacles: [{ x: 300, y: 200, width: 40, height: 40 }, { x: 450, y: 350, width: 40, height: 40 }],
    sandTraps: [{ x: 400, y: 300, radius: 60 }]
  },
  // Add more holes up to 9
];

export default function MiniGolf() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'complete'>('menu');
  const [currentHole, setCurrentHole] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [ballPosition, setBallPosition] = useState<Point>({ x: 100, y: 300 });
  const [ballVelocity, setBallVelocity] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Point>({ x: 0, y: 0 });
  const [holeScores, setHoleScores] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setCurrentHole(0);
    setStrokes(0);
    setTotalStrokes(0);
    setHoleScores([]);
    setBallPosition(holes[0].ballStart);
    setBallVelocity({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.abs(ballVelocity.x) > 0.1 || Math.abs(ballVelocity.y) > 0.1) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dist = Math.sqrt((x - ballPosition.x) ** 2 + (y - ballPosition.y) ** 2);
    if (dist < 30) {
      setIsDragging(true);
      setDragStart({ x, y });
      setDragEnd({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragEnd({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const power = Math.sqrt((dragEnd.x - dragStart.x) ** 2 + (dragEnd.y - dragStart.y) ** 2) / 10;
    const angle = Math.atan2(dragStart.y - dragEnd.y, dragStart.x - dragEnd.x);
    
    setBallVelocity({
      x: Math.cos(angle) * Math.min(power, 15),
      y: Math.sin(angle) * Math.min(power, 15)
    });
    
    setStrokes(strokes + 1);
    setIsDragging(false);
  };

  // Physics update
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setBallPosition(prev => {
        const newX = prev.x + ballVelocity.x;
        const newY = prev.y + ballVelocity.y;
        
        // Boundary collision
        if (newX < 10 || newX > 790) {
          setBallVelocity(v => ({ x: -v.x * 0.8, y: v.y }));
          return prev;
        }
        if (newY < 10 || newY > 590) {
          setBallVelocity(v => ({ x: v.x, y: -v.y * 0.8 }));
          return prev;
        }
        
        // Check hole
        const hole = holes[currentHole];
        const distToHole = Math.sqrt((newX - hole.holePosition.x) ** 2 + (newY - hole.holePosition.y) ** 2);
        if (distToHole < 15 && Math.abs(ballVelocity.x) < 3 && Math.abs(ballVelocity.y) < 3) {
          // Ball in hole!
          handleHoleComplete();
        }
        
        return { x: newX, y: newY };
      });
      
      // Apply friction
      setBallVelocity(v => ({
        x: v.x * 0.95,
        y: v.y * 0.95
      }));
    }, 1000 / 60);
    
    return () => clearInterval(interval);
  }, [ballVelocity, gameState, currentHole]);

  const handleHoleComplete = () => {
    const hole = holes[currentHole];
    const score = strokes - hole.par;
    setHoleScores([...holeScores, strokes]);
    setTotalStrokes(totalStrokes + strokes);
    
    // Calculate experience
    let exp = 100;
    if (score <= -2) exp = 300; // Eagle or better
    else if (score === -1) exp = 200; // Birdie
    else if (score === 0) exp = 150; // Par
    else if (score === 1) exp = 100; // Bogey
    else exp = 50; // Double bogey or worse
    
    setExperience(prev => prev + exp);
    
    if (currentHole < holes.length - 1) {
      setCurrentHole(currentHole + 1);
      setStrokes(0);
      setBallPosition(holes[currentHole + 1].ballStart);
      setBallVelocity({ x: 0, y: 0 });
    } else {
      setGameState('complete');
    }
  };

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 800, 600);
      
      if (gameState === 'playing' && holes[currentHole]) {
        const hole = holes[currentHole];
        
        // Draw obstacles
        ctx.fillStyle = '#374151';
        hole.obstacles.forEach(obs => {
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
        
        // Draw sand traps
        ctx.fillStyle = '#fbbf24';
        hole.sandTraps.forEach(trap => {
          ctx.beginPath();
          ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw hole
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(hole.holePosition.x, hole.holePosition.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw flag
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hole.holePosition.x, hole.holePosition.y);
        ctx.lineTo(hole.holePosition.x, hole.holePosition.y - 40);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(hole.holePosition.x, hole.holePosition.y - 40);
        ctx.lineTo(hole.holePosition.x + 20, hole.holePosition.y - 30);
        ctx.lineTo(hole.holePosition.x, hole.holePosition.y - 20);
        ctx.fill();
        
        // Draw ball
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ballPosition.x, ballPosition.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw power indicator when dragging
        if (isDragging) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(ballPosition.x, ballPosition.y);
          ctx.lineTo(dragStart.x + (dragStart.x - dragEnd.x), dragStart.y + (dragStart.y - dragEnd.y));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }, [gameState, currentHole, ballPosition, isDragging, dragStart, dragEnd]);

  const getTotalPar = () => holes.slice(0, currentHole + 1).reduce((sum, h) => sum + h.par, 0);
  const getScoreDisplay = () => {
    const diff = totalStrokes - getTotalPar();
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-6 h-6" />
          Mini Golf
        </CardTitle>
        <CardDescription>Complete 9 holes with the fewest strokes!</CardDescription>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="text-center py-8">
            <Target className="w-24 h-24 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-4">Welcome to Mini Golf!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Drag from the ball to aim and set power. Get the ball in the hole!
            </p>
            <div className="mb-6">
              <p className="text-sm">Level: {level}</p>
              <p className="text-sm">Experience: {experience} XP</p>
            </div>
            <Button onClick={startGame} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div className="flex justify-between mb-4">
              <div>Hole {currentHole + 1} • Par {holes[currentHole].par}</div>
              <div>Strokes: {strokes}</div>
              <div>Total: {totalStrokes} ({getScoreDisplay()})</div>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer"
              style={{ maxWidth: '800px' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        )}

        {gameState === 'complete' && (
          <div className="text-center py-8">
            <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold mb-4">Round Complete!</h2>
            <p className="text-2xl mb-4">Total Strokes: {totalStrokes}</p>
            <p className="text-xl mb-6">Score: {getScoreDisplay()}</p>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-6">
              {holeScores.map((score, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="text-sm">Hole {i + 1}</p>
                  <p className="font-bold">{score}</p>
                </div>
              ))}
            </div>
            <Button onClick={startGame} size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}