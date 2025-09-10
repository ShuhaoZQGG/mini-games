'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Percent } from 'lucide-react'

const GeometryDash: React.FC = () => {
  const [isJumping, setIsJumping] = useState(false)
  const [progress, setProgress] = useState(0)
  const [attempts, setAttempts] = useState(1)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [obstacles, setObstacles] = useState<{id: number, position: number, type: string}[]>([])
  const [playerY, setPlayerY] = useState(0)
  
  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true)
      setPlayerY(100)
      setTimeout(() => {
        setPlayerY(0)
        setIsJumping(false)
      }, 500)
    }
  }, [isJumping, gameOver])
  
  const gameLoop = useCallback(() => {
    if (!gameOver) {
      setProgress(prev => Math.min(prev + 0.5, 100))
      
      // Spawn obstacles
      if (Math.random() < 0.02) {
        setObstacles(prev => [...prev, {
          id: Date.now(),
          position: 800,
          type: Math.random() > 0.5 ? 'spike' : 'block'
        }])
      }
      
      // Move obstacles
      setObstacles(prev => prev.map(obs => ({
        ...obs,
        position: obs.position - 5
      })).filter(obs => obs.position > -50))
      
      // Check collisions
      obstacles.forEach(obs => {
        if (obs.position < 150 && obs.position > 100) {
          if (playerY < 50) {
            setGameOver(true)
          } else {
            setScore(prev => prev + 10)
          }
        }
      })
      
      if (progress >= 100) {
        setScore(prev => prev + 1000)
        setGameOver(true)
      }
    }
  }, [gameOver, obstacles, playerY, progress])
  
  useEffect(() => {
    const interval = setInterval(gameLoop, 50)
    return () => clearInterval(interval)
  }, [gameLoop])
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump])
  
  const resetGame = () => {
    setProgress(0)
    setAttempts(prev => prev + 1)
    setScore(0)
    setGameOver(false)
    setObstacles([])
    setPlayerY(0)
    setIsJumping(false)
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Geometry Dash</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-500" />
              <span>{Math.floor(progress)}%</span>
            </div>
            <span>Attempt #{attempts}</span>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg overflow-hidden"
             onClick={jump}>
          <div className="absolute bottom-20 left-32 text-3xl transition-all duration-300"
               style={{transform: `translateY(-${playerY}px) rotate(${isJumping ? 180 : 0}deg)`}}>
            ■
          </div>
          
          {obstacles.map(obs => (
            <div key={obs.id}
                 className="absolute bottom-20 text-2xl"
                 style={{left: `${obs.position}px`}}>
              {obs.type === 'spike' ? '▲' : '█'}
            </div>
          ))}
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="h-2 bg-black/30 rounded-full">
              <div className="h-full bg-white rounded-full transition-all"
                   style={{width: `${progress}%`}} />
            </div>
          </div>
          
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white">
            Tap or Press Space to Jump!
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">
                  {progress >= 100 ? 'Level Complete!' : 'Game Over!'}
                </h2>
                <p className="mb-4">Score: {score}</p>
                <p className="mb-4">Progress: {Math.floor(progress)}%</p>
                <Button onClick={resetGame}>Try Again</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default GeometryDash
