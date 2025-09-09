'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMultiplayerGame } from '@/lib/supabase/realtime'

type Stone = 'black' | 'white' | null
type Board = Stone[][]

interface GameState {
  board: Board
  currentPlayer: 'black' | 'white'
  capturedStones: { black: number; white: number }
  lastMove: { row: number; col: number } | null
  koPosition: { row: number; col: number } | null
  passes: number
  gameOver: boolean
  winner: 'black' | 'white' | 'draw' | null
  territory: { black: number; white: number }
}

interface GoGameProps {
  boardSize?: 9 | 13 | 19
}

export function GoGame({ boardSize = 9 }: GoGameProps) {
  const initializeBoard = (size: number): Board => {
    return Array(size).fill(null).map(() => Array(size).fill(null))
  }

  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(boardSize),
    currentPlayer: 'black',
    capturedStones: { black: 0, white: 0 },
    lastMove: null,
    koPosition: null,
    passes: 0,
    gameOver: false,
    winner: null,
    territory: { black: 0, white: 0 }
  })

  const [roomCode, setRoomCode] = useState('')
  const [playerColor, setPlayerColor] = useState<'black' | 'white'>('black')

  const {
    isConnected,
    roomId,
    sendMove,
    createRoom,
    joinRoom
  } = useMultiplayerGame({
    gameType: 'go',
    onGameMove: (move) => {
      if (move.move_data.type === 'stone_placement') {
        handleRemoteMove(move.move_data.row, move.move_data.col)
      } else if (move.move_data.type === 'pass') {
        handleRemotePass()
      }
    },
    onPlayerJoin: () => {
      setPlayerColor('white')
    }
  })

  const handleCreateRoom = async () => {
    await createRoom()
    setPlayerColor('black')
  }

  const handleJoinRoom = async () => {
    if (roomCode) {
      await joinRoom(roomCode)
      setPlayerColor('white')
    }
  }

  // Get all stones in a group connected to the given position
  const getGroup = useCallback((board: Board, row: number, col: number): Set<string> => {
    const color = board[row][col]
    if (!color) return new Set()

    const group = new Set<string>()
    const stack = [[row, col]]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const [r, c] = stack.pop()!
      const key = `${r},${c}`
      
      if (visited.has(key)) continue
      visited.add(key)

      if (board[r]?.[c] === color) {
        group.add(key)
        
        // Check adjacent positions
        const adjacent = [
          [r - 1, c], [r + 1, c],
          [r, c - 1], [r, c + 1]
        ]
        
        for (const [nr, nc] of adjacent) {
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
            stack.push([nr, nc])
          }
        }
      }
    }

    return group
  }, [boardSize])

  // Check if a group has any liberties (empty adjacent spaces)
  const hasLiberties = useCallback((board: Board, group: Set<string>): boolean => {
    for (const pos of group) {
      const [row, col] = pos.split(',').map(Number)
      const adjacent = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1]
      ]
      
      for (const [r, c] of adjacent) {
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
          if (board[r][c] === null) {
            return true
          }
        }
      }
    }
    return false
  }, [boardSize])

  // Capture stones that have no liberties
  const captureStones = useCallback((board: Board, color: 'black' | 'white'): number => {
    const opponent = color === 'black' ? 'white' : 'black'
    let captured = 0
    const visited = new Set<string>()

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === opponent) {
          const key = `${row},${col}`
          if (!visited.has(key)) {
            const group = getGroup(board, row, col)
            group.forEach(pos => visited.add(pos))
            
            if (!hasLiberties(board, group)) {
              // Capture the group
              for (const pos of group) {
                const [r, c] = pos.split(',').map(Number)
                board[r][c] = null
                captured++
              }
            }
          }
        }
      }
    }

    return captured
  }, [boardSize, getGroup, hasLiberties])

  // Check if a move would be suicide (placing a stone with no liberties)
  const isSuicide = useCallback((board: Board, row: number, col: number, color: 'black' | 'white'): boolean => {
    // Temporarily place the stone
    const testBoard = board.map(r => [...r])
    testBoard[row][col] = color
    
    // Capture opponent stones first
    captureStones(testBoard, color)
    
    // Check if our group would have liberties
    const group = getGroup(testBoard, row, col)
    return !hasLiberties(testBoard, group)
  }, [captureStones, getGroup, hasLiberties])

  // Check if a move violates the Ko rule (immediate recapture)
  const isKo = useCallback((row: number, col: number): boolean => {
    return gameState.koPosition?.row === row && gameState.koPosition?.col === col
  }, [gameState.koPosition])

  const isValidMove = useCallback((row: number, col: number): boolean => {
    if (gameState.board[row][col] !== null) return false
    if (isKo(row, col)) return false
    if (isSuicide(gameState.board, row, col, gameState.currentPlayer)) return false
    return true
  }, [gameState.board, gameState.currentPlayer, isKo, isSuicide])

  const handleRemoteMove = (row: number, col: number) => {
    if (!isValidMove(row, col)) return

    const newBoard = gameState.board.map(r => [...r])
    newBoard[row][col] = gameState.currentPlayer

    // Capture opponent stones
    const captured = captureStones(newBoard, gameState.currentPlayer)

    // Update Ko position if exactly one stone was captured
    let newKoPosition = null
    if (captured === 1) {
      // Check if this could lead to Ko
      const opponent = gameState.currentPlayer === 'black' ? 'white' : 'black'
      const testBoard = newBoard.map(r => [...r])
      
      // Find the captured stone position
      for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
          if (gameState.board[r][c] === opponent && newBoard[r][c] === null) {
            newKoPosition = { row: r, col: c }
            break
          }
        }
      }
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      capturedStones: {
        ...prev.capturedStones,
        [prev.currentPlayer]: prev.capturedStones[prev.currentPlayer as keyof typeof prev.capturedStones] + captured
      },
      lastMove: { row, col },
      koPosition: newKoPosition,
      passes: 0
    }))
  }

  const handleRemotePass = () => {
    setGameState(prev => {
      const newPasses = prev.passes + 1
      
      if (newPasses >= 2) {
        // Both players passed - game over
        const territory = calculateTerritory(prev.board)
        const blackScore = territory.black + prev.capturedStones.white
        const whiteScore = territory.white + prev.capturedStones.black + 6.5 // Komi

        return {
          ...prev,
          currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
          passes: newPasses,
          gameOver: true,
          winner: blackScore > whiteScore ? 'black' : 'white',
          territory
        }
      }

      return {
        ...prev,
        currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
        passes: newPasses,
        koPosition: null
      }
    })
  }

  const placeStone = useCallback((row: number, col: number) => {
    if (gameState.gameOver) return
    if (!isConnected && gameState.currentPlayer !== playerColor) return
    if (isConnected && gameState.currentPlayer !== playerColor) return
    if (!isValidMove(row, col)) return

    handleRemoteMove(row, col)

    if (isConnected) {
      sendMove({
        type: 'stone_placement',
        row,
        col
      })
    }
  }, [gameState, isConnected, playerColor, isValidMove, sendMove])

  const pass = useCallback(() => {
    if (gameState.gameOver) return
    if (isConnected && gameState.currentPlayer !== playerColor) return

    handleRemotePass()

    if (isConnected) {
      sendMove({ type: 'pass' })
    }
  }, [gameState, isConnected, playerColor, sendMove])

  // Calculate territory using flood fill
  const calculateTerritory = (board: Board): { black: number; white: number } => {
    const territory = { black: 0, white: 0 }
    const visited = new Set<string>()

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === null && !visited.has(`${row},${col}`)) {
          const area = new Set<string>()
          const stack = [[row, col]]
          let surroundedBy: 'black' | 'white' | 'neutral' = 'neutral'
          const colors = new Set<'black' | 'white'>()

          while (stack.length > 0) {
            const [r, c] = stack.pop()!
            const key = `${r},${c}`
            
            if (visited.has(key)) continue
            visited.add(key)

            if (board[r]?.[c] === null) {
              area.add(key)
              
              const adjacent = [
                [r - 1, c], [r + 1, c],
                [r, c - 1], [r, c + 1]
              ]
              
              for (const [nr, nc] of adjacent) {
                if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                  if (board[nr][nc] === null) {
                    stack.push([nr, nc])
                  } else {
                    colors.add(board[nr][nc] as 'black' | 'white')
                  }
                }
              }
            }
          }

          if (colors.size === 1) {
            const color = Array.from(colors)[0]
            territory[color] += area.size
          }
        }
      }
    }

    return territory
  }

  const resetGame = () => {
    setGameState({
      board: initializeBoard(boardSize),
      currentPlayer: 'black',
      capturedStones: { black: 0, white: 0 },
      lastMove: null,
      koPosition: null,
      passes: 0,
      gameOver: false,
      winner: null,
      territory: { black: 0, white: 0 }
    })
  }

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Go ({boardSize}x{boardSize})</h2>
          {roomId && (
            <div className="text-sm text-muted-foreground">
              Room: {roomId} | You are: {playerColor}
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
            <Button variant="outline" onClick={resetGame}>Play Offline</Button>
          </div>
        )}

        <div className="flex gap-8">
          <div className="flex-1">
            <div 
              className="inline-block p-4 bg-amber-100 dark:bg-amber-900 rounded-lg"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${boardSize}, 30px)`,
                gap: '1px',
                backgroundColor: '#D4A574'
              }}
            >
              {gameState.board.map((row, rowIndex) => (
                row.map((stone, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => placeStone(rowIndex, colIndex)}
                    className="w-[30px] h-[30px] relative bg-amber-100 dark:bg-amber-900 border border-gray-800 hover:opacity-80 transition-opacity"
                    disabled={gameState.gameOver || !isValidMove(rowIndex, colIndex)}
                  >
                    {stone && (
                      <div
                        className={`absolute inset-1 rounded-full ${
                          stone === 'black' ? 'bg-gray-900' : 'bg-white border border-gray-800'
                        }`}
                      />
                    )}
                    {gameState.lastMove?.row === rowIndex && gameState.lastMove?.col === colIndex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    )}
                  </button>
                ))
              ))}
            </div>
          </div>

          <div className="w-64 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Game Info</h3>
              <div className="space-y-2 text-sm">
                <div>Current Player: {gameState.currentPlayer}</div>
                <div>Passes: {gameState.passes}/2</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Captured Stones</h3>
              <div className="space-y-1 text-sm">
                <div>Black captured: {gameState.capturedStones.black}</div>
                <div>White captured: {gameState.capturedStones.white}</div>
              </div>
            </Card>

            {gameState.gameOver && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Game Over!</h3>
                <div className="space-y-1 text-sm">
                  <div>Winner: {gameState.winner}</div>
                  <div>Black territory: {gameState.territory.black}</div>
                  <div>White territory: {gameState.territory.white}</div>
                  <div>Black score: {gameState.territory.black + gameState.capturedStones.white}</div>
                  <div>White score: {gameState.territory.white + gameState.capturedStones.black + 6.5}</div>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Button 
                onClick={pass} 
                className="w-full"
                disabled={gameState.gameOver}
              >
                Pass
              </Button>
              <Button 
                onClick={resetGame} 
                variant="outline" 
                className="w-full"
              >
                New Game
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Rules: Place stones to control territory. Capture opponent stones by surrounding them. 
          Ko rule prevents immediate recapture. Game ends when both players pass. Komi: 6.5 points for white.
        </div>
      </div>
    </Card>
  )
}