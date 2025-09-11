'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trophy, Gamepad2, RefreshCw, Users, Bot } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Box {
  owner: 'player1' | 'player2' | null
  completed: boolean
}

interface Line {
  drawn: boolean
  owner: 'player1' | 'player2' | null
}

interface GameGrid {
  horizontalLines: Line[][]
  verticalLines: Line[][]
  boxes: Box[][]
}

export default function DotsAndBoxesGame() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [gameMode, setGameMode] = useState<'ai' | 'pvp'>('ai')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [stars, setStars] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<'player1' | 'player2'>('player1')
  const [gridSize, setGridSize] = useState(3)
  const [gameGrid, setGameGrid] = useState<GameGrid | null>(null)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Initialize grid
  const initializeGrid = useCallback((size: number) => {
    const horizontalLines: Line[][] = Array(size + 1).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ drawn: false, owner: null }))
    )
    const verticalLines: Line[][] = Array(size).fill(null).map(() =>
      Array(size + 1).fill(null).map(() => ({ drawn: false, owner: null }))
    )
    const boxes: Box[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ owner: null, completed: false }))
    )
    
    setGameGrid({ horizontalLines, verticalLines, boxes })
    setPlayer1Score(0)
    setPlayer2Score(0)
    setMoves(0)
    setCurrentPlayer('player1')
  }, [])

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('dotsAndBoxesHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('dotsAndBoxesHighScore', score.toString())
    }
  }, [score, highScore])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else if (!timerActive && timeElapsed !== 0) {
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeElapsed])

  // Start game
  const startGame = (mode: 'ai' | 'pvp', diff: 'easy' | 'medium' | 'hard') => {
    setGameMode(mode)
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setTimeElapsed(0)
    setTimerActive(true)
    
    // Set grid size based on difficulty
    const size = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5
    setGridSize(size)
    initializeGrid(size)
  }

  // Check if a box is completed
  const checkBoxCompletion = useCallback((row: number, col: number, grid: GameGrid): boolean => {
    if (!grid) return false
    
    const topLine = row > 0 ? grid.horizontalLines[row][col].drawn : true
    const bottomLine = row < gridSize ? grid.horizontalLines[row + 1][col].drawn : true
    const leftLine = col > 0 ? grid.verticalLines[row][col].drawn : true
    const rightLine = col < gridSize ? grid.verticalLines[row][col + 1].drawn : true
    
    return topLine && bottomLine && leftLine && rightLine
  }, [gridSize])

  // Handle line click
  const handleLineClick = useCallback((type: 'horizontal' | 'vertical', row: number, col: number) => {
    if (!gameGrid || gameState !== 'playing') return

    const newGrid = { ...gameGrid }
    const line = type === 'horizontal' 
      ? newGrid.horizontalLines[row][col]
      : newGrid.verticalLines[row][col]

    if (line.drawn) return

    // Draw the line
    line.drawn = true
    line.owner = currentPlayer
    setMoves(prev => prev + 1)

    // Check for completed boxes
    let boxesCompleted = 0
    const boxesToCheck: [number, number][] = []

    if (type === 'horizontal') {
      if (row > 0) boxesToCheck.push([row - 1, col])
      if (row < gridSize) boxesToCheck.push([row, col])
    } else {
      if (col > 0) boxesToCheck.push([row, col - 1])
      if (col < gridSize) boxesToCheck.push([row, col])
    }

    boxesToCheck.forEach(([r, c]) => {
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && 
          !newGrid.boxes[r][c].completed && checkBoxCompletion(r, c, newGrid)) {
        newGrid.boxes[r][c].completed = true
        newGrid.boxes[r][c].owner = currentPlayer
        boxesCompleted++
        
        if (currentPlayer === 'player1') {
          setPlayer1Score(prev => prev + 1)
          setScore(prev => prev + 100)
        } else {
          setPlayer2Score(prev => prev + 1)
        }
      }
    })

    setGameGrid(newGrid)

    // Check for game over
    const totalBoxes = gridSize * gridSize
    if (player1Score + player2Score + boxesCompleted >= totalBoxes) {
      endGame()
      return
    }

    // Switch player if no boxes were completed
    if (boxesCompleted === 0) {
      setCurrentPlayer(prev => prev === 'player1' ? 'player2' : 'player1')
      
      // AI move
      if (gameMode === 'ai' && currentPlayer === 'player1') {
        setTimeout(() => makeAIMove(newGrid), 500)
      }
    }
  }, [gameGrid, gameState, currentPlayer, gridSize, player1Score, player2Score, gameMode])

  // AI move logic
  const makeAIMove = useCallback((grid: GameGrid) => {
    if (!grid) return

    const availableLines: { type: 'horizontal' | 'vertical', row: number, col: number }[] = []
    
    // Collect all available lines
    grid.horizontalLines.forEach((row, rowIndex) => {
      row.forEach((line, colIndex) => {
        if (!line.drawn) {
          availableLines.push({ type: 'horizontal', row: rowIndex, col: colIndex })
        }
      })
    })
    
    grid.verticalLines.forEach((row, rowIndex) => {
      row.forEach((line, colIndex) => {
        if (!line.drawn) {
          availableLines.push({ type: 'vertical', row: rowIndex, col: colIndex })
        }
      })
    })

    if (availableLines.length === 0) return

    let chosenMove = null

    if (difficulty === 'hard' || difficulty === 'medium') {
      // Try to complete a box
      for (const move of availableLines) {
        const testGrid = JSON.parse(JSON.stringify(grid))
        if (move.type === 'horizontal') {
          testGrid.horizontalLines[move.row][move.col].drawn = true
        } else {
          testGrid.verticalLines[move.row][move.col].drawn = true
        }

        const boxesToCheck: [number, number][] = []
        if (move.type === 'horizontal') {
          if (move.row > 0) boxesToCheck.push([move.row - 1, move.col])
          if (move.row < gridSize) boxesToCheck.push([move.row, move.col])
        } else {
          if (move.col > 0) boxesToCheck.push([move.row, move.col - 1])
          if (move.col < gridSize) boxesToCheck.push([move.row, move.col])
        }

        const completesBox = boxesToCheck.some(([r, c]) => 
          r >= 0 && r < gridSize && c >= 0 && c < gridSize && 
          !grid.boxes[r][c].completed && checkBoxCompletion(r, c, testGrid)
        )

        if (completesBox) {
          chosenMove = move
          break
        }
      }
    }

    if (!chosenMove && difficulty === 'hard') {
      // Avoid giving opponent a box
      const safeMoves = availableLines.filter(move => {
        const testGrid = JSON.parse(JSON.stringify(grid))
        if (move.type === 'horizontal') {
          testGrid.horizontalLines[move.row][move.col].drawn = true
        } else {
          testGrid.verticalLines[move.row][move.col].drawn = true
        }

        const boxesToCheck: [number, number][] = []
        if (move.type === 'horizontal') {
          if (move.row > 0) boxesToCheck.push([move.row - 1, move.col])
          if (move.row < gridSize) boxesToCheck.push([move.row, move.col])
        } else {
          if (move.col > 0) boxesToCheck.push([move.row, move.col - 1])
          if (move.col < gridSize) boxesToCheck.push([move.row, move.col])
        }

        // Check if this move would leave a box with 3 sides for opponent
        return !boxesToCheck.some(([r, c]) => {
          if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false
          let sidesDrawn = 0
          if (r === 0 || testGrid.horizontalLines[r][c].drawn) sidesDrawn++
          if (r === gridSize - 1 || testGrid.horizontalLines[r + 1][c].drawn) sidesDrawn++
          if (c === 0 || testGrid.verticalLines[r][c].drawn) sidesDrawn++
          if (c === gridSize - 1 || testGrid.verticalLines[r][c + 1].drawn) sidesDrawn++
          return sidesDrawn === 3
        })
      })

      if (safeMoves.length > 0) {
        chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)]
      }
    }

    // Random move if no strategic move found
    if (!chosenMove) {
      chosenMove = availableLines[Math.floor(Math.random() * availableLines.length)]
    }

    if (chosenMove) {
      handleLineClick(chosenMove.type, chosenMove.row, chosenMove.col)
    }
  }, [difficulty, gridSize, checkBoxCompletion, handleLineClick])

  // End game
  const endGame = () => {
    setTimerActive(false)
    
    // Calculate stars based on performance
    const totalBoxes = gridSize * gridSize
    const winPercentage = (player1Score / totalBoxes) * 100
    const timeBonus = Math.max(0, 300 - timeElapsed) * 10
    const moveBonus = Math.max(0, (totalBoxes * 4) - moves) * 20
    
    const totalScore = score + timeBonus + moveBonus
    setScore(totalScore)
    
    let earnedStars = 0
    if (winPercentage >= 50) earnedStars = 1
    if (winPercentage >= 70) earnedStars = 2
    if (winPercentage >= 90) earnedStars = 3
    
    setStars(earnedStars)
    setGameState('levelComplete')
  }

  // Next level
  const nextLevel = () => {
    const newLevel = level + 1
    setLevel(newLevel)
    setGameState('playing')
    setTimeElapsed(0)
    setTimerActive(true)
    
    // Increase grid size every 2 levels
    const newSize = Math.min(3 + Math.floor(newLevel / 2), 6)
    setGridSize(newSize)
    initializeGrid(newSize)
  }

  // Reset game
  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setTimeElapsed(0)
    setTimerActive(false)
    setGameGrid(null)
  }

  // Render line
  const renderLine = (type: 'horizontal' | 'vertical', row: number, col: number) => {
    if (!gameGrid) return null
    
    const line = type === 'horizontal' 
      ? gameGrid.horizontalLines[row][col]
      : gameGrid.verticalLines[row][col]
    
    const baseClasses = type === 'horizontal'
      ? 'absolute h-1 w-12 -top-0.5 left-2 cursor-pointer hover:bg-blue-300 transition-colors'
      : 'absolute w-1 h-12 -left-0.5 top-2 cursor-pointer hover:bg-blue-300 transition-colors'
    
    const colorClass = line.drawn
      ? line.owner === 'player1' ? 'bg-blue-500' : 'bg-red-500'
      : 'bg-gray-300'
    
    return (
      <div
        className={`${baseClasses} ${colorClass}`}
        onClick={() => !line.drawn && handleLineClick(type, row, col)}
      />
    )
  }

  // Render box
  const renderBox = (row: number, col: number) => {
    if (!gameGrid) return null
    
    const box = gameGrid.boxes[row][col]
    const bgColor = box.completed
      ? box.owner === 'player1' ? 'bg-blue-100' : 'bg-red-100'
      : 'bg-white'
    
    return (
      <div className={`w-12 h-12 ${bgColor} flex items-center justify-center text-xs font-bold`}>
        {box.completed && (box.owner === 'player1' ? 'P1' : 'P2')}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Dots and Boxes
          </span>
          <span className="text-lg">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Choose Game Mode</h2>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <Button
                  size="lg"
                  onClick={() => startGame('ai', 'easy')}
                  className="flex flex-col gap-2 h-24"
                >
                  <Bot className="w-8 h-8" />
                  <span>vs AI (Easy)</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => startGame('ai', 'medium')}
                  className="flex flex-col gap-2 h-24"
                >
                  <Bot className="w-8 h-8" />
                  <span>vs AI (Medium)</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => startGame('ai', 'hard')}
                  className="flex flex-col gap-2 h-24"
                >
                  <Bot className="w-8 h-8" />
                  <span>vs AI (Hard)</span>
                </Button>
                <Button
                  size="lg"
                  onClick={() => startGame('pvp', 'easy')}
                  className="flex flex-col gap-2 h-24"
                >
                  <Users className="w-8 h-8" />
                  <span>2 Players</span>
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Connect dots to form boxes. The player who completes the most boxes wins!
                When you complete a box, you get another turn immediately.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {gameState === 'playing' && gameGrid && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium">Level {level}</p>
                <p className="text-sm text-gray-600">Grid: {gridSize}x{gridSize}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  Current Turn: {currentPlayer === 'player1' ? 'Player 1' : gameMode === 'ai' ? 'AI' : 'Player 2'}
                </p>
                <p className="text-sm text-gray-600">
                  Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm">Score: {score}</p>
                <p className="text-sm">Moves: {moves}</p>
              </div>
            </div>

            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="font-bold text-blue-500">Player 1</p>
                <p className="text-2xl font-bold">{player1Score}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-red-500">
                  {gameMode === 'ai' ? 'AI' : 'Player 2'}
                </p>
                <p className="text-2xl font-bold">{player2Score}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-block bg-gray-100 p-4 rounded-lg">
                {Array.from({ length: gridSize + 1 }).map((_, row) => (
                  <div key={row} className="flex">
                    {Array.from({ length: gridSize + 1 }).map((_, col) => (
                      <div key={col} className="relative">
                        {/* Dot */}
                        <div className="w-4 h-4 bg-gray-800 rounded-full" />
                        
                        {/* Horizontal line */}
                        {col < gridSize && renderLine('horizontal', row, col)}
                        
                        {/* Vertical line */}
                        {row < gridSize && renderLine('vertical', row, col)}
                        
                        {/* Box */}
                        {row < gridSize && col < gridSize && (
                          <div className="absolute top-2 left-2">
                            {renderBox(row, col)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={resetGame}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Game
              </Button>
            </div>
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold">
              {player1Score > player2Score ? 'You Win!' : player1Score === player2Score ? 'Draw!' : 'You Lose!'}
            </h2>
            
            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-12 h-12 ${
                    i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg">Final Score: {score}</p>
              <p className="text-sm text-gray-600">
                Boxes Won: {player1Score} / {gridSize * gridSize}
              </p>
              <p className="text-sm text-gray-600">
                Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={nextLevel} size="lg">
                Next Level
              </Button>
              <Button onClick={resetGame} variant="outline" size="lg">
                Main Menu
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-bold">Game Over!</h2>
            <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
            <div className="space-y-2">
              <p className="text-2xl font-bold">Final Score: {score}</p>
              <p className="text-lg">High Score: {highScore}</p>
            </div>
            <Button onClick={resetGame} size="lg">
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}