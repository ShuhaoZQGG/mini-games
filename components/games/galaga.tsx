'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trophy, Gamepad2 } from 'lucide-react'

export default function Galaga() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [stars, setStars] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('galagaHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('galagaHighScore', score.toString())
    }
  }, [score, highScore])

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
  }

  const completeLevel = () => {
    const earnedStars = Math.floor(Math.random() * 3) + 1 // Placeholder logic
    setStars(earnedStars)
    setGameState('levelComplete')
  }

  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Galaga
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Galaga</h2>
              <p className="text-gray-600">Formation space shooter with patterns</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Select Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => startGame('easy')} variant="outline">
                  Easy
                </Button>
                <Button onClick={() => startGame('medium')} variant="outline">
                  Medium
                </Button>
                <Button onClick={() => startGame('hard')} variant="outline">
                  Hard
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="text-center space-y-4">
              <h3 className="text-xl">Game content goes here</h3>
              <p>This is a placeholder for Galaga gameplay</p>
              <Button onClick={completeLevel}>Complete Level (Test)</Button>
            </div>
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Level {level} Complete!</h2>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-12 h-12 ${
                    star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={nextLevel}>Next Level</Button>
              <Button onClick={resetGame} variant="outline">Main Menu</Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Game Over</h2>
            <p className="text-2xl font-bold">Final Score: {score}</p>
            <Button onClick={resetGame}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}