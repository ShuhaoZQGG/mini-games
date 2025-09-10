'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

const BUBBLE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFE66D']
const BUBBLE_RADIUS = 20
const ROWS = 10
const COLS = 15

type Bubble = {
  x: number
  y: number
  color: string
  id: number
}

type Projectile = {
  x: number
  y: number
  dx: number
  dy: number
  color: string
}

export function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'won'>('playing')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [currentBubble, setCurrentBubble] = useState<string>('')
  const [nextBubble, setNextBubble] = useState<string>('')
  const [projectile, setProjectile] = useState<Projectile | null>(null)
  const [aimAngle, setAimAngle] = useState(0)
  const animationFrameRef = useRef<number>()

  // Initialize game
  useEffect(() => {
    resetGame()
  }, [])

  const resetGame = () => {
    // Initialize bubble grid
    const initialBubbles: Bubble[] = []
    let id = 0
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < COLS - (row % 2); col++) {
        const x = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + (row % 2 ? BUBBLE_RADIUS : 0)
        const y = row * BUBBLE_RADIUS * 1.8 + BUBBLE_RADIUS
        initialBubbles.push({
          x,
          y,
          color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
          id: id++
        })
      }
    }
    
    setBubbles(initialBubbles)
    setCurrentBubble(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)])
    setNextBubble(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)])
    setScore(0)
    setLevel(1)
    setGameState('playing')
    setProjectile(null)
  }

  // Handle mouse movement for aiming
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || projectile) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height - 40
    
    const angle = Math.atan2(centerY - y, x - centerX)
    setAimAngle(angle)
  }, [projectile])

  // Handle shooting
  const handleClick = useCallback(() => {
    if (projectile || gameState !== 'playing') return
    
    const speed = 10
    setProjectile({
      x: 300,
      y: 360,
      dx: Math.cos(aimAngle) * speed,
      dy: -Math.abs(Math.sin(aimAngle)) * speed,
      color: currentBubble
    })
    
    setCurrentBubble(nextBubble)
    setNextBubble(BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)])
  }, [projectile, gameState, aimAngle, currentBubble, nextBubble])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#2C3E50'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw bubbles
      bubbles.forEach(bubble => {
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = bubble.color
        ctx.fill()
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()
      })
      
      // Draw aim line
      if (!projectile && gameState === 'playing') {
        ctx.beginPath()
        ctx.moveTo(300, 360)
        ctx.lineTo(
          300 + Math.cos(aimAngle) * 100,
          360 - Math.abs(Math.sin(aimAngle)) * 100
        )
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      // Draw current bubble
      if (!projectile) {
        ctx.beginPath()
        ctx.arc(300, 360, BUBBLE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = currentBubble
        ctx.fill()
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      // Update and draw projectile
      if (projectile) {
        // Update position
        const newProjectile = { ...projectile }
        newProjectile.x += projectile.dx
        newProjectile.y += projectile.dy
        
        // Wall collision
        if (newProjectile.x <= BUBBLE_RADIUS || newProjectile.x >= canvas.width - BUBBLE_RADIUS) {
          newProjectile.dx = -newProjectile.dx
        }
        
        // Ceiling collision or bubble collision
        if (newProjectile.y <= BUBBLE_RADIUS) {
          // Snap to grid
          const row = 0
          const col = Math.round((newProjectile.x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2))
          const snappedX = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS
          const snappedY = BUBBLE_RADIUS
          
          setBubbles(prev => [...prev, {
            x: snappedX,
            y: snappedY,
            color: projectile.color,
            id: Date.now()
          }])
          setProjectile(null)
          checkMatches(snappedX, snappedY, projectile.color)
        } else {
          // Check collision with existing bubbles
          let collision = false
          for (const bubble of bubbles) {
            const dist = Math.sqrt(
              Math.pow(newProjectile.x - bubble.x, 2) +
              Math.pow(newProjectile.y - bubble.y, 2)
            )
            if (dist < BUBBLE_RADIUS * 2) {
              collision = true
              // Snap to nearest grid position
              const row = Math.round((newProjectile.y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.8))
              const col = Math.round((newProjectile.x - BUBBLE_RADIUS - (row % 2 ? BUBBLE_RADIUS : 0)) / (BUBBLE_RADIUS * 2))
              const snappedX = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + (row % 2 ? BUBBLE_RADIUS : 0)
              const snappedY = row * BUBBLE_RADIUS * 1.8 + BUBBLE_RADIUS
              
              setBubbles(prev => [...prev, {
                x: snappedX,
                y: snappedY,
                color: projectile.color,
                id: Date.now()
              }])
              setProjectile(null)
              checkMatches(snappedX, snappedY, projectile.color)
              break
            }
          }
          
          if (!collision) {
            setProjectile(newProjectile)
            
            // Draw projectile
            ctx.beginPath()
            ctx.arc(newProjectile.x, newProjectile.y, BUBBLE_RADIUS, 0, Math.PI * 2)
            ctx.fillStyle = newProjectile.color
            ctx.fill()
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 2
            ctx.stroke()
          }
        }
      }
      
      // Draw next bubble preview
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = '16px Arial'
      ctx.fillText('Next:', 520, 350)
      ctx.beginPath()
      ctx.arc(550, 370, BUBBLE_RADIUS * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = nextBubble
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()
      
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
    
    gameLoop()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [bubbles, projectile, currentBubble, nextBubble, aimAngle, gameState])

  const checkMatches = (x: number, y: number, color: string) => {
    const matches: Set<number> = new Set()
    const toCheck: Bubble[] = [{ x, y, color, id: -1 }]
    const checked: Set<string> = new Set()
    
    while (toCheck.length > 0) {
      const current = toCheck.pop()!
      const key = `${Math.round(current.x)},${Math.round(current.y)}`
      
      if (checked.has(key)) continue
      checked.add(key)
      
      bubbles.forEach(bubble => {
        const dist = Math.sqrt(
          Math.pow(bubble.x - current.x, 2) +
          Math.pow(bubble.y - current.y, 2)
        )
        if (dist < BUBBLE_RADIUS * 2.5 && bubble.color === color) {
          matches.add(bubble.id)
          const bubbleKey = `${Math.round(bubble.x)},${Math.round(bubble.y)}`
          if (!checked.has(bubbleKey)) {
            toCheck.push(bubble)
          }
        }
      })
    }
    
    if (matches.size >= 2) {
      setBubbles(prev => prev.filter(b => !matches.has(b.id)))
      setScore(prev => prev + matches.size * 10 * level)
      
      // Check for floating bubbles and remove them
      checkFloatingBubbles()
      
      // Check win condition
      if (bubbles.length - matches.size === 0) {
        setGameState('won')
      }
    }
    
    // Check game over
    if (bubbles.some(b => b.y > 320)) {
      setGameState('gameOver')
    }
  }

  const checkFloatingBubbles = () => {
    // This is a simplified version - in a real game, you'd want to check which bubbles
    // are connected to the ceiling and remove those that aren't
    setBubbles(prev => prev.filter(b => b.y < 300))
  }

  // Mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [handleMouseMove, handleClick])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bubble Shooter</h1>
          <div className="flex justify-center gap-8 text-lg">
            <span className="font-semibold">Score: <span className="text-blue-600">{score}</span></span>
            <span className="font-semibold">Level: <span className="text-green-600">{level}</span></span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border-4 border-gray-800 rounded-lg cursor-crosshair"
        />

        {gameState !== 'playing' && (
          <div className="mt-6 text-center">
            <div className="text-2xl font-bold mb-4">
              {gameState === 'won' ? 'You Won!' : 'Game Over!'}
            </div>
            <Button onClick={resetGame} className="px-6 py-3">
              Play Again
            </Button>
          </div>
        )}

        <div className="mt-4 text-center text-gray-600">
          <p>Move mouse to aim, click to shoot</p>
          <p>Match 3 or more bubbles of the same color</p>
        </div>
      </div>
    </div>
  )
}