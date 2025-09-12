'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Undo } from 'lucide-react'

interface Game2048Props {
  levelConfig: {
    gridSize: number
    targetTile: number
    moveLimit?: number
    obstacles?: number[]
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Classic 2048',
    difficulty: 'easy',
    config: { gridSize: 4, targetTile: 2048 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Extended Goal',
    difficulty: 'medium',
    config: { gridSize: 4, targetTile: 4096 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Larger Grid',
    difficulty: 'hard',
    config: { gridSize: 5, targetTile: 2048 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Move Challenge',
    difficulty: 'expert',
    config: { gridSize: 4, targetTile: 2048, moveLimit: 200 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Grid',
    difficulty: 'master',
    config: { gridSize: 6, targetTile: 8192, moveLimit: 500 },
    requiredStars: 12
  }
]

function Game2048({ levelConfig, onScore }: Game2048Props) {
  const { gridSize, targetTile, moveLimit } = levelConfig
  const [grid, setGrid] = useState<number[][]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [moves, setMoves] = useState(0)
  const [previousStates, setPreviousStates] = useState<{ grid: number[][], score: number, moves: number }[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
    addNewTile(newGrid)
    addNewTile(newGrid)
    return newGrid
  }, [gridSize])

  const addNewTile = (grid: number[][]) => {
    const emptyCells: [number, number][] = []
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      grid[row][col] = Math.random() < 0.9 ? 2 : 4
    }
  }

  const startGame = () => {
    const newGrid = initializeGrid()
    setGrid(newGrid)
    setScore(0)
    setMoves(0)
    setGameOver(false)
    setGameWon(false)
    setGameStarted(true)
    setPreviousStates([])
  }

  const moveGrid = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver || gameWon || !gameStarted) return
    if (moveLimit && moves >= moveLimit) {
      setGameOver(true)
      onScore(score)
      return
    }

    // Save current state for undo
    setPreviousStates([...previousStates, { grid: grid.map(row => [...row]), score, moves }])

    let newGrid = grid.map(row => [...row])
    let newScore = score
    let moved = false

    const moveRow = (row: number[]) => {
      const filtered = row.filter(val => val !== 0)
      const merged: number[] = []
      let i = 0
      
      while (i < filtered.length) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          merged.push(filtered[i] * 2)
          newScore += filtered[i] * 2
          i += 2
          moved = true
        } else {
          merged.push(filtered[i])
          i++
        }
      }
      
      const newRow = [...merged, ...Array(gridSize - merged.length).fill(0)]
      if (row.some((val, idx) => val !== newRow[idx])) {
        moved = true
      }
      return newRow
    }

    if (direction === 'left') {
      newGrid = newGrid.map(row => moveRow(row))
    } else if (direction === 'right') {
      newGrid = newGrid.map(row => moveRow([...row].reverse()).reverse())
    } else if (direction === 'up') {
      for (let col = 0; col < gridSize; col++) {
        const column = []
        for (let row = 0; row < gridSize; row++) {
          column.push(newGrid[row][col])
        }
        const newColumn = moveRow(column)
        for (let row = 0; row < gridSize; row++) {
          newGrid[row][col] = newColumn[row]
        }
      }
    } else if (direction === 'down') {
      for (let col = 0; col < gridSize; col++) {
        const column = []
        for (let row = 0; row < gridSize; row++) {
          column.push(newGrid[row][col])
        }
        const newColumn = moveRow([...column].reverse()).reverse()
        for (let row = 0; row < gridSize; row++) {
          newGrid[row][col] = newColumn[row]
        }
      }
    }

    if (moved) {
      addNewTile(newGrid)
      setGrid(newGrid)
      setScore(newScore)
      setMoves(moves + 1)

      // Check for win
      if (newGrid.some(row => row.some(cell => cell >= targetTile))) {
        setGameWon(true)
        onScore(newScore)
      }

      // Check for game over
      if (!hasValidMoves(newGrid)) {
        setGameOver(true)
        onScore(newScore)
      }
    }
  }

  const hasValidMoves = (grid: number[][]): boolean => {
    // Check for empty cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (grid[i][j] === 0) return true
        
        // Check adjacent cells for possible merges
        if (i > 0 && grid[i][j] === grid[i - 1][j]) return true
        if (i < gridSize - 1 && grid[i][j] === grid[i + 1][j]) return true
        if (j > 0 && grid[i][j] === grid[i][j - 1]) return true
        if (j < gridSize - 1 && grid[i][j] === grid[i][j + 1]) return true
      }
    }
    return false
  }

  const undo = () => {
    if (previousStates.length > 0) {
      const lastState = previousStates[previousStates.length - 1]
      setGrid(lastState.grid)
      setScore(lastState.score)
      setMoves(lastState.moves)
      setPreviousStates(previousStates.slice(0, -1))
      setGameOver(false)
      setGameWon(false)
    }
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveGrid('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveGrid('down')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        moveGrid('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        moveGrid('right')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [grid, gameOver, gameWon, gameStarted, moves])

  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'bg-gray-200 dark:bg-gray-700',
      2: 'bg-gray-300 dark:bg-gray-600',
      4: 'bg-gray-400 dark:bg-gray-500',
      8: 'bg-orange-300',
      16: 'bg-orange-400',
      32: 'bg-orange-500',
      64: 'bg-orange-600',
      128: 'bg-yellow-400',
      256: 'bg-yellow-500',
      512: 'bg-yellow-600',
      1024: 'bg-red-400',
      2048: 'bg-red-500',
      4096: 'bg-purple-500',
      8192: 'bg-purple-600',
      16384: 'bg-blue-600'
    }
    return colors[value] || 'bg-gray-900'
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-lg font-semibold">
              Moves: {moves}
              {moveLimit && ` / ${moveLimit}`}
            </div>
          </div>
          
          <div className="flex gap-2">
            {gameStarted && previousStates.length > 0 && (
              <Button onClick={undo} variant="outline" size="sm">
                <Undo className="mr-2 h-4 w-4" /> Undo
              </Button>
            )}
            
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="mr-2 h-4 w-4" /> Start Game
              </Button>
            ) : (
              <Button onClick={startGame} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> New Game
              </Button>
            )}
          </div>
        </div>

        <div 
          className="grid gap-2 mx-auto mb-4"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: `${gridSize * 80}px`
          }}
        >
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`
                  aspect-square rounded flex items-center justify-center
                  text-2xl font-bold transition-all duration-200
                  ${getTileColor(cell)}
                  ${cell > 0 && cell < 8 ? 'text-gray-700' : 'text-white'}
                `}
              >
                {cell > 0 && cell}
              </div>
            ))
          )}
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Use arrow keys to play
        </div>

        {(gameWon || gameOver) && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">
              {gameWon ? `You reached ${targetTile}!` : 'Game Over!'}
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Final Score: {score}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Completed in {moves} moves
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Game2048WithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const { targetTile, moveLimit } = levelConfig
    
    // Star rating based on score relative to target
    const baseScore = targetTile * 2
    
    if (moveLimit) {
      if (score >= baseScore * 2) return 3
      if (score >= baseScore) return 2
      return 1
    } else {
      if (score >= baseScore * 3) return 3
      if (score >= baseScore * 1.5) return 2
      return 1
    }
  }

  return (
    <GameWithLevels
      gameId="2048"
      gameName="2048"
      levels={levels}
      renderGame={(config, onScore) => (
        <Game2048 levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}