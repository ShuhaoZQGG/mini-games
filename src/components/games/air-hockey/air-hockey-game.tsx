'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMultiplayerGame } from '@/lib/supabase/realtime'

interface Vector2D {
  x: number
  y: number
}

interface Paddle {
  position: Vector2D
  velocity: Vector2D
  radius: number
  color: string
  playerId: string
}

interface Puck {
  position: Vector2D
  velocity: Vector2D
  radius: number
}

interface GameState {
  player1: Paddle
  player2: Paddle
  puck: Puck
  scores: { player1: number; player2: number }
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished'
  winner?: string
}

export function AirHockeyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const mousePositionRef = useRef<Vector2D>({ x: 0, y: 0 })
  const lastUpdateRef = useRef<number>(Date.now())
  
  const [roomCode, setRoomCode] = useState('')
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2' | 'spectator'>('player1')
  const [localGameState, setLocalGameState] = useState<GameState>({
    player1: {
      position: { x: 100, y: 200 },
      velocity: { x: 0, y: 0 },
      radius: 30,
      color: '#3B82F6',
      playerId: 'player1'
    },
    player2: {
      position: { x: 700, y: 200 },
      velocity: { x: 0, y: 0 },
      radius: 30,
      color: '#EF4444',
      playerId: 'player2'
    },
    puck: {
      position: { x: 400, y: 200 },
      velocity: { x: 0, y: 0 },
      radius: 20
    },
    scores: { player1: 0, player2: 0 },
    gameStatus: 'waiting'
  })

  const {
    isConnected,
    roomId,
    players,
    sendMove,
    createRoom,
    joinRoom,
    gameState: remoteGameState
  } = useMultiplayerGame({
    gameType: 'air-hockey',
    onGameMove: (move) => {
      if (move.move_data.type === 'paddle_move') {
        setLocalGameState(prev => {
          const playerId = move.move_data.playerId as 'player1' | 'player2'
          const currentPaddle = prev[playerId]
          return {
            ...prev,
            [playerId]: {
              ...currentPaddle,
              position: move.move_data.position
            }
          }
        })
      } else if (move.move_data.type === 'game_update') {
        setLocalGameState(move.move_data.gameState)
      }
    },
    onPlayerJoin: (playerId) => {
      console.log('Player joined:', playerId)
      if (players.length === 0) {
        setPlayerRole('player2')
      }
    }
  })

  // Canvas dimensions
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 400
  const GOAL_WIDTH = 100
  const FRICTION = 0.98
  const MAX_SPEED = 15

  const handleCreateRoom = async () => {
    await createRoom()
    setPlayerRole('player1')
    setLocalGameState(prev => ({ ...prev, gameStatus: 'waiting' }))
  }

  const handleJoinRoom = async () => {
    if (roomCode) {
      await joinRoom(roomCode)
      setPlayerRole('player2')
    }
  }

  const startGame = () => {
    setLocalGameState(prev => ({
      ...prev,
      gameStatus: 'playing',
      puck: {
        ...prev.puck,
        position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 }
      }
    }))
  }

  const resetPuck = () => {
    setLocalGameState(prev => ({
      ...prev,
      puck: {
        position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 },
        radius: 20
      }
    }))
  }

  const checkCollision = (obj1: { position: Vector2D; radius: number }, obj2: { position: Vector2D; radius: number }) => {
    const dx = obj1.position.x - obj2.position.x
    const dy = obj1.position.y - obj2.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < obj1.radius + obj2.radius
  }

  const resolveCollision = (paddle: Paddle, puck: Puck) => {
    const dx = puck.position.x - paddle.position.x
    const dy = puck.position.y - paddle.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) return // Prevent division by zero
    
    // Normalize collision vector
    const nx = dx / distance
    const ny = dy / distance
    
    // Relative velocity
    const dvx = puck.velocity.x - paddle.velocity.x
    const dvy = puck.velocity.y - paddle.velocity.y
    
    // Relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny
    
    // Do not resolve if velocities are separating
    if (dvn > 0) return
    
    // Collision impulse
    const impulse = 2 * dvn
    
    // Update puck velocity
    puck.velocity.x -= impulse * nx * 1.1 // Add some extra force
    puck.velocity.y -= impulse * ny * 1.1
    
    // Add paddle velocity influence
    puck.velocity.x += paddle.velocity.x * 0.3
    puck.velocity.y += paddle.velocity.y * 0.3
    
    // Limit puck speed
    const speed = Math.sqrt(puck.velocity.x ** 2 + puck.velocity.y ** 2)
    if (speed > MAX_SPEED) {
      puck.velocity.x = (puck.velocity.x / speed) * MAX_SPEED
      puck.velocity.y = (puck.velocity.y / speed) * MAX_SPEED
    }
    
    // Separate objects to prevent overlap
    const overlap = paddle.radius + puck.radius - distance
    puck.position.x += nx * overlap
    puck.position.y += ny * overlap
  }

  const updatePhysics = useCallback((deltaTime: number) => {
    if (localGameState.gameStatus !== 'playing') return

    const newState = { ...localGameState }
    const { puck, player1, player2 } = newState

    // Update puck position
    puck.position.x += puck.velocity.x * deltaTime / 16
    puck.position.y += puck.velocity.y * deltaTime / 16

    // Apply friction
    puck.velocity.x *= FRICTION
    puck.velocity.y *= FRICTION

    // Wall collisions for puck
    if (puck.position.y - puck.radius <= 0 || puck.position.y + puck.radius >= CANVAS_HEIGHT) {
      puck.velocity.y = -puck.velocity.y
      puck.position.y = puck.position.y - puck.radius <= 0 
        ? puck.radius 
        : CANVAS_HEIGHT - puck.radius
    }

    // Side wall collisions (not in goal areas)
    const inGoalArea = (
      puck.position.y >= (CANVAS_HEIGHT - GOAL_WIDTH) / 2 &&
      puck.position.y <= (CANVAS_HEIGHT + GOAL_WIDTH) / 2
    )

    if (!inGoalArea) {
      if (puck.position.x - puck.radius <= 0 || puck.position.x + puck.radius >= CANVAS_WIDTH) {
        puck.velocity.x = -puck.velocity.x
        puck.position.x = puck.position.x - puck.radius <= 0
          ? puck.radius
          : CANVAS_WIDTH - puck.radius
      }
    }

    // Check for goals
    if (puck.position.x <= 0 && inGoalArea) {
      newState.scores.player2++
      resetPuck()
      if (newState.scores.player2 >= 7) {
        newState.gameStatus = 'finished'
        newState.winner = 'Player 2'
      }
    } else if (puck.position.x >= CANVAS_WIDTH && inGoalArea) {
      newState.scores.player1++
      resetPuck()
      if (newState.scores.player1 >= 7) {
        newState.gameStatus = 'finished'
        newState.winner = 'Player 1'
      }
    }

    // Paddle-puck collisions
    if (checkCollision(player1, puck)) {
      resolveCollision(player1, puck)
    }
    if (checkCollision(player2, puck)) {
      resolveCollision(player2, puck)
    }

    // Update paddle velocities for next frame
    player1.velocity = {
      x: player1.position.x - mousePositionRef.current.x,
      y: player1.position.y - mousePositionRef.current.y
    }

    setLocalGameState(newState)

    // Send game state update if hosting
    if (isConnected && playerRole === 'player1') {
      sendMove({
        type: 'game_update',
        gameState: newState
      })
    }
  }, [localGameState, isConnected, playerRole, sendMove])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    mousePositionRef.current = { x, y }

    if (localGameState.gameStatus === 'playing') {
      const paddle = playerRole === 'player1' ? localGameState.player1 : localGameState.player2
      
      // Limit paddle to its half of the table
      const limitedX = playerRole === 'player1'
        ? Math.min(x, CANVAS_WIDTH / 2 - paddle.radius)
        : Math.max(x, CANVAS_WIDTH / 2 + paddle.radius)

      const newPosition = {
        x: Math.max(paddle.radius, Math.min(limitedX, CANVAS_WIDTH - paddle.radius)),
        y: Math.max(paddle.radius, Math.min(y, CANVAS_HEIGHT - paddle.radius))
      }

      setLocalGameState(prev => {
        if (playerRole === 'spectator') return prev
        
        const currentPaddle = prev[playerRole]
        return {
          ...prev,
          [playerRole]: {
            ...currentPaddle,
            position: newPosition
          }
        }
      })

      // Send paddle position to other player
      if (isConnected) {
        sendMove({
          type: 'paddle_move',
          playerId: playerRole,
          position: newPosition
        })
      }
    }
  }, [localGameState, playerRole, isConnected, sendMove])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1E293B'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw center line
    ctx.strokeStyle = '#64748B'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw goals
    ctx.fillStyle = '#374151'
    ctx.fillRect(0, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, 20, GOAL_WIDTH)
    ctx.fillRect(CANVAS_WIDTH - 20, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, 20, GOAL_WIDTH)

    // Draw paddles
    const { player1, player2 } = localGameState
    
    ctx.fillStyle = player1.color
    ctx.beginPath()
    ctx.arc(player1.position.x, player1.position.y, player1.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = player2.color
    ctx.beginPath()
    ctx.arc(player2.position.x, player2.position.y, player2.radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw puck
    ctx.fillStyle = '#FBBF24'
    ctx.beginPath()
    ctx.arc(localGameState.puck.position.x, localGameState.puck.position.y, localGameState.puck.radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw scores
    ctx.fillStyle = '#F3F4F6'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(localGameState.scores.player1.toString(), CANVAS_WIDTH / 4, 60)
    ctx.fillText(localGameState.scores.player2.toString(), (CANVAS_WIDTH * 3) / 4, 60)
  }, [localGameState])

  const gameLoop = useCallback(() => {
    const now = Date.now()
    const deltaTime = now - lastUpdateRef.current
    lastUpdateRef.current = now

    updatePhysics(deltaTime)
    draw()

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updatePhysics, draw])

  useEffect(() => {
    if (localGameState.gameStatus === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [localGameState.gameStatus, gameLoop])

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Air Hockey</h2>
          {roomId && (
            <div className="text-sm text-muted-foreground">
              Room: {roomId}
            </div>
          )}
        </div>

        {!isConnected && (
          <div className="flex gap-4 items-center">
            <Button onClick={handleCreateRoom}>Create Room</Button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="px-3 py-2 border rounded"
              />
              <Button onClick={handleJoinRoom}>Join Room</Button>
            </div>
          </div>
        )}

        {isConnected && localGameState.gameStatus === 'waiting' && (
          <div className="text-center">
            <p className="mb-4">Waiting for another player to join...</p>
            <p className="text-sm text-muted-foreground">
              Players: {players.length + 1}/2
            </p>
            {players.length === 1 && (
              <Button onClick={startGame} className="mt-4">
                Start Game
              </Button>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          className="border-2 border-border rounded-lg cursor-pointer mx-auto"
          style={{ backgroundColor: '#1E293B' }}
        />

        {localGameState.gameStatus === 'finished' && (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Game Over!</h3>
            <p className="text-lg">{localGameState.winner} Wins!</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Play Again
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground text-center">
          Move your mouse to control your paddle. First to 7 goals wins!
        </div>
      </div>
    </Card>
  )
}