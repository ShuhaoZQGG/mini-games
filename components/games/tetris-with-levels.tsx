'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import GameWithLevels from '@/components/ui/game-with-levels'

// Tetris game class inline since it's not exported as a module
class TetrisGame {
  public grid: any[][]
  public currentPiece: any
  public nextPiece: any
  public currentPosition: { x: number, y: number }
  public score: number
  public lines: number
  public level: number
  public gameOver: boolean

  constructor() {
    this.grid = Array(20).fill(null).map(() => Array(10).fill(0))
    this.currentPiece = null
    this.nextPiece = null
    this.currentPosition = { x: 3, y: 0 }
    this.score = 0
    this.lines = 0
    this.level = 1
    this.gameOver = false
    this.spawnPiece()
  }

  private pieces = [
    { shape: [[1, 1, 1, 1]], color: 'cyan' },
    { shape: [[1, 1], [1, 1]], color: 'yellow' },
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }
  ]

  spawnPiece() {
    this.currentPiece = this.nextPiece || this.getRandomPiece()
    this.nextPiece = this.getRandomPiece()
    this.currentPosition = { x: 3, y: 0 }
    
    if (!this.isValidPosition(this.currentPiece.shape, this.currentPosition)) {
      this.gameOver = true
    }
  }

  getRandomPiece() {
    const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)]
    return { ...piece, shape: [...piece.shape.map(row => [...row])] }
  }

  isValidPosition(shape: number[][], position: { x: number, y: number }) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = position.x + x
          const newY = position.y + y
          
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return false
          }
          
          if (newY >= 0 && this.grid[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }

  moveLeft() {
    const newPos = { x: this.currentPosition.x - 1, y: this.currentPosition.y }
    if (this.isValidPosition(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos
    }
  }

  moveRight() {
    const newPos = { x: this.currentPosition.x + 1, y: this.currentPosition.y }
    if (this.isValidPosition(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos
    }
  }

  moveDown() {
    const newPos = { x: this.currentPosition.x, y: this.currentPosition.y + 1 }
    if (this.isValidPosition(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos
    } else {
      this.lockPiece()
    }
  }

  rotate() {
    const rotated = this.currentPiece.shape[0].map((_: any, i: number) =>
      this.currentPiece.shape.map((row: any) => row[i]).reverse()
    )
    
    if (this.isValidPosition(rotated, this.currentPosition)) {
      this.currentPiece.shape = rotated
    }
  }

  lockPiece() {
    this.currentPiece.shape.forEach((row: number[], y: number) => {
      row.forEach((cell: number, x: number) => {
        if (cell && this.currentPosition.y + y >= 0) {
          this.grid[this.currentPosition.y + y][this.currentPosition.x + x] = this.currentPiece.color
        }
      })
    })
    
    this.clearLines()
    this.spawnPiece()
  }

  clearLines() {
    let linesCleared = 0
    
    for (let y = this.grid.length - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== 0)) {
        this.grid.splice(y, 1)
        this.grid.unshift(Array(10).fill(0))
        linesCleared++
        y++
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared
      this.level = Math.floor(this.lines / 10) + 1
      this.score += linesCleared * 100 * this.level
    }
  }

  reset() {
    this.grid = Array(20).fill(null).map(() => Array(10).fill(0))
    this.currentPiece = null
    this.nextPiece = null
    this.currentPosition = { x: 3, y: 0 }
    this.score = 0
    this.lines = 0
    this.level = 1
    this.gameOver = false
    this.spawnPiece()
  }

  getState() {
    return {
      grid: this.grid,
      currentPiece: this.currentPiece,
      nextPiece: this.nextPiece,
      currentPosition: this.currentPosition,
      score: this.score,
      lines: this.lines,
      level: this.level,
      gameOver: this.gameOver
    }
  }
}

const levels = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy' as const,
    config: {
      dropSpeed: 1000,
      targetLines: 10,
      speedIncrease: 0.95
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium' as const,
    config: {
      dropSpeed: 750,
      targetLines: 20,
      speedIncrease: 0.93
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard' as const,
    config: {
      dropSpeed: 500,
      targetLines: 30,
      speedIncrease: 0.90
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert' as const,
    config: {
      dropSpeed: 300,
      targetLines: 40,
      speedIncrease: 0.88
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master',
    difficulty: 'master' as const,
    config: {
      dropSpeed: 150,
      targetLines: 50,
      speedIncrease: 0.85
    },
    requiredStars: 12
  }
]

export function TetrisWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const baseScore = levelConfig.targetLines * 100
    if (score >= baseScore * 3) return 3
    if (score >= baseScore * 2) return 2
    if (score >= baseScore) return 1
    return 1
  }

  const renderGame = (levelConfig: any, onScore: (score: number) => void) => {
    return <TetrisLevel levelConfig={levelConfig} onScore={onScore} />
  }

  return (
    <GameWithLevels
      gameId="tetris"
      gameName="Tetris"
      levels={levels}
      renderGame={renderGame}
      getStars={getStars}
    />
  )
}

function TetrisLevel({ 
  levelConfig, 
  onScore 
}: { 
  levelConfig: any
  onScore: (score: number) => void 
}) {
  const [game] = useState(() => new TetrisGame())
  const [gameState, setGameState] = useState(game.getState())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [dropSpeed, setDropSpeed] = useState(levelConfig.dropSpeed)

  useEffect(() => {
    const savedHighScore = localStorage.getItem('tetris_highscore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  useEffect(() => {
    if (!isPlaying || isPaused) return

    const interval = setInterval(() => {
      game.moveDown()
      const state = game.getState()
      setGameState(state)
      
      // Increase speed every 10 lines
      const speedLevel = Math.floor(state.lines / 10)
      const newSpeed = levelConfig.dropSpeed * Math.pow(levelConfig.speedIncrease, speedLevel)
      setDropSpeed(Math.max(50, newSpeed))
      
      if (state.gameOver) {
        setIsPlaying(false)
        onScore(state.score)
        if (state.score > highScore) {
          setHighScore(state.score)
          localStorage.setItem('tetris_highscore', state.score.toString())
        }
      }
    }, dropSpeed)

    return () => clearInterval(interval)
  }, [game, isPlaying, isPaused, dropSpeed, highScore, levelConfig, onScore])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying || isPaused || gameState.gameOver) return

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        game.moveLeft()
        break
      case 'ArrowRight':
        e.preventDefault()
        game.moveRight()
        break
      case 'ArrowDown':
        e.preventDefault()
        game.moveDown()
        break
      case 'ArrowUp':
      case ' ':
        e.preventDefault()
        game.rotate()
        break
      case 'p':
      case 'P':
        e.preventDefault()
        setIsPaused(!isPaused)
        break
    }
    
    setGameState(game.getState())
  }, [game, isPlaying, isPaused, gameState.gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleStart = () => {
    game.reset()
    setGameState(game.getState())
    setIsPlaying(true)
    setIsPaused(false)
    setDropSpeed(levelConfig.dropSpeed)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const renderGrid = () => {
    const grid = gameState.grid
    const currentPiece = gameState.currentPiece
    const position = gameState.currentPosition

    // Create display grid with current piece
    const displayGrid = grid.map(row => [...row])
    
    if (currentPiece && !gameState.gameOver) {
      currentPiece.shape.forEach((row: any[], y: number) => {
        row.forEach((cell: any, x: number) => {
          if (cell) {
            const newY = position.y + y
            const newX = position.x + x
            if (newY >= 0 && newY < 20 && newX >= 0 && newX < 10) {
              displayGrid[newY][newX] = currentPiece.color
            }
          }
        })
      })
    }

    return displayGrid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-6 h-6 border border-gray-700 ${
              cell ? `bg-${cell}-500` : 'bg-gray-900'
            }`}
            style={{
              backgroundColor: cell ? getColorValue(cell) : '#111827'
            }}
          />
        ))}
      </div>
    ))
  }

  const getColorValue = (color: string) => {
    const colors: Record<string, string> = {
      'cyan': '#06B6D4',
      'blue': '#3B82F6',
      'orange': '#F97316',
      'yellow': '#EAB308',
      'green': '#22C55E',
      'purple': '#A855F7',
      'red': '#EF4444'
    }
    return colors[color] || '#6B7280'
  }

  const renderNextPiece = () => {
    if (!gameState.nextPiece) return null

    const grid = Array(4).fill(null).map(() => Array(4).fill(0))
    gameState.nextPiece.shape.forEach((row: any[], y: number) => {
      row.forEach((cell: any, x: number) => {
        if (cell && y < 4 && x < 4) {
          grid[y][x] = gameState.nextPiece.color
        }
      })
    })

    return grid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-4 h-4 border border-gray-700`}
            style={{
              backgroundColor: cell ? getColorValue(cell) : '#1F2937'
            }}
          />
        ))}
      </div>
    ))
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tetris - Speed: Level {Math.floor(gameState.lines / 10)}</span>
            <span className="text-lg">Target: {levelConfig.targetLines} lines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 justify-center">
            <div className="space-y-4">
              <div className="bg-gray-900 p-2 inline-block">
                {renderGrid()}
              </div>
              
              {!isPlaying && !gameState.gameOver && (
                <Button onClick={handleStart} className="w-full">
                  Start Game
                </Button>
              )}
              
              {isPlaying && (
                <Button onClick={handlePause} variant="outline" className="w-full">
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{gameState.score}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    High Score: {highScore}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{gameState.lines}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Level: {gameState.level}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Next</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div>{renderNextPiece()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>← → Move</div>
                  <div>↓ Soft Drop</div>
                  <div>↑ / Space: Rotate</div>
                  <div>P: Pause</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {gameState.gameOver && (
            <Card className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Game Over!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Final Score: {gameState.score}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Lines Cleared: {gameState.lines}
                  </p>
                  {gameState.lines >= levelConfig.targetLines && (
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      Target Reached!
                    </p>
                  )}
                  <div className="flex gap-4 justify-center mt-4">
                    <Button onClick={handleStart}>
                      Play Again
                    </Button>
                    <ShareCard
                      score={gameState.score}
                      gameTitle="Tetris"
                      gameSlug="tetris"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}