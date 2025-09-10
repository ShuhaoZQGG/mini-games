'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, RotateCcw, Flag, Handshake, Clock, Trophy, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
type PieceColor = 'white' | 'black'
type Piece = {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean
} | null

type Board = Piece[][]
type Position = { row: number; col: number }
type Move = { from: Position; to: Position; promotion?: PieceType }

const PIECE_SYMBOLS = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
}

const initialBoard: Board = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'black' as PieceColor })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'white' as PieceColor })),
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ]
]

const Chess: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: []
  })
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [isCheck, setIsCheck] = useState(false)
  const [isCheckmate, setIsCheckmate] = useState(false)
  const [isDraw, setIsDraw] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<PieceColor | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [promotionSquare, setPromotionSquare] = useState<Position | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [level, setLevel] = useState(1)

  const positionToAlgebraic = (pos: Position): string => {
    const files = 'abcdefgh'
    return `${files[pos.col]}${8 - pos.row}`
  }

  const getPieceValue = (piece: Piece): number => {
    if (!piece) return 0
    const values = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 0
    }
    return values[piece.type]
  }

  const isValidMove = useCallback((from: Position, to: Position, testOnly = false): boolean => {
    const piece = board[from.row][from.col]
    if (!piece) return false

    const targetPiece = board[to.row][to.col]
    if (targetPiece && targetPiece.color === piece.color) return false

    const rowDiff = to.row - from.row
    const colDiff = to.col - from.col
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)

    // Check piece-specific movement rules
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1
        const startRow = piece.color === 'white' ? 6 : 1

        // Forward movement
        if (colDiff === 0) {
          if (rowDiff === direction && !targetPiece) return true
          if (from.row === startRow && rowDiff === 2 * direction && !targetPiece) {
            const middleSquare = board[from.row + direction][from.col]
            return !middleSquare
          }
          return false
        }

        // Diagonal capture
        if (absColDiff === 1 && rowDiff === direction) {
          if (targetPiece) return true
          // En passant
          if (enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
            return true
          }
        }
        return false

      case 'rook':
        if (rowDiff !== 0 && colDiff !== 0) return false
        return isPathClear(from, to)

      case 'bishop':
        if (absRowDiff !== absColDiff) return false
        return isPathClear(from, to)

      case 'queen':
        if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false
        return isPathClear(from, to)

      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)

      case 'king':
        // Normal king move
        if (absRowDiff <= 1 && absColDiff <= 1) return true

        // Castling
        if (!piece.hasMoved && absRowDiff === 0 && absColDiff === 2) {
          const rookCol = colDiff > 0 ? 7 : 0
          const rook = board[from.row][rookCol]
          
          if (rook && rook.type === 'rook' && !rook.hasMoved) {
            // Check if path is clear
            const direction = colDiff > 0 ? 1 : -1
            for (let col = from.col + direction; col !== rookCol; col += direction) {
              if (board[from.row][col]) return false
            }
            
            // Check if king doesn't pass through check
            if (!testOnly) {
              for (let col = from.col; col !== to.col + direction; col += direction) {
                if (isSquareUnderAttack({ row: from.row, col }, piece.color)) return false
              }
            }
            return true
          }
        }
        return false

      default:
        return false
    }
  }, [board, enPassantTarget])

  const isPathClear = (from: Position, to: Position): boolean => {
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
  }

  const isSquareUnderAttack = (square: Position, byColor: PieceColor): boolean => {
    const opponentColor = byColor === 'white' ? 'black' : 'white'
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.color === opponentColor) {
          if (isValidMove({ row, col }, square, true)) {
            return true
          }
        }
      }
    }
    return false
  }

  const findKing = (color: PieceColor): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  const isInCheck = (color: PieceColor, testBoard?: Board): boolean => {
    const boardToTest = testBoard || board
    const kingPos = findKing(color)
    if (!kingPos) return false

    const opponentColor = color === 'white' ? 'black' : 'white'
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardToTest[row][col]
        if (piece && piece.color === opponentColor) {
          // Simple check without recursion for test board
          if (testBoard) {
            // Basic movement validation without full rule checking
            const rowDiff = Math.abs(kingPos.row - row)
            const colDiff = Math.abs(kingPos.col - col)
            
            switch (piece.type) {
              case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1
                if (rowDiff === 1 && colDiff === 1 && (kingPos.row - row) === -direction) return true
                break
              case 'knight':
                if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) return true
                break
              case 'king':
                if (rowDiff <= 1 && colDiff <= 1) return true
                break
              // For other pieces, check if path is clear
              case 'rook':
                if (row === kingPos.row || col === kingPos.col) {
                  if (isPathClear({ row, col }, kingPos)) return true
                }
                break
              case 'bishop':
                if (rowDiff === colDiff) {
                  if (isPathClear({ row, col }, kingPos)) return true
                }
                break
              case 'queen':
                if (row === kingPos.row || col === kingPos.col || rowDiff === colDiff) {
                  if (isPathClear({ row, col }, kingPos)) return true
                }
                break
            }
          } else if (isValidMove({ row, col }, kingPos, true)) {
            return true
          }
        }
      }
    }
    return false
  }

  const wouldMoveResultInCheck = (from: Position, to: Position): boolean => {
    const testBoard = board.map(row => [...row])
    const piece = testBoard[from.row][from.col]
    if (!piece) return true

    testBoard[to.row][to.col] = piece
    testBoard[from.row][from.col] = null

    return isInCheck(piece.color, testBoard)
  }

  const getValidMoves = useCallback((position: Position): Position[] => {
    const moves: Position[] = []
    const piece = board[position.row][position.col]
    if (!piece) return moves

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(position, { row, col }) && !wouldMoveResultInCheck(position, { row, col })) {
          moves.push({ row, col })
        }
      }
    }

    return moves
  }, [board, isValidMove])

  const makeMove = (from: Position, to: Position) => {
    const newBoard = board.map(row => [...row])
    const piece = newBoard[from.row][from.col]
    if (!piece) return

    const targetPiece = newBoard[to.row][to.col]

    // Handle captures
    if (targetPiece) {
      setCapturedPieces(prev => ({
        ...prev,
        [targetPiece.color]: [...prev[targetPiece.color], targetPiece]
      }))
      setScore(prev => prev + getPieceValue(targetPiece) * 10)
    }

    // Handle en passant
    if (piece.type === 'pawn' && enPassantTarget && 
        to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1
      const capturedPawn = newBoard[capturedPawnRow][to.col]
      if (capturedPawn) {
        setCapturedPieces(prev => ({
          ...prev,
          [capturedPawn.color]: [...prev[capturedPawn.color], capturedPawn]
        }))
        newBoard[capturedPawnRow][to.col] = null
      }
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      const rookFromCol = to.col > from.col ? 7 : 0
      const rookToCol = to.col > from.col ? to.col - 1 : to.col + 1
      const rook = newBoard[from.row][rookFromCol]
      if (rook) {
        newBoard[from.row][rookToCol] = { ...rook, hasMoved: true }
        newBoard[from.row][rookFromCol] = null
      }
    }

    // Set en passant target for two-square pawn moves
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      const enPassantRow = piece.color === 'white' ? to.row + 1 : to.row - 1
      setEnPassantTarget({ row: enPassantRow, col: to.col })
    } else {
      setEnPassantTarget(null)
    }

    // Move the piece
    newBoard[to.row][to.col] = { ...piece, hasMoved: true }
    newBoard[from.row][from.col] = null

    // Check for pawn promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      setPromotionSquare(to)
      // Auto-promote to queen for now
      newBoard[to.row][to.col] = { type: 'queen', color: piece.color, hasMoved: true }
    }

    // Update move history
    const moveNotation = `${positionToAlgebraic(from)}-${positionToAlgebraic(to)}`
    setMoveHistory(prev => [...prev, moveNotation])
    setLastMove({ from, to })

    setBoard(newBoard)
    setSelectedSquare(null)
    setValidMoves([])

    // Check game state
    const opponentColor = piece.color === 'white' ? 'black' : 'white'
    const inCheck = isInCheck(opponentColor)
    setIsCheck(inCheck)

    // Check for checkmate or stalemate
    const hasValidMoves = checkForValidMoves(opponentColor, newBoard)
    if (!hasValidMoves) {
      if (inCheck) {
        setIsCheckmate(true)
        setWinner(piece.color)
        setGameOver(true)
        setScore(prev => prev + 1000)
      } else {
        setIsDraw(true)
        setGameOver(true)
      }
    }

    setCurrentPlayer(opponentColor)
  }

  const checkForValidMoves = (color: PieceColor, testBoard: Board): boolean => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = testBoard[row][col]
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove({ row, col }, { row: toRow, col: toCol }) &&
                  !wouldMoveResultInCheck({ row, col }, { row: toRow, col: toCol })) {
                return true
              }
            }
          }
        }
      }
    }
    return false
  }

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || currentPlayer !== 'white') return

    const clickedPiece = board[row][col]

    if (selectedSquare) {
      const isValid = validMoves.some(move => move.row === row && move.col === col)
      if (isValid) {
        makeMove(selectedSquare, { row, col })
      } else if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedSquare({ row, col })
        setValidMoves(getValidMoves({ row, col }))
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedSquare({ row, col })
      setValidMoves(getValidMoves({ row, col }))
    }
  }

  // Simple AI - makes random valid move
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver) {
      const timer = setTimeout(() => {
        const allMoves: { from: Position; to: Position; value: number }[] = []

        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board[row][col]
            if (piece && piece.color === 'black') {
              const moves = getValidMoves({ row, col })
              moves.forEach(to => {
                let value = Math.random() * 10
                const targetPiece = board[to.row][to.col]
                if (targetPiece) {
                  value += getPieceValue(targetPiece) * 10
                }
                // Prefer center squares
                if (to.row >= 3 && to.row <= 4 && to.col >= 3 && to.col <= 4) {
                  value += 5
                }
                allMoves.push({ from: { row, col }, to, value })
              })
            }
          }
        }

        if (allMoves.length > 0) {
          // Sort by value and pick from top moves based on difficulty
          allMoves.sort((a, b) => b.value - a.value)
          const topMovesCount = difficulty === 'Easy' ? allMoves.length : 
                               difficulty === 'Medium' ? Math.ceil(allMoves.length / 2) : 
                               Math.ceil(allMoves.length / 4)
          const selectedMove = allMoves[Math.floor(Math.random() * Math.min(topMovesCount, allMoves.length))]
          makeMove(selectedMove.from, selectedMove.to)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameOver, board, difficulty, getValidMoves])

  const resetGame = () => {
    setBoard(initialBoard)
    setCurrentPlayer('white')
    setSelectedSquare(null)
    setValidMoves([])
    setCapturedPieces({ white: [], black: [] })
    setMoveHistory([])
    setIsCheck(false)
    setIsCheckmate(false)
    setIsDraw(false)
    setGameOver(false)
    setWinner(null)
    setEnPassantTarget(null)
    setPromotionSquare(null)
    setLastMove(null)
  }

  const resign = () => {
    setWinner('black')
    setGameOver(true)
  }

  const offerDraw = () => {
    // In single player, AI accepts draw if behind
    const whitePieces = board.flat().filter(p => p?.color === 'white').length
    const blackPieces = board.flat().filter(p => p?.color === 'black').length
    
    if (blackPieces < whitePieces) {
      setIsDraw(true)
      setGameOver(true)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Chess
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="px-2 py-1 border rounded"
                data-testid="difficulty-selector"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div className="flex items-center gap-2" data-testid="level-display">
              <Trophy className="w-4 h-4" />
              <span>Level {level}</span>
            </div>
            <div className="flex items-center gap-2" data-testid="score-display">
              <span className="font-bold">Score: {score}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between items-center">
              <div data-testid="current-player" className="font-bold">
                {currentPlayer === 'white' ? 'White' : 'Black'} to move
                {isCheck && <span className="text-red-500 ml-2">Check!</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetGame}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restart
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resign}
                  disabled={gameOver || currentPlayer !== 'white'}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Resign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={offerDraw}
                  disabled={gameOver || currentPlayer !== 'white'}
                >
                  <Handshake className="w-4 h-4 mr-1" />
                  Offer Draw
                </Button>
              </div>
            </div>

            <div 
              className="grid grid-cols-8 gap-0 border-2 border-gray-800 touch-enabled"
              data-testid="chess-board"
            >
              {board.map((row, rowIndex) => 
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0
                  const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                  const isValidMove = validMoves.some(move => move.row === rowIndex && move.col === colIndex)
                  const isLastMoveFrom = lastMove?.from.row === rowIndex && lastMove?.from.col === colIndex
                  const isLastMoveTo = lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex
                  const files = 'abcdefgh'
                  const position = `${files[colIndex]}${8 - rowIndex}`

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-testid={`square-${rowIndex}-${colIndex}`}
                      className={cn(
                        'w-12 h-12 flex items-center justify-center cursor-pointer text-3xl relative',
                        isLight ? 'bg-[#EEEED2]' : 'bg-[#769656]',
                        isSelected && 'ring-2 ring-blue-500',
                        isValidMove && 'ring-2 ring-green-400',
                        (isLastMoveFrom || isLastMoveTo) && 'bg-yellow-200'
                      )}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <span 
                          data-testid={`piece-${position}`}
                          className={cn(
                            'select-none',
                            piece.color === 'white' ? 'text-white drop-shadow-md' : 'text-black'
                          )}
                        >
                          {PIECE_SYMBOLS[piece.color][piece.type]}
                        </span>
                      )}
                      {isValidMove && !piece && (
                        <div className="absolute w-3 h-3 bg-green-400 rounded-full opacity-50" />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {gameOver && (
              <div className="mt-4 text-center text-xl font-bold">
                {isCheckmate && `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins!`}
                {isDraw && 'Game drawn!'}
              </div>
            )}
          </div>

          <div className="w-64 space-y-4">
            <div data-testid="captured-pieces">
              <h3 className="font-bold mb-2">Captured Pieces</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm">By White:</span>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.black.map((piece, idx) => (
                      <span key={idx} className="text-2xl">
                        {piece && PIECE_SYMBOLS.black[piece.type]}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm">By Black:</span>
                  <div className="flex flex-wrap gap-1">
                    {capturedPieces.white.map((piece, idx) => (
                      <span key={idx} className="text-2xl text-white drop-shadow-md">
                        {piece && PIECE_SYMBOLS.white[piece.type]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div data-testid="move-history">
              <h3 className="font-bold mb-2">Move History</h3>
              <div className="h-48 overflow-y-auto border rounded p-2 text-sm">
                {moveHistory.map((move, idx) => (
                  <div key={idx} className={idx % 2 === 0 ? 'bg-gray-100' : ''}>
                    {idx % 2 === 0 && <span className="font-bold">{Math.floor(idx / 2) + 1}. </span>}
                    {move}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Chess