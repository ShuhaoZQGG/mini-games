'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw, Play, Pause } from 'lucide-react'

interface Bubble {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  row?: number
  col?: number
  isMoving?: boolean
}

interface BubbleShooterProps {
  levelConfig: {
    rows: number
    cols: number
    colors: string[]
    speed: number
    targetScore: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Start',
    difficulty: 'easy',
    config: { rows: 5, cols: 8, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], speed: 5, targetScore: 1000 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'More Colors',
    difficulty: 'medium',
    config: { rows: 6, cols: 8, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'], speed: 6, targetScore: 2000 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Challenging',
    difficulty: 'hard',
    config: { rows: 7, cols: 9, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'], speed: 7, targetScore: 3000 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Mode',
    difficulty: 'expert',
    config: { rows: 8, cols: 10, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D'], speed: 8, targetScore: 5000 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Challenge',
    difficulty: 'master',
    config: { rows: 9, cols: 11, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#C9B1FF'], speed: 10, targetScore: 7500 },
    requiredStars: 12
  }
]

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const BUBBLE_RADIUS = 20
const SHOOTER_Y = CANVAS_HEIGHT - 50

function BubbleShooterGame({ levelConfig, onScore }: BubbleShooterProps) {
  const { rows, cols, colors, speed, targetScore } = levelConfig
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  
  const [grid, setGrid] = useState<(Bubble | null)[][]>([])
  const [currentBubble, setCurrentBubble] = useState<Bubble | null>(null)
  const [nextBubbleColor, setNextBubbleColor] = useState('')
  const [shootingBubble, setShootingBubble] = useState<Bubble | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover' | 'won'>('ready')
  const [mousePos, setMousePos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  const [aimAngle, setAimAngle] = useState(0)

  // Initialize game
  useEffect(() => {
    initializeGame()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [rows, cols, colors])

  // Start animation loop when playing
  useEffect(() => {
    if (gameState === 'playing' && !animationRef.current) {
      animationRef.current = requestAnimationFrame(gameLoop)
    } else if (gameState !== 'playing' && animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
  }, [gameState])

  // Handle mouse movement for aiming
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || gameState !== 'playing') return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })
      
      // Calculate aim angle
      const dx = x - CANVAS_WIDTH / 2
      const dy = y - SHOOTER_Y
      const angle = Math.atan2(dy, dx)
      setAimAngle(angle)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [gameState])

  const initializeGame = () => {
    // Initialize bubble grid
    const newGrid: (Bubble | null)[][] = []
    for (let row = 0; row < rows; row++) {
      const rowBubbles: (Bubble | null)[] = []
      for (let col = 0; col < cols; col++) {
        // Offset every other row for hexagonal pattern
        const offset = row % 2 === 0 ? 0 : BUBBLE_RADIUS
        const x = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + offset
        const y = row * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS * 2
        
        // Leave some bubbles empty for gameplay
        if (Math.random() > 0.3) {
          rowBubbles.push({
            x,
            y,
            vx: 0,
            vy: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
            radius: BUBBLE_RADIUS,
            row,
            col
          })
        } else {
          rowBubbles.push(null)
        }
      }
      newGrid.push(rowBubbles)
    }
    setGrid(newGrid)
    
    // Set current and next bubbles
    const currentColor = colors[Math.floor(Math.random() * colors.length)]
    setCurrentBubble({
      x: CANVAS_WIDTH / 2,
      y: SHOOTER_Y,
      vx: 0,
      vy: 0,
      color: currentColor,
      radius: BUBBLE_RADIUS
    })
    setNextBubbleColor(colors[Math.floor(Math.random() * colors.length)])
    
    setScore(0)
    setCombo(0)
    setGameState('ready')
    setShootingBubble(null)
  }

  const startGame = () => {
    setGameState('playing')
  }

  const pauseGame = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing')
  }

  const shootBubble = () => {
    if (!currentBubble || shootingBubble || gameState !== 'playing') return
    
    // Calculate velocity based on aim angle
    const vx = Math.cos(aimAngle) * speed
    const vy = Math.sin(aimAngle) * speed
    
    setShootingBubble({
      ...currentBubble,
      vx,
      vy,
      isMoving: true
    })
    
    // Prepare next bubble
    setCurrentBubble({
      x: CANVAS_WIDTH / 2,
      y: SHOOTER_Y,
      vx: 0,
      vy: 0,
      color: nextBubbleColor,
      radius: BUBBLE_RADIUS
    })
    setNextBubbleColor(colors[Math.floor(Math.random() * colors.length)])
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState === 'ready') {
      startGame()
    } else if (gameState === 'playing') {
      shootBubble()
    }
  }

  const gameLoop = useCallback(() => {
    if (!shootingBubble) {
      if (gameState === 'playing') {
        animationRef.current = requestAnimationFrame(gameLoop)
      }
      draw()
      return
    }

    // Update shooting bubble position
    let bubble = { ...shootingBubble }
    bubble.x += bubble.vx
    bubble.y += bubble.vy
    
    // Check wall collisions
    if (bubble.x - BUBBLE_RADIUS <= 0 || bubble.x + BUBBLE_RADIUS >= CANVAS_WIDTH) {
      bubble.vx = -bubble.vx // Bounce off walls
      bubble.x = Math.max(BUBBLE_RADIUS, Math.min(CANVAS_WIDTH - BUBBLE_RADIUS, bubble.x))
    }
    
    // Check if bubble reached top or hit other bubbles
    if (bubble.y - BUBBLE_RADIUS <= 0) {
      attachBubbleToGrid(bubble)
      return
    }
    
    // Check collision with grid bubbles
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const gridBubble = grid[row][col]
        if (gridBubble) {
          const dx = bubble.x - gridBubble.x
          const dy = bubble.y - gridBubble.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < BUBBLE_RADIUS * 2) {
            attachBubbleToGrid(bubble)
            return
          }
        }
      }
    }
    
    setShootingBubble(bubble)
    draw()
    
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
  }, [shootingBubble, grid, gameState])

  const attachBubbleToGrid = (bubble: Bubble) => {
    // Find nearest grid position
    const row = Math.floor((bubble.y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.7))
    const offset = row % 2 === 0 ? 0 : BUBBLE_RADIUS
    const col = Math.round((bubble.x - BUBBLE_RADIUS - offset) / (BUBBLE_RADIUS * 2))
    
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      const newGrid = [...grid]
      const snapX = col * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS + offset
      const snapY = row * BUBBLE_RADIUS * 1.7 + BUBBLE_RADIUS * 2
      
      newGrid[row][col] = {
        x: snapX,
        y: snapY,
        vx: 0,
        vy: 0,
        color: bubble.color,
        radius: BUBBLE_RADIUS,
        row,
        col
      }
      
      setGrid(newGrid)
      setShootingBubble(null)
      
      // Check for matches
      checkMatches(row, col, bubble.color, newGrid)
      
      // Check game over
      if (row >= rows - 1) {
        setGameState('gameover')
      }
    }
  }

  const checkMatches = (startRow: number, startCol: number, color: string, currentGrid: (Bubble | null)[][]) => {
    const visited = new Set<string>()
    const matches: {row: number, col: number}[] = []
    
    const dfs = (row: number, col: number) => {
      const key = `${row},${col}`
      if (visited.has(key)) return
      if (row < 0 || row >= rows || col < 0 || col >= cols) return
      
      const bubble = currentGrid[row][col]
      if (!bubble || bubble.color !== color) return
      
      visited.add(key)
      matches.push({ row, col })
      
      // Check all 6 neighbors (hexagonal grid)
      const offset = row % 2 === 0 ? -1 : 0
      const neighbors = [
        [row - 1, col + offset], [row - 1, col + offset + 1],
        [row, col - 1], [row, col + 1],
        [row + 1, col + offset], [row + 1, col + offset + 1]
      ]
      
      neighbors.forEach(([r, c]) => dfs(r, c))
    }
    
    dfs(startRow, startCol)
    
    // Remove matched bubbles if 3 or more
    if (matches.length >= 3) {
      const newGrid = [...currentGrid]
      let points = 0
      
      matches.forEach(({ row, col }) => {
        newGrid[row][col] = null
        points += 10
      })
      
      // Apply combo multiplier
      const comboMultiplier = Math.min(combo + 1, 5)
      points *= comboMultiplier
      
      setGrid(newGrid)
      setScore(prev => {
        const newScore = prev + points
        onScore(newScore)
        
        // Check win condition
        if (newScore >= targetScore) {
          setGameState('won')
        }
        
        return newScore
      })
      setCombo(combo + 1)
      
      // Check for floating bubbles
      removeFloatingBubbles(newGrid)
    } else {
      setCombo(0)
    }
  }

  const removeFloatingBubbles = (currentGrid: (Bubble | null)[][]) => {
    const connected = new Set<string>()
    
    // Find all bubbles connected to the top
    const checkConnected = (row: number, col: number) => {
      const key = `${row},${col}`
      if (connected.has(key)) return
      if (row < 0 || row >= rows || col < 0 || col >= cols) return
      if (!currentGrid[row][col]) return
      
      connected.add(key)
      
      // Check neighbors
      const offset = row % 2 === 0 ? -1 : 0
      const neighbors = [
        [row - 1, col + offset], [row - 1, col + offset + 1],
        [row, col - 1], [row, col + 1],
        [row + 1, col + offset], [row + 1, col + offset + 1]
      ]
      
      neighbors.forEach(([r, c]) => checkConnected(r, c))
    }
    
    // Check all bubbles in the top row
    for (let col = 0; col < cols; col++) {
      if (currentGrid[0][col]) {
        checkConnected(0, col)
      }
    }
    
    // Remove unconnected bubbles
    const newGrid = [...currentGrid]
    let floatingPoints = 0
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (newGrid[row][col] && !connected.has(`${row},${col}`)) {
          newGrid[row][col] = null
          floatingPoints += 20 // Bonus points for floating bubbles
        }
      }
    }
    
    if (floatingPoints > 0) {
      setGrid(newGrid)
      setScore(prev => prev + floatingPoints)
    }
  }

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw grid bubbles
    grid.forEach(row => {
      row.forEach(bubble => {
        if (bubble) {
          drawBubble(ctx, bubble)
        }
      })
    })
    
    // Draw shooting bubble
    if (shootingBubble) {
      drawBubble(ctx, shootingBubble)
    }
    
    // Draw current bubble (shooter)
    if (currentBubble && gameState === 'playing') {
      drawBubble(ctx, currentBubble)
      
      // Draw aim line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(CANVAS_WIDTH / 2, SHOOTER_Y)
      ctx.lineTo(
        CANVAS_WIDTH / 2 + Math.cos(aimAngle) * 100,
        SHOOTER_Y + Math.sin(aimAngle) * 100
      )
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Draw next bubble preview
    if (nextBubbleColor) {
      ctx.fillStyle = nextBubbleColor
      ctx.beginPath()
      ctx.arc(CANVAS_WIDTH - 50, CANVAS_HEIGHT - 50, 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
    // Draw bubble shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(bubble.x + 2, bubble.y + 2, bubble.radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw bubble
    ctx.fillStyle = bubble.color
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw bubble highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(bubble.x - 5, bubble.y - 5, bubble.radius / 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw bubble border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold mb-2">Bubble Shooter</h2>
          <p className="text-gray-600">Match 3+ bubbles of the same color to clear them!</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            <span className="font-semibold">Score:</span>{' '}
            <span data-testid="score-display">{score}</span>/{targetScore}
          </div>
          <div className="text-lg">
            <span className="font-semibold">Level:</span> {levels.findIndex(l => l.config === levelConfig) + 1}
          </div>
          {combo > 0 && (
            <div className="text-lg text-orange-500" data-testid="combo-display">
              <span className="font-semibold">Combo:</span> x{combo + 1}
            </div>
          )}
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            data-testid="bubble-shooter-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 rounded-lg cursor-crosshair"
            onMouseMove={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect()
              if (rect) {
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                setMousePos({ x, y })
                
                const dx = x - CANVAS_WIDTH / 2
                const dy = y - SHOOTER_Y
                setAimAngle(Math.atan2(dy, dx))
              }
            }}
            onClick={handleCanvasClick}
          />
        </div>

        {/* Next Bubble Preview */}
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="text-lg">
            <span className="font-semibold">Next:</span>
          </div>
          <div
            data-testid="current-bubble-color"
            className="w-10 h-10 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: nextBubbleColor }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {gameState === 'ready' && (
            <Button onClick={startGame} size="lg" className="flex items-center gap-2">
              <Play size={20} />
              Start Game
            </Button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <>
              <Button
                onClick={pauseGame}
                variant="outline"
                className="flex items-center gap-2"
              >
                {gameState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                {gameState === 'playing' ? 'Pause' : 'Resume'}
              </Button>
              <Button
                onClick={initializeGame}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                New Game
              </Button>
            </>
          )}
          {(gameState === 'gameover' || gameState === 'won') && (
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                {gameState === 'won' ? '🎉 You Won!' : 'Game Over'}
              </h3>
              <p className="text-lg mb-4">Final Score: {score}</p>
              <Button onClick={initializeGame} size="lg">
                Play Again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BubbleShooterWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const { targetScore } = levelConfig
    if (score >= targetScore * 1.5) return 3
    if (score >= targetScore * 1.2) return 2
    if (score >= targetScore) return 1
    return 1
  }

  const renderGame = (levelConfig: any, onScore: (score: number) => void) => {
    return <BubbleShooterGame levelConfig={levelConfig} onScore={onScore} />
  }

  return (
    <GameWithLevels
      gameId="bubble-shooter"
      gameName="Bubble Shooter"
      levels={levels}
      getStars={getStars}
      renderGame={renderGame}
    />
  )
}