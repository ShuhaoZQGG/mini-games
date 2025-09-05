'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Target, RotateCcw } from 'lucide-react'
import { submitScore } from '@/lib/services/scores'

export default function AimTrainer() {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 })
  const [targetSize, setTargetSize] = useState(50)

  const moveTarget = useCallback(() => {
    // Keep target within bounds (considering target size)
    const maxX = 100 - (targetSize / 4) // Convert to percentage
    const maxY = 100 - (targetSize / 4)
    const minX = targetSize / 4
    const minY = targetSize / 4
    
    setTargetPosition({
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY
    })
    
    // Vary target size for difficulty
    setTargetSize(30 + Math.random() * 40)
  }, [targetSize])

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (gameState !== 'playing') return
    
    setScore(prev => prev + 1)
    setHits(prev => prev + 1)
    moveTarget()
  }

  const handleMissClick = () => {
    if (gameState !== 'playing') return
    
    setScore(prev => Math.max(-10, prev - 1))
    setMisses(prev => prev + 1)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setHits(0)
    setMisses(0)
    setTimeLeft(30)
    moveTarget()
  }

  const endGame = async () => {
    setGameState('ended')
    const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0
    
    await submitScore({
      gameId: 'aim-trainer',
      score,
      metadata: {
        hits,
        misses,
        accuracy
      }
    })
  }

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, hits, misses])

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  if (gameState === 'waiting') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Target className="w-8 h-8" />
              Aim Trainer
            </h1>
            <p className="text-muted-foreground">Click targets as fast as you can!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Click on the targets as they appear</li>
              <li>• Each hit gives you +1 point</li>
              <li>• Each miss gives you -1 point</li>
              <li>• You have 30 seconds to get the highest score</li>
              <li>• Targets vary in size for added challenge</li>
            </ul>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState === 'ended') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Game Over!</h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {score}</p>
            <p className="text-lg text-muted-foreground">Hits: {hits}</p>
            <p className="text-lg text-muted-foreground">Misses: {misses}</p>
            <p className="text-lg text-muted-foreground">Accuracy: {accuracy}%</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <span className="text-lg font-semibold">Score: {score}</span>
            <span className="text-lg">Hits: {hits}</span>
            <span className="text-lg">Misses: {misses}</span>
            <span className="text-lg">Accuracy: {accuracy}%</span>
          </div>
          <span className="text-lg font-semibold">Time: {timeLeft}s</span>
        </div>
        
        <div 
          data-testid="game-area"
          className="relative bg-secondary/20 rounded-lg cursor-crosshair"
          style={{ height: '500px' }}
          onClick={handleMissClick}
        >
          <div
            data-testid="target"
            className="absolute bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors"
            style={{
              width: `${targetSize}px`,
              height: `${targetSize}px`,
              left: `${targetPosition.x}%`,
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={handleTargetClick}
          >
            <Target 
              className="w-full h-full p-2 text-white" 
              strokeWidth={3}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}