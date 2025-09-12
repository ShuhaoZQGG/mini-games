'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Trophy, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type Player = 'white' | 'black'
type Point = { player: Player | null; count: number }
type Board = Point[]
type Dice = [number, number]

const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

const initialBoard: Board = Array(24).fill(null).map((_, idx) => {
  // Standard backgammon starting position
  if (idx === 0) return { player: 'white', count: 2 }
  if (idx === 5) return { player: 'black', count: 5 }
  if (idx === 7) return { player: 'black', count: 3 }
  if (idx === 11) return { player: 'white', count: 5 }
  if (idx === 12) return { player: 'black', count: 5 }
  if (idx === 16) return { player: 'white', count: 3 }
  if (idx === 18) return { player: 'white', count: 5 }
  if (idx === 23) return { player: 'black', count: 2 }
  return { player: null, count: 0 }
})

const Backgammon: React.FC = () => {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('white')
  const [dice, setDice] = useState<Dice>([0, 0])
  const [availableMoves, setAvailableMoves] = useState<number[]>([])
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [bar, setBar] = useState<{ white: number; black: number }>({ white: 0, black: 0 })
  const [bearingOff, setBearingOff] = useState<{ white: number; black: number }>({ white: 0, black: 0 })
  const [doublingCube, setDoublingCube] = useState(1)
  const [cubeOwner, setCubeOwner] = useState<Player | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [level, setLevel] = useState(1)
  const [diceRolling, setDiceRolling] = useState(false)
  const [pipCount, setPipCount] = useState<{ white: number; black: number }>({ white: 167, black: 167 })

  const rollDice = () => {
    setDiceRolling(true)
    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      setDice([die1, die2])
      
      // Doubles give 4 moves
      const moves = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2]
      setAvailableMoves(moves)
      setDiceRolling(false)
    }, 500)
  }

  const canMoveFromBar = (player: Player, die: number): boolean => {
    const targetPoint = player === 'white' ? die - 1 : 24 - die
    const point = board[targetPoint]
    return !point.player || point.player === player || point.count <= 1
  }

  const canBearOff = (player: Player): boolean => {
    const homeStart = player === 'white' ? 18 : 0
    const homeEnd = player === 'white' ? 24 : 6
    
    // Check if all checkers are in home board
    for (let i = 0; i < board.length; i++) {
      if (i >= homeStart && i < homeEnd) continue
      if (board[i].player === player && board[i].count > 0) return false
    }
    
    return bar[player] === 0
  }

  const isValidMove = (from: number, to: number, player: Player): boolean => {
    if (from < 0 || from >= 24 || to < 0 || to >= 24) return false
    
    const fromPoint = board[from]
    if (!fromPoint.player || fromPoint.player !== player) return false
    
    const toPoint = board[to]
    if (toPoint.player && toPoint.player !== player && toPoint.count > 1) return false
    
    const distance = Math.abs(to - from)
    return availableMoves.includes(distance)
  }

  const makeMove = (from: number, to: number) => {
    const newBoard = [...board]
    const player = currentPlayer
    
    // Remove checker from source
    newBoard[from] = {
      ...newBoard[from],
      count: newBoard[from].count - 1,
      player: newBoard[from].count > 1 ? newBoard[from].player : null
    }
    
    // Handle capturing
    if (newBoard[to].player && newBoard[to].player !== player && newBoard[to].count === 1) {
      setBar(prev => ({
        ...prev,
        [newBoard[to].player as Player]: prev[newBoard[to].player as Player] + 1
      }))
      newBoard[to] = { player, count: 1 }
    } else {
      // Add checker to destination
      newBoard[to] = {
        player: newBoard[to].player || player,
        count: newBoard[to].count + 1
      }
    }
    
    setBoard(newBoard)
    
    // Remove used die
    const distance = Math.abs(to - from)
    const moveIndex = availableMoves.indexOf(distance)
    const newMoves = [...availableMoves]
    newMoves.splice(moveIndex, 1)
    setAvailableMoves(newMoves)
    
    // Check for end of turn
    if (newMoves.length === 0) {
      endTurn()
    }
    
    updatePipCount(newBoard)
  }

  const updatePipCount = (currentBoard: Board) => {
    let whiteCount = 0
    let blackCount = 0
    
    currentBoard.forEach((point, idx) => {
      if (point.player === 'white') {
        whiteCount += point.count * (24 - idx)
      } else if (point.player === 'black') {
        blackCount += point.count * (idx + 1)
      }
    })
    
    // Add bar checkers
    whiteCount += bar.white * 25
    blackCount += bar.black * 25
    
    setPipCount({ white: whiteCount, black: blackCount })
  }

  const endTurn = () => {
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white')
    setSelectedPoint(null)
    setDice([0, 0])
    setAvailableMoves([])
    
    // Check for win
    if (bearingOff.white === 15) {
      setWinner('white')
      setGameOver(true)
      const multiplier = bearingOff.black === 0 ? 2 : 1 // Gammon
      setScore(prev => prev + 1000 * doublingCube * multiplier)
    } else if (bearingOff.black === 15) {
      setWinner('black')
      setGameOver(true)
    }
  }

  const handlePointClick = (pointIndex: number) => {
    if (gameOver || availableMoves.length === 0) return
    
    if (selectedPoint === null) {
      if (board[pointIndex].player === currentPlayer) {
        setSelectedPoint(pointIndex)
      }
    } else {
      if (isValidMove(selectedPoint, pointIndex, currentPlayer)) {
        makeMove(selectedPoint, pointIndex)
        setSelectedPoint(null)
      } else {
        setSelectedPoint(pointIndex)
      }
    }
  }

  const offerDouble = () => {
    // In single player, AI accepts based on position
    const accept = pipCount.black <= pipCount.white * 1.2
    
    if (accept) {
      setDoublingCube(prev => prev * 2)
      setCubeOwner('black')
    } else {
      setWinner('white')
      setGameOver(true)
      setScore(prev => prev + 100 * doublingCube)
    }
  }

  // Simple AI
  useEffect(() => {
    if (currentPlayer === 'black' && !gameOver && availableMoves.length > 0) {
      const timer = setTimeout(() => {
        // AI logic - make random valid move
        for (let from = 0; from < 24; from++) {
          if (board[from].player === 'black') {
            for (const move of availableMoves) {
              const to = from - move
              if (to >= 0 && isValidMove(from, to, 'black')) {
                makeMove(from, to)
                return
              }
            }
          }
        }
        endTurn() // No valid moves
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameOver, availableMoves, board])

  const resetGame = () => {
    setBoard(initialBoard)
    setCurrentPlayer('white')
    setDice([0, 0])
    setAvailableMoves([])
    setSelectedPoint(null)
    setBar({ white: 0, black: 0 })
    setBearingOff({ white: 0, black: 0 })
    setDoublingCube(1)
    setCubeOwner(null)
    setGameOver(false)
    setWinner(null)
    setPipCount({ white: 167, black: 167 })
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Backgammon</CardTitle>
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
            <div data-testid="level-display">
              <Trophy className="w-4 h-4 inline mr-1" />
              Level {level}
            </div>
            <div data-testid="score-display">Score: {score}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div data-testid="turn-indicator">
              {currentPlayer === 'white' ? 'Your' : "AI's"} Turn
            </div>
            <div className="flex gap-2">
              <Button
                onClick={rollDice}
                disabled={dice[0] !== 0 || gameOver}
                data-testid="roll-dice"
              >
                Roll Dice
              </Button>
              <Button
                onClick={offerDouble}
                disabled={gameOver || cubeOwner === 'black'}
              >
                Double ({doublingCube})
              </Button>
              <Button onClick={resetGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <motion.div
              animate={{ rotate: diceRolling ? 360 : 0 }}
              transition={{ duration: 0.5 }}
              data-testid="die-1"
              className="text-2xl"
            >
              {dice[0] > 0 && React.createElement(DiceIcons[dice[0] - 1], { className: 'w-8 h-8' })}
            </motion.div>
            <motion.div
              animate={{ rotate: diceRolling ? -360 : 0 }}
              transition={{ duration: 0.5 }}
              data-testid="die-2"
              className="text-2xl"
            >
              {dice[1] > 0 && React.createElement(DiceIcons[dice[1] - 1], { className: 'w-8 h-8' })}
            </motion.div>
            <div data-testid="doubling-cube" className="ml-4">
              Cube: {doublingCube}
            </div>
          </div>

          <div className="flex gap-2" data-testid="backgammon-board">
            <div className="flex-1">
              <div className="grid grid-cols-12 gap-1 bg-amber-800 p-2 rounded">
                {/* Top half */}
                {[...Array(12)].map((_, i) => {
                  const pointIdx = 12 + i
                  const point = board[pointIdx]
                  return (
                    <div
                      key={pointIdx}
                      data-testid={`point-${pointIdx + 1}`}
                      className={cn(
                        'h-40 bg-amber-700 flex flex-col items-center justify-start cursor-pointer',
                        selectedPoint === pointIdx && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => handlePointClick(pointIdx)}
                    >
                      <div data-testid={`point-${pointIdx + 1}-checkers`}>
                        {point.count}
                      </div>
                      {[...Array(Math.min(5, point.count))].map((_, j) => (
                        <div
                          key={j}
                          className={cn(
                            'w-8 h-8 rounded-full',
                            point.player === 'white' ? 'bg-white' : 'bg-black'
                          )}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
              
              <div className="h-8 bg-amber-900 flex items-center justify-center" data-testid="bar-area">
                <div data-testid="white-bar">White Bar: {bar.white}</div>
                <div className="mx-4">|</div>
                <div data-testid="black-bar">Black Bar: {bar.black}</div>
              </div>
              
              <div className="grid grid-cols-12 gap-1 bg-amber-800 p-2 rounded">
                {/* Bottom half */}
                {[...Array(12)].map((_, i) => {
                  const pointIdx = 11 - i
                  const point = board[pointIdx]
                  return (
                    <div
                      key={pointIdx}
                      data-testid={`point-${pointIdx + 1}`}
                      className={cn(
                        'h-40 bg-amber-700 flex flex-col-reverse items-center justify-start cursor-pointer',
                        selectedPoint === pointIdx && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => handlePointClick(pointIdx)}
                    >
                      <div data-testid={`point-${pointIdx + 1}-checkers`}>
                        {point.count}
                      </div>
                      {[...Array(Math.min(5, point.count))].map((_, j) => (
                        <div
                          key={j}
                          className={cn(
                            'w-8 h-8 rounded-full',
                            point.player === 'white' ? 'bg-white' : 'bg-black'
                          )}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="w-32 space-y-4">
              <div data-testid="white-home" className="bg-amber-600 p-2 rounded">
                <h4 className="font-bold">White Home</h4>
                <div>Borne off: {bearingOff.white}</div>
              </div>
              <div data-testid="black-home" className="bg-amber-600 p-2 rounded">
                <h4 className="font-bold">Black Home</h4>
                <div>Borne off: {bearingOff.black}</div>
              </div>
              <div data-testid="white-pip-count">White Pip: {pipCount.white}</div>
              <div data-testid="black-pip-count">Black Pip: {pipCount.black}</div>
            </div>
          </div>

          {gameOver && (
            <div className="text-center text-xl font-bold">
              Game Over! {winner === 'white' ? 'You win!' : 'AI wins!'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Backgammon