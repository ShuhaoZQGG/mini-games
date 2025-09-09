'use client'

import { useState } from 'react'
import ChessGame from '@/components/games/chess/chess-game'
// Temporarily removed GameWithLevels import - needs refactoring
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Bot, Globe } from 'lucide-react'

const levelRequirements = [
  { level: 1, stars: 0, description: 'Beginner - Learn the basics', winTarget: 1 },
  { level: 2, stars: 2, description: 'Intermediate - 3 wins required', winTarget: 3 },
  { level: 3, stars: 5, description: 'Advanced - 5 wins required', winTarget: 5 },
  { level: 4, stars: 9, description: 'Expert - 10 wins required', winTarget: 10 },
  { level: 5, stars: 12, description: 'Master - 15 wins required', winTarget: 15 },
]

export default function ChessPage() {
  const [mode, setMode] = useState<'menu' | 'single' | 'multiplayer' | 'online'>('menu')
  const [roomId, setRoomId] = useState<string>('')
  const [wins, setWins] = useState(0)

  const handleGameEnd = (winner: 'white' | 'black' | 'draw') => {
    if (mode === 'single' && winner === 'white') {
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

  if (mode === 'menu') {
    const currentLevel = 1; // Temporary - will integrate with level system later
    return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Chess</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  The classic game of strategy - Level {currentLevel}
                </p>
                <p className="text-sm mt-2">
                  Wins: {wins} | Stars: {'⭐'.repeat(calculateStars())}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('single')}>
                  <div className="flex flex-col items-center text-center">
                    <Bot className="w-12 h-12 mb-4 text-blue-500" />
                    <h3 className="text-xl font-semibold mb-2">vs Computer</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Play against AI opponent
                    </p>
                    <p className="text-sm mt-2 text-gray-500">
                      Difficulty adjusts to your level
                    </p>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('multiplayer')}>
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-12 h-12 mb-4 text-green-500" />
                    <h3 className="text-xl font-semibold mb-2">Local Multiplayer</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Play with a friend locally
                    </p>
                    <p className="text-sm mt-2 text-gray-500">
                      Same device, two players
                    </p>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                  const newRoomId = `chess-${Date.now()}`
                  setRoomId(newRoomId)
                  setMode('online')
                }}>
                  <div className="flex flex-col items-center text-center">
                    <Globe className="w-12 h-12 mb-4 text-purple-500" />
                    <h3 className="text-xl font-semibold mb-2">Online Match</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Play against online opponents
                    </p>
                    <p className="text-sm mt-2 text-gray-500">
                      Real-time multiplayer
                    </p>
                  </div>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <h3 className="text-lg font-semibold mb-4">Level Progress</h3>
                <div className="space-y-2 max-w-md mx-auto">
                  {levelRequirements.map((req) => (
                    <div
                      key={req.level}
                      className={`p-2 rounded ${
                        currentLevel >= req.level
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Level {req.level}: {req.description}</span>
                        <span>{req.winTarget} wins</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">
            Chess - {mode === 'single' ? 'vs Computer' : mode === 'multiplayer' ? 'Local Match' : 'Online Match'}
          </h1>
          <Button onClick={() => setMode('menu')} variant="outline">
            Back to Menu
          </Button>
        </div>
        
        {mode === 'online' && roomId && (
          <div className="max-w-7xl mx-auto mb-4">
            <Card className="p-4">
              <p className="text-sm">
                Room ID: <span className="font-mono font-bold">{roomId}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Share this ID with your opponent to join the game
              </p>
            </Card>
          </div>
        )}
        
        <ChessGame 
          roomId={mode === 'online' ? roomId : undefined}
          isMultiplayer={mode === 'online'}
          onGameEnd={handleGameEnd}
        />
      </div>
    </div>
  )
}