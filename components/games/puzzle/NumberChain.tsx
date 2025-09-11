'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star } from 'lucide-react'

const NumberChain: React.FC = () => {
  const [chain, setChain] = useState<number[]>([2, 4])
  const [target, setTarget] = useState(128)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const operations = [
    { label: '×2', fn: (n: number) => n * 2 },
    { label: '+5', fn: (n: number) => n + 5 },
    { label: '−3', fn: (n: number) => n - 3 },
    { label: '÷2', fn: (n: number) => Math.floor(n / 2) }
  ]

  const applyOperation = (op: (n: number) => number) => {
    if (gameWon) return
    const last = chain[chain.length - 1]
    const result = op(last)
    setChain([...chain, result])
    setMoves(moves + 1)
    
    if (result === target) {
      setGameWon(true)
      const points = Math.max(1000 - moves * 50, 100) * level
      setScore(score + points)
      setStars(Math.min(stars + 1, 9))
    }
  }

  const resetGame = () => {
    setChain([Math.floor(Math.random() * 10) + 1])
    setTarget(Math.floor(Math.random() * 200) + 50)
    setMoves(0)
    setGameWon(false)
  }

  useEffect(() => {
    if (score > level * 5000) {
      setLevel(level + 1)
    }
  }, [score, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Number Chain - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/9</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg mb-2">Target: <span className="text-3xl font-bold text-blue-600">{target}</span></h3>
            <p className="text-sm text-gray-600">Moves: {moves}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {chain.map((num, i) => (
              <div key={i} className={`
                px-4 py-2 rounded-lg font-mono text-lg
                ${num === target ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}
              `}>
                {num}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {operations.map((op, i) => (
              <Button
                key={i}
                onClick={() => applyOperation(op.fn)}
                disabled={gameWon}
              >
                {op.label}
              </Button>
            ))}
          </div>

          {gameWon && (
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-2">Success!</h3>
              <p>Completed in {moves} moves!</p>
              <Button onClick={resetGame} className="mt-2">Next Puzzle</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default NumberChain
