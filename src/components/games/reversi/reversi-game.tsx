'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMultiplayerGame } from '@/lib/supabase/realtime'

type Disc = 'black' | 'white' | null
type Board = Disc[][]

interface GameState {
  board: Board
  currentPlayer: 'black' | 'white'
  scores: { black: number; white: number }
  validMoves: { row: number; col: number }[]
  gameOver: boolean
  winner: 'black' | 'white' | 'draw' | null
  lastMove: { row: number; col: number } | null
}

export function ReversiGame() {
  const BOARD_SIZE = 8

  const initializeBoard = (): Board => {
    const board: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
    // Set initial four discs in the center
    board[3][3] = 'white'
    board[3][4] = 'black'
    board[4][3] = 'black'
    board[4][4] = 'white'
    return board
  }

  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentPlayer: 'black',
    scores: { black: 2, white: 2 },
    validMoves: [],
    gameOver: false,
    winner: null,
    lastMove: null
  })

  const [roomCode, setRoomCode] = useState('')
  const [playerColor, setPlayerColor] = useState<'black' | 'white'>('black')
  const [showHints, setShowHints] = useState(true)

  const {
    isConnected,
    roomId,
    sendMove,
    createRoom,
    joinRoom
  } = useMultiplayerGame({
    gameType: 'reversi',
    onGameMove: (move) => {
      if (move.move_data.type === 'place_disc') {
        handleRemoteMove(move.move_data.row, move.move_data.col)
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

  // Check if a move is valid and return the discs that would be flipped
  const getFlippedDiscs = useCallback((board: Board, row: number, col: number, player: 'black' | 'white'): { row: number; col: number }[] => {
    if (board[row][col] !== null) return []

    const opponent = player === 'black' ? 'white' : 'black'
    const flipped: { row: number; col: number }[] = []

    // Check all eight directions
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]

    for (const [dr, dc] of directions) {
      const lineFlipped: { row: number; col: number }[] = []
      let r = row + dr
      let c = col + dc

      // Follow the line while we see opponent discs
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
        lineFlipped.push({ row: r, col: c })
        r += dr
        c += dc
      }

      // If we ended on our own disc and captured at least one opponent disc
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player && lineFlipped.length > 0) {
        flipped.push(...lineFlipped)
      }
    }

    return flipped
  }, [])

  // Get all valid moves for the current player
  const getValidMoves = useCallback((board: Board, player: 'black' | 'white'): { row: number; col: number }[] => {
    const moves: { row: number; col: number }[] = []

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (getFlippedDiscs(board, row, col, player).length > 0) {
          moves.push({ row, col })
        }
      }
    }

    return moves
  }, [getFlippedDiscs])

  // Update valid moves whenever the board or player changes
  useEffect(() => {
    const moves = getValidMoves(gameState.board, gameState.currentPlayer)
    setGameState(prev => ({ ...prev, validMoves: moves }))

    // Check for game over conditions
    if (moves.length === 0) {
      const opponent = gameState.currentPlayer === 'black' ? 'white' : 'black'
      const opponentMoves = getValidMoves(gameState.board, opponent)

      if (opponentMoves.length === 0) {
        // No moves for either player - game over
        const blackCount = gameState.board.flat().filter(disc => disc === 'black').length
        const whiteCount = gameState.board.flat().filter(disc => disc === 'white').length

        setGameState(prev => ({
          ...prev,
          gameOver: true,
          winner: blackCount > whiteCount ? 'black' : whiteCount > blackCount ? 'white' : 'draw'
        }))
      } else {
        // Current player has no moves, pass to opponent
        setGameState(prev => ({
          ...prev,
          currentPlayer: opponent,
          validMoves: opponentMoves
        }))
      }
    }
  }, [gameState.board, gameState.currentPlayer, getValidMoves])

  const handleRemoteMove = (row: number, col: number) => {
    const flipped = getFlippedDiscs(gameState.board, row, col, gameState.currentPlayer)
    if (flipped.length === 0) return

    const newBoard = gameState.board.map(r => [...r])
    
    // Place the new disc
    newBoard[row][col] = gameState.currentPlayer

    // Flip the captured discs
    for (const disc of flipped) {
      newBoard[disc.row][disc.col] = gameState.currentPlayer
    }

    // Count scores
    const blackCount = newBoard.flat().filter(disc => disc === 'black').length
    const whiteCount = newBoard.flat().filter(disc => disc === 'white').length

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      scores: { black: blackCount, white: whiteCount },
      lastMove: { row, col }
    }))
  }

  const placeDisc = useCallback((row: number, col: number) => {
    if (gameState.gameOver) return
    if (isConnected && gameState.currentPlayer !== playerColor) return

    const flipped = getFlippedDiscs(gameState.board, row, col, gameState.currentPlayer)
    if (flipped.length === 0) return

    handleRemoteMove(row, col)

    if (isConnected) {
      sendMove({
        type: 'place_disc',
        row,
        col
      })
    }
  }, [gameState, isConnected, playerColor, getFlippedDiscs, sendMove])

  const isValidMove = (row: number, col: number): boolean => {
    return gameState.validMoves.some(move => move.row === row && move.col === col)
  }

  const resetGame = () => {
    setGameState({
      board: initializeBoard(),
      currentPlayer: 'black',
      scores: { black: 2, white: 2 },
      validMoves: [],
      gameOver: false,
      winner: null,
      lastMove: null
    })
  }

  // AI move for single player
  const makeAIMove = useCallback(() => {
    if (gameState.validMoves.length === 0) return

    // Simple AI: choose the move that flips the most discs
    let bestMove = gameState.validMoves[0]
    let maxFlipped = 0

    for (const move of gameState.validMoves) {
      const flipped = getFlippedDiscs(gameState.board, move.row, move.col, gameState.currentPlayer)
      if (flipped.length > maxFlipped) {
        maxFlipped = flipped.length
        bestMove = move
      }
    }

    setTimeout(() => {
      placeDisc(bestMove.row, bestMove.col)
    }, 500)
  }, [gameState.validMoves, gameState.board, gameState.currentPlayer, getFlippedDiscs, placeDisc])

  // AI plays as white in single player mode
  useEffect(() => {
    if (!isConnected && gameState.currentPlayer === 'white' && !gameState.gameOver) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameOver, isConnected, makeAIMove])

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Reversi (Othello)</h2>
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
            <Button variant="outline" onClick={resetGame}>Play vs AI</Button>
          </div>
        )}

        <div className="flex gap-8">
          <div className="flex-1">
            <div 
              className="inline-block p-4 bg-green-600 dark:bg-green-800 rounded-lg"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 48px)`,
                gap: '2px'
              }}
            >
              {gameState.board.map((row, rowIndex) => (
                row.map((disc, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => placeDisc(rowIndex, colIndex)}
                    className={`w-12 h-12 bg-green-500 dark:bg-green-700 border border-green-800 relative transition-all ${
                      isValidMove(rowIndex, colIndex) && showHints ? 'hover:bg-green-400 dark:hover:bg-green-600' : ''
                    }`}
                    disabled={gameState.gameOver || !isValidMove(rowIndex, colIndex)}
                  >
                    {disc && (
                      <div
                        className={`absolute inset-1 rounded-full ${
                          disc === 'black' ? 'bg-gray-900' : 'bg-white'
                        } transition-all duration-300`}
                      />
                    )}
                    {showHints && isValidMove(rowIndex, colIndex) && !disc && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
                      </div>
                    )}
                    {gameState.lastMove?.row === rowIndex && gameState.lastMove?.col === colIndex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                    )}
                  </button>
                ))
              ))}
            </div>
          </div>

          <div className="w-64 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Score</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-900 rounded-full" />
                    Black
                  </span>
                  <span className="font-bold">{gameState.scores.black}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-800 rounded-full" />
                    White
                  </span>
                  <span className="font-bold">{gameState.scores.white}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Game Info</h3>
              <div className="space-y-2 text-sm">
                <div>Current Turn: {gameState.currentPlayer}</div>
                <div>Valid Moves: {gameState.validMoves.length}</div>
                <div>Discs Placed: {gameState.scores.black + gameState.scores.white}</div>
              </div>
            </Card>

            {gameState.gameOver && (
              <Card className="p-4 bg-primary/10">
                <h3 className="font-semibold mb-2">Game Over!</h3>
                <div className="text-lg font-bold">
                  {gameState.winner === 'draw' 
                    ? "It's a draw!" 
                    : `${gameState.winner === 'black' ? 'Black' : 'White'} wins!`}
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => setShowHints(!showHints)}
                variant="outline"
                className="w-full"
              >
                {showHints ? 'Hide' : 'Show'} Hints
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
          Rules: Place discs to flip opponent's discs between yours. The player with the most discs at the end wins.
          Valid moves are shown with yellow dots when hints are enabled.
        </div>
      </div>
    </Card>
  )
}