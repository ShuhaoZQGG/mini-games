'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Shield, Star, Trophy } from 'lucide-react'

interface Missile {
  id: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  x: number
  y: number
  speed: number
  active: boolean
}

interface Explosion {
  x: number
  y: number
  radius: number
  maxRadius: number
  growing: boolean
}

interface City {
  x: number
  y: number
  width: number
  height: number
  destroyed: boolean
}

const MissileCommand: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('paused')
  const [missiles, setMissiles] = useState<Missile[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [ammo, setAmmo] = useState(30)
  const [wave, setWave] = useState(1)
  const animationRef = useRef<number | undefined>(undefined)

  // Initialize cities
  useEffect(() => {
    const cityPositions = [100, 200, 300, 500, 600, 700]
    const newCities = cityPositions.map(x => ({
      x,
      y: 450,
      width: 60,
      height: 40,
      destroyed: false
    }))
    setCities(newCities)
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        updateGame()
        drawGame()
        animationRef.current = requestAnimationFrame(gameLoop)
      }
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, missiles, explosions, cities])

  const updateGame = () => {
    // Update missiles
    setMissiles(prev => prev.map(missile => {
      if (!missile.active) return missile
      
      const dx = missile.targetX - missile.startX
      const dy = missile.targetY - missile.startY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const moveX = (dx / distance) * missile.speed
      const moveY = (dy / distance) * missile.speed
      
      const newX = missile.x + moveX
      const newY = missile.y + moveY
      
      // Check if missile reached target
      if (newY >= missile.targetY) {
        // Check if hit a city
        cities.forEach(city => {
          if (!city.destroyed &&
              newX >= city.x && 
              newX <= city.x + city.width &&
              newY >= city.y) {
            city.destroyed = true
          }
        })
        
        return { ...missile, active: false }
      }
      
      // Check collision with explosions
      for (const explosion of explosions) {
        const dist = Math.sqrt((newX - explosion.x) ** 2 + (newY - explosion.y) ** 2)
        if (dist < explosion.radius) {
          setScore(prev => prev + 10)
          return { ...missile, active: false }
        }
      }
      
      return { ...missile, x: newX, y: newY }
    }).filter(m => m.active))
    
    // Update explosions
    setExplosions(prev => prev.map(explosion => {
      if (explosion.growing) {
        const newRadius = explosion.radius + 2
        if (newRadius >= explosion.maxRadius) {
          return { ...explosion, radius: newRadius, growing: false }
        }
        return { ...explosion, radius: newRadius }
      } else {
        const newRadius = explosion.radius - 1
        if (newRadius <= 0) {
          return null
        }
        return { ...explosion, radius: newRadius }
      }
    }).filter(Boolean) as Explosion[])
    
    // Spawn new missiles
    if (Math.random() < 0.02 * level) {
      spawnMissile()
    }
    
    // Check game over
    if (cities.every(c => c.destroyed)) {
      setGameState('gameOver')
    }
    
    // Check wave complete
    if (missiles.length === 0 && wave * 10 <= score / 10) {
      nextWave()
    }
  }

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw ground
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(0, 480, canvas.width, 20)
    
    // Draw cities
    cities.forEach(city => {
      if (!city.destroyed) {
        ctx.fillStyle = '#00FF00'
        ctx.fillRect(city.x, city.y, city.width, city.height)
        
        // Draw windows
        ctx.fillStyle = '#FFFF00'
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            ctx.fillRect(city.x + 10 + i * 15, city.y + 10 + j * 15, 5, 5)
          }
        }
      } else {
        ctx.fillStyle = '#FF0000'
        ctx.fillRect(city.x, city.y + 20, city.width, 20)
      }
    })
    
    // Draw missile bases
    ctx.fillStyle = '#0000FF'
    ctx.beginPath()
    ctx.moveTo(20, 480)
    ctx.lineTo(40, 460)
    ctx.lineTo(60, 480)
    ctx.closePath()
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(370, 480)
    ctx.lineTo(400, 460)
    ctx.lineTo(430, 480)
    ctx.closePath()
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(740, 480)
    ctx.lineTo(760, 460)
    ctx.lineTo(780, 480)
    ctx.closePath()
    ctx.fill()
    
    // Draw missiles
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    missiles.forEach(missile => {
      if (missile.active) {
        ctx.beginPath()
        ctx.moveTo(missile.startX, missile.startY)
        ctx.lineTo(missile.x, missile.y)
        ctx.stroke()
        
        // Draw missile head
        ctx.fillStyle = '#FFFF00'
        ctx.beginPath()
        ctx.arc(missile.x, missile.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    
    // Draw explosions
    explosions.forEach(explosion => {
      const gradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, explosion.radius)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.8)')
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw crosshair (optional)
    // You can add mouse tracking here
  }

  const spawnMissile = () => {
    const startX = Math.random() * 800
    const targetCity = cities.filter(c => !c.destroyed)[Math.floor(Math.random() * cities.filter(c => !c.destroyed).length)]
    
    if (targetCity) {
      const newMissile: Missile = {
        id: Date.now() + Math.random(),
        startX,
        startY: 0,
        targetX: targetCity.x + targetCity.width / 2,
        targetY: targetCity.y,
        x: startX,
        y: 0,
        speed: 1 + level * 0.5,
        active: true
      }
      
      setMissiles(prev => [...prev, newMissile])
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || ammo <= 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Create explosion at click point
    const newExplosion: Explosion = {
      x,
      y,
      radius: 5,
      maxRadius: 40,
      growing: true
    }
    
    setExplosions(prev => [...prev, newExplosion])
    setAmmo(prev => prev - 1)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLevel(1)
    setWave(1)
    setAmmo(30)
    setMissiles([])
    setExplosions([])
    setCities(cities.map(c => ({ ...c, destroyed: false })))
  }

  const nextWave = () => {
    setWave(prev => prev + 1)
    setLevel(prev => Math.min(prev + 0.5, 10))
    setAmmo(prev => prev + 20)
    setScore(prev => prev + 100)
  }

  const reset = () => {
    startGame()
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    if (gameState !== 'gameOver') return 0
    const citiesRemaining = cities.filter(c => !c.destroyed).length
    if (citiesRemaining >= 5) return 3
    if (citiesRemaining >= 3) return 2
    if (citiesRemaining >= 1) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Missile Command</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>Cities: {cities.filter(c => !c.destroyed).length}/6</span>
            </div>
          </div>
          <div className="flex gap-2">
            {gameState === 'gameOver' && (
              <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      getStarRating() >= star
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            <Button onClick={reset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              New Game
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onClick={handleCanvasClick}
              className="w-full bg-black cursor-crosshair"
              style={{ imageRendering: 'pixelated' }}
            />
            
            <div className="p-4 bg-gray-900 text-white">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div>Wave: {wave}</div>
                  <div>Ammo: {ammo}</div>
                </div>
                
                <div className="flex gap-2">
                  {gameState === 'paused' && (
                    <Button onClick={startGame} variant="default">
                      Start Game
                    </Button>
                  )}
                  
                  {gameState === 'gameOver' && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">Game Over!</span>
                    </div>
                  )}
                  
                  {gameState === 'playing' && (
                    <Button onClick={() => setGameState('paused')} variant="outline">
                      Pause
                    </Button>
                  )}
                </div>
              </div>
            </div>
      </CardContent>
    </Card>
  )
}

export default MissileCommand