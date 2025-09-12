'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle, RotateCcw, Zap, Trophy } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

interface Mole {
  id: number;
  isActive: boolean;
  isWhacked: boolean;
}

export function WhackAMole() {
  const [moles, setMoles] = useState<Mole[]>(
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      isActive: false,
      isWhacked: false,
    }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [missedMoles, setMissedMoles] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { updateScore } = useGameStore();

  const getDifficultySettings = () => {
    switch (difficulty) {
      case 'easy':
        return { moleTime: 1500, spawnRate: 1200 };
      case 'medium':
        return { moleTime: 1000, spawnRate: 800 };
      case 'hard':
        return { moleTime: 700, spawnRate: 500 };
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setMissedMoles(0);
    setCombo(0);
    setMaxCombo(0);
    setMoles(moles.map(m => ({ ...m, isActive: false, isWhacked: false })));
    
    const { spawnRate } = getDifficultySettings();
    
    gameIntervalRef.current = setInterval(() => {
      spawnMole();
    }, spawnRate);
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnMole = () => {
    const availableMoles = moles.filter(m => !m.isActive);
    if (availableMoles.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * 9);
    const { moleTime } = getDifficultySettings();
    
    setMoles(prev => {
      const newMoles = [...prev];
      if (!newMoles[randomIndex].isActive) {
        newMoles[randomIndex].isActive = true;
        newMoles[randomIndex].isWhacked = false;
        
        setTimeout(() => {
          setMoles(current => {
            const updated = [...current];
            if (updated[randomIndex].isActive && !updated[randomIndex].isWhacked) {
              updated[randomIndex].isActive = false;
              setMissedMoles(m => m + 1);
              setCombo(0);
            }
            return updated;
          });
        }, moleTime);
      }
      return newMoles;
    });
  };

  const whackMole = (id: number) => {
    if (!isPlaying) return;
    
    setMoles(prev => {
      const newMoles = [...prev];
      if (newMoles[id].isActive && !newMoles[id].isWhacked) {
        newMoles[id].isWhacked = true;
        newMoles[id].isActive = false;
        
        const baseScore = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
        const comboBonus = Math.floor(combo / 5) * 5;
        const totalScore = baseScore + comboBonus;
        
        setScore(s => s + totalScore);
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(mc => Math.max(mc, newCombo));
          return newCombo;
        });
        
        setTimeout(() => {
          setMoles(current => {
            const updated = [...current];
            updated[id].isWhacked = false;
            return updated;
          });
        }, 200);
      }
      return newMoles;
    });
  };

  const endGame = () => {
    setIsPlaying(false);
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setMoles(moles.map(m => ({ ...m, isActive: false, isWhacked: false })));
    
    if (score > highScore) {
      setHighScore(score);
    }
    
    updateScore('whack-a-mole', score);
  };

  const resetGame = () => {
    endGame();
    setScore(0);
    setTimeLeft(30);
    setMissedMoles(0);
    setCombo(0);
    setMaxCombo(0);
  };

  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Whack-a-Mole</h2>
        <p className="text-gray-600 mb-4">
          Click the moles as they appear!
        </p>
        
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{timeLeft}s</div>
            <div className="text-sm text-gray-600">Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold flex items-center gap-1">
              {combo} <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-sm text-gray-600">Combo</div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <Button
            onClick={() => setDifficulty('easy')}
            variant={difficulty === 'easy' ? 'default' : 'outline'}
            size="sm"
            disabled={isPlaying}
          >
            Easy
          </Button>
          <Button
            onClick={() => setDifficulty('medium')}
            variant={difficulty === 'medium' ? 'default' : 'outline'}
            size="sm"
            disabled={isPlaying}
          >
            Medium
          </Button>
          <Button
            onClick={() => setDifficulty('hard')}
            variant={difficulty === 'hard' ? 'default' : 'outline'}
            size="sm"
            disabled={isPlaying}
          >
            Hard
          </Button>
        </div>

        <div className="flex justify-center gap-4">
          {!isPlaying ? (
            <Button onClick={startGame} size="lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button onClick={resetGame} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {moles.map((mole) => (
          <div
            key={mole.id}
            className="relative aspect-square"
          >
            <div className="absolute inset-0 bg-amber-700 rounded-full" />
            <div className="absolute inset-2 bg-amber-900 rounded-full" />
            <button
              className={`
                absolute inset-4 rounded-full transition-all duration-200 cursor-pointer
                ${mole.isActive && !mole.isWhacked ? 'bg-amber-600 hover:bg-amber-500 scale-110' : ''}
                ${mole.isWhacked ? 'bg-red-500 scale-90' : ''}
                ${!mole.isActive && !mole.isWhacked ? 'bg-amber-900' : ''}
              `}
              onClick={() => whackMole(mole.id)}
              disabled={!isPlaying}
            >
              {mole.isActive && !mole.isWhacked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl">🐹</div>
                </div>
              )}
              {mole.isWhacked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl">💥</div>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {!isPlaying && score > 0 && (
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <p className="text-lg font-semibold">
              Game Over! Final Score: {score}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Max Combo: {maxCombo} | Missed: {missedMoles}
          </p>
          {score === highScore && (
            <p className="text-sm text-green-600 font-semibold">
              New High Score!
            </p>
          )}
        </div>
      )}
    </Card>
  );
}