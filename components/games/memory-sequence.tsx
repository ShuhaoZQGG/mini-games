'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle, Brain, Trophy, Zap, Eye, EyeOff } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

export default function MemorySequence() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const [speed, setSpeed] = useState(600);
  
  const { updateScore } = useGameStore();

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setSpeed(600);
    setIsPlaying(true);
    setPlayerSequence([]);
    generateSequence(1);
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
      updateScore('memory-sequence', score);
    }
  };

  const generateSequence = (level: number) => {
    const length = 3 + level;
    const newSequence: number[] = [];
    
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 8));
    }
    
    setSequence(newSequence);
    setPlayerSequence([]);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    setIsPlayerTurn(false);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    for (let i = 0; i < seq.length; i++) {
      setActiveButton(seq[i]);
      await new Promise(resolve => setTimeout(resolve, speed));
      setActiveButton(null);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsShowingSequence(false);
    setIsPlayerTurn(true);
  };

  const handleButtonClick = (index: number) => {
    if (!isPlayerTurn || !isPlaying) return;
    
    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);
    
    // Show button press animation
    setActiveButton(index);
    setTimeout(() => setActiveButton(null), 200);
    
    // Check if correct
    const currentIndex = newPlayerSequence.length - 1;
    
    if (sequence[currentIndex] !== index) {
      // Wrong!
      setLives(prev => prev - 1);
      setIsPlayerTurn(false);
      
      if (lives <= 1) {
        endGame();
      } else {
        setTimeout(() => {
          setPlayerSequence([]);
          showSequence(sequence);
        }, 1500);
      }
    } else if (newPlayerSequence.length === sequence.length) {
      // Completed sequence!
      setScore(prev => prev + level * 10);
      setLevel(prev => prev + 1);
      setIsPlayerTurn(false);
      
      // Increase speed every 3 levels
      if (level % 3 === 0) {
        setSpeed(prev => Math.max(prev - 50, 200));
      }
      
      setTimeout(() => {
        generateSequence(level + 1);
      }, 1000);
    }
  };

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('memorySequenceHighScore');
    if (saved) setHighScore(Number(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('memorySequenceHighScore', highScore.toString());
    }
  }, [highScore]);

  return (
    <Card className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Memory Sequence
        </h1>
        <p className="text-muted-foreground">
          Watch the sequence and repeat it!
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
          <Brain className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">Lives</div>
          <div className="text-xl font-bold text-red-500">{'❤️'.repeat(lives)}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Zap className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <div className="text-sm text-muted-foreground">Speed</div>
          <div className="text-xl font-bold">{Math.round((600 - speed) / 4)}%</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-xl font-bold text-green-500">{highScore}</div>
        </div>
      </div>

      {!isPlaying ? (
        <div className="text-center py-12">
          {score > 0 && (
            <div className="mb-8 p-6 bg-secondary rounded-lg">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-lg mb-2">Final Score: {score}</p>
              <p className="text-sm text-muted-foreground">
                Level Reached: {level}
              </p>
              {score === highScore && score > 0 && (
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
          {/* Status */}
          <div className="text-center">
            {isShowingSequence && (
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-blue-500">
                <Eye className="w-5 h-5" />
                Watch the sequence!
              </div>
            )}
            {isPlayerTurn && (
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-500">
                <Brain className="w-5 h-5" />
                Your turn! ({playerSequence.length}/{sequence.length})
              </div>
            )}
            {!isShowingSequence && !isPlayerTurn && isPlaying && (
              <div className="text-lg font-semibold text-muted-foreground">
                Get ready...
              </div>
            )}
          </div>

          {/* Color Buttons Grid */}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(index)}
                disabled={!isPlayerTurn}
                className={`
                  aspect-square rounded-lg transition-all transform
                  ${activeButton === index ? 'scale-110 ring-4 ring-white shadow-2xl' : ''}
                  ${!isPlayerTurn ? 'cursor-not-allowed opacity-75' : 'hover:scale-105 cursor-pointer'}
                `}
                style={{
                  backgroundColor: color,
                  boxShadow: activeButton === index ? `0 0 30px ${color}` : ''
                }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="text-sm text-muted-foreground mb-2">Sequence Progress</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${(playerSequence.length / sequence.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}