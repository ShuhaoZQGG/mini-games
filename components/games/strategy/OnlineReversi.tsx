'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Users, TrendingUp, Circle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Piece = 'black' | 'white' | null
type Board = Piece[][]

const OnlineReversi: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => {
    const initialBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null))
    initialBoard[3][3] = 'white'
    initialBoard[3][4] = 'black'
    initialBoard[4][3] = 'black'
    initialBoard[4][4] = 'white'
    return initialBoard
  })
  
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [validMoves, setValidMoves] = useState<boolean[][]>([])
  const [score, setScore] = useState({ black: 2, white: 2 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'black' | 'white' | 'tie' | null>(null)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [playerRanking, setPlayerRanking] = useState(1000)
  const [isOnline, setIsOnline] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [consecutivePasses, setConsecutivePasses] = useState(0)

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const checkDirection = useCallback((board: Board, row: number, col: number, dr: number, dc: number, player: 'black' | 'white'): number[] => {
    const flips: number[] = []
    const opponent = player === 'black' ? 'white' : 'black'
    let r = row + dr
    let c = col + dc
    
    while (isValidPosition(r, c) && board[r][c] === opponent) {
      flips.push(r * 8 + c)
      r += dr
      c += dc
    }
    
    if (isValidPosition(r, c) && board[r][c] === player && flips.length > 0) {
      return flips
    }
    
    return []
  }, [])

  const getValidMoves = useCallback((board: Board, player: 'black' | 'white'): boolean[][] => {
    const valid: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false))
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === null) {
          for (const [dr, dc] of directions) {
            const flips = checkDirection(board, row, col, dr, dc, player)
            if (flips.length > 0) {
              valid[row][col] = true
              break
            }
          }
        }
      }
    }
    
    return valid
  }, [checkDirection, directions])

  const makeMove = useCallback((row: number, col: number) => {
    if (board[row][col] !== null || !validMoves[row][col]) return
    
    const newBoard = board.map(row => [...row])
    const flips: number[] = []
    
    for (const [dr, dc] of directions) {
      const dirFlips = checkDirection(board, row, col, dr, dc, currentPlayer)
      flips.push(...dirFlips)
    }
    
    newBoard[row][col] = currentPlayer
    flips.forEach(pos => {
      const r = Math.floor(pos / 8)
      const c = pos % 8
      newBoard[r][c] = currentPlayer
    })
    
    setBoard(newBoard)
    setMoveHistory(prev => [...prev, `${currentPlayer}: ${String.fromCharCode(65 + col)}${row + 1}`])
    
    // Update score
    let blackCount = 0
    let whiteCount = 0
    newBoard.forEach(row => {
      row.forEach(cell => {
        if (cell === 'black') blackCount++
        else if (cell === 'white') whiteCount++
      })
    })
    setScore({ black: blackCount, white: whiteCount })
    
    // Switch player
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black'
    const nextValidMoves = getValidMoves(newBoard, nextPlayer)
    const hasValidMove = nextValidMoves.some(row => row.some(valid => valid))
    
    if (hasValidMove) {
      setCurrentPlayer(nextPlayer)
      setValidMoves(nextValidMoves)
      setConsecutivePasses(0)
    } else {
      // Check if current player has moves
      const currentValidMoves = getValidMoves(newBoard, currentPlayer)
      const currentHasValidMove = currentValidMoves.some(row => row.some(valid => valid))
      
      if (currentHasValidMove) {
        setValidMoves(currentValidMoves)
        setConsecutivePasses(prev => prev + 1)
      } else {
        // Game over
        setGameOver(true)
        if (blackCount > whiteCount) setWinner('black')
        else if (whiteCount > blackCount) setWinner('white')
        else setWinner('tie')
      }
    }
  }, [board, validMoves, currentPlayer, checkDirection, directions, getValidMoves])

  const resetGame = useCallback(() => {
    const initialBoard: Board = Array(8).fill(null).map(() => Array(8).fill(null))
    initialBoard[3][3] = 'white'
    initialBoard[3][4] = 'black'
    initialBoard[4][3] = 'black'
    initialBoard[4][4] = 'white'
    
    setBoard(initialBoard)
    setCurrentPlayer('black')
    setScore({ black: 2, white: 2 })
    setGameOver(false)
    setWinner(null)
    setMoveHistory([])
    setConsecutivePasses(0)
    
    const valid = getValidMoves(initialBoard, 'black')
    setValidMoves(valid)
  }, [getValidMoves])

  const joinOnlineGame = () => {
    setIsOnline(true)
    setRoomCode(`REV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
  }

  // Initialize valid moves
  useEffect(() => {
    const valid = getValidMoves(board, currentPlayer)
    setValidMoves(valid)
  }, [])

  // Update level based on score
  useEffect(() => {
    const totalMoves = moveHistory.length
    const newLevel = Math.floor(totalMoves / 10) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(3, Math.floor(score[currentPlayer] / 20)))
    }
  }, [moveHistory, score, currentPlayer, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Online Reversi - Ranking: {playerRanking}
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
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Rank: {playerRanking}</span>
            </div>
            {isOnline && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Room: {roomCode}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isOnline && (
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
            <div className="mb-2 text-center">
              <span className="text-lg font-semibold">
                Current Turn: <span className="capitalize">{currentPlayer}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 dark:border-gray-200 mx-auto" style={{ width: 'fit-content' }}>
              {board.map((row, rowIndex) => 
                row.map((piece, colIndex) => {
                  const isValidMove = validMoves[rowIndex]?.[colIndex]
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-12 h-12 border border-gray-600 dark:border-gray-400 flex items-center justify-center cursor-pointer
                        bg-green-600 hover:bg-green-500 transition-colors
                        ${isValidMove ? 'ring-2 ring-yellow-400' : ''}
                      `}
                      onClick={() => makeMove(rowIndex, colIndex)}
                    >
                      {piece && (
                        <motion.div
                          initial={{ scale: 0, rotateY: 0 }}
                          animate={{ scale: 1, rotateY: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`
                            w-10 h-10 rounded-full border-2
                            ${piece === 'black' 
                              ? 'bg-gray-900 border-gray-700' 
                              : 'bg-white border-gray-300'}
                          `}
                        />
                      )}
                      {isValidMove && !piece && (
                        <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-50" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
            
            <div className="mt-4 flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700" />
                <span className="font-semibold">Black: {score.black}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300" />
                <span className="font-semibold">White: {score.white}</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-64 space-y-4">
            {/* Game Stats */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Game Stats</h3>
              <div className="space-y-1 text-sm">
                <div>Total Pieces: {score.black + score.white}</div>
                <div>Empty Squares: {64 - score.black - score.white}</div>
                <div>Valid Moves: {validMoves.flat().filter(v => v).length}</div>
                {consecutivePasses > 0 && (
                  <div className="text-orange-600">Consecutive Passes: {consecutivePasses}</div>
                )}
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

            {/* Game Over */}
            <AnimatePresence>
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center"
                >
                  <h3 className="text-xl font-bold mb-2">
                    {winner === 'tie' ? "It's a Tie!" : `${winner === 'black' ? 'Black' : 'White'} Wins!`}
                  </h3>
                  <p className="mb-2">
                    Final Score: Black {score.black} - White {score.white}
                  </p>
                  <p className="mb-3">
                    Ranking Change: +{Math.floor(Math.random() * 50) + 10}
                  </p>
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

export default OnlineReversi