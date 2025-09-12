'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Users, Target, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Ball = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  number: number
  isPocketed: boolean
  type: 'solid' | 'stripe' | 'cue' | 'eight'
}

const OnlinePool: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [balls, setBalls] = useState<Ball[]>([])
  const [cueBall, setCueBall] = useState<Ball | null>(null)
  const [isAiming, setIsAiming] = useState(false)
  const [aimAngle, setAimAngle] = useState(0)
  const [aimPower, setAimPower] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1')
  const [playerType, setPlayerType] = useState<'solid' | 'stripe' | null>(null)
  const [score, setScore] = useState({ player1: 0, player2: 0 })
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'foul'>('playing')
  const [winner, setWinner] = useState<string | null>(null)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [onlineRoom, setOnlineRoom] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [turnTime, setTurnTime] = useState(30)
  const animationRef = useRef<number>(0)

  const initializeBalls = useCallback(() => {
    const newBalls: Ball[] = []
    const ballRadius = 10
    const rackX = 500
    const rackY = 200
    
    // Cue ball
    const cue: Ball = {
      id: 0,
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      color: 'white',
      number: 0,
      isPocketed: false,
      type: 'cue'
    }
    newBalls.push(cue)
    setCueBall(cue)
    
    // Rack formation
    const colors = [
      '#FFD700', '#0000FF', '#FF0000', '#800080', '#FFA500',
      '#008000', '#8B4513', '#000000', '#FFD700', '#0000FF',
      '#FF0000', '#800080', '#FFA500', '#008000', '#8B4513'
    ]
    
    let ballIndex = 0
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        if (ballIndex < 15) {
          const x = rackX + row * ballRadius * 1.8
          const y = rackY + (col - row / 2) * ballRadius * 2.1
          
          newBalls.push({
            id: ballIndex + 1,
            x,
            y,
            vx: 0,
            vy: 0,
            color: colors[ballIndex],
            number: ballIndex + 1,
            isPocketed: false,
            type: ballIndex === 7 ? 'eight' : ballIndex < 7 ? 'solid' : 'stripe'
          })
          ballIndex++
        }
      }
    }
    
    setBalls(newBalls)
  }, [])

  const updatePhysics = useCallback(() => {
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        if (ball.isPocketed) return ball
        
        let newX = ball.x + ball.vx
        let newY = ball.y + ball.vy
        let newVx = ball.vx * 0.98 // Friction
        let newVy = ball.vy * 0.98
        
        // Table boundaries
        if (newX <= 10 || newX >= 790) {
          newVx = -newVx * 0.8
          newX = newX <= 10 ? 10 : 790
        }
        if (newY <= 10 || newY >= 390) {
          newVy = -newVy * 0.8
          newY = newY <= 10 ? 10 : 390
        }
        
        // Check pockets
        const pockets = [
          { x: 0, y: 0 }, { x: 400, y: 0 }, { x: 800, y: 0 },
          { x: 0, y: 400 }, { x: 400, y: 400 }, { x: 800, y: 400 }
        ]
        
        for (const pocket of pockets) {
          const dist = Math.sqrt((newX - pocket.x) ** 2 + (newY - pocket.y) ** 2)
          if (dist < 20) {
            if (ball.type === 'cue') {
              // Foul - respawn cue ball
              return { ...ball, x: 200, y: 200, vx: 0, vy: 0 }
            }
            return { ...ball, isPocketed: true, vx: 0, vy: 0 }
          }
        }
        
        // Stop if very slow
        if (Math.abs(newVx) < 0.1 && Math.abs(newVy) < 0.1) {
          newVx = 0
          newVy = 0
        }
        
        return { ...ball, x: newX, y: newY, vx: newVx, vy: newVy }
      })
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cueBall || cueBall.vx !== 0 || cueBall.vy !== 0) return
    setIsAiming(true)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x)
    setAimAngle(angle)
  }, [cueBall])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiming || !cueBall) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const angle = Math.atan2(y - cueBall.y, x - cueBall.x)
    const distance = Math.sqrt((x - cueBall.x) ** 2 + (y - cueBall.y) ** 2)
    
    setAimAngle(angle)
    setAimPower(Math.min(distance / 5, 20))
  }, [isAiming, cueBall])

  const handleMouseUp = useCallback(() => {
    if (!isAiming || !cueBall) return
    
    setBalls(prevBalls => 
      prevBalls.map(ball => 
        ball.id === 0 
          ? { ...ball, vx: Math.cos(aimAngle) * aimPower, vy: Math.sin(aimAngle) * aimPower }
          : ball
      )
    )
    
    setIsAiming(false)
    setAimPower(0)
    setTurnTime(30)
  }, [isAiming, cueBall, aimAngle, aimPower])

  const resetGame = useCallback(() => {
    initializeBalls()
    setCurrentPlayer('player1')
    setPlayerType(null)
    setScore({ player1: 0, player2: 0 })
    setGameStatus('playing')
    setWinner(null)
    setIsAiming(false)
    setAimAngle(0)
    setAimPower(0)
    setTurnTime(30)
  }, [initializeBalls])

  const joinOnlineRoom = () => {
    setIsOnline(true)
    setOnlineRoom(`POOL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
  }

  // Initialize game
  useEffect(() => {
    initializeBalls()
  }, [])

  // Physics loop
  useEffect(() => {
    const gameLoop = () => {
      updatePhysics()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updatePhysics])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#0a5f38'
    ctx.fillRect(0, 0, 800, 400)
    
    // Draw pockets
    const pockets = [
      { x: 0, y: 0 }, { x: 400, y: 0 }, { x: 800, y: 0 },
      { x: 0, y: 400 }, { x: 400, y: 400 }, { x: 800, y: 400 }
    ]
    
    ctx.fillStyle = '#000'
    pockets.forEach(pocket => {
      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, 20, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw balls
    balls.forEach(ball => {
      if (!ball.isPocketed) {
        ctx.fillStyle = ball.color
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2)
        ctx.fill()
        
        if (ball.type === 'stripe') {
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 3
          ctx.stroke()
        }
        
        if (ball.number > 0) {
          ctx.fillStyle = ball.type === 'eight' ? 'white' : 'black'
          ctx.font = '10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(ball.number.toString(), ball.x, ball.y)
        }
      }
    })
    
    // Draw aim line
    if (isAiming && cueBall) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(cueBall.x, cueBall.y)
      ctx.lineTo(
        cueBall.x + Math.cos(aimAngle) * (50 + aimPower * 5),
        cueBall.y + Math.sin(aimAngle) * (50 + aimPower * 5)
      )
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [balls, isAiming, cueBall, aimAngle, aimPower])

  // Turn timer
  useEffect(() => {
    if (gameStatus !== 'playing' || !isOnline) return
    
    const timer = setInterval(() => {
      setTurnTime(prev => {
        if (prev <= 1) {
          setCurrentPlayer(p => p === 'player1' ? 'player2' : 'player1')
          return 30
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [gameStatus, isOnline, currentPlayer])

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Online Pool (8-Ball) - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: {score.player1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/3 Stars</span>
            </div>
            {isOnline && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Room: {onlineRoom}</span>
              </div>
            )}
            {isOnline && (
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>Turn: {turnTime}s</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isOnline && (
              <Button onClick={joinOnlineRoom} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-1" />
                Play Online
              </Button>
            )}
            <Button onClick={resetGame} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              New Game
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {currentPlayer === 'player1' ? 'Your' : "Opponent's"} Turn
              {playerType && ` - ${playerType === 'solid' ? 'Solids' : 'Stripes'}`}
            </span>
          </div>
          
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="border-4 border-amber-800 rounded-lg cursor-crosshair mx-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Player 1</h3>
              <div className="flex flex-wrap gap-1">
                {balls.filter(b => b.type === 'solid' && b.isPocketed).map(ball => (
                  <div
                    key={ball.id}
                    className="w-6 h-6 rounded-full border-2 border-gray-600"
                    style={{ backgroundColor: ball.color }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Player 2</h3>
              <div className="flex flex-wrap gap-1">
                {balls.filter(b => b.type === 'stripe' && b.isPocketed).map(ball => (
                  <div
                    key={ball.id}
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: ball.color }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {gameStatus === 'won' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg"
              >
                <h3 className="text-2xl font-bold mb-2">{winner} Wins!</h3>
                <Button onClick={resetGame}>Play Again</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnlinePool