'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Coins, Zap } from 'lucide-react'

const TempleRun: React.FC = () => {
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)
  const [speed, setSpeed] = useState(5)
  const [gameOver, setGameOver] = useState(false)
  const [lane, setLane] = useState(1) // 0, 1, 2 (left, center, right)
  const [jumping, setJumping] = useState(false)
  const [sliding, setSliding] = useState(false)
  const [obstacles, setObstacles] = useState<{id: number, lane: number, type: string, position: number}[]>([])
  
  const gameLoop = useCallback(() => {
    if (!gameOver) {
      setDistance(prev => prev + speed)
      setSpeed(prev => Math.min(prev + 0.001, 20))
      
      // Spawn obstacles
      if (Math.random() < 0.02 + distance / 10000) {
        setObstacles(prev => [...prev, {
          id: Date.now(),
          lane: Math.floor(Math.random() * 3),
          type: Math.random() > 0.5 ? 'barrier' : 'pit',
          position: 500
        }])
      }
      
      // Move obstacles
      setObstacles(prev => prev.map(obs => ({
        ...obs,
        position: obs.position - speed
      })).filter(obs => obs.position > -50))
    }
  }, [gameOver, speed, distance])
  
  const handleSwipe = useCallback((direction: string) => {
    if (direction === 'left' && lane > 0) setLane(lane - 1)
    if (direction === 'right' && lane < 2) setLane(lane + 1)
    if (direction === 'up') {
      setJumping(true)
      setTimeout(() => setJumping(false), 500)
    }
    if (direction === 'down') {
      setSliding(true)
      setTimeout(() => setSliding(false), 500)
    }
  }, [lane])
  
  const resetGame = () => {
    setDistance(0)
    setCoins(0)
    setSpeed(5)
    setGameOver(false)
    setLane(1)
    setObstacles([])
  }
  
  useEffect(() => {
    const interval = setInterval(gameLoop, 50)
    return () => clearInterval(interval)
  }, [gameLoop])
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Temple Run</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{Math.floor(distance)}m</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span>{coins}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span>x{(speed / 5).toFixed(1)}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-lg overflow-hidden">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-4xl">
            <div className={`transition-all duration-200 ${jumping ? '-translate-y-20' : ''} ${sliding ? 'scale-y-50' : ''}`}
                 style={{transform: `translateX(${(lane - 1) * 100}px)`}}>
              🏃
            </div>
          </div>
          
          {obstacles.map(obs => (
            <div key={obs.id} 
                 className="absolute text-3xl"
                 style={{
                   bottom: `${obs.position}px`,
                   left: `${33.33 * obs.lane + 16}%`
                 }}>
              {obs.type === 'barrier' ? '🚧' : '⬛'}
            </div>
          ))}
          
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <Button onClick={() => handleSwipe('left')} size="sm">←</Button>
            <div className="flex gap-2">
              <Button onClick={() => handleSwipe('up')} size="sm">Jump</Button>
              <Button onClick={() => handleSwipe('down')} size="sm">Slide</Button>
            </div>
            <Button onClick={() => handleSwipe('right')} size="sm">→</Button>
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <p className="mb-4">Distance: {Math.floor(distance)}m</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TempleRun
