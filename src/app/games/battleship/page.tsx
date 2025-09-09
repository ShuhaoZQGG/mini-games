'use client';

import { BattleshipGame } from '@/components/games/battleship/battleship-game';

export default function BattleshipPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-4">Battleship</h1>
      <p className="text-center text-gray-600 mb-6">
        Sink your opponent's fleet before they sink yours!
      </p>
      <BattleshipGame />
    </div>
  );
}