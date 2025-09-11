'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Users, Clock, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type PieceColor = 'white' | 'black'
type Piece = {
  type: PieceType
  color: PieceColor
} | null

type Square = {
  row: number
  col: number
}

const INITIAL_BOARD: Piece[][] = [
  [
    { type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, 
    { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, 
    { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'black' as PieceColor })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'white' as PieceColor })),
  [
    { type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, 
    { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, 
    { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }
  ]
]

const PIECE_SYMBOLS: Record<PieceType, Record<PieceColor, string>> = {
  king: { white: '♔', black: '♚' },
  queen: { white: '♕', black: '♛' },
  rook: { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn: { white: '♙', black: '♟' }
}

const OnlineChess: React.FC = () => {
  const [board, setBoard] = useState<Piece[][]>(INITIAL_BOARD)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[], black: Piece[] }>({ white: [], black: [] })
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [playerElo, setPlayerElo] = useState(1200)
  const [opponentElo, setOpponentElo] = useState(1200)
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw'>('playing')
  const [timeLeft, setTimeLeft] = useState<{ white: number, black: number }>({ white: 600, black: 600 })
  const [isCheck, setIsCheck] = useState(false)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [isOnlineMode, setIsOnlineMode] = useState(false)
  const [roomCode, setRoomCode] = useState('')

  const isValidMove = useCallback((from: Square, to: Square, testMode = false): boolean => {
    const piece = board[from.row][from.col]
    if (!piece) return false

    const targetPiece = board[to.row][to.col]
    if (targetPiece?.color === piece.color) return false

    const rowDiff = to.row - from.row
    const colDiff = to.col - from.col
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)

    // Basic piece movement rules
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1
        const startRow = piece.color === 'white' ? 6 : 1
        
        if (colDiff === 0) {
          if (rowDiff === direction && !targetPiece) return true
          if (from.row === startRow && rowDiff === 2 * direction && !targetPiece) {
            const middlePiece = board[from.row + direction][from.col]
            return !middlePiece
          }
        } else if (absColDiff === 1 && rowDiff === direction && targetPiece) {
          return true
        }
        return false

      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)

      case 'bishop':
        if (absRowDiff !== absColDiff) return false
        return isPathClear(from, to)

      case 'rook':
        if (rowDiff !== 0 && colDiff !== 0) return false
        return isPathClear(from, to)

      case 'queen':
        if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false
        return isPathClear(from, to)

      case 'king':
        return absRowDiff <= 1 && absColDiff <= 1

      default:
        return false
    }
  }, [board])

  const isPathClear = useCallback((from: Square, to: Square): boolean => {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0
    
    let currentRow = from.row + rowStep
    let currentCol = from.col + colStep
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol]) return false
      currentRow += rowStep
      currentCol += colStep
    }
    
    return true
  }, [board])

  const getPossibleMoves = useCallback((square: Square): Square[] => {
    const moves: Square[] = []
    const piece = board[square.row][square.col]
    if (!piece || piece.color !== currentPlayer) return moves

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(square, { row, col })) {
          moves.push({ row, col })
        }
      }
    }

    return moves
  }, [board, currentPlayer, isValidMove])

  const makeMove = useCallback((from: Square, to: Square) => {
    const newBoard = board.map(row => [...row])
    const piece = newBoard[from.row][from.col]
    const targetPiece = newBoard[to.row][to.col]
    
    if (!piece) return

    // Capture piece
    if (targetPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        [targetPiece.color]: [...prev[targetPiece.color], targetPiece]
      }))
    }

    // Move piece
    newBoard[to.row][to.col] = piece
    newBoard[from.row][from.col] = null

    // Pawn promotion
    if (piece.type === 'pawn') {
      if ((piece.color === 'white' && to.row === 0) || (piece.color === 'black' && to.row === 7)) {
        newBoard[to.row][to.col] = { type: 'queen', color: piece.color }
      }
    }

    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white')
    setSelectedSquare(null)
    setPossibleMoves([])

    // Add to move history
    const moveNotation = `${piece.type} ${String.fromCharCode(97 + from.col)}${8 - from.row} → ${String.fromCharCode(97 + to.col)}${8 - to.row}`
    setMoveHistory(prev => [...prev, moveNotation])
  }, [board, currentPlayer])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing') return

    if (selectedSquare) {
      const move = { row, col }
      if (possibleMoves.some(m => m.row === row && m.col === col)) {
        makeMove(selectedSquare, move)
      } else {
        setSelectedSquare(null)
        setPossibleMoves([])
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
    setBoard(INITIAL_BOARD)
    setSelectedSquare(null)
    setCurrentPlayer('white')
    setPossibleMoves([])
    setCapturedPieces({ white: [], black: [] })
    setMoveHistory([])
    setGameStatus('playing')
    setTimeLeft({ white: 600, black: 600 })
    setIsCheck(false)
  }, [])

  const calculateEloChange = (playerElo: number, opponentElo: number, won: boolean): number => {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
    const actualScore = won ? 1 : 0
    const kFactor = 32
    return Math.round(kFactor * (actualScore - expectedScore))
  }

  const joinOnlineGame = () => {
    setIsOnlineMode(true)
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase())
    // In a real implementation, this would connect to a game server
  }

  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = { ...prev }
        newTime[currentPlayer] = Math.max(0, prev[currentPlayer] - 1)
        
        if (newTime[currentPlayer] === 0) {
          setGameStatus('draw')
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentPlayer, gameStatus])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Online Chess - ELO: {playerElo}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Level {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars} Stars</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>ELO: {playerElo}</span>
            </div>
            {isOnlineMode && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Room: {roomCode}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isOnlineMode && (
              <Button onClick={joinOnlineGame} variant="outline" size="sm">
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
        <div className="flex gap-4">
          {/* Main Board */}
          <div className="flex-1">
            <div className="mb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={currentPlayer === 'black' ? 'font-bold' : ''}>
                  Black: {formatTime(timeLeft.black)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {isOnlineMode ? 'Opponent' : 'AI'} ELO: {opponentElo}
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 dark:border-gray-200">
              {board.map((row, rowIndex) => 
                row.map((piece, colIndex) => {
                  const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                  const isPossibleMove = possibleMoves.some(m => m.row === rowIndex && m.col === colIndex)
                  const isLight = (rowIndex + colIndex) % 2 === 0
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        aspect-square flex items-center justify-center text-4xl cursor-pointer transition-colors
                        ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                        ${isSelected ? 'ring-4 ring-blue-500' : ''}
                        ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
                        hover:brightness-110
                      `}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={piece.color === 'white' ? 'text-white drop-shadow-lg' : 'text-black drop-shadow-lg'}
                        >
                          {PIECE_SYMBOLS[piece.type][piece.color]}
                        </motion.span>
                      )}
                      {isPossibleMove && !piece && (
                        <div className="w-3 h-3 bg-green-400 rounded-full opacity-70" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={currentPlayer === 'white' ? 'font-bold' : ''}>
                  White: {formatTime(timeLeft.white)}
                </span>
              </div>
              <div className="text-sm">
                Current Turn: <span className="font-bold capitalize">{currentPlayer}</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-64 space-y-4">
            {/* Captured Pieces */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Captured Pieces</h3>
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {capturedPieces.white.map((piece, i) => (
                    <span key={i} className="text-2xl">
                      {piece && PIECE_SYMBOLS[piece.type]['white']}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {capturedPieces.black.map((piece, i) => (
                    <span key={i} className="text-2xl">
                      {piece && PIECE_SYMBOLS[piece.type]['black']}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Move History */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Move History</h3>
              <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                {moveHistory.map((move, i) => (
                  <div key={i} className={i % 2 === 0 ? 'text-gray-700 dark:text-gray-300' : ''}>
                    {Math.floor(i / 2) + 1}. {move}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            {gameStatus !== 'playing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center"
              >
                <h3 className="text-xl font-bold mb-2">
                  {gameStatus === 'checkmate' && 'Checkmate!'}
                  {gameStatus === 'stalemate' && 'Stalemate!'}
                  {gameStatus === 'draw' && 'Draw!'}
                </h3>
                <p className="mb-2">
                  ELO Change: {gameStatus === 'checkmate' ? '+' : ''}{calculateEloChange(playerElo, opponentElo, gameStatus === 'checkmate')}
                </p>
                <Button onClick={resetGame} className="w-full">
                  New Game
                </Button>
              </motion.div>
            )}

            {isCheck && gameStatus === 'playing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-100 dark:bg-red-900 p-3 rounded-lg text-center"
              >
                <span className="font-bold text-red-600 dark:text-red-300">CHECK!</span>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnlineChess