'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Zap, TrendingUp, Award } from 'lucide-react';

interface Score {
  time: number;
  timestamp: number;
}

export default function ReactionTimeGame() {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'clicked' | 'tooEarly'>('idle');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [waitStartTime, setWaitStartTime] = useState<number>(0);
  const [averageTime, setAverageTime] = useState<number>(0);

  const startGame = useCallback(() => {
    setGameState('waiting');
    setReactionTime(null);
    setWaitStartTime(Date.now());
    
    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000;
    
    const id = setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
    
    setTimeoutId(id);
  }, []);

  const handleClick = useCallback(() => {
    if (gameState === 'waiting') {
      // Clicked too early
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setGameState('tooEarly');
      setReactionTime(null);
    } else if (gameState === 'ready') {
      // Calculate reaction time
      const endTime = Date.now();
      const time = endTime - startTime;
      setReactionTime(time);
      setGameState('clicked');
      
      // Save score
      const newScore: Score = { time, timestamp: Date.now() };
      const newScores = [...scores, newScore].slice(-10); // Keep last 10 scores
      setScores(newScores);
      
      // Calculate average
      const avg = newScores.reduce((sum, s) => sum + s.time, 0) / newScores.length;
      setAverageTime(Math.round(avg));
    }
  }, [gameState, startTime, scores, timeoutId]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setReactionTime(null);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const getBestScore = () => {
    if (scores.length === 0) return null;
    return Math.min(...scores.map(s => s.time));
  };

  const getReactionLevel = (time: number) => {
    if (time < 200) return { level: 'Lightning Fast!', color: 'text-purple-600' };
    if (time < 250) return { level: 'Excellent!', color: 'text-green-600' };
    if (time < 300) return { level: 'Good!', color: 'text-blue-600' };
    if (time < 400) return { level: 'Average', color: 'text-yellow-600' };
    return { level: 'Keep Practicing', color: 'text-orange-600' };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Reaction Time Test
          </CardTitle>
          <CardDescription>
            Test your reflexes! Click as fast as you can when the screen turns green.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Timer className="w-4 h-4" />
                Current
              </div>
              <div className="text-2xl font-bold">
                {reactionTime !== null ? `${reactionTime}ms` : '--'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Average
              </div>
              <div className="text-2xl font-bold">
                {averageTime > 0 ? `${averageTime}ms` : '--'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Award className="w-4 h-4" />
                Best
              </div>
              <div className="text-2xl font-bold">
                {getBestScore() !== null ? `${getBestScore()}ms` : '--'}
              </div>
            </div>
          </div>

          {/* Game Area */}
          <div 
            className={`
              relative min-h-[300px] rounded-lg flex items-center justify-center cursor-pointer
              transition-colors duration-100
              ${gameState === 'idle' ? 'bg-blue-100 hover:bg-blue-200' : ''}
              ${gameState === 'waiting' ? 'bg-red-500 hover:bg-red-600' : ''}
              ${gameState === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''}
              ${gameState === 'clicked' ? 'bg-blue-100' : ''}
              ${gameState === 'tooEarly' ? 'bg-orange-500' : ''}
            `}
            onClick={gameState === 'waiting' || gameState === 'ready' ? handleClick : undefined}
          >
            {gameState === 'idle' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to test your reflexes?</h3>
                <Button onClick={startGame} size="lg">
                  Start Test
                </Button>
              </div>
            )}
            
            {gameState === 'waiting' && (
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">Wait for green...</h3>
                <p className="text-lg">Click when the screen turns green!</p>
              </div>
            )}
            
            {gameState === 'ready' && (
              <div className="text-center text-white">
                <h3 className="text-4xl font-bold">CLICK NOW!</h3>
              </div>
            )}
            
            {gameState === 'clicked' && reactionTime !== null && (
              <div className="text-center">
                <h3 className="text-5xl font-bold mb-2">{reactionTime}ms</h3>
                <p className={`text-xl font-semibold mb-4 ${getReactionLevel(reactionTime).color}`}>
                  {getReactionLevel(reactionTime).level}
                </p>
                <Button onClick={startGame} size="lg">
                  Try Again
                </Button>
              </div>
            )}
            
            {gameState === 'tooEarly' && (
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">Too Early!</h3>
                <p className="text-lg mb-4">Wait for the green screen before clicking.</p>
                <Button onClick={startGame} variant="secondary" size="lg">
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Recent Scores */}
          {scores.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Recent Attempts</h4>
              <div className="flex gap-2 flex-wrap">
                {scores.slice(-5).reverse().map((score, index) => (
                  <div 
                    key={score.timestamp}
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}
                  >
                    {score.time}ms
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How to Play:</h4>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li>1. Click &quot;Start Test&quot; to begin</li>
              <li>2. Wait for the red screen to turn green</li>
              <li>3. Click as quickly as possible when it turns green</li>
              <li>4. Your reaction time will be measured in milliseconds</li>
              <li>5. Try to beat your best score!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}