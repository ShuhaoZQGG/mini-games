'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Droplets, Sun } from 'lucide-react'

const ZenGarden: React.FC = () => {
  const [plants, setPlants] = useState<{id: number, type: string, growth: number, x: number, y: number}[]>([])
  const [water, setWater] = useState(100)
  const [sunlight, setSunlight] = useState(100)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [zen, setZen] = useState(0)

  const plantTypes = ['🌱', '🌿', '🌷', '🌹', '🌻', '🌺', '🌸', '🌼']

  const plantSeed = (x: number, y: number) => {
    if (water >= 10 && sunlight >= 10) {
      setPlants(prev => [...prev, {
        id: Date.now(),
        type: plantTypes[0],
        growth: 0,
        x,
        y
      }])
      setWater(prev => prev - 10)
      setSunlight(prev => prev - 10)
    }
  }

  const waterPlant = (plantId: number) => {
    if (water >= 5) {
      setPlants(prev => prev.map(plant => {
        if (plant.id === plantId && plant.growth < plantTypes.length - 1) {
          setScore(s => s + 10)
          setZen(z => z + 1)
          return {
            ...plant,
            growth: plant.growth + 1,
            type: plantTypes[Math.min(plant.growth + 1, plantTypes.length - 1)]
          }
        }
        return plant
      }))
      setWater(prev => prev - 5)
    }
  }

  const harvestPlant = (plantId: number) => {
    setPlants(prev => {
      const plant = prev.find(p => p.id === plantId)
      if (plant && plant.growth >= 3) {
        setScore(s => s + 50 * plant.growth)
        setZen(z => z + 5)
      }
      return prev.filter(p => p.id !== plantId)
    })
  }

  const resetGarden = () => {
    setPlants([])
    setWater(100)
    setSunlight(100)
    setScore(0)
    setZen(0)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setWater(prev => Math.min(100, prev + 1))
      setSunlight(prev => Math.min(100, prev + 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(stars + 1, 12))
    }
  }, [score, level, stars])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Zen Garden - Level {level}
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
              <Droplets className="w-5 h-5 text-blue-500" />
              <span>{water}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-400" />
              <span>{sunlight}%</span>
            </div>
          </div>
          <Button onClick={resetGarden} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Garden
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            Zen Level: {zen} 🧘
          </div>
          
          <div 
            className="relative h-96 bg-gradient-to-b from-green-100 to-green-300 dark:from-green-800 dark:to-green-600 rounded-lg cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              if (!plants.some(p => Math.abs(p.x - x) < 30 && Math.abs(p.y - y) < 30)) {
                plantSeed(x, y)
              }
            }}
          >
            {plants.map(plant => (
              <div
                key={plant.id}
                className="absolute cursor-pointer hover:scale-110 transition-transform"
                style={{ left: plant.x - 20, top: plant.y - 20 }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (plant.growth < 3) {
                    waterPlant(plant.id)
                  } else {
                    harvestPlant(plant.id)
                  }
                }}
              >
                <div className="text-3xl">{plant.type}</div>
                <div className="text-xs text-center">
                  {plant.growth < 3 ? '💧' : '✂️'}
                </div>
              </div>
            ))}
            
            {plants.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Click to plant seeds
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-600">
            Click empty space to plant | Click plants to water/harvest
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ZenGarden
