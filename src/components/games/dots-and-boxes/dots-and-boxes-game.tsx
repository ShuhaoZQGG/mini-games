'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
// Multiplayer temporarily disabled
// import { useMultiplayerGame } from '@/hooks/use-multiplayer-game'
import { toast } from 'sonner'

interface Edge {
  drawn: boolean
  player: 1 | 2 | null
}

interface Box {
  owner: 1 | 2 | null
}

interface GameState {
  gridSize: number
  horizontalEdges: Edge[][]
  verticalEdges: Edge[][]
  boxes: Box[][]
  currentPlayer: 1 | 2
  scores: { player1: number; player2: number }
  winner: 1 | 2 | 'tie' | null
  lastMove: { type: 'horizontal' | 'vertical'; row: number; col: number } | null
}

const createInitialState = (size: number): GameState => {
  const horizontalEdges: Edge[][] = Array(size + 1).fill(null).map(() =>
    Array(size).fill(null).map(() => ({ drawn: false, player: null }))
  )
  const verticalEdges: Edge[][] = Array(size).fill(null).map(() =>
    Array(size + 1).fill(null).map(() => ({ drawn: false, player: null }))
  )
  const boxes: Box[][] = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({ owner: null }))
  )
  
  return {
    gridSize: size,
    horizontalEdges,
    verticalEdges,
    boxes,
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    winner: null,
    lastMove: null,
  }
}

export default function DotsAndBoxesGame() {
  const [gridSize, setGridSize] = useState(5)
  const [gameState, setGameState] = useState<GameState>(createInitialState(gridSize))
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null)

  // Multiplayer functionality temporarily disabled
  const isConnected = false
  const roomCode = roomId
  const players: string[] = []
  const sendGameUpdate = (state: GameState) => {}
  const createRoom = async () => false
  const joinRoom = async (id: string) => false
  const leaveRoom = () => {}

  const checkForCompletedBox = useCallback((state: GameState, row: number, col: number, type: 'horizontal' | 'vertical'): number[] => {
    const completedBoxes: number[] = []
    const { horizontalEdges, verticalEdges, gridSize } = state
    
    if (type === 'horizontal') {
      // Check box above
      if (row > 0) {
        const hasTop = horizontalEdges[row - 1][col].drawn
        const hasBottom = horizontalEdges[row][col].drawn
        const hasLeft = verticalEdges[row - 1][col].drawn
        const hasRight = verticalEdges[row - 1][col + 1].drawn
        
        if (hasTop && hasBottom && hasLeft && hasRight) {
          completedBoxes.push((row - 1) * gridSize + col)
        }
      }
      
      // Check box below
      if (row < gridSize) {
        const hasTop = horizontalEdges[row][col].drawn
        const hasBottom = horizontalEdges[row + 1][col].drawn
        const hasLeft = verticalEdges[row][col].drawn
        const hasRight = verticalEdges[row][col + 1].drawn
        
        if (hasTop && hasBottom && hasLeft && hasRight) {
          completedBoxes.push(row * gridSize + col)
        }
      }
    } else {
      // Check box to the left
      if (col > 0) {
        const hasTop = horizontalEdges[row][col - 1].drawn
        const hasBottom = horizontalEdges[row + 1][col - 1].drawn
        const hasLeft = verticalEdges[row][col - 1].drawn
        const hasRight = verticalEdges[row][col].drawn
        
        if (hasTop && hasBottom && hasLeft && hasRight) {
          completedBoxes.push(row * gridSize + (col - 1))
        }
      }
      
      // Check box to the right
      if (col < gridSize) {
        const hasTop = horizontalEdges[row][col].drawn
        const hasBottom = horizontalEdges[row + 1][col].drawn
        const hasLeft = verticalEdges[row][col].drawn
        const hasRight = verticalEdges[row][col + 1].drawn
        
        if (hasTop && hasBottom && hasLeft && hasRight) {
          completedBoxes.push(row * gridSize + col)
        }
      }
    }
    
    return completedBoxes
  }, [])

  const drawEdge = useCallback((type: 'horizontal' | 'vertical', row: number, col: number) => {
    if (gameState.winner) return
    if (isMultiplayer && playerNumber !== gameState.currentPlayer) return
    
    const newState = { ...gameState }
    const edge = type === 'horizontal' 
      ? newState.horizontalEdges[row][col]
      : newState.verticalEdges[row][col]
    
    if (edge.drawn) return
    
    edge.drawn = true
    edge.player = gameState.currentPlayer
    
    // Check for completed boxes
    const completedBoxes = checkForCompletedBox(newState, row, col, type)
    let scoreAdded = false
    
    completedBoxes.forEach(boxIndex => {
      const boxRow = Math.floor(boxIndex / gridSize)
      const boxCol = boxIndex % gridSize
      
      if (!newState.boxes[boxRow][boxCol].owner) {
        newState.boxes[boxRow][boxCol].owner = gameState.currentPlayer
        if (gameState.currentPlayer === 1) {
          newState.scores.player1++
        } else {
          newState.scores.player2++
        }
        scoreAdded = true
      }
    })
    
    // Check for winner
    const totalBoxes = gridSize * gridSize
    const filledBoxes = newState.scores.player1 + newState.scores.player2
    
    if (filledBoxes === totalBoxes) {
      if (newState.scores.player1 > newState.scores.player2) {
        newState.winner = 1
      } else if (newState.scores.player2 > newState.scores.player1) {
        newState.winner = 2
      } else {
        newState.winner = 'tie'
      }
    }
    
    // Switch turn only if no box was completed
    if (!scoreAdded && !newState.winner) {
      newState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1
    }
    
    newState.lastMove = { type, row, col }
    
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
    
    if (newState.winner) {
      if (newState.winner === 'tie') {
        toast.success("It's a tie!")
      } else {
        toast.success(`Player ${newState.winner} wins!`)
      }
    }
  }, [gameState, isMultiplayer, playerNumber, gridSize, checkForCompletedBox, sendGameUpdate])

  const handleCreateRoom = async () => {
    const success = await createRoom()
    if (success) {
      setIsMultiplayer(true)
      setPlayerNumber(1)
      toast.success('Room created! Waiting for opponent...')
    }
  }

  const handleJoinRoom = async () => {
    if (!roomId) {
      toast.error('Please enter a room code')
      return
    }
    const success = await joinRoom(roomId)
    if (success) {
      setIsMultiplayer(true)
      setPlayerNumber(2)
      toast.success('Joined room successfully!')
    }
  }

  const handleLeaveRoom = () => {
    leaveRoom()
    setIsMultiplayer(false)
    setPlayerNumber(null)
    setRoomId('')
    resetGame()
  }

  const resetGame = () => {
    const newState = createInitialState(gridSize)
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
  }

  const changeGridSize = (size: number) => {
    setGridSize(size)
    const newState = createInitialState(size)
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
  }

  const renderDot = (row: number, col: number) => (
    <div
      key={`dot-${row}-${col}`}
      className="absolute w-3 h-3 bg-gray-800 rounded-full"
      style={{
        top: `${row * 60}px`,
        left: `${col * 60}px`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  )

  const renderHorizontalEdge = (row: number, col: number) => {
    const edge = gameState.horizontalEdges[row][col]
    const isLastMove = gameState.lastMove?.type === 'horizontal' && 
                      gameState.lastMove?.row === row && 
                      gameState.lastMove?.col === col
    
    return (
      <div
        key={`h-${row}-${col}`}
        className={`absolute w-12 h-1 cursor-pointer transition-all
          ${edge.drawn 
            ? edge.player === 1 
              ? 'bg-blue-500' 
              : 'bg-red-500'
            : 'bg-gray-300 hover:bg-gray-500'
          }
          ${isLastMove ? 'ring-2 ring-yellow-400' : ''}
        `}
        style={{
          top: `${row * 60}px`,
          left: `${col * 60 + 30}px`,
          transform: 'translateY(-50%)',
        }}
        onClick={() => drawEdge('horizontal', row, col)}
      />
    )
  }

  const renderVerticalEdge = (row: number, col: number) => {
    const edge = gameState.verticalEdges[row][col]
    const isLastMove = gameState.lastMove?.type === 'vertical' && 
                      gameState.lastMove?.row === row && 
                      gameState.lastMove?.col === col
    
    return (
      <div
        key={`v-${row}-${col}`}
        className={`absolute w-1 h-12 cursor-pointer transition-all
          ${edge.drawn 
            ? edge.player === 1 
              ? 'bg-blue-500' 
              : 'bg-red-500'
            : 'bg-gray-300 hover:bg-gray-500'
          }
          ${isLastMove ? 'ring-2 ring-yellow-400' : ''}
        `}
        style={{
          top: `${row * 60 + 30}px`,
          left: `${col * 60}px`,
          transform: 'translateX(-50%)',
        }}
        onClick={() => drawEdge('vertical', row, col)}
      />
    )
  }

  const renderBox = (row: number, col: number) => {
    const box = gameState.boxes[row][col]
    if (!box.owner) return null
    
    return (
      <div
        key={`box-${row}-${col}`}
        className={`absolute w-12 h-12 flex items-center justify-center text-white font-bold text-xl
          ${box.owner === 1 ? 'bg-blue-500/50' : 'bg-red-500/50'}
        `}
        style={{
          top: `${row * 60 + 6}px`,
          left: `${col * 60 + 6}px`,
        }}
      >
        {box.owner}
      </div>
    )
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Dots and Boxes</h1>
        {!isMultiplayer && (
          <p className="text-gray-600">Connect the dots to create boxes and score points!</p>
        )}
      </div>

      {!isMultiplayer ? (
        <div className="flex gap-4 justify-center mb-6">
          <Button onClick={handleCreateRoom}>Create Room</Button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room Code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="px-3 py-2 border rounded"
              maxLength={6}
            />
            <Button onClick={handleJoinRoom}>Join Room</Button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-lg font-semibold">Room Code: {roomCode}</p>
          <p className="text-sm text-gray-600">
            Players: {players.length}/2
            {playerNumber && ` | You are Player ${playerNumber}`}
          </p>
          <Button onClick={handleLeaveRoom} variant="destructive" className="mt-2">
            Leave Room
          </Button>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">
            Current Turn: Player {gameState.currentPlayer}
            <span className={`ml-2 inline-block w-4 h-4 rounded ${
              gameState.currentPlayer === 1 ? 'bg-blue-500' : 'bg-red-500'
            }`} />
          </p>
        </div>
        <div className="flex gap-4">
          <p className="text-lg">
            <span className="font-semibold text-blue-500">Player 1: {gameState.scores.player1}</span>
          </p>
          <p className="text-lg">
            <span className="font-semibold text-red-500">Player 2: {gameState.scores.player2}</span>
          </p>
        </div>
      </div>

      {!isMultiplayer && !gameState.winner && (
        <div className="mb-4 flex gap-2 justify-center">
          <span className="text-sm">Grid Size:</span>
          {[3, 4, 5, 6].map(size => (
            <Button
              key={size}
              size="sm"
              variant={gridSize === size ? 'default' : 'outline'}
              onClick={() => changeGridSize(size)}
            >
              {size}x{size}
            </Button>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <div 
          className="relative bg-gray-100 rounded-lg p-8"
          style={{
            width: `${gridSize * 60 + 60}px`,
            height: `${gridSize * 60 + 60}px`,
          }}
        >
          {/* Render dots */}
          {Array.from({ length: gridSize + 1 }).map((_, row) =>
            Array.from({ length: gridSize + 1 }).map((_, col) =>
              renderDot(row, col)
            )
          )}
          
          {/* Render horizontal edges */}
          {Array.from({ length: gridSize + 1 }).map((_, row) =>
            Array.from({ length: gridSize }).map((_, col) =>
              renderHorizontalEdge(row, col)
            )
          )}
          
          {/* Render vertical edges */}
          {Array.from({ length: gridSize }).map((_, row) =>
            Array.from({ length: gridSize + 1 }).map((_, col) =>
              renderVerticalEdge(row, col)
            )
          )}
          
          {/* Render completed boxes */}
          {Array.from({ length: gridSize }).map((_, row) =>
            Array.from({ length: gridSize }).map((_, col) =>
              renderBox(row, col)
            )
          )}
        </div>
      </div>

      {gameState.winner && (
        <div className="text-center mt-6">
          <h2 className="text-2xl font-bold mb-4">
            {gameState.winner === 'tie' 
              ? "It's a Tie!" 
              : `Player ${gameState.winner} Wins!`
            }
          </h2>
          <div className="text-lg mb-4">
            Final Score: {gameState.scores.player1} - {gameState.scores.player2}
          </div>
          <Button onClick={resetGame}>New Game</Button>
        </div>
      )}
    </Card>
  )
}