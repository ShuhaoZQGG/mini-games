'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Heart, Zap } from 'lucide-react'

const TankBattle: React.FC = () => {
  const [playerPos, setPlayerPos] = useState({x: 400, y: 300})
  const [playerAngle, setPlayerAngle] = useState(0)
  const [enemies, setEnemies] = useState<any[]>([])
  const [bullets, setBullets] = useState<any[]>([])
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [powerUps, setPowerUps] = useState<any[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [keys, setKeys] = useState({w: false, a: false, s: false, d: false})
  
  const spawnEnemy = useCallback(() => {
    if (enemies.length < 5) {
      setEnemies(prev => [...prev, {
        id: Date.now(),
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        angle: Math.random() * 360
      }])
    }
  }, [enemies])
  
  const shoot = useCallback((fromX: number, fromY: number, angle: number, isPlayer: boolean) => {
    const rad = (angle * Math.PI) / 180
    setBullets(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: fromX,
      y: fromY,
      vx: Math.cos(rad) * 10,
      vy: Math.sin(rad) * 10,
      isPlayer
    }])
  }, [])
  
  const gameLoop = useCallback(() => {
    if (gameOver) return
    
    // Move player
    setPlayerPos(prev => {
      let newX = prev.x
      let newY = prev.y
      if (keys.w) newY -= 5
      if (keys.s) newY += 5
      if (keys.a) newX -= 5
      if (keys.d) newX += 5
      return {
        x: Math.max(20, Math.min(780, newX)),
        y: Math.max(20, Math.min(580, newY))
      }
    })
    
    // Move bullets
    setBullets(prev => prev.map(b => ({
      ...b,
      x: b.x + b.vx,
      y: b.y + b.vy
    })).filter(b => b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600))
    
    // Enemy AI
    setEnemies(prev => prev.map(e => {
      const dx = playerPos.x - e.x
      const dy = playerPos.y - e.y
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      
      if (Math.random() < 0.01) {
        shoot(e.x, e.y, angle, false)
      }
      
      return {
        ...e,
        x: e.x + Math.cos(angle * Math.PI / 180) * 2,
        y: e.y + Math.sin(angle * Math.PI / 180) * 2,
        angle
      }
    }))
    
    // Check collisions
    bullets.forEach(b => {
      if (b.isPlayer) {
        enemies.forEach(e => {
          if (Math.abs(b.x - e.x) < 30 && Math.abs(b.y - e.y) < 30) {
            setEnemies(prev => prev.filter(en => en.id !== e.id))
            setScore(prev => prev + 100)
            setBullets(prev => prev.filter(bu => bu.id !== b.id))
          }
        })
      } else {
        if (Math.abs(b.x - playerPos.x) < 30 && Math.abs(b.y - playerPos.y) < 30) {
          setHealth(prev => prev - 10)
          setBullets(prev => prev.filter(bu => bu.id !== b.id))
        }
      }
    })
    
    if (health <= 0) {
      setGameOver(true)
    }
  }, [gameOver, keys, playerPos, bullets, enemies, health, shoot])
  
  useEffect(() => {
    const interval = setInterval(gameLoop, 50)
    return () => clearInterval(interval)
  }, [gameLoop])
  
  useEffect(() => {
    const spawnInterval = setInterval(spawnEnemy, 3000)
    return () => clearInterval(spawnInterval)
  }, [spawnEnemy])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({...prev, [key]: true}))
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeys(prev => ({...prev, [key]: false}))
      }
    }
    
    const handleClick = (e: MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const angle = Math.atan2(y - playerPos.y, x - playerPos.x) * 180 / Math.PI
      shoot(playerPos.x, playerPos.y, angle, true)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('click', handleClick)
    }
  }, [playerPos, shoot])
  
  const resetGame = () => {
    setPlayerPos({x: 400, y: 300})
    setEnemies([])
    setBullets([])
    setScore(0)
    setHealth(100)
    setGameOver(false)
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Tank Battle</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{health}%</span>
            </div>
            <span>Enemies: {enemies.length}</span>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[600px] bg-gradient-to-br from-green-800 to-green-900 rounded-lg overflow-hidden cursor-crosshair">
          {/* Player Tank */}
          <div className="absolute text-3xl"
               style={{
                 left: `${playerPos.x - 15}px`,
                 top: `${playerPos.y - 15}px`,
                 transform: `rotate(${playerAngle}deg)`
               }}>
            🟦
          </div>
          
          {/* Enemies */}
          {enemies.map(e => (
            <div key={e.id}
                 className="absolute text-3xl"
                 style={{
                   left: `${e.x - 15}px`,
                   top: `${e.y - 15}px`,
                   transform: `rotate(${e.angle}deg)`
                 }}>
              🟥
            </div>
          ))}
          
          {/* Bullets */}
          {bullets.map(b => (
            <div key={b.id}
                 className="absolute w-2 h-2 rounded-full"
                 style={{
                   left: `${b.x - 4}px`,
                   top: `${b.y - 4}px`,
                   backgroundColor: b.isPlayer ? 'yellow' : 'red'
                 }} />
          ))}
          
          <div className="absolute bottom-4 left-4 text-white">
            WASD: Move | Click: Shoot
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <p className="mb-4">Final Score: {score}</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TankBattle
