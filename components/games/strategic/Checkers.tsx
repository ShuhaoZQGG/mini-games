'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Circle, Crown, RotateCcw, Trophy, Bot, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

type PieceColor = 'red' | 'black'
type Piece = {
  color: PieceColor
  isKing: boolean
} | null

type Board = Piece[][]
type Position = { row: number; col: number }
type Move = { from: Position; to: Position; captured?: Position[] }

const initialBoard: Board = (() => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null))
  
  // Place red pieces (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'red', isKing: false }
      }
    }
  }
  
  // Place black pieces (bottom)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: 'black', isKing: false }
      }
    }
  }
  
  return board
})()

const Checkers: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('red')
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Move[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{ red: number; black: number }>({
    red: 0,
    black: 0
  })
  const [mustCapture, setMustCapture] = useState(false)
  const [continuingCapture, setContinuingCapture] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<PieceColor | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [level, setLevel] = useState(1)
  const [gameTime, setGameTime] = useState(0)
  const [lastMove, setLastMove] = useState<Move | null>(null)

  const isValidSquare = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const getCaptureMoves = useCallback((position: Position, piece: Piece, testBoard?: Board): Move[] => {
    if (!piece) return []
    
    const currentBoard = testBoard || board
    const moves: Move[] = []
    const directions = piece.isKing ? 
      [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
      piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]

    for (const [dr, dc] of directions) {
      const jumpRow = position.row + dr * 2
      const jumpCol = position.col + dc * 2
      const middleRow = position.row + dr
      const middleCol = position.col + dc

      if (isValidSquare(jumpRow, jumpCol)) {
        const middlePiece = currentBoard[middleRow][middleCol]
        const targetSquare = currentBoard[jumpRow][jumpCol]

        if (middlePiece && middlePiece.color !== piece.color && !targetSquare) {
          // Found a valid capture
          const newBoard = currentBoard.map(row => [...row])
          newBoard[jumpRow][jumpCol] = piece
          newBoard[position.row][position.col] = null
          newBoard[middleRow][middleCol] = null

          // Check for additional captures
          const additionalCaptures = getCaptureMoves(
            { row: jumpRow, col: jumpCol },
            piece,
            newBoard
          )

          if (additionalCaptures.length > 0) {
            // Multi-jump available
            additionalCaptures.forEach(additionalMove => {
              moves.push({
                from: position,
                to: additionalMove.to,
                captured: [{ row: middleRow, col: middleCol }, ...(additionalMove.captured || [])]
              })
            })
          } else {
            moves.push({
              from: position,
              to: { row: jumpRow, col: jumpCol },
              captured: [{ row: middleRow, col: middleCol }]
            })
          }
        }
      }
    }

    return moves
  }, [board])

  const getRegularMoves = useCallback((position: Position, piece: Piece): Move[] => {
    if (!piece) return []
    
    const moves: Move[] = []
    const directions = piece.isKing ? 
      [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
      piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]]

    for (const [dr, dc] of directions) {
      const newRow = position.row + dr
      const newCol = position.col + dc

      if (isValidSquare(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({
          from: position,
          to: { row: newRow, col: newCol }
        })
      }
    }

    return moves
  }, [board])

  const getAllValidMoves = useCallback((color: PieceColor): Move[] => {
    const allMoves: Move[] = []
    const captureMoves: Move[] = []

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece.color === color) {
          const captures = getCaptureMoves({ row, col }, piece)
          const regular = getRegularMoves({ row, col }, piece)
          
          captureMoves.push(...captures)
          allMoves.push(...regular)
        }
      }
    }

    // Mandatory capture rule
    return captureMoves.length > 0 ? captureMoves : allMoves
  }, [board, getCaptureMoves, getRegularMoves])

  const makeMove = (move: Move) => {
    const newBoard = board.map(row => [...row])
    const piece = newBoard[move.from.row][move.from.col]
    if (!piece) return

    // Move piece
    newBoard[move.to.row][move.to.col] = piece
    newBoard[move.from.row][move.from.col] = null

    // Handle captures
    if (move.captured && move.captured.length > 0) {
      move.captured.forEach(pos => {
        const capturedPiece = newBoard[pos.row][pos.col]
        if (capturedPiece) {
          setCapturedPieces(prev => ({
            ...prev,
            [capturedPiece.color]: prev[capturedPiece.color] + 1
          }))
          newBoard[pos.row][pos.col] = null
          setScore(prev => prev + (capturedPiece.isKing ? 20 : 10))
        }
      })

      // Award bonus for multiple captures
      if (move.captured && move.captured.length > 1) {
        setScore(prev => prev + move.captured!.length * 5)
      }
    }

    // Check for king promotion
    if (!piece.isKing) {
      if ((piece.color === 'red' && move.to.row === 7) ||
          (piece.color === 'black' && move.to.row === 0)) {
        newBoard[move.to.row][move.to.col] = { ...piece, isKing: true }
        setScore(prev => prev + 30)
      }
    }

    setBoard(newBoard)
    setLastMove(move)
    setSelectedSquare(null)
    setValidMoves([])

    // Check for game over
    const opponentColor = piece.color === 'red' ? 'black' : 'red'
    const opponentMoves = getAllValidMoves(opponentColor)
    
    if (opponentMoves.length === 0) {
      setWinner(piece.color)
      setGameOver(true)
      setScore(prev => prev + 500)
    } else {
      setCurrentPlayer(opponentColor)
    }

    // Check if all pieces are captured
    const redCount = newBoard.flat().filter(p => p?.color === 'red').length
    const blackCount = newBoard.flat().filter(p => p?.color === 'black').length
    
    if (redCount === 0) {
      setWinner('black')
      setGameOver(true)
    } else if (blackCount === 0) {
      setWinner('red')
      setGameOver(true)
      setScore(prev => prev + 500)
    }
  }

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || currentPlayer !== 'red') return

    const clickedPiece = board[row][col]

    if (selectedSquare) {
      const validMove = validMoves.find(move => 
        move.to.row === row && move.to.col === col
      )
      
      if (validMove) {
        makeMove(validMove)
      } else if (clickedPiece && clickedPiece.color === currentPlayer) {
        const piece = board[row][col]
        if (piece) {
          const captures = getCaptureMoves({ row, col }, piece)
          const regular = getRegularMoves({ row, col }, piece)
          const allCaptures = getAllValidMoves(currentPlayer).filter(m => m.captured && m.captured.length > 0)
          
          // If there are captures available, only allow pieces that can capture
          const moves = allCaptures.length > 0 ? captures : [...captures, ...regular]
          
          setSelectedSquare({ row, col })
          setValidMoves(moves)
          setMustCapture(allCaptures.length > 0)
        }
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      const piece = board[row][col]
      if (piece) {
        const captures = getCaptureMoves({ row, col }, piece)
        const regular = getRegularMoves({ row, col }, piece)
        const allCaptures = getAllValidMoves(currentPlayer).filter(m => m.captured && m.captured.length > 0)
        
        // If there are captures available, only allow pieces that can capture
        const moves = allCaptures.length > 0 ? captures : [...captures, ...regular]
        
        setSelectedSquare({ row, col })
        setValidMoves(moves)
        setMustCapture(allCaptures.length > 0)
      }
    }
  }

  // AI player
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver) {
      const timer = setTimeout(() => {
        const allMoves = getAllValidMoves('black')
        
        if (allMoves.length > 0) {
          // Sort moves by value
          const scoredMoves = allMoves.map(move => {
            let score = Math.random() * 10
            
            // Prefer captures
            if (move.captured && move.captured.length > 0) {
              score += move.captured.length * 50
            }
            
            // Prefer moves that make kings
            const piece = board[move.from.row][move.from.col]
            if (piece && !piece.isKing && move.to.row === 0) {
              score += 30
            }
            
            // Prefer protecting back row (prevent opponent kings)
            if (move.to.row === 0) {
              score += 10
            }
            
            // Prefer center control
            if (move.to.col >= 2 && move.to.col <= 5) {
              score += 5
            }
            
            return { move, score }
          })
          
          scoredMoves.sort((a, b) => b.score - a.score)
          
          // Select move based on difficulty
          const topMovesCount = difficulty === 'Easy' ? scoredMoves.length : 
                               difficulty === 'Medium' ? Math.ceil(scoredMoves.length / 2) : 
                               1
          
          const selectedMove = scoredMoves[Math.floor(Math.random() * Math.min(topMovesCount, scoredMoves.length))].move
          makeMove(selectedMove)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameOver, board, difficulty, getAllValidMoves])

  // Game timer
  useEffect(() => {
    if (!gameOver) {
      const timer = setInterval(() => {
        setGameTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameOver])

  const resetGame = () => {
    setBoard(initialBoard)
    setCurrentPlayer('red')
    setSelectedSquare(null)
    setValidMoves([])
    setCapturedPieces({ red: 0, black: 0 })
    setMustCapture(false)
    setContinuingCapture(false)
    setGameOver(false)
    setWinner(null)
    setGameTime(0)
    setLastMove(null)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Circle className="w-6 h-6" />
            Checkers
          </CardTitle>
          <div className="flex gap-4">
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
            <div className="flex items-center gap-2" data-testid="game-timer">
              <Timer className="w-4 h-4" />
              <span>{formatTime(gameTime)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between items-center">
              <div data-testid="turn-indicator" className="font-bold">
                {currentPlayer === 'red' ? 'Red' : 'Black'} to move
                {mustCapture && <span className="text-yellow-500 ml-2">Must capture!</span>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={resetGame}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart
              </Button>
            </div>

            <div 
              className="grid grid-cols-8 gap-0 border-2 border-gray-800"
              data-testid="checkers-board"
            >
              {board.map((row, rowIndex) => 
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0
                  const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                  const isValidMove = validMoves.some(move => 
                    move.to.row === rowIndex && move.to.col === colIndex
                  )
                  const isLastMoveFrom = lastMove?.from.row === rowIndex && lastMove?.from.col === colIndex
                  const isLastMoveTo = lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-testid={`square-${rowIndex}-${colIndex}`}
                      className={cn(
                        'w-12 h-12 flex items-center justify-center cursor-pointer relative',
                        isLight ? 'bg-[#FFDAB9]' : 'bg-[#BA7A3A] dark-square',
                        isSelected && 'ring-2 ring-blue-500',
                        (isLastMoveFrom || isLastMoveTo) && 'bg-yellow-300'
                      )}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      {piece && (
                        <div
                          data-testid={`piece-${piece.color}-${rowIndex * 8 + colIndex}`}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            piece.color === 'red' ? 'bg-red-600 border-red-700' : 'bg-gray-800 border-gray-900',
                            'border-2 shadow-lg'
                          )}
                        >
                          {piece.isKing && (
                            <Crown className="w-6 h-6 text-yellow-400" />
                          )}
                        </div>
                      )}
                      {isValidMove && (
                        <div 
                          data-testid={`valid-move-${rowIndex}-${colIndex}`}
                          className="absolute w-4 h-4 bg-green-400 rounded-full opacity-60"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {gameOver && (
              <div className="mt-4 text-center text-xl font-bold">
                Game Over! {winner === 'red' ? 'Red' : 'Black'} wins!
              </div>
            )}
          </div>

          <div className="w-48 space-y-4">
            <div>
              <h3 className="font-bold mb-2">Captured Pieces</h3>
              <div className="space-y-2">
                <div data-testid="captured-red">
                  Red captured: {capturedPieces.red}
                </div>
                <div data-testid="captured-black">
                  Black captured: {capturedPieces.black}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Rules</h3>
              <ul className="text-sm space-y-1">
                <li>• Diagonal moves only</li>
                <li>• Captures are mandatory</li>
                <li>• Kings can move backward</li>
                <li>• Multiple jumps allowed</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-2">Scoring</h3>
              <ul className="text-sm space-y-1">
                <li>• Capture: 10 points</li>
                <li>• King capture: 20 points</li>
                <li>• Promotion: 30 points</li>
                <li>• Multiple jumps: +5 each</li>
                <li>• Win: 500 points</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Checkers