'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Zap, Star, Trophy, Heart } from 'lucide-react'

interface Enemy {
  id: number
  lane: number
  distance: number
  speed: number
  type: 'flipper' | 'tanker' | 'spike' | 'fuseball'
  color: string
}

interface Bullet {
  id: number
  lane: number
  distance: number
}

const Tempest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver'>('paused')
  const [playerLane, setPlayerLane] = useState(0)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [superzapper, setSuperzapper] = useState(2)
  const animationRef = useRef<number | undefined>(undefined)
  const keysPressed = useRef<Set<string>>(new Set())
  
  const LANES = 16
  const TUBE_DEPTH = 10

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key)
      
      if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') {
          setPlayerLane(prev => (prev - 1 + LANES) % LANES)
        } else if (e.key === 'ArrowRight') {
          setPlayerLane(prev => (prev + 1) % LANES)
        } else if (e.key === ' ') {
          shoot()
        } else if (e.key === 'z' && superzapper > 0) {
          useSuperzapper()
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, playerLane, superzapper])

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
  }, [gameState, enemies, bullets, playerLane])

  const updateGame = () => {
    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      const newDistance = enemy.distance - enemy.speed
      
      if (newDistance <= 0) {
        // Enemy reached player
        if (enemy.lane === playerLane) {
          setLives(prev => {
            const newLives = prev - 1
            if (newLives <= 0) {
              setGameState('gameOver')
            }
            return newLives
          })
        }
        return null
      }
      
      return { ...enemy, distance: newDistance }
    }).filter(Boolean) as Enemy[])
    
    // Update bullets
    setBullets(prev => {
      const newBullets: Bullet[] = []
      const enemiesToRemove: number[] = []
      
      prev.forEach(bullet => {
        const newDistance = bullet.distance + 0.5
        
        if (newDistance >= TUBE_DEPTH) {
          return // Bullet out of range
        }
        
        // Check collision with enemies
        let hit = false
        enemies.forEach(enemy => {
          if (enemy.lane === bullet.lane && 
              Math.abs(enemy.distance - newDistance) < 0.5) {
            enemiesToRemove.push(enemy.id)
            setScore(prev => prev + getEnemyPoints(enemy.type))
            hit = true
          }
        })
        
        if (!hit) {
          newBullets.push({ ...bullet, distance: newDistance })
        }
      })
      
      // Remove hit enemies
      if (enemiesToRemove.length > 0) {
        setEnemies(prev => prev.filter(e => !enemiesToRemove.includes(e.id)))
      }
      
      return newBullets
    })
    
    // Spawn enemies
    if (Math.random() < 0.02 * level) {
      spawnEnemy()
    }
    
    // Check level complete
    if (enemies.length === 0 && Math.random() < 0.01) {
      nextLevel()
    }
  }

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 200
    
    // Clear canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw tube lanes
    for (let i = 0; i < LANES; i++) {
      const angle = (i / LANES) * Math.PI * 2
      const nextAngle = ((i + 1) / LANES) * Math.PI * 2
      
      // Draw outer edge
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      )
      ctx.lineTo(
        centerX + Math.cos(nextAngle) * radius,
        centerY + Math.sin(nextAngle) * radius
      )
      ctx.stroke()
      
      // Draw depth lines
      ctx.strokeStyle = '#008800'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      )
      ctx.stroke()
    }
    
    // Draw inner perspective lines
    for (let d = 1; d <= TUBE_DEPTH; d++) {
      const innerRadius = radius * (1 - d / TUBE_DEPTH)
      
      ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 - d * 0.03})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    // Draw enemies
    enemies.forEach(enemy => {
      const angle = (enemy.lane / LANES) * Math.PI * 2
      const nextAngle = ((enemy.lane + 1) / LANES) * Math.PI * 2
      const enemyRadius = radius * (1 - enemy.distance / TUBE_DEPTH)
      
      ctx.fillStyle = enemy.color
      ctx.beginPath()
      ctx.moveTo(
        centerX + Math.cos(angle) * enemyRadius * 0.9,
        centerY + Math.sin(angle) * enemyRadius * 0.9
      )
      ctx.lineTo(
        centerX + Math.cos(nextAngle) * enemyRadius * 0.9,
        centerY + Math.sin(nextAngle) * enemyRadius * 0.9
      )
      ctx.lineTo(
        centerX + Math.cos(nextAngle) * enemyRadius * 1.1,
        centerY + Math.sin(nextAngle) * enemyRadius * 1.1
      )
      ctx.lineTo(
        centerX + Math.cos(angle) * enemyRadius * 1.1,
        centerY + Math.sin(angle) * enemyRadius * 1.1
      )
      ctx.closePath()
      ctx.fill()
    })
    
    // Draw bullets
    ctx.fillStyle = '#FFFF00'
    bullets.forEach(bullet => {
      const angle = ((bullet.lane + 0.5) / LANES) * Math.PI * 2
      const bulletRadius = radius * (1 - bullet.distance / TUBE_DEPTH)
      
      ctx.beginPath()
      ctx.arc(
        centerX + Math.cos(angle) * bulletRadius,
        centerY + Math.sin(angle) * bulletRadius,
        3,
        0,
        Math.PI * 2
      )
      ctx.fill()
    })
    
    // Draw player
    const playerAngle = (playerLane / LANES) * Math.PI * 2
    const playerNextAngle = ((playerLane + 1) / LANES) * Math.PI * 2
    
    ctx.strokeStyle = '#00FFFF'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(
      centerX + Math.cos(playerAngle) * radius,
      centerY + Math.sin(playerAngle) * radius
    )
    ctx.lineTo(
      centerX + Math.cos(playerNextAngle) * radius,
      centerY + Math.sin(playerNextAngle) * radius
    )
    ctx.stroke()
    
    // Draw player ship
    const shipAngle = ((playerLane + 0.5) / LANES) * Math.PI * 2
    ctx.fillStyle = '#00FFFF'
    ctx.beginPath()
    ctx.moveTo(
      centerX + Math.cos(shipAngle) * (radius + 10),
      centerY + Math.sin(shipAngle) * (radius + 10)
    )
    ctx.lineTo(
      centerX + Math.cos(shipAngle - 0.1) * (radius - 10),
      centerY + Math.sin(shipAngle - 0.1) * (radius - 10)
    )
    ctx.lineTo(
      centerX + Math.cos(shipAngle + 0.1) * (radius - 10),
      centerY + Math.sin(shipAngle + 0.1) * (radius - 10)
    )
    ctx.closePath()
    ctx.fill()
  }

  const spawnEnemy = () => {
    const types: Enemy['type'][] = ['flipper', 'tanker', 'spike', 'fuseball']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const colors = {
      flipper: '#FF0000',
      tanker: '#FF00FF',
      spike: '#FFFF00',
      fuseball: '#00FF00'
    }
    
    const speeds = {
      flipper: 0.02 + level * 0.005,
      tanker: 0.015 + level * 0.003,
      spike: 0.025 + level * 0.007,
      fuseball: 0.03 + level * 0.01
    }
    
    const newEnemy: Enemy = {
      id: Date.now() + Math.random(),
      lane: Math.floor(Math.random() * LANES),
      distance: TUBE_DEPTH,
      speed: speeds[type],
      type,
      color: colors[type]
    }
    
    setEnemies(prev => [...prev, newEnemy])
  }

  const shoot = () => {
    const newBullet: Bullet = {
      id: Date.now(),
      lane: playerLane,
      distance: 0
    }
    
    setBullets(prev => [...prev, newBullet])
  }

  const useSuperzapper = () => {
    setSuperzapper(prev => prev - 1)
    setEnemies([])
    setScore(prev => prev + 100)
  }

  const getEnemyPoints = (type: Enemy['type']): number => {
    const points = {
      flipper: 150,
      tanker: 100,
      spike: 200,
      fuseball: 250
    }
    return points[type]
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLevel(1)
    setLives(3)
    setSuperzapper(2)
    setEnemies([])
    setBullets([])
    setPlayerLane(0)
  }

  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setSuperzapper(2)
    setScore(prev => prev + 1000)
  }

  const reset = () => {
    startGame()
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    if (gameState !== 'gameOver') return 0
    if (score >= 10000) return 3
    if (score >= 5000) return 2
    if (score >= 1000) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Tempest</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Level: {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>Lives: {lives}</span>
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
              height={600}
              className="w-full bg-black"
              style={{ imageRendering: 'pixelated' }}
            />
            
            <div className="p-4 bg-gray-900 text-white">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Superzapper: {superzapper}
                  </div>
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
              
              <div className="mt-2 text-sm text-gray-400">
                Use Arrow Keys to move " Space to shoot " Z for Superzapper
              </div>
            </div>
      </CardContent>
    </Card>
  )
}

export default Tempest