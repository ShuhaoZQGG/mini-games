'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

interface ColorButton {
  color: string;
  sound: number;
  active: boolean;
}

export function SimonSays() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [level, setLevel] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [buttons, setButtons] = useState<ColorButton[]>([
    { color: 'bg-red-500', sound: 261.63, active: false },
    { color: 'bg-blue-500', sound: 329.63, active: false },
    { color: 'bg-yellow-500', sound: 392.00, active: false },
    { color: 'bg-green-500', sound: 523.25, active: false },
  ]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const { updateScore } = useGameStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((frequency: number) => {
    if (!soundEnabled || !audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  }, [soundEnabled]);

  const startGame = () => {
    setSequence([]);
    setPlayerSequence([]);
    setLevel(0);
    setIsPlaying(true);
    setTimeout(() => nextRound(), 1000);
  };

  const nextRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setLevel(newSequence.length);
    setPlayerSequence([]);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      activateButton(seq[i]);
    }
    
    setIsShowingSequence(false);
  };

  const activateButton = (index: number) => {
    setButtons(prev => {
      const newButtons = [...prev];
      newButtons[index].active = true;
      return newButtons;
    });
    
    playSound(buttons[index].sound);
    
    setTimeout(() => {
      setButtons(prev => {
        const newButtons = [...prev];
        newButtons[index].active = false;
        return newButtons;
      });
    }, 400);
  };

  const handleButtonClick = (index: number) => {
    if (!isPlaying || isShowingSequence) return;
    
    activateButton(index);
    
    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);
    
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      gameOver();
      return;
    }
    
    if (newPlayerSequence.length === sequence.length) {
      if (level > highScore) {
        setHighScore(level);
      }
      updateScore('simon-says', level * 100);
      setTimeout(() => {
        setSequence([...sequence, Math.floor(Math.random() * 4)]);
        nextRound();
      }, 1000);
    }
  };

  const gameOver = () => {
    setIsPlaying(false);
    if (soundEnabled && audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 100;
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 1);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 1);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Simon Says</h2>
        <p className="text-gray-600 mb-4">
          Watch the pattern and repeat it!
        </p>
        
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{level}</div>
            <div className="text-sm text-gray-600">Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{highScore}</div>
            <div className="text-sm text-gray-600">High Score</div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!isPlaying ? (
            <Button onClick={startGame} size="lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button onClick={() => setIsPlaying(false)} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            size="lg"
            variant="outline"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {buttons.map((button, index) => (
          <button
            key={index}
            className={`
              aspect-square rounded-lg transition-all duration-200
              ${button.color}
              ${button.active ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-80'}
              ${!isPlaying || isShowingSequence ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => handleButtonClick(index)}
            disabled={!isPlaying || isShowingSequence}
          />
        ))}
      </div>

      {!isPlaying && level > 0 && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold">
            Game Over! You reached level {level}
          </p>
        </div>
      )}

      {isShowingSequence && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold animate-pulse">
            Watch carefully...
          </p>
        </div>
      )}

      {isPlaying && !isShowingSequence && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold">
            Your turn! Repeat the pattern
          </p>
        </div>
      )}
    </Card>
  );
}