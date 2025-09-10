'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Heart, Trophy, Zap, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Fruit = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  type: 'apple' | 'orange' | 'watermelon' | 'banana' | 'bomb'
  sliced: boolean
  rotation: number
}

const FRUIT_EMOJIS = {
  apple: '🍎',
  orange: '🍊',
  watermelon: '🍉',
  banana: '🍌',
  bomb: '💣'
}

const FruitNinja: React.FC = () => {
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [isSlicing, setIsSlicing] = useState(false)
  const [sliceTrail, setSliceTrail] = useState<{ x: number; y: number }[]>([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [level, setLevel] = useState(1)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)

  const spawnFruit = useCallback(() => {
    if (gameOver) return
    
    const types: ('apple' | 'orange' | 'watermelon' | 'banana' | 'bomb')[] = 
      ['apple', 'orange', 'watermelon', 'banana']
    
    // Add bombs based on level
    if (Math.random() < 0.1 + level * 0.02) {
      types.push('bomb')
    }
    
    const type = types[Math.floor(Math.random() * types.length)]
    const side = Math.random() < 0.5 ? 'left' : 'right'
    
    const newFruit: Fruit = {
      id: Date.now() + Math.random(),
      x: side === 'left' ? -50 : window.innerWidth + 50,
      y: window.innerHeight - 100,
      vx: side === 'left' ? (5 + Math.random() * 5) : -(5 + Math.random() * 5),
      vy: -(15 + Math.random() * 10),
      type,
      sliced: false,
      rotation: 0
    }
    
    setFruits(prev => [...prev, newFruit])
  }, [gameOver, level])

  const updateFruits = useCallback(() => {
    setFruits(prev => prev.map(fruit => {
      if (fruit.sliced) return fruit
      
      return {
        ...fruit,
        x: fruit.x + fruit.vx,
        y: fruit.y + fruit.vy,
        vy: fruit.vy + 0.5, // gravity
        rotation: fruit.rotation + 5
      }
    }).filter(fruit => 
      fruit.y < window.innerHeight + 100 && 
      (fruit.sliced || fruit.x > -100 && fruit.x < window.innerWidth + 100)
    ))
  }, [])

  const sliceFruit = useCallback((fruit: Fruit) => {
    if (fruit.sliced) return
    
    if (fruit.type === 'bomb') {
      // Hit a bomb!
      setLives(prev => prev - 1)
      setCombo(0)
      if (lives <= 1) {
        setGameOver(true)
      }
    } else {
      // Sliced a fruit!
      const points = fruit.type === 'watermelon' ? 30 : 
                     fruit.type === 'banana' ? 20 : 10
      setScore(prev => prev + points * (1 + combo * 0.1))
      setCombo(prev => prev + 1)
      
      setFruits(prev => prev.map(f => 
        f.id === fruit.id ? { ...f, sliced: true } : f
      ))
      
      // Remove sliced fruit after animation
      setTimeout(() => {
        setFruits(prev => prev.filter(f => f.id !== fruit.id))
      }, 500)
    }
  }, [combo, lives])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsSlicing(true)
    setSliceTrail([{ x: e.clientX, y: e.clientY }])
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSlicing) return
    
    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX
    const y = e.clientY
    
    setSliceTrail(prev => [...prev.slice(-10), { x, y }])
    
    // Check for fruit collision
    fruits.forEach(fruit => {
      if (!fruit.sliced) {
        const distance = Math.sqrt(
          Math.pow(fruit.x - x, 2) + 
          Math.pow(fruit.y - y, 2)
        )
        if (distance < 50) {
          sliceFruit(fruit)
        }
      }
    })
  }, [isSlicing, fruits, sliceFruit])

  const handleMouseUp = useCallback(() => {
    setIsSlicing(false)
    setSliceTrail([])
    setTimeout(() => setCombo(0), 1000)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsSlicing(true)
    setSliceTrail([{ x: touch.clientX, y: touch.clientY }])
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSlicing) return
    
    const touch = e.touches[0]
    const x = touch.clientX
    const y = touch.clientY
    
    setSliceTrail(prev => [...prev.slice(-10), { x, y }])
    
    fruits.forEach(fruit => {
      if (!fruit.sliced) {
        const distance = Math.sqrt(
          Math.pow(fruit.x - x, 2) + 
          Math.pow(fruit.y - y, 2)
        )
        if (distance < 50) {
          sliceFruit(fruit)
        }
      }
    })
  }, [isSlicing, fruits, sliceFruit])

  const handleTouchEnd = useCallback(() => {
    setIsSlicing(false)
    setSliceTrail([])
    setTimeout(() => setCombo(0), 1000)
  }, [])

  const gameLoop = useCallback(() => {
    if (!gameOver) {
      updateFruits()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
  }, [gameOver, updateFruits])

  const resetGame = useCallback(() => {
    setFruits([])
    setScore(0)
    setCombo(0)
    setLives(3)
    setTimeLeft(60)
    setLevel(1)
    setGameOver(false)
    setIsSlicing(false)
    setSliceTrail([])
  }, [])

  // Spawn fruits periodically
  useEffect(() => {
    if (!gameOver) {
      const interval = setInterval(() => {
        spawnFruit()
      }, Math.max(500, 2000 - level * 100))
      
      return () => clearInterval(interval)
    }
  }, [gameOver, level, spawnFruit])

  // Game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  // Timer
  useEffect(() => {
    if (!gameOver && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      
      if (timeLeft === 0) {
        setGameOver(true)
      }
      
      return () => clearTimeout(timer)
    }
  }, [timeLeft, gameOver])

  // Level up
  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
    }
  }, [score, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Fruit Ninja - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Combo: x{combo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{Array(lives).fill('●').join(' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-500" />
              <span>{timeLeft}s</span>
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
          ref={gameAreaRef}
          className="relative h-[500px] bg-gradient-to-b from-sky-200 to-sky-400 dark:from-sky-800 dark:to-sky-900 rounded-lg overflow-hidden cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slice trail */}
          {sliceTrail.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none z-20">
              <polyline
                points={sliceTrail.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          )}
          
          {/* Fruits */}
          <AnimatePresence>
            {fruits.map(fruit => (
              <motion.div
                key={fruit.id}
                className="absolute text-5xl select-none pointer-events-none"
                style={{
                  left: fruit.x - 25,
                  top: fruit.y - 25,
                  transform: `rotate(${fruit.rotation}deg)`
                }}
                animate={{
                  scale: fruit.sliced ? [1, 1.5, 0] : 1,
                  opacity: fruit.sliced ? [1, 1, 0] : 1
                }}
                transition={{ duration: 0.5 }}
              >
                {fruit.sliced && fruit.type !== 'bomb' ? (
                  <div className="relative">
                    <span style={{ transform: 'translateX(-10px)' }}>
                      {FRUIT_EMOJIS[fruit.type]}
                    </span>
                    <span style={{ transform: 'translateX(10px)' }}>
                      {FRUIT_EMOJIS[fruit.type]}
                    </span>
                  </div>
                ) : (
                  FRUIT_EMOJIS[fruit.type]
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Combo display */}
          <AnimatePresence>
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white pointer-events-none"
              >
                {combo}x Combo!
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Game Over */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70"
              >
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                  <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                  <p className="text-xl mb-2">Final Score: {score}</p>
                  <p className="text-lg mb-4">Level Reached: {level}</p>
                  <Button onClick={resetGame} size="lg">
                    Play Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default FruitNinja