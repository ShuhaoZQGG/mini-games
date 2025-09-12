'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle, RotateCcw, Trophy, Zap, Clock } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Cyan', hex: '#06B6D4' },
];

export default function ColorMatcher() {
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const { updateScore } = useGameStore();

  const generateRound = useCallback(() => {
    const numOptions = Math.min(4 + Math.floor(level / 2), 8);
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const roundOptions = shuffled.slice(0, numOptions);
    
    const target = roundOptions[Math.floor(Math.random() * roundOptions.length)];
    setTargetColor(target);
    setOptions(roundOptions.sort(() => Math.random() - 0.5));
  }, [level]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    setMistakes(0);
    setShowFeedback(null);
    generateRound();
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
      updateScore('color-matcher', score);
    }
  };

  const handleColorClick = (color: typeof COLORS[0]) => {
    if (!isPlaying) return;

    if (color.hex === targetColor.hex) {
      // Correct match
      const points = 10 + (streak * 2) + (level * 5);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setShowFeedback('correct');
      
      // Level up every 5 successful matches
      if ((score + points) % 50 === 0) {
        setLevel(prev => prev + 1);
      }
      
      // Add bonus time for streaks
      if (streak > 0 && streak % 5 === 0) {
        setTimeLeft(prev => Math.min(prev + 5, 60));
      }
      
      setTimeout(() => {
        setShowFeedback(null);
        generateRound();
      }, 300);
    } else {
      // Wrong match
      setMistakes(prev => prev + 1);
      setStreak(0);
      setShowFeedback('wrong');
      setTimeLeft(prev => Math.max(prev - 2, 0));
      
      setTimeout(() => {
        setShowFeedback(null);
      }, 500);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
  }, [isPlaying, timeLeft]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('colorMatcherHighScore');
    if (saved) setHighScore(Number(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('colorMatcherHighScore', highScore.toString());
    }
  }, [highScore]);

  return (
    <Card className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Color Matcher
        </h1>
        <p className="text-muted-foreground">
          Match the color shown at the top as quickly as possible!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Zap className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <div className="text-sm text-muted-foreground">Time</div>
          <div className="text-xl font-bold">{timeLeft}s</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">Streak</div>
          <div className="text-xl font-bold text-green-500">{streak}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-xl font-bold text-purple-500">{highScore}</div>
        </div>
      </div>

      {!isPlaying ? (
        <div className="text-center py-12">
          {score > 0 && (
            <div className="mb-8 p-6 bg-secondary rounded-lg">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-lg mb-2">Final Score: {score}</p>
              <p className="text-sm text-muted-foreground">
                Level Reached: {level} | Mistakes: {mistakes}
              </p>
              {score > highScore && (
                <p className="text-green-500 font-bold mt-2">New High Score!</p>
              )}
            </div>
          )}
          <Button
            size="lg"
            onClick={startGame}
            className="gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            {score > 0 ? 'Play Again' : 'Start Game'}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Target Color */}
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">Match this color:</div>
            <div
              className="w-32 h-32 mx-auto rounded-xl shadow-lg border-4 border-background transition-transform hover:scale-105"
              style={{ backgroundColor: targetColor.hex }}
            />
            <div className="mt-2 text-2xl font-bold">{targetColor.name}</div>
          </div>

          {/* Color Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorClick(color)}
                className={`
                  p-4 rounded-lg transition-all transform hover:scale-105
                  ${showFeedback === 'correct' && color.hex === targetColor.hex 
                    ? 'ring-4 ring-green-500 scale-110' 
                    : ''}
                  ${showFeedback === 'wrong' && color.hex !== targetColor.hex 
                    ? 'opacity-50' 
                    : ''}
                `}
                style={{ backgroundColor: color.hex }}
              >
                <div className="h-20" />
              </button>
            ))}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`text-center text-2xl font-bold ${
              showFeedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}>
              {showFeedback === 'correct' ? 'Correct! +' + (10 + (streak * 2) + (level * 5)) : 'Wrong! -2 seconds'}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}