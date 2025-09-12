'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Circle, RotateCcw, Trophy, Bot, Undo2, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type CellState = 'black' | 'white' | null
type Board = CellState[][]
type Position = { row: number; col: number }
type Move = { position: Position; flipped: Position[] }

const initialBoard: Board = (() => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null))
  // Starting position
  board[3][3] = 'white'
  board[3][4] = 'black'
  board[4][3] = 'black'
  board[4][4] = 'white'
  return board
})()

const Reversi: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<CellState>('black')
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [score, setScore] = useState({ black: 2, white: 2 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<CellState | 'draw' | null>(null)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [lastMove, setLastMove] = useState<Position | null>(null)
  const [moveHistory, setMoveHistory] = useState<{ board: Board; player: CellState }[]>([])
  const [hoveredSquare, setHoveredSquare] = useState<Position | null>(null)
  const [previewFlips, setPreviewFlips] = useState<Position[]>([])
  const [level, setLevel] = useState(1)
  const [gameScore, setGameScore] = useState(0)
  const [passCount, setPassCount] = useState(0)
  const [flippingDiscs, setFlippingDiscs] = useState<Position[]>([])
  const [mobility, setMobility] = useState({ black: 0, white: 0 })
  const [cornerControl, setCornerControl] = useState({ black: 0, white: 0 })

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const getFlippedDiscs = useCallback((row: number, col: number, player: CellState, testBoard?: Board): Position[] => {
    const currentBoard = testBoard || board
    const flipped: Position[] = []
    const opponent = player === 'black' ? 'white' : 'black'

    for (const [dr, dc] of directions) {
      const lineFlipped: Position[] = []
      let r = row + dr
      let c = col + dc

      // Follow the direction while we see opponent discs
      while (isValidPosition(r, c) && currentBoard[r][c] === opponent) {
        lineFlipped.push({ row: r, col: c })
        r += dr
        c += dc
      }

      // If we ended on our own disc and captured at least one opponent disc
      if (isValidPosition(r, c) && currentBoard[r][c] === player && lineFlipped.length > 0) {
        flipped.push(...lineFlipped)
      }
    }

    return flipped
  }, [board, directions])

  const isValidMove = useCallback((row: number, col: number, player: CellState): boolean => {
    if (board[row][col] !== null) return false
    return getFlippedDiscs(row, col, player).length > 0
  }, [board, getFlippedDiscs])

  const getAllValidMoves = useCallback((player: CellState, testBoard?: Board): Position[] => {
    const moves: Position[] = []
    const currentBoard = testBoard || board

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col] === null && 
            getFlippedDiscs(row, col, player, currentBoard).length > 0) {
          moves.push({ row, col })
        }
      }
    }

    return moves
  }, [board, getFlippedDiscs])

  const countDiscs = (testBoard?: Board): { black: number; white: number } => {
    const currentBoard = testBoard || board
    let black = 0
    let white = 0

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col] === 'black') black++
        else if (currentBoard[row][col] === 'white') white++
      }
    }

    return { black, white }
  }

  const updateCornerControl = (testBoard?: Board) => {
    const currentBoard = testBoard || board
    const corners = [
      { row: 0, col: 0 }, { row: 0, col: 7 },
      { row: 7, col: 0 }, { row: 7, col: 7 }
    ]
    
    let black = 0
    let white = 0
    
    corners.forEach(corner => {
      if (currentBoard[corner.row][corner.col] === 'black') black++
      else if (currentBoard[corner.row][corner.col] === 'white') white++
    })
    
    setCornerControl({ black, white })
  }

  const makeMove = (row: number, col: number, player: CellState) => {
    const flipped = getFlippedDiscs(row, col, player)
    if (flipped.length === 0) return

    const newBoard = board.map(row => [...row])
    
    // Place the new disc
    newBoard[row][col] = player
    
    // Start flipping animation
    setFlippingDiscs(flipped)
    
    // Flip the discs after a short delay for animation
    setTimeout(() => {
      flipped.forEach(pos => {
        newBoard[pos.row][pos.col] = player
      })
      
      setBoard(newBoard)
      setFlippingDiscs([])
      
      // Update scores
      const newScore = countDiscs(newBoard)
      setScore(newScore)
      
      // Update corner control
      updateCornerControl(newBoard)
      
      // Award points
      const points = flipped.length * 10
      const cornerBonus = isCorner(row, col) ? 50 : 0
      setGameScore(prev => prev + points + cornerBonus)
      
      // Save to history
      setMoveHistory(prev => [...prev, { board: board, player }])
      setLastMove({ row, col })
      setPassCount(0)
      
      // Check next player's moves
      const opponent = player === 'black' ? 'white' : 'black'
      const opponentMoves = getAllValidMoves(opponent, newBoard)
      
      if (opponentMoves.length > 0) {
        setCurrentPlayer(opponent)
        setValidMoves(opponentMoves)
        setMobility(prev => ({ ...prev, [opponent]: opponentMoves.length }))
      } else {
        // Opponent must pass
        const currentPlayerMoves = getAllValidMoves(player, newBoard)
        if (currentPlayerMoves.length > 0) {
          // Same player goes again
          setValidMoves(currentPlayerMoves)
          setPassCount(prev => prev + 1)
        } else {
          // Game over - neither player can move
          endGame(newBoard)
        }
      }
    }, 300)
  }

  const isCorner = (row: number, col: number): boolean => {
    return (row === 0 || row === 7) && (col === 0 || col === 7)
  }

  const isEdge = (row: number, col: number): boolean => {
    return row === 0 || row === 7 || col === 0 || col === 7
  }

  const endGame = (finalBoard?: Board) => {
    const finalScore = countDiscs(finalBoard || board)
    setScore(finalScore)
    setGameOver(true)
    
    if (finalScore.black > finalScore.white) {
      setWinner('black')
      setGameScore(prev => prev + (finalScore.black - finalScore.white) * 20)
    } else if (finalScore.white > finalScore.black) {
      setWinner('white')
    } else {
      setWinner('draw')
    }
  }

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || currentPlayer !== 'black') return
    
    if (isValidMove(row, col, 'black')) {
      makeMove(row, col, 'black')
    }
  }

  const handleSquareHover = (row: number, col: number) => {
    if (gameOver || currentPlayer !== 'black' || board[row][col] !== null) {
      setHoveredSquare(null)
      setPreviewFlips([])
      return
    }
    
    setHoveredSquare({ row, col })
    const flips = getFlippedDiscs(row, col, 'black')
    setPreviewFlips(flips)
  }

  // AI player
  useEffect(() => {
    if (currentPlayer === 'white' && !gameOver && validMoves.length > 0) {
      const timer = setTimeout(() => {
        // Evaluate each move
        const scoredMoves = validMoves.map(move => {
          const flipped = getFlippedDiscs(move.row, move.col, 'white')
          let score = flipped.length
          
          // Corner strategy - highest priority
          if (isCorner(move.row, move.col)) {
            score += 100
          }
          // Avoid edges early game (except corners)
          else if (isEdge(move.row, move.col)) {
            const totalDiscs = countDiscs().black + countDiscs().white
            if (totalDiscs < 20) {
              score -= 20
            }
          }
          
          // Mobility consideration
          const testBoard = board.map(row => [...row])
          testBoard[move.row][move.col] = 'white'
          flipped.forEach(pos => {
            testBoard[pos.row][pos.col] = 'white'
          })
          const opponentMoves = getAllValidMoves('black', testBoard)
          score -= opponentMoves.length * 0.5
          
          // Add randomness based on difficulty
          const randomFactor = difficulty === 'Easy' ? Math.random() * 20 : 
                              difficulty === 'Medium' ? Math.random() * 10 : 
                              Math.random() * 5
          score += randomFactor
          
          return { move, score }
        })
        
        scoredMoves.sort((a, b) => b.score - a.score)
        
        // Select move based on difficulty
        const topMovesCount = difficulty === 'Easy' ? scoredMoves.length : 
                             difficulty === 'Medium' ? Math.ceil(scoredMoves.length / 2) : 
                             1
        
        const selectedMove = scoredMoves[Math.floor(Math.random() * Math.min(topMovesCount, scoredMoves.length))].move
        makeMove(selectedMove.row, selectedMove.col, 'white')
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameOver, validMoves, board, difficulty])

  // Initialize valid moves
  useEffect(() => {
    if (!gameOver) {
      const moves = getAllValidMoves(currentPlayer as CellState)
      setValidMoves(moves)
      if (currentPlayer === 'black' || currentPlayer === 'white') {
        setMobility(prev => ({ ...prev, [currentPlayer]: moves.length }))
      }
    }
  }, [currentPlayer, gameOver, getAllValidMoves])

  const resetGame = () => {
    setBoard(initialBoard)
    setCurrentPlayer('black')
    setValidMoves([])
    setScore({ black: 2, white: 2 })
    setGameOver(false)
    setWinner(null)
    setLastMove(null)
    setMoveHistory([])
    setGameScore(0)
    setPassCount(0)
    setFlippingDiscs([])
    setMobility({ black: 0, white: 0 })
    setCornerControl({ black: 0, white: 0 })
  }

  const undoMove = () => {
    if (moveHistory.length > 0 && currentPlayer === 'black') {
      const lastState = moveHistory[moveHistory.length - 1]
      setBoard(lastState.board)
      setCurrentPlayer(lastState.player)
      setMoveHistory(prev => prev.slice(0, -1))
      setScore(countDiscs(lastState.board))
      updateCornerControl(lastState.board)
    }
  }

  const getGamePhase = (): string => {
    const total = score.black + score.white
    if (total <= 20) return 'Opening'
    if (total <= 40) return 'Middle Game'
    return 'End Game'
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Circle className="w-6 h-6" />
            Reversi / Othello
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
              <span className="font-bold">Score: {gameScore}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between items-center">
              <div data-testid="turn-indicator" className="font-bold">
                {currentPlayer === 'black' ? 'Black' : 'White'} to move
                {passCount > 0 && <span className="text-yellow-500 ml-2">Opponent passed!</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={undoMove}
                  disabled={moveHistory.length === 0 || currentPlayer !== 'black'}
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  Undo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetGame}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restart
                </Button>
              </div>
            </div>

            <div 
              className="grid grid-cols-8 gap-0 border-2 border-gray-800 bg-green-800"
              data-testid="reversi-board"
            >
              {board.map((row, rowIndex) => 
                row.map((cell, colIndex) => {
                  const isValid = validMoves.some(move => 
                    move.row === rowIndex && move.col === colIndex
                  )
                  const isLastMove = lastMove?.row === rowIndex && lastMove?.col === colIndex
                  const isHovered = hoveredSquare?.row === rowIndex && hoveredSquare?.col === colIndex
                  const isPreviewFlip = previewFlips.some(pos => 
                    pos.row === rowIndex && pos.col === colIndex
                  )
                  const isFlipping = flippingDiscs.some(pos => 
                    pos.row === rowIndex && pos.col === colIndex
                  )

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-testid={`square-${rowIndex}-${colIndex}`}
                      className={cn(
                        'w-12 h-12 flex items-center justify-center cursor-pointer relative border border-green-900',
                        isLastMove && 'bg-yellow-600 last-move',
                        isHovered && 'bg-green-600 preview'
                      )}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      onMouseEnter={() => handleSquareHover(rowIndex, colIndex)}
                      onMouseLeave={() => {
                        setHoveredSquare(null)
                        setPreviewFlips([])
                      }}
                    >
                      <AnimatePresence>
                        {cell && (
                          <motion.div
                            data-testid={`disc-${rowIndex}-${colIndex}`}
                            className={cn(
                              'w-10 h-10 rounded-full',
                              cell === 'black' ? 'bg-black' : 'bg-white',
                              'border-2 border-gray-400',
                              isFlipping && 'flipping'
                            )}
                            initial={{ rotateY: 0 }}
                            animate={{ 
                              rotateY: isFlipping ? 180 : 0,
                              scale: isFlipping ? [1, 1.1, 1] : 1
                            }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </AnimatePresence>
                      {isValid && !cell && (
                        <div 
                          data-testid={`valid-move-${rowIndex}-${colIndex}`}
                          className="absolute w-3 h-3 bg-green-400 rounded-full opacity-60"
                        />
                      )}
                      {isPreviewFlip && (
                        <div 
                          data-testid={`preview-flip-${rowIndex}-${colIndex}`}
                          className="absolute w-10 h-10 rounded-full border-2 border-yellow-400 opacity-50"
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {gameOver && (
              <div className="mt-4 text-center text-xl font-bold">
                Game Over! 
                {winner === 'draw' ? ' It\'s a draw!' : ` ${winner === 'black' ? 'Black' : 'White'} wins!`}
              </div>
            )}
          </div>

          <div className="w-64 space-y-4">
            <div>
              <h3 className="font-bold mb-2">Score</h3>
              <div className="space-y-2">
                <div className="flex justify-between" data-testid="black-score">
                  <span>Black:</span>
                  <span className="font-bold" data-testid="black-count">{score.black}</span>
                </div>
                <div className="flex justify-between" data-testid="white-score">
                  <span>White:</span>
                  <span className="font-bold" data-testid="white-count">{score.white}</span>
                </div>
              </div>
            </div>

            <div data-testid="mobility-display">
              <h3 className="font-bold mb-2">Mobility</h3>
              <div className="space-y-1 text-sm">
                <div>Black moves: {mobility.black}</div>
                <div>White moves: {mobility.white}</div>
              </div>
            </div>

            <div data-testid="territory-display">
              <h3 className="font-bold mb-2">Corner Control</h3>
              <div className="space-y-1 text-sm">
                <div>Black corners: {cornerControl.black}</div>
                <div>White corners: {cornerControl.white}</div>
              </div>
            </div>

            <div data-testid="game-phase">
              <h3 className="font-bold mb-2">Game Phase</h3>
              <div className="text-sm">{getGamePhase()}</div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Strategy Tips</h3>
              <ul className="text-sm space-y-1">
                <li>• Corners are valuable</li>
                <li>• Avoid edges early</li>
                <li>• Control the center</li>
                <li>• Limit opponent moves</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Reversi