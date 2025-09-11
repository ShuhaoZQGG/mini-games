'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Zap, Clock } from 'lucide-react'

const SpeedRunner: React.FC = () => {
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 200 })
  const [platforms, setPlatforms] = useState<{id: number, x: number, y: number, width: number}[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [speed, setSpeed] = useState(5)
  const [gameOver, setGameOver] = useState(false)
  const [distance, setDistance] = useState(0)
  const [jumping, setJumping] = useState(false)
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })

  const generatePlatform = useCallback(() => {
    const lastPlatform = platforms[platforms.length - 1] || { x: 800, y: 250 }
    const gap = 100 + Math.random() * 150
    const yVariation = Math.random() * 100 - 50
    
    setPlatforms(prev => [...prev, {
      id: Date.now(),
      x: lastPlatform.x + gap,
      y: Math.max(150, Math.min(300, lastPlatform.y + yVariation)),
      width: 80 + Math.random() * 40
    }])
  }, [platforms])

  const jump = useCallback(() => {
    if (!jumping && !gameOver) {
      setJumping(true)
      setVelocity(prev => ({ ...prev, y: -15 }))
    }
  }, [jumping, gameOver])

  const updateGame = useCallback(() => {
    if (gameOver) return

    // Update player physics
    setVelocity(prev => ({ x: speed, y: prev.y + 0.8 })) // gravity
    
    setPlayerPos(prev => {
      const newY = Math.max(0, prev.y + velocity.y)
      
      // Check platform collision
      let onPlatform = false
      platforms.forEach(platform => {
        if (prev.x > platform.x - 20 && prev.x < platform.x + platform.width &&
            newY > platform.y - 30 && newY < platform.y + 10) {
          onPlatform = true
          if (velocity.y > 0) {
            setVelocity(v => ({ ...v, y: 0 }))
            setJumping(false)
          }
        }
      })
      
      // Check if fell
      if (newY > 400) {
        setGameOver(true)
      }
      
      return { x: prev.x, y: newY }
    })

    // Move platforms
    setPlatforms(prev => prev
      .map(p => ({ ...p, x: p.x - speed }))
      .filter(p => p.x > -100)
    )

    setDistance(prev => prev + speed)
    setScore(prev => prev + Math.floor(speed))
  }, [gameOver, speed, velocity, platforms])

  const resetGame = () => {
    setPlayerPos({ x: 50, y: 200 })
    setPlatforms([
      { id: 1, x: 0, y: 250, width: 200 },
      { id: 2, x: 250, y: 250, width: 100 },
      { id: 3, x: 400, y: 220, width: 100 }
    ])
    setScore(0)
    setDistance(0)
    setGameOver(false)
    setJumping(false)
    setVelocity({ x: 0, y: 0 })
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump])

  useEffect(() => {
    const gameLoop = setInterval(updateGame, 30)
    return () => clearInterval(gameLoop)
  }, [updateGame])

  useEffect(() => {
    if (platforms.length < 5) generatePlatform()
  }, [platforms, generatePlatform])

  useEffect(() => {
    const newLevel = Math.floor(distance / 1000) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setSpeed(Math.min(5 + newLevel, 15))
      setStars(Math.min(stars + 1, 12))
    }
  }, [distance, level, stars])

  useEffect(() => {
    resetGame()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Speed Runner - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/12</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Speed: {speed.toFixed(1)}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Run
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="relative h-96 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-lg overflow-hidden cursor-pointer"
          onClick={jump}
        >
          {/* Player */}
          <div
            className="absolute w-8 h-8 bg-red-500 rounded"
            style={{ 
              left: playerPos.x,
              top: playerPos.y,
              transform: jumping ? 'rotate(-15deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />

          {/* Platforms */}
          {platforms.map(platform => (
            <div
              key={platform.id}
              className="absolute bg-gray-800"
              style={{
                left: platform.x,
                top: platform.y,
                width: platform.width,
                height: 20
              }}
            />
          ))}

          {/* Distance indicator */}
          <div className="absolute top-4 right-4 text-white font-bold">
            Distance: {Math.floor(distance)}m
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-2">Distance: {Math.floor(distance)}m</p>
                <p className="text-lg mb-4">Score: {score}</p>
                <Button onClick={resetGame}>Try Again</Button>
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

export default SpeedRunner
