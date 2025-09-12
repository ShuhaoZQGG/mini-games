'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Heart, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const NinjaWarrior: React.FC = () => {
  const [ninjaY, setNinjaY] = useState(200)
  const [obstacles, setObstacles] = useState<{id: number, x: number, y: number, type: string}[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [lives, setLives] = useState(3)
  const [isJumping, setIsJumping] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const gameRef = useRef<HTMLDivElement>(null)

  const jump = useCallback(() => {
    if (isJumping || gameOver) return
    setIsJumping(true)
    setNinjaY(100)
    setTimeout(() => {
      setNinjaY(200)
      setIsJumping(false)
    }, 600)
  }, [isJumping, gameOver])

  const spawnObstacle = useCallback(() => {
    const types = ['shuriken', 'wall', 'pit']
    const type = types[Math.floor(Math.random() * types.length)]
    const y = type === 'pit' ? 250 : type === 'wall' ? 180 : 200
    
    setObstacles(prev => [...prev, {
      id: Date.now(),
      x: 800,
      y,
      type
    }])
  }, [])

  const updateGame = useCallback(() => {
    if (gameOver) return

    setObstacles(prev => {
      const updated = prev.map(obs => ({ ...obs, x: obs.x - 5 - level }))
        .filter(obs => obs.x > -50)
      
      // Check collisions
      updated.forEach(obs => {
        if (obs.x > 80 && obs.x < 120) {
          if ((obs.type === 'wall' && ninjaY > 150) || 
              (obs.type === 'shuriken' && Math.abs(ninjaY - obs.y) < 30) ||
              (obs.type === 'pit' && ninjaY > 180)) {
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) setGameOver(true)
              return newLives
            })
            setObstacles(prev => prev.filter(o => o.id !== obs.id))
          }
        }
      })
      
      return updated
    })

    setScore(prev => prev + 1)
  }, [gameOver, ninjaY, level])

  const resetGame = () => {
    setNinjaY(200)
    setObstacles([])
    setScore(0)
    setLives(3)
    setGameOver(false)
    setIsJumping(false)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump()
    }
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [jump])

  useEffect(() => {
    const gameLoop = setInterval(updateGame, 50)
    return () => clearInterval(gameLoop)
  }, [updateGame])

  useEffect(() => {
    const spawnInterval = setInterval(spawnObstacle, 2000 - level * 100)
    return () => clearInterval(spawnInterval)
  }, [spawnObstacle, level])

  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 9))
    }
  }, [score, level, stars])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Ninja Warrior - Level {level}
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
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{Array(lives).fill('❤️').join(' ')}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={gameRef}
          className="relative h-80 bg-gradient-to-b from-purple-900 to-purple-600 rounded-lg overflow-hidden"
          onClick={jump}
        >
          {/* Ninja */}
          <motion.div
            className="absolute left-20 text-4xl"
            animate={{ y: ninjaY }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            🥷
          </motion.div>

          {/* Obstacles */}
          {obstacles.map(obs => (
            <div
              key={obs.id}
              className="absolute text-3xl"
              style={{ left: obs.x, top: obs.y }}
            >
              {obs.type === 'shuriken' && '⭐'}
              {obs.type === 'wall' && '🧱'}
              {obs.type === 'pit' && '🕳️'}
            </div>
          ))}

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-20 bg-gray-800" />

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: {score}</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center mt-4 text-sm text-gray-600">
          Press SPACE or click to jump!
        </p>
      </CardContent>
    </Card>
  )
}

export default NinjaWarrior
