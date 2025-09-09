'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RotateCcw, Users, Trophy } from 'lucide-react'

interface Ball {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  type: 'solid' | 'stripe' | 'cue' | '8ball'
  pocketed: boolean
}

interface PoolGameProps {
  isMultiplayer?: boolean
  onGameEnd?: (winner: 'player1' | 'player2') => void
}

export default function PoolGame({ isMultiplayer = false, onGameEnd }: PoolGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [balls, setBalls] = useState<Ball[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1')
  const [playerTypes, setPlayerTypes] = useState<{ player1: string | null; player2: string | null }>({
    player1: null,
    player2: null
  })
  const [gameStatus, setGameStatus] = useState<'aiming' | 'shooting' | 'animating' | 'ended'>('aiming')
  const [cueAngle, setCueAngle] = useState(0)
  const [cuePower, setCuePower] = useState(0)
  const [pocketedBalls, setPocketedBalls] = useState<{ player1: Ball[]; player2: Ball[] }>({
    player1: [],
    player2: []
  })
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>()

  const TABLE_WIDTH = 800
  const TABLE_HEIGHT = 400
  const BALL_RADIUS = 12
  const POCKET_RADIUS = 20
  const FRICTION = 0.985
  const MIN_VELOCITY = 0.1

  // Initialize balls
  useEffect(() => {
    initializeBalls()
  }, [])

  const initializeBalls = () => {
    const initialBalls: Ball[] = [
      // Cue ball
      { id: 0, x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, color: 'white', type: 'cue', pocketed: false },
      
      // Triangle formation at 3/4 table width
      // Row 1 (1 ball)
      { id: 1, x: TABLE_WIDTH * 0.75, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, color: '#FFD700', type: 'solid', pocketed: false },
      
      // Row 2 (2 balls)
      { id: 2, x: TABLE_WIDTH * 0.75 + 25, y: TABLE_HEIGHT / 2 - 14, vx: 0, vy: 0, color: '#0000FF', type: 'solid', pocketed: false },
      { id: 3, x: TABLE_WIDTH * 0.75 + 25, y: TABLE_HEIGHT / 2 + 14, vx: 0, vy: 0, color: '#FF0000', type: 'solid', pocketed: false },
      
      // Row 3 (3 balls) - 8 ball in middle
      { id: 4, x: TABLE_WIDTH * 0.75 + 50, y: TABLE_HEIGHT / 2 - 28, vx: 0, vy: 0, color: '#800080', type: 'solid', pocketed: false },
      { id: 8, x: TABLE_WIDTH * 0.75 + 50, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, color: '#000000', type: '8ball', pocketed: false },
      { id: 5, x: TABLE_WIDTH * 0.75 + 50, y: TABLE_HEIGHT / 2 + 28, vx: 0, vy: 0, color: '#FFA500', type: 'solid', pocketed: false },
      
      // Row 4 (4 balls)
      { id: 6, x: TABLE_WIDTH * 0.75 + 75, y: TABLE_HEIGHT / 2 - 42, vx: 0, vy: 0, color: '#008000', type: 'solid', pocketed: false },
      { id: 9, x: TABLE_WIDTH * 0.75 + 75, y: TABLE_HEIGHT / 2 - 14, vx: 0, vy: 0, color: '#FFD700', type: 'stripe', pocketed: false },
      { id: 10, x: TABLE_WIDTH * 0.75 + 75, y: TABLE_HEIGHT / 2 + 14, vx: 0, vy: 0, color: '#0000FF', type: 'stripe', pocketed: false },
      { id: 7, x: TABLE_WIDTH * 0.75 + 75, y: TABLE_HEIGHT / 2 + 42, vx: 0, vy: 0, color: '#8B4513', type: 'solid', pocketed: false },
      
      // Row 5 (5 balls)
      { id: 11, x: TABLE_WIDTH * 0.75 + 100, y: TABLE_HEIGHT / 2 - 56, vx: 0, vy: 0, color: '#FF0000', type: 'stripe', pocketed: false },
      { id: 12, x: TABLE_WIDTH * 0.75 + 100, y: TABLE_HEIGHT / 2 - 28, vx: 0, vy: 0, color: '#800080', type: 'stripe', pocketed: false },
      { id: 13, x: TABLE_WIDTH * 0.75 + 100, y: TABLE_HEIGHT / 2, vx: 0, vy: 0, color: '#FFA500', type: 'stripe', pocketed: false },
      { id: 14, x: TABLE_WIDTH * 0.75 + 100, y: TABLE_HEIGHT / 2 + 28, vx: 0, vy: 0, color: '#008000', type: 'stripe', pocketed: false },
      { id: 15, x: TABLE_WIDTH * 0.75 + 100, y: TABLE_HEIGHT / 2 + 56, vx: 0, vy: 0, color: '#8B4513', type: 'stripe', pocketed: false },
    ]
    
    setBalls(initialBalls)
  }

  // Physics simulation
  const updatePhysics = useCallback(() => {
    setBalls(prevBalls => {
      const newBalls = [...prevBalls]
      let isMoving = false
      
      // Update ball positions and velocities
      newBalls.forEach(ball => {
        if (ball.pocketed) return
        
        // Apply velocity
        ball.x += ball.vx
        ball.y += ball.vy
        
        // Apply friction
        ball.vx *= FRICTION
        ball.vy *= FRICTION
        
        // Stop if velocity is too small
        if (Math.abs(ball.vx) < MIN_VELOCITY) ball.vx = 0
        if (Math.abs(ball.vy) < MIN_VELOCITY) ball.vy = 0
        
        if (ball.vx !== 0 || ball.vy !== 0) isMoving = true
        
        // Wall collisions
        if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= TABLE_WIDTH) {
          ball.vx = -ball.vx * 0.9
          ball.x = Math.max(BALL_RADIUS, Math.min(TABLE_WIDTH - BALL_RADIUS, ball.x))
        }
        if (ball.y - BALL_RADIUS <= 0 || ball.y + BALL_RADIUS >= TABLE_HEIGHT) {
          ball.vy = -ball.vy * 0.9
          ball.y = Math.max(BALL_RADIUS, Math.min(TABLE_HEIGHT - BALL_RADIUS, ball.y))
        }
      })
      
      // Ball-to-ball collisions
      for (let i = 0; i < newBalls.length; i++) {
        if (newBalls[i].pocketed) continue
        
        for (let j = i + 1; j < newBalls.length; j++) {
          if (newBalls[j].pocketed) continue
          
          const dx = newBalls[j].x - newBalls[i].x
          const dy = newBalls[j].y - newBalls[i].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < BALL_RADIUS * 2) {
            // Collision detected
            const nx = dx / distance
            const ny = dy / distance
            
            // Relative velocity
            const dvx = newBalls[j].vx - newBalls[i].vx
            const dvy = newBalls[j].vy - newBalls[i].vy
            const dvn = dvx * nx + dvy * ny
            
            // Don't resolve if velocities are separating
            if (dvn > 0) continue
            
            // Collision impulse
            const impulse = dvn
            
            // Update velocities
            newBalls[i].vx -= impulse * nx
            newBalls[i].vy -= impulse * ny
            newBalls[j].vx += impulse * nx
            newBalls[j].vy += impulse * ny
            
            // Separate balls
            const overlap = BALL_RADIUS * 2 - distance
            const separationX = nx * overlap / 2
            const separationY = ny * overlap / 2
            newBalls[i].x -= separationX
            newBalls[i].y -= separationY
            newBalls[j].x += separationX
            newBalls[j].y += separationY
          }
        }
      }
      
      // Check pockets
      const pockets = [
        { x: 0, y: 0 },
        { x: TABLE_WIDTH / 2, y: 0 },
        { x: TABLE_WIDTH, y: 0 },
        { x: 0, y: TABLE_HEIGHT },
        { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
        { x: TABLE_WIDTH, y: TABLE_HEIGHT },
      ]
      
      newBalls.forEach(ball => {
        if (ball.pocketed) return
        
        pockets.forEach(pocket => {
          const dx = ball.x - pocket.x
          const dy = ball.y - pocket.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < POCKET_RADIUS) {
            ball.pocketed = true
            ball.vx = 0
            ball.vy = 0
            
            // Handle pocketing logic
            if (ball.type === 'cue') {
              // Foul - reset cue ball
              setTimeout(() => {
                setBalls(prev => prev.map(b => 
                  b.id === 0 ? { ...b, x: TABLE_WIDTH * 0.25, y: TABLE_HEIGHT / 2, pocketed: false } : b
                ))
              }, 1000)
            } else if (ball.type === '8ball') {
              // Game ending
              const playerBalls = currentPlayer === 'player1' ? pocketedBalls.player1 : pocketedBalls.player2
              const playerType = playerTypes[currentPlayer]
              const allPlayerBallsPocketed = newBalls.filter(b => 
                b.type === playerType && !b.pocketed && b.id !== 8
              ).length === 0
              
              if (allPlayerBallsPocketed) {
                setWinner(currentPlayer)
                setGameStatus('ended')
                onGameEnd?.(currentPlayer)
              } else {
                // Pocketed 8-ball early - lose
                setWinner(currentPlayer === 'player1' ? 'player2' : 'player1')
                setGameStatus('ended')
                onGameEnd?.(currentPlayer === 'player1' ? 'player2' : 'player1')
              }
            } else {
              // Regular ball pocketed
              setPocketedBalls(prev => ({
                ...prev,
                [currentPlayer]: [...prev[currentPlayer], ball]
              }))
              
              // Set player type if not set
              if (!playerTypes[currentPlayer]) {
                setPlayerTypes(prev => ({
                  ...prev,
                  [currentPlayer]: ball.type,
                  [currentPlayer === 'player1' ? 'player2' : 'player1']: 
                    ball.type === 'solid' ? 'stripe' : 'solid'
                }))
              }
            }
          }
        })
      })
      
      // Check if animation should end
      if (!isMoving && gameStatus === 'animating') {
        setGameStatus('aiming')
        setCurrentPlayer(prev => prev === 'player1' ? 'player2' : 'player1')
      }
      
      return newBalls
    })
  }, [gameStatus, currentPlayer, playerTypes, pocketedBalls, onGameEnd])

  // Animation loop
  useEffect(() => {
    if (gameStatus === 'animating') {
      const animate = () => {
        updatePhysics()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [gameStatus, updatePhysics])

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw table
    ctx.fillStyle = '#0a5c2e'
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw pockets
    const pockets = [
      { x: 0, y: 0 },
      { x: TABLE_WIDTH / 2, y: 0 },
      { x: TABLE_WIDTH, y: 0 },
      { x: 0, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
      { x: TABLE_WIDTH, y: TABLE_HEIGHT },
    ]
    
    ctx.fillStyle = '#000'
    pockets.forEach(pocket => {
      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw balls
    balls.forEach(ball => {
      if (ball.pocketed) return
      
      ctx.fillStyle = ball.color
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw stripe
      if (ball.type === 'stripe') {
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, BALL_RADIUS - 3, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // Draw number
      if (ball.id > 0) {
        ctx.fillStyle = ball.id === 8 ? 'white' : ball.type === 'stripe' ? 'black' : 'white'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ball.id.toString(), ball.x, ball.y)
      }
    })
    
    // Draw cue stick when aiming
    if (gameStatus === 'aiming') {
      const cueBall = balls.find(b => b.id === 0 && !b.pocketed)
      if (cueBall) {
        ctx.strokeStyle = '#8B4513'
        ctx.lineWidth = 8
        ctx.beginPath()
        const startX = cueBall.x - Math.cos(cueAngle) * (50 + cuePower * 100)
        const startY = cueBall.y - Math.sin(cueAngle) * (50 + cuePower * 100)
        const endX = cueBall.x - Math.cos(cueAngle) * 30
        const endY = cueBall.y - Math.sin(cueAngle) * 30
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        
        // Draw aim line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(cueBall.x, cueBall.y)
        ctx.lineTo(cueBall.x + Math.cos(cueAngle) * 200, cueBall.y + Math.sin(cueAngle) * 200)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }, [balls, gameStatus, cueAngle, cuePower])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'aiming') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    
    const cueBall = balls.find(b => b.id === 0 && !b.pocketed)
    if (cueBall) {
      const angle = Math.atan2(y - cueBall.y, x - cueBall.x)
      setCueAngle(angle)
    }
  }

  const handleMouseDown = () => {
    if (gameStatus === 'aiming') {
      setGameStatus('shooting')
    }
  }

  const handleMouseUp = () => {
    if (gameStatus === 'shooting') {
      shoot()
    }
  }

  const shoot = () => {
    const cueBall = balls.find(b => b.id === 0 && !b.pocketed)
    if (!cueBall) return
    
    const power = cuePower > 0 ? cuePower : 0.5
    const speed = power * 20
    
    setBalls(prev => prev.map(ball => 
      ball.id === 0 
        ? { ...ball, vx: Math.cos(cueAngle) * speed, vy: Math.sin(cueAngle) * speed }
        : ball
    ))
    
    setGameStatus('animating')
    setCuePower(0)
  }

  const resetGame = () => {
    initializeBalls()
    setCurrentPlayer('player1')
    setPlayerTypes({ player1: null, player2: null })
    setPocketedBalls({ player1: [], player2: [] })
    setGameStatus('aiming')
    setWinner(null)
    setCueAngle(0)
    setCuePower(0)
  }

  // Update power based on hold time
  useEffect(() => {
    if (gameStatus === 'shooting') {
      const interval = setInterval(() => {
        setCuePower(prev => Math.min(prev + 0.02, 1))
      }, 20)
      return () => clearInterval(interval)
    }
  }, [gameStatus])

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto">
      <Card className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">8-Ball Pool</h2>
          <Button onClick={resetGame} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
        
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          className="border-4 border-amber-900 rounded cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold">
              Current Player: {currentPlayer === 'player1' ? 'Player 1' : 'Player 2'}
            </p>
            {playerTypes[currentPlayer] && (
              <p className="text-xs text-gray-600">
                Playing: {playerTypes[currentPlayer] === 'solid' ? 'Solids (1-7)' : 'Stripes (9-15)'}
              </p>
            )}
          </div>
          {gameStatus === 'shooting' && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Power:</span>
              <div className="w-32 h-4 bg-gray-200 rounded">
                <div 
                  className="h-full bg-red-500 rounded transition-all"
                  style={{ width: `${cuePower * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="p-4 min-w-[250px]">
        <h3 className="text-lg font-bold mb-4">Game Info</h3>
        
        {winner ? (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 rounded">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-center font-bold">
              {winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Player 1</h4>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm">
                  Type: {playerTypes.player1 || 'Not decided'}
                </p>
                <p className="text-sm">
                  Pocketed: {pocketedBalls.player1.length}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pocketedBalls.player1.map(ball => (
                    <div
                      key={ball.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: ball.color, color: 'white' }}
                    >
                      {ball.id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Player 2</h4>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm">
                  Type: {playerTypes.player2 || 'Not decided'}
                </p>
                <p className="text-sm">
                  Pocketed: {pocketedBalls.player2.length}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {pocketedBalls.player2.map(ball => (
                    <div
                      key={ball.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: ball.color, color: 'white' }}
                    >
                      {ball.id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
        <div>
          <h4 className="font-semibold mb-2">Controls</h4>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <p>• Move mouse to aim</p>
            <p>• Click and hold to charge power</p>
            <p>• Release to shoot</p>
            <p>• Pocket all your balls then the 8-ball to win</p>
          </div>
        </div>
      </Card>
    </div>
  )
}