'use client';

import { useState } from 'react';
import { CheckersGame } from '@/components/games/checkers/checkers-game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Bot } from 'lucide-react';


export default function CheckersPage() {
  const [gameMode, setGameMode] = useState<'menu' | 'single' | 'multi'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [score, setScore] = useState(0);
  const [piecesLost, setPiecesLost] = useState(0);

  const handleGameEnd = (winner: 'red' | 'black' | 'draw') => {
    if (winner === 'red') {
      // Player wins (assuming player is always red in single player)
      const baseScore = 100;
      const bonus = Math.max(0, (12 - piecesLost) * 10);
      setScore(baseScore + bonus);
    }
  };

  if (gameMode === 'menu') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8">Checkers</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setGameMode('single')}>
            <div className="flex flex-col items-center text-center space-y-4">
              <Bot className="w-16 h-16 text-blue-500" />
              <h2 className="text-2xl font-semibold">Single Player</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Play against the computer with varying difficulty levels
              </p>
              <Button className="w-full">Play vs AI</Button>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setGameMode('multi')}>
            <div className="flex flex-col items-center text-center space-y-4">
              <Users className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-semibold">Multiplayer</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Challenge friends online in real-time matches
              </p>
              <Button className="w-full" variant="outline">Coming Soon</Button>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h3 className="text-xl font-semibold mb-4">How to Play</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• Move diagonally forward on dark squares</p>
            <p>• Capture opponent pieces by jumping over them</p>
            <p>• Multiple captures in one turn are mandatory</p>
            <p>• Reach the opposite end to crown your piece as a King</p>
            <p>• Kings can move and capture in any diagonal direction</p>
            <p>• Win by capturing all opponent pieces or blocking all their moves</p>
          </div>
        </Card>
      </div>
    );
  }

  if (gameMode === 'single') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => setGameMode('menu')} 
              variant="outline"
              size="sm"
            >
              Back to Menu
            </Button>
          </div>
          <CheckersGame 
            onGameEnd={(winner) => {
              handleGameEnd(winner);
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}