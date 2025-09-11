'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Shield, Zap } from 'lucide-react'

const LaserDefense: React.FC = () => {
  const [playerX, setPlayerX] = useState(200)
  const [lasers, setLasers] = useState<{id: number, x: number, y: number, angle: number}[]>([])
  const [shields, setShields] = useState(3)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [powerUp, setPowerUp] = useState<string | null>(null)

  const movePlayer = useCallback((direction: number) => {
    setPlayerX(prev => Math.max(20, Math.min(380, prev + direction * 20)))
  }, [])

  const spawnLaser = useCallback(() => {
    setLasers(prev => [...prev, {
      id: Date.now(),
      x: Math.random() * 400,
      y: 0,
      angle: Math.random() * 60 - 30
    }])
  }, [])

  const updateGame = useCallback(() => {
    if (gameOver) return

    setLasers(prev => {
      const updated = prev.map(laser => ({
        ...laser,
        y: laser.y + 5 + level,
        x: laser.x + Math.sin(laser.angle * Math.PI / 180) * 2
      })).filter(laser => laser.y < 400)

      updated.forEach(laser => {
        if (laser.y > 320 && Math.abs(laser.x - playerX) < 30) {
          if (shields > 0) {
            setShields(s => s - 1)
            setLasers(p => p.filter(l => l.id !== laser.id))
          } else {
            setGameOver(true)
          }
        }
      })

      return updated
    })

    setScore(prev => prev + 10)
  }, [gameOver, playerX, shields, level])

  const resetGame = () => {
    setPlayerX(200)
    setLasers([])
    setShields(3)
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setPowerUp(null)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePlayer(-1)
      if (e.key === 'ArrowRight') movePlayer(1)
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePlayer])

  useEffect(() => {
    const gameLoop = setInterval(updateGame, 50)
    return () => clearInterval(gameLoop)
  }, [updateGame])

  useEffect(() => {
    const spawnInterval = setInterval(spawnLaser, 1500 - level * 100)
    return () => clearInterval(spawnInterval)
  }, [spawnLaser, level])

  useEffect(() => {
    const newLevel = Math.floor(score / 1000) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 15))
    }
  }, [score, level, stars])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Laser Defense - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/15</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>{shields}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-gradient-to-b from-gray-900 to-purple-900 rounded-lg overflow-hidden">
          {/* Player ship */}
          <div
            className="absolute bottom-10 w-12 h-12 transition-all duration-100"
            style={{ left: playerX - 24 }}
          >
            <div className="text-3xl">🚀</div>
          </div>

          {/* Lasers */}
          {lasers.map(laser => (
            <div
              key={laser.id}
              className="absolute w-1 h-8 bg-red-500 shadow-lg shadow-red-500/50"
              style={{
                left: laser.x,
                top: laser.y,
                transform: `rotate(${laser.angle}deg)`
              }}
            />
          ))}

          {/* Shield indicator */}
          {shields > 0 && (
            <div
              className="absolute bottom-8 w-16 h-16 rounded-full border-2 border-blue-400 opacity-50"
              style={{ left: playerX - 32 }}
            />
          )}

          {/* Controls */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => movePlayer(-1)}
              className="text-white"
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => movePlayer(1)}
              className="text-white"
            >
              →
            </Button>
          </div>

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
      </CardContent>
    </Card>
  )
}

export default LaserDefense
