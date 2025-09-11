'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Fish, Heart } from 'lucide-react'

const FishTank: React.FC = () => {
  const [fish, setFish] = useState<{id: number, type: string, x: number, y: number, vx: number, health: number}[]>([])
  const [food, setFood] = useState<{id: number, x: number, y: number}[]>([])
  const [coins, setCoins] = useState(100)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [happiness, setHappiness] = useState(100)

  const fishTypes = ['🐠', '🐟', '🐡', '🦈', '🐙']

  const buyFish = () => {
    if (coins >= 50 && fish.length < 10) {
      setFish(prev => [...prev, {
        id: Date.now(),
        type: fishTypes[Math.floor(Math.random() * fishTypes.length)],
        x: Math.random() * 350 + 25,
        y: Math.random() * 250 + 50,
        vx: (Math.random() - 0.5) * 2,
        health: 100
      }])
      setCoins(prev => prev - 50)
    }
  }

  const feedFish = (x: number, y: number) => {
    if (coins >= 10) {
      setFood(prev => [...prev, { id: Date.now(), x, y }])
      setCoins(prev => prev - 10)
    }
  }

  const updateTank = useCallback(() => {
    setFish(prev => prev.map(f => {
      let newX = f.x + f.vx
      let newVx = f.vx
      
      if (newX < 20 || newX > 380) {
        newVx = -newVx
        newX = Math.max(20, Math.min(380, newX))
      }
      
      const newY = f.y + Math.sin(Date.now() / 1000 + f.id) * 2
      
      // Check for food
      let newHealth = f.health - 0.1
      food.forEach(foodItem => {
        if (Math.abs(foodItem.x - newX) < 30 && Math.abs(foodItem.y - newY) < 30) {
          newHealth = Math.min(100, newHealth + 20)
          setFood(prev => prev.filter(fo => fo.id !== foodItem.id))
          setCoins(prev => prev + 5)
        }
      })
      
      return { ...f, x: newX, y: newY, vx: newVx, health: Math.max(0, newHealth) }
    }).filter(f => f.health > 0))
  }, [food])

  const resetTank = () => {
    setFish([])
    setFood([])
    setCoins(100)
    setHappiness(100)
  }

  useEffect(() => {
    const interval = setInterval(updateTank, 100)
    return () => clearInterval(interval)
  }, [updateTank])

  useEffect(() => {
    const interval = setInterval(() => {
      setCoins(prev => prev + fish.length * 2)
    }, 2000)
    return () => clearInterval(interval)
  }, [fish])

  useEffect(() => {
    const avgHealth = fish.length > 0 
      ? fish.reduce((sum, f) => sum + f.health, 0) / fish.length 
      : 100
    setHappiness(Math.round(avgHealth))
  }, [fish])

  useEffect(() => {
    const newLevel = Math.floor(coins / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 9))
    }
  }, [coins, level, stars])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Fish className="w-6 h-6" />
          Fish Tank Manager - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{coins} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/9</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{happiness}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={buyFish} variant="outline" size="sm" disabled={coins < 50}>
              Buy Fish (50c)
            </Button>
            <Button onClick={resetTank} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="relative h-80 bg-gradient-to-b from-blue-300 to-blue-600 rounded-lg overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            feedFish(e.clientX - rect.left, e.clientY - rect.top)
          }}
        >
          {/* Fish */}
          {fish.map(f => (
            <div
              key={f.id}
              className="absolute text-2xl transition-all duration-100"
              style={{
                left: f.x - 15,
                top: f.y - 15,
                transform: f.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)'
              }}
            >
              {f.type}
              <div className="text-xs text-center">
                {f.health < 30 && '😰'}
              </div>
            </div>
          ))}
          
          {/* Food */}
          {food.map(f => (
            <div
              key={f.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{ left: f.x - 1, top: f.y - 1 }}
            />
          ))}
          
          {fish.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Buy fish to start!
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Click to drop food | Fish generate coins over time
        </div>
      </CardContent>
    </Card>
  )
}

export default FishTank
