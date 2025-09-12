'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameLevel } from '@/types/game'

interface BubbleConfig {
  colors: number
  rows: number
  shooterSpeed: number
  dropSpeed: number
  specialBubbles: boolean
}

const levels: GameLevel[] = [
  { id: 1, name: 'Easy Mode', difficulty: 'easy', config: { colors: 4, rows: 8, shooterSpeed: 5, dropSpeed: 0, specialBubbles: false } as BubbleConfig },
  { id: 2, name: 'Medium Mode', difficulty: 'medium', config: { colors: 5, rows: 10, shooterSpeed: 6, dropSpeed: 0.1, specialBubbles: false } as BubbleConfig },
  { id: 3, name: 'Hard Mode', difficulty: 'hard', config: { colors: 6, rows: 12, shooterSpeed: 7, dropSpeed: 0.2, specialBubbles: true } as BubbleConfig },
  { id: 4, name: 'Expert Mode', difficulty: 'expert', config: { colors: 7, rows: 14, shooterSpeed: 8, dropSpeed: 0.3, specialBubbles: true } as BubbleConfig },
  { id: 5, name: 'Master Mode', difficulty: 'master', config: { colors: 8, rows: 16, shooterSpeed: 9, dropSpeed: 0.4, specialBubbles: true } as BubbleConfig }
]

interface Bubble {
  x: number
  y: number
  vx: number
  vy: number
  color: number
  row?: number
  col?: number
  isMoving?: boolean
}

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BUBBLE_RADIUS = 20
const ROWS = 12
const COLS = 10

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#FF7979', '#686DE0', '#F8B739'
]

export default function BubbleShooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [bubbles, setBubbles] = useState<Bubble[][]>([])
  const [currentBubble, setCurrentBubble] = useState<Bubble | null>(null)
  const [nextBubble, setNextBubble] = useState<Bubble | null>(null)
  const [shooterAngle, setShooterAngle] = useState(0)
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(0)

  const level = levels[currentLevel - 1]
  const config = level.config as BubbleConfig

  const initializeGrid = useCallback(() => {
    const grid: Bubble[][] = []
    for (let row = 0; row < config.rows; row++) {
      grid[row] = []
      const offset = row % 2 === 0 ? 0 : BUBBLE_RADIUS
      const colsInRow = row % 2 === 0 ? COLS : COLS - 1
      
      for (let col = 0; col < colsInRow; col++) {
        if (Math.random() < 0.8) { // 80% chance of bubble
          grid[row][col] = {
            x: col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + offset,
            y: row * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS,
            vx: 0,
            vy: 0,
            color: Math.floor(Math.random() * config.colors),
            row,
            col
          }
        }
      }
    }
    return grid
  }, [config.rows, config.colors])

  const createNewBubble = useCallback(() => {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - BUBBLE_RADIUS * 2,
      vx: 0,
      vy: 0,
      color: Math.floor(Math.random() * config.colors),
      isMoving: false
    }
  }, [config.colors])

  useEffect(() => {
    setBubbles(initializeGrid())
    setCurrentBubble(createNewBubble())
    setNextBubble(createNewBubble())
    setGameOver(false)
    setCombo(0)
  }, [currentLevel, initializeGrid, createNewBubble])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || gameOver) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const dx = x - CANVAS_WIDTH / 2
    const dy = y - (CANVAS_HEIGHT - BUBBLE_RADIUS * 2)
    const angle = Math.atan2(dy, dx)
    
    // Limit angle between -80 and 80 degrees
    const limitedAngle = Math.max(-1.4, Math.min(1.4, angle))
    setShooterAngle(limitedAngle)
  }

  const shoot = () => {
    if (!currentBubble || currentBubble.isMoving || gameOver) return
    
    const speed = config.shooterSpeed
    const newBubble = {
      ...currentBubble,
      vx: Math.cos(shooterAngle) * speed,
      vy: Math.sin(shooterAngle) * speed,
      isMoving: true
    }
    
    setCurrentBubble(newBubble)
  }

  const checkCollision = (bubble: Bubble, grid: Bubble[][]): { row: number, col: number } | null => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < (row % 2 === 0 ? COLS : COLS - 1); col++) {
        if (grid[row][col]) {
          const dx = bubble.x - grid[row][col].x
          const dy = bubble.y - grid[row][col].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < BUBBLE_RADIUS * 2) {
            return { row, col }
          }
        }
      }
    }
    
    // Check if bubble reached the top
    if (bubble.y <= BUBBLE_RADIUS) {
      const col = Math.round((bubble.x - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 2))
      return { row: 0, col: Math.max(0, Math.min(COLS - 1, col)) }
    }
    
    return null
  }

  const snapToGrid = (bubble: Bubble): { row: number, col: number } => {
    const row = Math.round((bubble.y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.7))
    const offset = row % 2 === 0 ? 0 : BUBBLE_RADIUS
    const col = Math.round((bubble.x - BUBBLE_RADIUS - offset) / (BUBBLE_RADIUS * 2))
    
    return { 
      row: Math.max(0, Math.min(ROWS - 1, row)),
      col: Math.max(0, Math.min(row % 2 === 0 ? COLS - 1 : COLS - 2, col))
    }
  }

  const findMatches = (grid: Bubble[][], row: number, col: number, color: number): Set<string> => {
    const matches = new Set<string>()
    const toCheck = [`${row},${col}`]
    const checked = new Set<string>()
    
    while (toCheck.length > 0) {
      const key = toCheck.pop()!
      if (checked.has(key)) continue
      checked.add(key)
      
      const [r, c] = key.split(',').map(Number)
      if (!grid[r] || !grid[r][c] || grid[r][c].color !== color) continue
      
      matches.add(key)
      
      // Check neighbors (hexagonal grid)
      const offset = r % 2 === 0 ? -1 : 0
      const neighbors = [
        [r - 1, c + offset], [r - 1, c + offset + 1],
        [r, c - 1], [r, c + 1],
        [r + 1, c + offset], [r + 1, c + offset + 1]
      ]
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < (nr % 2 === 0 ? COLS : COLS - 1)) {
          const nKey = `${nr},${nc}`
          if (!checked.has(nKey)) {
            toCheck.push(nKey)
          }
        }
      }
    }
    
    return matches
  }

  const removeFloatingBubbles = (grid: Bubble[][]): number => {
    const connected = new Set<string>()
    const toCheck: string[] = []
    
    // Find all bubbles connected to the top
    for (let col = 0; col < (COLS); col++) {
      if (grid[0][col]) {
        toCheck.push(`0,${col}`)
      }
    }
    
    while (toCheck.length > 0) {
      const key = toCheck.pop()!
      if (connected.has(key)) continue
      connected.add(key)
      
      const [r, c] = key.split(',').map(Number)
      const offset = r % 2 === 0 ? -1 : 0
      const neighbors = [
        [r - 1, c + offset], [r - 1, c + offset + 1],
        [r, c - 1], [r, c + 1],
        [r + 1, c + offset], [r + 1, c + offset + 1]
      ]
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < grid.length && nc >= 0 && nc < (nr % 2 === 0 ? COLS : COLS - 1)) {
          if (grid[nr][nc]) {
            const nKey = `${nr},${nc}`
            if (!connected.has(nKey)) {
              toCheck.push(nKey)
            }
          }
        }
      }
    }
    
    // Remove floating bubbles
    let removed = 0
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < (row % 2 === 0 ? COLS : COLS - 1); col++) {
        if (grid[row][col] && !connected.has(`${row},${col}`)) {
          grid[row][col] = null as any
          removed++
        }
      }
    }
    
    return removed
  }

  const updateGame = useCallback(() => {
    if (!currentBubble || !currentBubble.isMoving || gameOver) return
    
    const bubble = { ...currentBubble }
    bubble.x += bubble.vx
    bubble.y += bubble.vy
    
    // Wall collision
    if (bubble.x - BUBBLE_RADIUS <= 0 || bubble.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
      bubble.vx = -bubble.vx
      bubble.x = Math.max(BUBBLE_RADIUS, Math.min(CANVAS_WIDTH - BUBBLE_RADIUS, bubble.x))
    }
    
    // Check collision with other bubbles
    const collision = checkCollision(bubble, bubbles)
    
    if (collision || bubble.y <= BUBBLE_RADIUS) {
      const pos = collision || snapToGrid(bubble)
      const newGrid = [...bubbles]
      
      // Place the bubble
      if (!newGrid[pos.row]) newGrid[pos.row] = []
      const offset = pos.row % 2 === 0 ? 0 : BUBBLE_RADIUS
      newGrid[pos.row][pos.col] = {
        x: pos.col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + offset,
        y: pos.row * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS,
        vx: 0,
        vy: 0,
        color: bubble.color,
        row: pos.row,
        col: pos.col
      }
      
      // Check for matches
      const matches = findMatches(newGrid, pos.row, pos.col, bubble.color)
      
      if (matches.size >= 3) {
        // Remove matched bubbles
        for (const key of matches) {
          const [r, c] = key.split(',').map(Number)
          newGrid[r][c] = null as any
        }
        
        // Remove floating bubbles
        const floatingRemoved = removeFloatingBubbles(newGrid)
        
        // Calculate score
        const matchScore = matches.size * 100
        const floatingScore = floatingRemoved * 150
        const comboMultiplier = 1 + combo * 0.5
        const levelMultiplier = currentLevel
        const totalScore = Math.round((matchScore + floatingScore) * comboMultiplier * levelMultiplier)
        
        setScore(score + totalScore)
        setCombo(combo + 1)
      } else {
        setCombo(0)
      }
      
      // Check game over
      if (pos.row >= ROWS - 2) {
        setGameOver(true)
        if (score > highScore) {
          setHighScore(score)
        }
      }
      
      setBubbles(newGrid)
      setCurrentBubble(nextBubble)
      setNextBubble(createNewBubble())
    } else {
      setCurrentBubble(bubble)
    }
  }, [currentBubble, bubbles, gameOver, score, combo, currentLevel, nextBubble, createNewBubble, highScore])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw grid bubbles
    bubbles.forEach(row => {
      row?.forEach(bubble => {
        if (bubble) {
          ctx.fillStyle = COLORS[bubble.color]
          ctx.beginPath()
          ctx.arc(bubble.x, bubble.y, BUBBLE_RADIUS, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    })
    
    // Draw aim line
    if (!gameOver && currentBubble && !currentBubble.isMoving) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - BUBBLE_RADIUS * 2)
      ctx.lineTo(
        CANVAS_WIDTH / 2 + Math.cos(shooterAngle) * 200,
        CANVAS_HEIGHT - BUBBLE_RADIUS * 2 + Math.sin(shooterAngle) * 200
      )
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw current bubble
    if (currentBubble) {
      ctx.fillStyle = COLORS[currentBubble.color]
      ctx.beginPath()
      ctx.arc(currentBubble.x, currentBubble.y, BUBBLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    // Draw next bubble preview
    if (nextBubble) {
      ctx.fillStyle = COLORS[nextBubble.color]
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40, BUBBLE_RADIUS * 0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.fillText('Next', CANVAS_WIDTH - 65, CANVAS_HEIGHT - 55)
    }
    
    // Draw combo indicator
    if (combo > 0) {
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 20px Arial'
      ctx.fillText(`Combo x${combo}`, 10, 30)
    }
  }, [bubbles, currentBubble, nextBubble, shooterAngle, gameOver, combo])

  useEffect(() => {
    const gameLoop = () => {
      updateGame()
      draw()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updateGame, draw])

  const startNewGame = () => {
    setBubbles(initializeGrid())
    setCurrentBubble(createNewBubble())
    setNextBubble(createNewBubble())
    setGameOver(false)
    setScore(0)
    setCombo(0)
  }

  const nextLevel = () => {
    if (currentLevel < levels.length) {
      setCurrentLevel(currentLevel + 1)
      startNewGame()
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold mb-2">Bubble Shooter</h2>
        <div className="flex justify-center gap-4">
          <div>Level {currentLevel}: {level.name}</div>
          <div>Score: {score.toLocaleString()}</div>
          <div>High Score: {highScore.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-300 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={shoot}
        />
      </div>

      {gameOver && (
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">
            Game Over! Final Score: {score.toLocaleString()}
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={startNewGame}>Play Again</Button>
            {currentLevel < levels.length && score >= 5000 * currentLevel && (
              <Button onClick={nextLevel} variant="default">
                Next Level
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        Move mouse to aim, click to shoot. Match 3 or more bubbles to clear them!
      </div>
    </Card>
  )
}