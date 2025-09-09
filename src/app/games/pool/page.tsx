'use client'

import { useState } from 'react'
import PoolGame from '@/components/games/pool/pool-game'
import GameWithLevels from '@/components/games/game-with-levels'

const levelRequirements = [
  { level: 1, stars: 0, description: 'Beginner - Win 1 game', winTarget: 1 },
  { level: 2, stars: 2, description: 'Amateur - Win 3 games', winTarget: 3 },
  { level: 3, stars: 5, description: 'Semi-Pro - Win 5 games', winTarget: 5 },
  { level: 4, stars: 9, description: 'Professional - Win 10 games', winTarget: 10 },
  { level: 5, stars: 12, description: 'Champion - Win 15 games', winTarget: 15 },
]

export default function PoolPage() {
  const [wins, setWins] = useState(0)

  const handleGameEnd = (winner: 'player1' | 'player2') => {
    if (winner === 'player1') {
      setWins(prev => prev + 1)
    }
  }

  const calculateStars = () => {
    if (wins >= 15) return 5
    if (wins >= 10) return 4
    if (wins >= 5) return 3
    if (wins >= 3) return 2
    if (wins >= 1) return 1
    return 0
  }

  return (
    <GameWithLevels
      gameId="pool"
      gameName="8-Ball Pool"
      levelRequirements={levelRequirements}
    >
      {(currentLevel) => (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="p-4">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold mb-2">8-Ball Pool</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Level {currentLevel} | Wins: {wins} | Stars: {'⭐'.repeat(calculateStars())}
              </p>
            </div>
            
            <PoolGame onGameEnd={handleGameEnd} />
            
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4 text-center">Level Progress</h3>
              <div className="space-y-2">
                {levelRequirements.map((req) => (
                  <div
                    key={req.level}
                    className={`p-3 rounded-lg ${
                      currentLevel >= req.level
                        ? 'bg-green-200 dark:bg-green-700'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Level {req.level}: {req.description}</span>
                      <span className="text-sm">
                        {wins}/{req.winTarget} wins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </GameWithLevels>
  )
}