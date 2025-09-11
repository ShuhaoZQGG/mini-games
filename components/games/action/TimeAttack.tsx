'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Clock, Target } from 'lucide-react'

const TimeAttack: React.FC = () => {
  const [targets, setTargets] = useState<{id: number, x: number, y: number, size: number, points: number}[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)

  const spawnTarget = useCallback(() => {
    const size = 30 + Math.random() * 40
    const points = Math.floor(100 / (size / 30))
    
    setTargets(prev => [...prev, {
      id: Date.now(),
      x: Math.random() * 350,
      y: Math.random() * 350,
      size,
      points
    }])
  }, [])

  const hitTarget = useCallback((targetId: number) => {
    setTargets(prev => {
      const target = prev.find(t => t.id === targetId)
      if (target) {
        setScore(s => s + target.points * (1 + combo * 0.1))
        setCombo(c => c + 1)
        setHits(h => h + 1)
        setTimeout(() => setCombo(0), 2000)
      }
      return prev.filter(t => t.id !== targetId)
    })
  }, [combo])

  const missClick = () => {
    setCombo(0)
    setMisses(prev => prev + 1)
    setScore(prev => Math.max(0, prev - 10))
  }

  const resetGame = () => {
    setTargets([])
    setScore(0)
    setTimeLeft(30)
    setCombo(0)
    setHits(0)
    setMisses(0)
    setGameOver(false)
  }

  useEffect(() => {
    if (!gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameOver])

  useEffect(() => {
    if (!gameOver) {
      const interval = setInterval(spawnTarget, 1500 - level * 100)
      return () => clearInterval(interval)
    }
  }, [spawnTarget, level, gameOver])

  useEffect(() => {
    if (!gameOver) {
      const cleanup = setTimeout(() => {
        setTargets(prev => prev.slice(-5))
      }, 3000)
      return () => clearTimeout(cleanup)
    }
  }, [targets, gameOver])

  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 9))
      setTimeLeft(prev => prev + 10)
    }
  }, [score, level, stars])

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Time Attack - Level {level}
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
              <Clock className="w-5 h-5 text-red-500" />
              <span>{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <span>{accuracy}%</span>
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
          className="relative h-96 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg overflow-hidden cursor-crosshair"
          onClick={(e) => {
            if (e.target === e.currentTarget) missClick()
          }}
        >
          {/* Targets */}
          {targets.map(target => (
            <div
              key={target.id}
              className="absolute rounded-full bg-white border-4 border-red-600 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center font-bold"
              style={{
                left: target.x,
                top: target.y,
                width: target.size,
                height: target.size
              }}
              onClick={(e) => {
                e.stopPropagation()
                hitTarget(target.id)
              }}
            >
              {target.points}
            </div>
          ))}

          {/* Combo indicator */}
          {combo > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold">
              {combo}x COMBO!
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
                <p className="text-xl mb-2">Final Score: {score}</p>
                <p className="text-lg mb-2">Accuracy: {accuracy}%</p>
                <p className="text-lg mb-4">Hits: {hits} | Misses: {misses}</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TimeAttack
