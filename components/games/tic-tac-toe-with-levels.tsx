'use client'

import { useState, useCallback, useEffect } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Grid3x3, Bot, RotateCcw, Trophy, Play, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

type Player = 'X' | 'O' | null
type Board = Player[]

interface TicTacToeConfig {
  boardSize: number
  aiDifficulty: 'random' | 'easy' | 'medium' | 'hard' | 'perfect'
  rounds: number
  timeLimit?: number
}

interface TicTacToeCoreProps {
  levelConfig: TicTacToeConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Classic 3x3',
    difficulty: 'easy',
    config: {
      boardSize: 3,
      aiDifficulty: 'random',
      rounds: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Smart AI',
    difficulty: 'medium',
    config: {
      boardSize: 3,
      aiDifficulty: 'medium',
      rounds: 3
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: '4x4 Challenge',
    difficulty: 'hard',
    config: {
      boardSize: 4,
      aiDifficulty: 'hard',
      rounds: 3
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Speed Tournament',
    difficulty: 'expert',
    config: {
      boardSize: 4,
      aiDifficulty: 'hard',
      rounds: 5,
      timeLimit: 10
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: '5x5 Master',
    difficulty: 'master',
    config: {
      boardSize: 5,
      aiDifficulty: 'perfect',
      rounds: 5,
      timeLimit: 8
    },
    requiredStars: 12
  }
]

function TicTacToeCore({ levelConfig, onScore }: TicTacToeCoreProps) {
  const { boardSize, aiDifficulty, rounds, timeLimit } = levelConfig
  const totalCells = boardSize * boardSize
  
  const [board, setBoard] = useState<Board>(Array(totalCells).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [winningLine, setWinningLine] = useState<number[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [playerWins, setPlayerWins] = useState(0)
  const [aiWins, setAiWins] = useState(0)
  const [draws, setDraws] = useState(0)
  const [moveTimer, setMoveTimer] = useState<number | null>(null)
  const [totalScore, setTotalScore] = useState(0)

  const getWinningCombinations = useCallback(() => {
    const combinations: number[][] = []
    
    // Rows
    for (let row = 0; row < boardSize; row++) {
      const rowCombination: number[] = []
      for (let col = 0; col < boardSize; col++) {
        rowCombination.push(row * boardSize + col)
      }
      combinations.push(rowCombination)
    }
    
    // Columns
    for (let col = 0; col < boardSize; col++) {
      const colCombination: number[] = []
      for (let row = 0; row < boardSize; row++) {
        colCombination.push(row * boardSize + col)
      }
      combinations.push(colCombination)
    }
    
    // Diagonal top-left to bottom-right
    const diagonal1: number[] = []
    for (let i = 0; i < boardSize; i++) {
      diagonal1.push(i * boardSize + i)
    }
    combinations.push(diagonal1)
    
    // Diagonal top-right to bottom-left
    const diagonal2: number[] = []
    for (let i = 0; i < boardSize; i++) {
      diagonal2.push(i * boardSize + (boardSize - 1 - i))
    }
    combinations.push(diagonal2)
    
    return combinations
  }, [boardSize])

  const checkWinner = useCallback((board: Board): { winner: Player | 'draw' | null; line: number[] } => {
    const winningCombinations = getWinningCombinations()
    
    // Check for winner
    for (const combination of winningCombinations) {
      const firstCell = board[combination[0]]
      if (firstCell && combination.every(index => board[index] === firstCell)) {
        return { winner: firstCell, line: combination }
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: [] }
    }
    
    return { winner: null, line: [] }
  }, [getWinningCombinations])

  const minimax = useCallback((board: Board, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
    const result = checkWinner(board)
    
    if (result.winner === 'O') return 10 - depth
    if (result.winner === 'X') return depth - 10
    if (result.winner === 'draw') return 0
    
    if (isMaximizing) {
      let maxEval = -Infinity
      for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) {
          board[i] = 'O'
          const eval_ = minimax(board, depth + 1, false, alpha, beta)
          board[i] = null
          maxEval = Math.max(maxEval, eval_)
          alpha = Math.max(alpha, eval_)
          if (beta <= alpha) break
        }
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (let i = 0; i < totalCells; i++) {
        if (board[i] === null) {
          board[i] = 'X'
          const eval_ = minimax(board, depth + 1, true, alpha, beta)
          board[i] = null
          minEval = Math.min(minEval, eval_)
          beta = Math.min(beta, eval_)
          if (beta <= alpha) break
        }
      }
      return minEval
    }
  }, [checkWinner, totalCells])

  const getAiMove = useCallback((board: Board): number => {
    const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null) as number[]
    
    if (availableMoves.length === 0) return -1
    
    // For larger boards, limit search depth
    const maxDepth = boardSize <= 3 ? 9 : boardSize <= 4 ? 5 : 3
    
    switch (aiDifficulty) {
      case 'random':
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      
      case 'easy':
        // 30% best move, 70% random
        if (Math.random() < 0.3) {
          let bestMove = -1
          let bestValue = -Infinity
          
          for (const move of availableMoves) {
            board[move] = 'O'
            const value = minimax(board, 0, false, -Infinity, Infinity)
            board[move] = null
            
            if (value > bestValue) {
              bestValue = value
              bestMove = move
            }
          }
          return bestMove
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      
      case 'medium':
        // 60% best move, 40% random
        if (Math.random() < 0.6) {
          let bestMove = -1
          let bestValue = -Infinity
          
          for (const move of availableMoves) {
            board[move] = 'O'
            const value = minimax(board, 0, false, -Infinity, Infinity)
            board[move] = null
            
            if (value > bestValue) {
              bestValue = value
              bestMove = move
            }
          }
          return bestMove
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      
      case 'hard':
        // 85% best move, 15% random
        if (Math.random() < 0.85) {
          let bestMove = -1
          let bestValue = -Infinity
          
          for (const move of availableMoves) {
            board[move] = 'O'
            const value = minimax(board, 0, false, -Infinity, Infinity)
            board[move] = null
            
            if (value > bestValue) {
              bestValue = value
              bestMove = move
            }
          }
          return bestMove
        }
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
      
      case 'perfect':
        // Always best move
        let bestMove = -1
        let bestValue = -Infinity
        
        for (const move of availableMoves) {
          board[move] = 'O'
          const value = minimax(board, 0, false, -Infinity, Infinity)
          board[move] = null
          
          if (value > bestValue) {
            bestValue = value
            bestMove = move
          }
        }
        return bestMove
      
      default:
        return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
  }, [aiDifficulty, boardSize, minimax])

  const makeMove = useCallback((index: number) => {
    if (board[index] || winner || isAiThinking || !gameStarted) return
    
    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    
    const result = checkWinner(newBoard)
    if (result.winner) {
      setWinner(result.winner)
      setWinningLine(result.line)
      
      // Update round stats
      if (result.winner === 'draw') {
        setDraws(draws + 1)
      } else if (result.winner === 'X') {
        setPlayerWins(playerWins + 1)
      } else {
        setAiWins(aiWins + 1)
      }
      
      // Calculate round score
      let roundScore = 0
      if (result.winner === 'X') {
        roundScore = 1000
        // Bonus for quick win
        const movesPlayed = newBoard.filter(cell => cell !== null).length
        roundScore += Math.max(0, (totalCells - movesPlayed) * 100)
        // Bonus for time
        if (timeLimit && moveTimer) {
          roundScore += moveTimer * 50
        }
      } else if (result.winner === 'draw') {
        roundScore = 300
      }
      
      setTotalScore(totalScore + roundScore)
      
      // Check if tournament is over
      if (currentRound >= rounds) {
        setTimeout(() => {
          endTournament()
        }, 2000)
      } else {
        // Start next round after delay
        setTimeout(() => {
          nextRound()
        }, 2000)
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
      if (timeLimit) {
        setMoveTimer(timeLimit)
      }
    }
  }, [board, currentPlayer, winner, checkWinner, gameStarted, isAiThinking, playerWins, aiWins, draws, currentRound, rounds, totalScore, totalCells, timeLimit, moveTimer])

  // Timer effect
  useEffect(() => {
    if (gameStarted && !winner && timeLimit && moveTimer !== null && currentPlayer === 'X') {
      if (moveTimer <= 0) {
        // Time's up - make random move
        const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null) as number[]
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]
          makeMove(randomMove)
        }
        return
      }
      
      const interval = setInterval(() => {
        setMoveTimer(prev => prev !== null ? prev - 1 : null)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [gameStarted, winner, timeLimit, moveTimer, currentPlayer, board, makeMove])

  // AI move
  useEffect(() => {
    if (gameStarted && currentPlayer === 'O' && !winner && !isAiThinking) {
      setIsAiThinking(true)
      const timeout = setTimeout(() => {
        const aiMove = getAiMove([...board])
        if (aiMove !== -1) {
          makeMove(aiMove)
        }
        setIsAiThinking(false)
      }, 500)
      
      return () => clearTimeout(timeout)
    }
  }, [currentPlayer, gameStarted, winner, board, getAiMove, makeMove, isAiThinking])

  const startGame = useCallback(() => {
    setBoard(Array(totalCells).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine([])
    setIsAiThinking(false)
    setGameStarted(true)
    setCurrentRound(1)
    setPlayerWins(0)
    setAiWins(0)
    setDraws(0)
    setTotalScore(0)
    if (timeLimit) {
      setMoveTimer(timeLimit)
    }
  }, [totalCells, timeLimit])

  const nextRound = useCallback(() => {
    setBoard(Array(totalCells).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine([])
    setIsAiThinking(false)
    setCurrentRound(currentRound + 1)
    if (timeLimit) {
      setMoveTimer(timeLimit)
    }
  }, [totalCells, currentRound, timeLimit])

  const endTournament = useCallback(() => {
    // Calculate final score with bonuses
    let finalScore = totalScore
    
    // Bonus for winning the tournament
    if (playerWins > aiWins) {
      finalScore += 2000
    }
    
    // Difficulty multiplier
    const difficultyMultiplier = {
      'random': 1,
      'easy': 1.5,
      'medium': 2,
      'hard': 3,
      'perfect': 4
    }
    
    finalScore = Math.floor(finalScore * (difficultyMultiplier[aiDifficulty] || 1))
    
    onScore(finalScore)
  }, [totalScore, playerWins, aiWins, aiDifficulty, onScore])

  const resetGame = useCallback(() => {
    startGame()
  }, [startGame])

  const renderCell = (index: number) => {
    const isWinningCell = winningLine.includes(index)
    const value = board[index]
    const row = Math.floor(index / boardSize)
    const col = index % boardSize
    
    return (
      <button
        key={index}
        onClick={() => makeMove(index)}
        disabled={!!value || !!winner || isAiThinking || !gameStarted}
        className={cn(
          "aspect-square border-2 rounded-lg flex items-center justify-center",
          "text-3xl font-bold transition-all duration-200",
          "hover:bg-muted disabled:cursor-default",
          isWinningCell && "bg-green-100 border-green-500",
          !value && !winner && !isAiThinking && gameStarted && "hover:scale-105"
        )}
        style={{
          fontSize: boardSize > 4 ? '1.5rem' : boardSize > 3 ? '2rem' : '2.5rem'
        }}
      >
        <span className={cn(
          "transition-all duration-200",
          value === 'X' && "text-blue-600",
          value === 'O' && "text-red-600",
          isWinningCell && "scale-110"
        )}>
          {value}
        </span>
      </button>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6 space-y-6">
        {!gameStarted ? (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">
              {rounds > 1 ? `Tournament: ${rounds} Rounds` : 'Single Match'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Board: {boardSize}x{boardSize} | AI: {aiDifficulty}
              {timeLimit && ` | Time: ${timeLimit}s per move`}
            </p>
            <Button onClick={startGame} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Game
            </Button>
          </div>
        ) : (
          <>
            {/* Game Header */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                {rounds > 1 && (
                  <div className="text-sm font-semibold">
                    Round {currentRound} of {rounds}
                  </div>
                )}
                <div className="flex gap-4 text-sm">
                  <span>You: {playerWins}</span>
                  <span>Draws: {draws}</span>
                  <span>AI: {aiWins}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {timeLimit && moveTimer !== null && currentPlayer === 'X' && !winner && (
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Timer className="w-5 h-5" />
                    {moveTimer}s
                  </div>
                )}
                
                <Button onClick={resetGame} variant="outline" size="sm">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center">
              {!winner && (
                <div className="text-lg">
                  Current Player: <span className={cn(
                    "font-bold",
                    currentPlayer === 'X' ? "text-blue-600" : "text-red-600"
                  )}>
                    {currentPlayer === 'X' ? 'You' : 'AI'}
                  </span>
                  {isAiThinking && ' (thinking...)'}
                </div>
              )}
              
              {winner && (
                <div className="space-y-2">
                  <div className="text-2xl font-bold flex items-center justify-center gap-2">
                    {winner === 'draw' ? (
                      "It's a Draw!"
                    ) : (
                      <>
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <span className={cn(
                          winner === 'X' ? "text-blue-600" : "text-red-600"
                        )}>
                          {winner === 'X' ? 'You win' : 'AI wins'} this round!
                        </span>
                      </>
                    )}
                  </div>
                  {currentRound < rounds && (
                    <div className="text-sm text-gray-600">
                      Next round starting...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Game Board */}
            <div className="relative">
              <div 
                className="grid gap-2 max-w-lg mx-auto"
                style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
              >
                {board.map((_, index) => renderCell(index))}
              </div>
              
              {isAiThinking && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                  <div className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 animate-pulse" />
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Score Display */}
            <div className="text-center">
              <div className="text-lg font-semibold">
                Current Score: {totalScore}
              </div>
            </div>
          </>
        )}

        {/* Final Results */}
        {gameStarted && currentRound >= rounds && winner && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">Tournament Complete!</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Final Score: {totalScore}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              You won {playerWins} rounds, AI won {aiWins}, {draws} draws
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TicTacToeWithLevels() {
  const getStars = (score: number, levelConfig: TicTacToeConfig): 1 | 2 | 3 => {
    // Star rating based on score and configuration
    const baseThreshold = levelConfig.rounds * 1000
    
    if (score >= baseThreshold * 2.5) return 3
    if (score >= baseThreshold * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="tic-tac-toe"
      gameName="Tic-Tac-Toe"
      levels={levels}
      renderGame={(config, onScore) => (
        <TicTacToeCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}