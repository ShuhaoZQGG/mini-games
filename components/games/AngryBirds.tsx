'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Target } from 'lucide-react'

const AngryBirds: React.FC = () => {
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [birds, setBirds] = useState(3)
  const [aiming, setAiming] = useState(false)
  const [aimAngle, setAimAngle] = useState(45)
  const [aimPower, setAimPower] = useState(50)
  const [projectiles, setProjectiles] = useState<any[]>([])
  const [targets, setTargets] = useState<{id: number, x: number, y: number, hit: boolean}[]>([])
  const [gameOver, setGameOver] = useState(false)
  
  const initLevel = useCallback(() => {
    const newTargets = []
    for (let i = 0; i < 3 + level; i++) {
      newTargets.push({
        id: i,
        x: 400 + i * 60,
        y: 300 - Math.random() * 150,
        hit: false
      })
    }
    setTargets(newTargets)
    setBirds(3)
  }, [level])
  
  const launch = useCallback(() => {
    if (birds <= 0) return
    
    const radians = (aimAngle * Math.PI) / 180
    const vx = Math.cos(radians) * aimPower / 10
    const vy = -Math.sin(radians) * aimPower / 10
    
    setProjectiles(prev => [...prev, {
      id: Date.now(),
      x: 100,
      y: 300,
      vx,
      vy
    }])
    
    setBirds(prev => prev - 1)
    setAiming(false)
  }, [aimAngle, aimPower, birds])
  
  const updatePhysics = useCallback(() => {
    setProjectiles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.3 // gravity
    })).filter(p => p.x < 800 && p.y < 400))
    
    // Check collisions
    projectiles.forEach(p => {
      targets.forEach(t => {
        if (!t.hit && Math.abs(p.x - t.x) < 30 && Math.abs(p.y - t.y) < 30) {
          setTargets(prev => prev.map(target => 
            target.id === t.id ? {...target, hit: true} : target
          ))
          setScore(prev => prev + 100)
        }
      })
    })
    
    // Check level complete
    if (targets.every(t => t.hit)) {
      setLevel(prev => prev + 1)
      initLevel()
    } else if (birds === 0 && projectiles.length === 0) {
      setGameOver(true)
    }
  }, [projectiles, targets, birds, initLevel])
  
  useEffect(() => {
    initLevel()
  }, [initLevel])
  
  useEffect(() => {
    const interval = setInterval(updatePhysics, 50)
    return () => clearInterval(interval)
  }, [updatePhysics])
  
  const resetGame = () => {
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setProjectiles([])
    initLevel()
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Angry Birds - Level {level}</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              <span>Birds: {birds}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-gradient-to-b from-sky-300 to-green-300 rounded-lg overflow-hidden">
          {/* Slingshot */}
          <div className="absolute bottom-20 left-20 text-4xl">Y</div>
          
          {/* Aiming UI */}
          {aiming && (
            <div className="absolute bottom-32 left-32">
              <div>Angle: {aimAngle}°</div>
              <input type="range" min="0" max="90" value={aimAngle} 
                     onChange={(e) => setAimAngle(Number(e.target.value))} />
              <div>Power: {aimPower}%</div>
              <input type="range" min="10" max="100" value={aimPower}
                     onChange={(e) => setAimPower(Number(e.target.value))} />
              <Button onClick={launch} size="sm" className="mt-2">Launch!</Button>
            </div>
          )}
          
          {/* Birds waiting */}
          {!aiming && birds > 0 && (
            <Button 
              className="absolute bottom-20 left-24"
              onClick={() => setAiming(true)}
              size="sm"
            >
              🐦 Aim
            </Button>
          )}
          
          {/* Projectiles */}
          {projectiles.map(p => (
            <div key={p.id} 
                 className="absolute text-2xl"
                 style={{
                   left: `${p.x}px`,
                   bottom: `${400 - p.y}px`
                 }}>
              🐦
            </div>
          ))}
          
          {/* Targets */}
          {targets.map(t => !t.hit && (
            <div key={t.id}
                 className="absolute text-3xl"
                 style={{
                   left: `${t.x}px`,
                   bottom: `${400 - t.y}px`
                 }}>
              🐷
            </div>
          ))}
          
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

export default AngryBirds
