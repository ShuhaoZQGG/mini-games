'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Fuel, Compass } from 'lucide-react'

const GalaxyExplorer: React.FC = () => {
  const [shipPos, setShipPos] = useState({ x: 200, y: 200 })
  const [planets, setPlanets] = useState<{id: number, x: number, y: number, visited: boolean, size: number}[]>([])
  const [fuel, setFuel] = useState(100)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [discovered, setDiscovered] = useState(0)

  const generateGalaxy = useCallback(() => {
    const newPlanets = []
    for (let i = 0; i < 5 + level; i++) {
      newPlanets.push({
        id: i,
        x: Math.random() * 350 + 25,
        y: Math.random() * 350 + 25,
        visited: false,
        size: Math.random() * 20 + 20
      })
    }
    setPlanets(newPlanets)
  }, [level])

  const moveShip = useCallback((targetX: number, targetY: number) => {
    if (gameOver || fuel <= 0) return
    
    const distance = Math.sqrt((targetX - shipPos.x) ** 2 + (targetY - shipPos.y) ** 2)
    const fuelCost = Math.floor(distance / 10)
    
    if (fuel >= fuelCost) {
      setShipPos({ x: targetX, y: targetY })
      setFuel(prev => prev - fuelCost)
      
      // Check planet visits
      setPlanets(prev => prev.map(planet => {
        if (!planet.visited && Math.sqrt((planet.x - targetX) ** 2 + (planet.y - targetY) ** 2) < planet.size) {
          setScore(s => s + 100 * level)
          setDiscovered(d => d + 1)
          return { ...planet, visited: true }
        }
        return planet
      }))
    }
  }, [shipPos, fuel, gameOver, level])

  const refuelShip = () => {
    setFuel(100)
    setScore(prev => Math.max(0, prev - 50))
  }

  const resetGame = () => {
    setShipPos({ x: 200, y: 200 })
    setFuel(100)
    setScore(0)
    setDiscovered(0)
    setGameOver(false)
    generateGalaxy()
  }

  useEffect(() => {
    generateGalaxy()
  }, [generateGalaxy])

  useEffect(() => {
    if (fuel <= 0 && planets.some(p => !p.visited)) {
      setGameOver(true)
    }
    
    if (planets.length > 0 && planets.every(p => p.visited)) {
      setLevel(prev => prev + 1)
      setStars(prev => Math.min(prev + 1, 12))
      generateGalaxy()
      setFuel(100)
    }
  }, [fuel, planets, generateGalaxy])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Galaxy Explorer - Level {level}
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
              <Fuel className="w-5 h-5 text-green-500" />
              <span>{fuel}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500" />
              <span>{discovered}/{planets.length}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Galaxy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="relative h-96 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-lg overflow-hidden cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            moveShip(e.clientX - rect.left, e.clientY - rect.top)
          }}
        >
          {/* Stars background */}
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-50"
              style={{
                left: Math.random() * 400,
                top: Math.random() * 400
              }}
            />
          ))}

          {/* Planets */}
          {planets.map(planet => (
            <div
              key={planet.id}
              className={`absolute rounded-full transition-all ${
                planet.visited ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                left: planet.x - planet.size / 2,
                top: planet.y - planet.size / 2,
                width: planet.size,
                height: planet.size,
                backgroundColor: planet.visited ? '#666' : `hsl(${planet.id * 60}, 70%, 50%)`
              }}
            />
          ))}

          {/* Ship */}
          <div
            className="absolute text-2xl transition-all duration-500"
            style={{
              left: shipPos.x - 12,
              top: shipPos.y - 12
            }}
          >
            🚀
          </div>

          {/* Fuel warning */}
          {fuel < 20 && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded">
              Low Fuel!
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Mission Failed!</h2>
                <p className="text-lg mb-4">Out of fuel!</p>
                <Button onClick={resetGame}>Try Again</Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <Button onClick={refuelShip} variant="outline" disabled={fuel === 100}>
            Refuel (-50 points)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default GalaxyExplorer
