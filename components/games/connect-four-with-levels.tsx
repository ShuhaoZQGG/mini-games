'use client'

import React, { useState, useCallback, useEffect } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, Trophy, Circle, Play } from 'lucide-react'

interface ConnectFourConfig {
  boardWidth: number
  boardHeight: number
  aiDifficulty: 'random' | 'easy' | 'medium' | 'hard' | 'expert'
  timeLimit?: number
  winCondition: number
}

interface ConnectFourCoreProps {
  levelConfig: ConnectFourConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner AI',
    difficulty: 'easy',
    config: {
      boardWidth: 7,
      boardHeight: 6,
      aiDifficulty: 'random',
      winCondition: 4
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Smart Opponent',
    difficulty: 'medium',
    config: {
      boardWidth: 7,
      boardHeight: 6,
      aiDifficulty: 'easy',
      winCondition: 4
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Strategic Play',
    difficulty: 'hard',
    config: {
      boardWidth: 8,
      boardHeight: 7,
      aiDifficulty: 'medium',
      winCondition: 4
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Challenge',
    difficulty: 'expert',
    config: {
      boardWidth: 9,
      boardHeight: 7,
      aiDifficulty: 'hard',
      timeLimit: 15,
      winCondition: 5
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Tournament',
    difficulty: 'master',
    config: {
      boardWidth: 9,
      boardHeight: 8,
      aiDifficulty: 'expert',
      timeLimit: 10,
      winCondition: 5
    },
    requiredStars: 12
  }
]

class ConnectFourGameLogic {
  public board: (string | null)[][]
  public currentPlayer: 'red' | 'yellow'
  public winner: string | null
  public winningCells: [number, number][]
  public score: number
  private moveCount: number
  private startTime: number
  private duration: number
  private config: ConnectFourConfig

  constructor(config: ConnectFourConfig) {
    this.config = config
    this.board = this.createEmptyBoard()
    this.currentPlayer = 'red'
    this.winner = null
    this.winningCells = []
    this.moveCount = 0
    this.score = 0
    this.startTime = 0
    this.duration = 0
  }

  private createEmptyBoard(): (string | null)[][] {
    return Array(this.config.boardHeight).fill(null).map(() => Array(this.config.boardWidth).fill(null))
  }

  start(): void {
    this.startTime = Date.now()
    this.board = this.createEmptyBoard()
    this.currentPlayer = 'red'
    this.winner = null
    this.winningCells = []
    this.moveCount = 0
  }

  makeMove(column: number): boolean {
    if (this.winner || this.board[0][column] !== null) {
      return false
    }

    // Find the lowest empty row
    let row = this.config.boardHeight - 1
    while (row >= 0 && this.board[row][column] !== null) {
      row--
    }

    if (row < 0) return false

    this.board[row][column] = this.currentPlayer
    this.moveCount++

    // Check for winner
    if (this.checkWinner(row, column)) {
      this.winner = this.currentPlayer
      this.duration = Date.now() - this.startTime
      this.score = this.calculateScore()
    } else if (this.isBoardFull()) {
      this.winner = 'draw'
      this.duration = Date.now() - this.startTime
    } else {
      this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red'
    }

    return true
  }

  private isBoardFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== null))
  }

  private checkWinner(row: number, col: number): boolean {
    const player = this.board[row][col]
    if (!player) return false

    // Check all directions
    const directions = [
      [[0, 1], [0, -1]], // Horizontal
      [[1, 0], [-1, 0]], // Vertical
      [[1, 1], [-1, -1]], // Diagonal \
      [[1, -1], [-1, 1]] // Diagonal /
    ]

    for (const direction of directions) {
      const cells: [number, number][] = [[row, col]]
      
      for (const [dr, dc] of direction) {
        let r = row + dr
        let c = col + dc
        
        while (r >= 0 && r < this.config.boardHeight && c >= 0 && c < this.config.boardWidth && this.board[r][c] === player) {
          cells.push([r, c])
          r += dr
          c += dc
        }
      }

      if (cells.length >= this.config.winCondition) {
        this.winningCells = cells
        return true
      }
    }

    return false
  }

  private calculateScore(): number {
    if (!this.winner || this.winner === 'draw') return 0
    
    // Base score for winning
    let baseScore = 1000
    
    // Bonus for quick victory
    const maxMoves = this.config.boardWidth * this.config.boardHeight
    const moveBonus = Math.max(0, (maxMoves - this.moveCount) * 50)
    
    // Bonus for AI difficulty
    const difficultyMultiplier = {
      'random': 1,
      'easy': 1.5,
      'medium': 2,
      'hard': 3,
      'expert': 4
    }
    
    // Time bonus if time limit exists
    let timeBonus = 0
    if (this.config.timeLimit) {
      const timeTaken = this.duration / 1000 // in seconds
      const timeLeft = Math.max(0, this.config.timeLimit * this.moveCount - timeTaken)
      timeBonus = timeLeft * 10
    }
    
    const totalScore = Math.floor((baseScore + moveBonus + timeBonus) * (difficultyMultiplier[this.config.aiDifficulty] || 1))
    return totalScore
  }

  getAIMove(): number {
    const availableColumns = []
    for (let col = 0; col < this.config.boardWidth; col++) {
      if (this.board[0][col] === null) {
        availableColumns.push(col)
      }
    }

    if (availableColumns.length === 0) return -1

    switch (this.config.aiDifficulty) {
      case 'random':
        return availableColumns[Math.floor(Math.random() * availableColumns.length)]
      
      case 'easy':
        // Check for immediate win or block
        for (const col of availableColumns) {
          if (this.wouldWin(col, 'yellow')) return col
        }
        for (const col of availableColumns) {
          if (this.wouldWin(col, 'red')) return col
        }
        return availableColumns[Math.floor(Math.random() * availableColumns.length)]
      
      case 'medium':
        // Use minimax with depth 2
        return this.minimaxMove(2)
      
      case 'hard':
        // Use minimax with depth 4
        return this.minimaxMove(4)
      
      case 'expert':
        // Use minimax with depth 6
        return this.minimaxMove(6)
      
      default:
        return availableColumns[Math.floor(Math.random() * availableColumns.length)]
    }
  }

  private wouldWin(col: number, player: string): boolean {
    // Find the row where the piece would land
    let row = this.config.boardHeight - 1
    while (row >= 0 && this.board[row][col] !== null) {
      row--
    }
    if (row < 0) return false

    // Temporarily place the piece
    this.board[row][col] = player
    const wins = this.checkWinner(row, col)
    this.board[row][col] = null

    return wins
  }

  private minimaxMove(depth: number): number {
    const availableColumns = []
    for (let col = 0; col < this.config.boardWidth; col++) {
      if (this.board[0][col] === null) {
        availableColumns.push(col)
      }
    }

    let bestScore = -Infinity
    let bestMove = availableColumns[0]

    for (const col of availableColumns) {
      const row = this.getLowestEmptyRow(col)
      if (row === -1) continue

      this.board[row][col] = 'yellow'
      const score = this.minimax(depth - 1, false, -Infinity, Infinity)
      this.board[row][col] = null

      if (score > bestScore) {
        bestScore = score
        bestMove = col
      }
    }

    return bestMove
  }

  private getLowestEmptyRow(col: number): number {
    for (let row = this.config.boardHeight - 1; row >= 0; row--) {
      if (this.board[row][col] === null) return row
    }
    return -1
  }

  private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    // Check terminal states
    const score = this.evaluateBoard()
    if (depth === 0 || Math.abs(score) > 1000) {
      return score
    }

    if (isMaximizing) {
      let maxEval = -Infinity
      for (let col = 0; col < this.config.boardWidth; col++) {
        const row = this.getLowestEmptyRow(col)
        if (row === -1) continue

        this.board[row][col] = 'yellow'
        const evalScore = this.minimax(depth - 1, false, alpha, beta)
        this.board[row][col] = null

        maxEval = Math.max(maxEval, evalScore)
        alpha = Math.max(alpha, evalScore)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (let col = 0; col < this.config.boardWidth; col++) {
        const row = this.getLowestEmptyRow(col)
        if (row === -1) continue

        this.board[row][col] = 'red'
        const evalScore = this.minimax(depth - 1, true, alpha, beta)
        this.board[row][col] = null

        minEval = Math.min(minEval, evalScore)
        beta = Math.min(beta, evalScore)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  private evaluateBoard(): number {
    // Simple evaluation: count potential winning lines
    let score = 0

    // Check all possible winning lines
    for (let row = 0; row < this.config.boardHeight; row++) {
      for (let col = 0; col < this.config.boardWidth; col++) {
        // Horizontal, vertical, and both diagonals
        score += this.evaluateLine(row, col, 0, 1) // Horizontal
        score += this.evaluateLine(row, col, 1, 0) // Vertical
        score += this.evaluateLine(row, col, 1, 1) // Diagonal \
        score += this.evaluateLine(row, col, 1, -1) // Diagonal /
      }
    }

    return score
  }

  private evaluateLine(row: number, col: number, dRow: number, dCol: number): number {
    const length = this.config.winCondition
    let yellowCount = 0
    let redCount = 0

    for (let i = 0; i < length; i++) {
      const r = row + i * dRow
      const c = col + i * dCol
      
      if (r < 0 || r >= this.config.boardHeight || c < 0 || c >= this.config.boardWidth) {
        return 0
      }

      if (this.board[r][c] === 'yellow') yellowCount++
      else if (this.board[r][c] === 'red') redCount++
    }

    if (yellowCount > 0 && redCount > 0) return 0 // Mixed line, no value
    if (yellowCount === length) return 10000 // AI wins
    if (redCount === length) return -10000 // Player wins
    
    // Partial lines
    if (yellowCount > 0) return Math.pow(10, yellowCount)
    if (redCount > 0) return -Math.pow(10, redCount)
    
    return 0
  }

  reset(): void {
    this.start()
  }
}

function ConnectFourCore({ levelConfig, onScore }: ConnectFourCoreProps) {
  const [game] = useState(() => new ConnectFourGameLogic(levelConfig))
  const [board, setBoard] = useState(game.board)
  const [currentPlayer, setCurrentPlayer] = useState(game.currentPlayer)
  const [winner, setWinner] = useState(game.winner)
  const [winningCells, setWinningCells] = useState(game.winningCells)
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const updateGameState = useCallback(() => {
    setBoard([...game.board])
    setCurrentPlayer(game.currentPlayer)
    setWinner(game.winner)
    setWinningCells([...game.winningCells])
    
    if (game.winner) {
      onScore(game.score)
    }
  }, [game, onScore])

  const handleColumnClick = useCallback((column: number) => {
    if (!gameStarted || isAIThinking || currentPlayer !== 'red') return
    
    if (game.makeMove(column)) {
      updateGameState()
      if (levelConfig.timeLimit) {
        setTimeLeft(levelConfig.timeLimit)
      }
    }
  }, [game, updateGameState, gameStarted, isAIThinking, currentPlayer, levelConfig.timeLimit])

  // Timer effect
  useEffect(() => {
    if (gameStarted && !winner && levelConfig.timeLimit && currentPlayer === 'red') {
      setTimeLeft(levelConfig.timeLimit)
      const interval = setInterval(() => {
        setTimeLeft((prev): number | null => {
          if (prev === null) return null
          if (prev <= 1) {
            // Time's up - make random move
            const availableCols = []
            for (let col = 0; col < levelConfig.boardWidth; col++) {
              if (game.board[0][col] === null) {
                availableCols.push(col)
              }
            }
            if (availableCols.length > 0) {
              const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)]
              handleColumnClick(randomCol)
            }
            return levelConfig.timeLimit || null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameStarted, winner, currentPlayer, levelConfig.timeLimit, levelConfig.boardWidth, game.board, handleColumnClick])

  // AI move effect
  useEffect(() => {
    if (gameStarted && currentPlayer === 'yellow' && !winner && !isAIThinking) {
      setIsAIThinking(true)
      setTimeout(() => {
        const aiMove = game.getAIMove()
        if (aiMove !== -1) {
          game.makeMove(aiMove)
          updateGameState()
        }
        setIsAIThinking(false)
      }, 500)
    }
  }, [currentPlayer, gameStarted, winner, game, updateGameState, isAIThinking])

  const handleStart = useCallback(() => {
    game.start()
    updateGameState()
    setGameStarted(true)
  }, [game, updateGameState])

  const handleReset = useCallback(() => {
    game.reset()
    updateGameState()
    setGameStarted(false)
    setTimeLeft(null)
  }, [game, updateGameState])

  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col)
  }

  const getDropRow = (column: number): number => {
    if (winner || !hoveredColumn) return -1
    let row = levelConfig.boardHeight - 1
    while (row >= 0 && board[row][column] !== null) {
      row--
    }
    return row
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          {!gameStarted ? (
            <Button onClick={handleStart} size="lg">
              <Play className="mr-2 h-4 w-4" />
              Start Game
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-4 text-lg">
                {winner ? (
                  winner === 'draw' ? (
                    <span className="font-semibold">It's a draw!</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">
                        <Circle 
                          className={`inline-block h-4 w-4 ${
                            winner === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'
                          }`} 
                        />
                        {' '}{winner === 'red' ? 'You win!' : 'AI wins!'}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>Current player:</span>
                      <Circle 
                        className={`h-5 w-5 ${
                          currentPlayer === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'
                        }`} 
                      />
                      <span className="font-semibold">
                        {currentPlayer === 'red' ? 'You' : 'AI'}
                      </span>
                    </div>
                    {levelConfig.timeLimit && currentPlayer === 'red' && timeLeft !== null && (
                      <div className="text-lg font-semibold">
                        Time: {timeLeft}s
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isAIThinking && (
                <div className="text-sm text-gray-600">AI is thinking...</div>
              )}

              <div className="relative bg-blue-600 p-4 rounded-lg">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${levelConfig.boardWidth}, minmax(0, 1fr))` }}>
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          relative w-12 h-12 bg-blue-700 rounded-full
                          ${!winner && !cell && currentPlayer === 'red' && !isAIThinking ? 'hover:bg-blue-800 cursor-pointer' : ''}
                          transition-colors
                        `}
                        onClick={() => handleColumnClick(colIndex)}
                        onMouseEnter={() => setHoveredColumn(colIndex)}
                        onMouseLeave={() => setHoveredColumn(null)}
                        disabled={!!winner || currentPlayer !== 'red' || isAIThinking}
                      >
                        {cell && (
                          <Circle
                            className={`
                              absolute inset-1 
                              ${cell === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'}
                              ${isWinningCell(rowIndex, colIndex) ? 'animate-pulse' : ''}
                            `}
                          />
                        )}
                        {!cell && hoveredColumn === colIndex && getDropRow(colIndex) === rowIndex && !winner && currentPlayer === 'red' && !isAIThinking && (
                          <Circle
                            className={`
                              absolute inset-1 opacity-50
                              fill-red-500 text-red-500
                            `}
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                New Game
              </Button>
            </>
          )}
        </div>
      </Card>

      {winner && (
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Score: {game.score}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ConnectFourWithLevels() {
  const getStars = (score: number, levelConfig: ConnectFourConfig): 1 | 2 | 3 => {
    // Star rating based on score and difficulty
    const thresholds = {
      'random': { three: 2000, two: 1000 },
      'easy': { three: 3000, two: 1500 },
      'medium': { three: 4000, two: 2000 },
      'hard': { three: 6000, two: 3000 },
      'expert': { three: 8000, two: 4000 }
    }
    
    const threshold = thresholds[levelConfig.aiDifficulty] || thresholds['random']
    
    if (score >= threshold.three) return 3
    if (score >= threshold.two) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="connect-four"
      gameName="Connect Four"
      levels={levels}
      renderGame={(config, onScore) => (
        <ConnectFourCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}