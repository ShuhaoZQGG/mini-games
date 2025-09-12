'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Users, Clock, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type PieceType = 'regular' | 'king' | null
type PieceColor = 'red' | 'black'
type Piece = {
  type: PieceType
  color: PieceColor
} | null

type Square = {
  row: number
  col: number
}

type Move = {
  from: Square
  to: Square
  captures?: Square[]
}

const OnlineCheckers: React.FC = () => {
  const [board, setBoard] = useState<Piece[][]>(() => {
    const initialBoard: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null))
    
    // Place black pieces
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          initialBoard[row][col] = { type: 'regular', color: 'black' }
        }
      }
    }
    
    // Place red pieces
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          initialBoard[row][col] = { type: 'regular', color: 'red' }
        }
      }
    }
    
    return initialBoard
  })

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('red')
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([])
  const [mustCapture, setMustCapture] = useState(false)
  const [capturedPieces, setCapturedPieces] = useState<{ red: number, black: number }>({ red: 0, black: 0 })
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing')
  const [winner, setWinner] = useState<PieceColor | null>(null)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [score, setScore] = useState(0)
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'searching' | 'matched'>('idle')
  const [opponentName, setOpponentName] = useState('AI Opponent')
  const [playerRating, setPlayerRating] = useState(1000)
  const [timeLeft, setTimeLeft] = useState<{ red: number, black: number }>({ red: 300, black: 300 })

  const isValidSquare = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const canCapture = useCallback((from: Square, piece: Piece): Square[] => {
    if (!piece) return []
    
    const captures: Square[] = []
    const directions = piece.type === 'king' 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red' 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]]

    for (const [dr, dc] of directions) {
      const midRow = from.row + dr
      const midCol = from.col + dc
      const toRow = from.row + 2 * dr
      const toCol = from.col + 2 * dc

      if (isValidSquare(toRow, toCol)) {
        const midPiece = board[midRow][midCol]
        const toPiece = board[toRow][toCol]

        if (midPiece && midPiece.color !== piece.color && !toPiece) {
          captures.push({ row: toRow, col: toCol })
        }
      }
    }

    return captures
  }, [board])

  const getPossibleMoves = useCallback((square: Square): Move[] => {
    const piece = board[square.row][square.col]
    if (!piece || piece.color !== currentPlayer) return []

    const moves: Move[] = []
    const captures = canCapture(square, piece)

    // Check if any piece can capture
    let anyCanCapture = false
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = board[row][col]
        if (p && p.color === currentPlayer) {
          if (canCapture({ row, col }, p).length > 0) {
            anyCanCapture = true
            break
          }
        }
      }
      if (anyCanCapture) break
    }

    // If any piece can capture, only capture moves are allowed
    if (anyCanCapture) {
      setMustCapture(true)
      return captures.map(to => ({
        from: square,
        to,
        captures: [{
          row: square.row + (to.row - square.row) / 2,
          col: square.col + (to.col - square.col) / 2
        }]
      }))
    }

    setMustCapture(false)

    // Regular moves
    const directions = piece.type === 'king'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red'
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]]

    for (const [dr, dc] of directions) {
      const newRow = square.row + dr
      const newCol = square.col + dc

      if (isValidSquare(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({
          from: square,
          to: { row: newRow, col: newCol }
        })
      }
    }

    return moves
  }, [board, currentPlayer, canCapture])

  const makeMove = useCallback((move: Move) => {
    const newBoard = board.map(row => [...row])
    const piece = newBoard[move.from.row][move.from.col]
    
    if (!piece) return

    // Move piece
    newBoard[move.to.row][move.to.col] = piece
    newBoard[move.from.row][move.from.col] = null

    // Handle captures
    if (move.captures) {
      for (const capture of move.captures) {
        newBoard[capture.row][capture.col] = null
        setCapturedPieces(prev => ({
          ...prev,
          [currentPlayer === 'red' ? 'black' : 'red']: prev[currentPlayer === 'red' ? 'black' : 'red'] + 1
        }))
        setScore(prev => prev + 100)
      }

      // Check for additional captures
      const additionalCaptures = canCapture(move.to, piece)
      if (additionalCaptures.length > 0) {
        setSelectedSquare(move.to)
        setPossibleMoves(additionalCaptures.map(to => ({
          from: move.to,
          to,
          captures: [{
            row: move.to.row + (to.row - move.to.row) / 2,
            col: move.to.col + (to.col - move.to.col) / 2
          }]
        })))
        setBoard(newBoard)
        return // Don't switch players yet
      }
    }

    // Promote to king
    if (piece.type === 'regular') {
      if ((piece.color === 'red' && move.to.row === 0) || 
          (piece.color === 'black' && move.to.row === 7)) {
        newBoard[move.to.row][move.to.col] = { type: 'king', color: piece.color }
        setScore(prev => prev + 50)
      }
    }

    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red')
    setSelectedSquare(null)
    setPossibleMoves([])

    // Add to move history
    const moveNotation = `${move.from.row},${move.from.col} → ${move.to.row},${move.to.col}`
    setMoveHistory(prev => [...prev, moveNotation])

    // Check for game over
    checkGameStatus(newBoard)
  }, [board, currentPlayer, canCapture])

  const checkGameStatus = (board: Piece[][]) => {
    let redPieces = 0
    let blackPieces = 0
    let redCanMove = false
    let blackCanMove = false

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          if (piece.color === 'red') {
            redPieces++
            if (!redCanMove && getPossibleMoves({ row, col }).length > 0) {
              redCanMove = true
            }
          } else {
            blackPieces++
            if (!blackCanMove && getPossibleMoves({ row, col }).length > 0) {
              blackCanMove = true
            }
          }
        }
      }
    }

    if (redPieces === 0 || !redCanMove) {
      setGameStatus('won')
      setWinner('black')
    } else if (blackPieces === 0 || !blackCanMove) {
      setGameStatus('won')
      setWinner('red')
    }
  }

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return

    if (selectedSquare) {
      const move = possibleMoves.find(m => m.to.row === row && m.to.col === col)
      if (move) {
        makeMove(move)
      } else {
        const piece = board[row][col]
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare({ row, col })
          setPossibleMoves(getPossibleMoves({ row, col }))
        } else {
          setSelectedSquare(null)
          setPossibleMoves([])
        }
      }
    } else {
      const piece = board[row][col]
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare({ row, col })
        setPossibleMoves(getPossibleMoves({ row, col }))
      }
    }
  }, [selectedSquare, possibleMoves, board, currentPlayer, gameStatus, makeMove, getPossibleMoves])

  const resetGame = useCallback(() => {
    const initialBoard: Piece[][] = Array(8).fill(null).map(() => Array(8).fill(null))
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          initialBoard[row][col] = { type: 'regular', color: 'black' }
        }
      }
    }
    
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          initialBoard[row][col] = { type: 'regular', color: 'red' }
        }
      }
    }
    
    setBoard(initialBoard)
    setSelectedSquare(null)
    setCurrentPlayer('red')
    setPossibleMoves([])
    setMustCapture(false)
    setCapturedPieces({ red: 0, black: 0 })
    setMoveHistory([])
    setGameStatus('playing')
    setWinner(null)
    setScore(0)
    setTimeLeft({ red: 300, black: 300 })
    setMatchmakingStatus('idle')
  }, [])

  const startMatchmaking = () => {
    setMatchmakingStatus('searching')
    
    // Simulate matchmaking
    setTimeout(() => {
      setMatchmakingStatus('matched')
      setOpponentName(`Player${Math.floor(Math.random() * 9999)}`)
      const opponentRating = playerRating + Math.floor(Math.random() * 200) - 100
      setScore(0)
    }, 2000)
  }

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing' || matchmakingStatus !== 'matched') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = { ...prev }
        newTime[currentPlayer] = Math.max(0, prev[currentPlayer] - 1)
        
        if (newTime[currentPlayer] === 0) {
          setGameStatus('won')
          setWinner(currentPlayer === 'red' ? 'black' : 'red')
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentPlayer, gameStatus, matchmakingStatus])

  // Update level based on score
  useEffect(() => {
    const newLevel = Math.floor(score / 500) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(3, Math.floor(score / 1000)))
    }
  }, [score, level])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Online Checkers - Rating: {playerRating}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Level {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/3 Stars</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span>Score: {score}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {matchmakingStatus === 'idle' && (
              <Button onClick={startMatchmaking} variant="outline" size="sm">
                <Wifi className="w-4 h-4 mr-1" />
                Find Match
              </Button>
            )}
            {matchmakingStatus === 'searching' && (
              <Button disabled variant="outline" size="sm">
                <Wifi className="w-4 h-4 mr-1 animate-pulse" />
                Searching...
              </Button>
            )}
            {matchmakingStatus === 'matched' && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-green-500" />
                <span>vs {opponentName}</span>
              </div>
            )}
            <Button onClick={resetGame} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              New Game
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Main Board */}
          <div className="flex-1">
            {matchmakingStatus === 'matched' && (
              <div className="mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={currentPlayer === 'black' ? 'font-bold' : ''}>
                    Black: {formatTime(timeLeft.black)}
                  </span>
                </div>
                <div className="text-sm">
                  Captured: {capturedPieces.red}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 dark:border-gray-200">
              {board.map((row, rowIndex) => 
                row.map((piece, colIndex) => {
                  const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                  const isPossibleMove = possibleMoves.some(m => m.to.row === rowIndex && m.to.col === colIndex)
                  const isDark = (rowIndex + colIndex) % 2 === 1
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        aspect-square flex items-center justify-center cursor-pointer transition-all
                        ${isDark ? 'bg-green-800' : 'bg-green-100'}
                        ${isSelected ? 'ring-4 ring-blue-500' : ''}
                        ${isPossibleMove ? 'ring-2 ring-yellow-400' : ''}
                        hover:brightness-110
                      `}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`
                            w-10 h-10 rounded-full border-2 flex items-center justify-center
                            ${piece.color === 'red' 
                              ? 'bg-red-600 border-red-800' 
                              : 'bg-gray-800 border-gray-900'}
                          `}
                        >
                          {piece.type === 'king' && (
                            <span className="text-yellow-400 text-xl">♔</span>
                          )}
                        </motion.div>
                      )}
                      {isPossibleMove && !piece && (
                        <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-70" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
            
            {matchmakingStatus === 'matched' && (
              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={currentPlayer === 'red' ? 'font-bold' : ''}>
                    Red: {formatTime(timeLeft.red)}
                  </span>
                </div>
                <div className="text-sm">
                  Captured: {capturedPieces.black}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-64 space-y-4">
            {/* Game Info */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Game Info</h3>
              <div className="space-y-1 text-sm">
                <div>Current Turn: <span className="font-bold capitalize">{currentPlayer}</span></div>
                {mustCapture && (
                  <div className="text-orange-600 dark:text-orange-400 font-semibold">
                    Must capture!
                  </div>
                )}
                <div>Red Pieces: {12 - capturedPieces.red}</div>
                <div>Black Pieces: {12 - capturedPieces.black}</div>
              </div>
            </div>

            {/* Move History */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Move History</h3>
              <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                {moveHistory.map((move, i) => (
                  <div key={i} className={i % 2 === 0 ? 'text-gray-700 dark:text-gray-300' : ''}>
                    {i + 1}. {move}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <AnimatePresence>
              {gameStatus === 'won' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center"
                >
                  <h3 className="text-xl font-bold mb-2">
                    {winner === 'red' ? 'Red' : 'Black'} Wins!
                  </h3>
                  <p className="mb-2">Final Score: {score}</p>
                  <p className="mb-3">Rating Change: +{Math.floor(Math.random() * 30) + 10}</p>
                  <Button onClick={resetGame} className="w-full">
                    Play Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnlineCheckers