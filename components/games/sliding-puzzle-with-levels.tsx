'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Shuffle } from 'lucide-react'

interface Tile {
  value: number
  currentPosition: number
  correctPosition: number
}

interface SlidingPuzzleGameProps {
  levelConfig: {
    gridSize: number
    moveLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Slide',
    difficulty: 'easy',
    config: { gridSize: 3, moveLimit: 100 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Classic Puzzle',
    difficulty: 'medium',
    config: { gridSize: 4, moveLimit: 150 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Complex Grid',
    difficulty: 'hard',
    config: { gridSize: 5, moveLimit: 200 },
    requiredStars: 4
  },
  {
    id: 4,
    name: 'Expert Challenge',
    difficulty: 'expert',
    config: { gridSize: 6, moveLimit: 250 },
    requiredStars: 6
  },
  {
    id: 5,
    name: 'Master Slider',
    difficulty: 'master',
    config: { gridSize: 7, moveLimit: 300 },
    requiredStars: 8
  }
]

function SlidingPuzzleGame({ levelConfig, onScore }: SlidingPuzzleGameProps) {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [emptyPosition, setEmptyPosition] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'solved' | 'failed'>('waiting')
  const [isShuffling, setIsShuffling] = useState(false)
  
  const gridSize = levelConfig.gridSize
  const totalTiles = gridSize * gridSize

  // Check if puzzle is solvable
  const isSolvable = useCallback((tiles: Tile[]): boolean => {
    let inversions = 0
    const values = tiles.map(t => t.value).filter(v => v !== totalTiles)
    
    for (let i = 0; i < values.length - 1; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (values[i] > values[j]) {
          inversions++
        }
      }
    }
    
    if (gridSize % 2 === 1) {
      // Odd grid size: solvable if inversions are even
      return inversions % 2 === 0
    } else {
      // Even grid size: solvable based on inversions and empty tile row
      const emptyRow = Math.floor(tiles.findIndex(t => t.value === totalTiles) / gridSize)
      const emptyFromBottom = gridSize - emptyRow
      return (inversions + emptyFromBottom) % 2 === 1
    }
  }, [gridSize, totalTiles])

  // Initialize puzzle
  const initializePuzzle = useCallback(() => {
    const newTiles: Tile[] = []
    
    // Create tiles in solved position
    for (let i = 0; i < totalTiles; i++) {
      newTiles.push({
        value: i + 1,
        currentPosition: i,
        correctPosition: i
      })
    }
    
    return newTiles
  }, [totalTiles])

  // Shuffle puzzle with animation
  const shufflePuzzle = useCallback(async () => {
    setIsShuffling(true)
    let shuffled: Tile[]
    let attempts = 0
    
    do {
      shuffled = [...initializePuzzle()]
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tempPos = shuffled[i].currentPosition
        shuffled[i].currentPosition = shuffled[j].currentPosition
        shuffled[j].currentPosition = tempPos
      }
      
      attempts++
      if (attempts > 100) {
        // Fallback: use a known solvable configuration
        shuffled = initializePuzzle()
        // Do a series of valid moves to shuffle
        for (let i = 0; i < 50 * gridSize; i++) {
          const emptyIdx = shuffled.findIndex(t => t.value === totalTiles)
          const emptyPos = shuffled[emptyIdx].currentPosition
          const neighbors = getNeighbors(emptyPos)
          if (neighbors.length > 0) {
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)]
            const neighborIdx = shuffled.findIndex(t => t.currentPosition === randomNeighbor)
            if (neighborIdx !== -1) {
              const temp = shuffled[emptyIdx].currentPosition
              shuffled[emptyIdx].currentPosition = shuffled[neighborIdx].currentPosition
              shuffled[neighborIdx].currentPosition = temp
            }
          }
        }
        break
      }
    } while (!isSolvable(shuffled) || isSolved(shuffled))
    
    setTiles(shuffled)
    setEmptyPosition(shuffled.find(t => t.value === totalTiles)?.currentPosition || 0)
    setMoves(0)
    setGameState('playing')
    setIsShuffling(false)
  }, [initializePuzzle, isSolvable, gridSize, totalTiles])

  // Check if puzzle is solved
  const isSolved = (currentTiles: Tile[]) => {
    return currentTiles.every(tile => tile.currentPosition === tile.correctPosition)
  }

  // Get valid neighbor positions
  const getNeighbors = (position: number): number[] => {
    const neighbors: number[] = []
    const row = Math.floor(position / gridSize)
    const col = position % gridSize
    
    // Up
    if (row > 0) neighbors.push(position - gridSize)
    // Down
    if (row < gridSize - 1) neighbors.push(position + gridSize)
    // Left
    if (col > 0) neighbors.push(position - 1)
    // Right
    if (col < gridSize - 1) neighbors.push(position + 1)
    
    return neighbors
  }

  // Handle tile click
  const handleTileClick = (clickedTile: Tile) => {
    if (gameState !== 'playing' || clickedTile.value === totalTiles) return
    
    const neighbors = getNeighbors(clickedTile.currentPosition)
    
    if (neighbors.includes(emptyPosition)) {
      // Swap with empty tile
      const newTiles = tiles.map(tile => {
        if (tile.value === clickedTile.value) {
          return { ...tile, currentPosition: emptyPosition }
        }
        if (tile.value === totalTiles) {
          return { ...tile, currentPosition: clickedTile.currentPosition }
        }
        return tile
      })
      
      setTiles(newTiles)
      setEmptyPosition(clickedTile.currentPosition)
      const newMoves = moves + 1
      setMoves(newMoves)
      
      // Check if solved
      if (isSolved(newTiles)) {
        setGameState('solved')
        const moveBonus = Math.max(0, (levelConfig.moveLimit - newMoves) * 10)
        const baseScore = 1000
        const finalScore = baseScore + moveBonus
        onScore(finalScore)
      } else if (newMoves >= levelConfig.moveLimit) {
        setGameState('failed')
        onScore(0)
      }
    }
  }

  // Get tile color based on position
  const getTileColor = (tile: Tile) => {
    if (tile.value === totalTiles) return 'transparent'
    
    const row = Math.floor(tile.correctPosition / gridSize)
    const col = tile.correctPosition % gridSize
    const hue = (row * 360 / gridSize + col * 360 / gridSize) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // Start game
  const startGame = () => {
    shufflePuzzle()
  }

  // Reset game
  const resetGame = () => {
    setGameState('waiting')
    setMoves(0)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">
              Moves: {moves}/{levelConfig.moveLimit}
            </div>
            {moves > levelConfig.moveLimit * 0.8 && gameState === 'playing' && (
              <div className="text-orange-600 font-semibold">
                Running out of moves!
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="sm" disabled={isShuffling}>
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {gameState === 'playing' && (
              <Button onClick={resetGame} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            {(gameState === 'solved' || gameState === 'failed') && (
              <Button onClick={startGame} size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {gameState === 'waiting' && !isShuffling && (
          <div className="text-center py-12 text-gray-500">
            Click "Start" to shuffle and begin the puzzle
          </div>
        )}

        {isShuffling && (
          <div className="text-center py-12 text-gray-500">
            Shuffling puzzle...
          </div>
        )}

        {(gameState === 'playing' || gameState === 'solved' || gameState === 'failed') && !isShuffling && (
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              width: `${Math.min(400, gridSize * 80)}px`,
              height: `${Math.min(400, gridSize * 80)}px`
            }}
          >
            {Array.from({ length: totalTiles }, (_, i) => {
              const tile = tiles.find(t => t.currentPosition === i)
              if (!tile) return null
              
              const isEmpty = tile.value === totalTiles
              const isCorrect = tile.currentPosition === tile.correctPosition
              
              return (
                <button
                  key={i}
                  onClick={() => handleTileClick(tile)}
                  disabled={gameState !== 'playing' || isEmpty}
                  className={`
                    rounded-lg font-bold text-white transition-all duration-200
                    ${isEmpty ? 'invisible' : ''}
                    ${!isEmpty && gameState === 'playing' ? 'hover:scale-105 cursor-pointer' : ''}
                    ${isCorrect && !isEmpty ? 'ring-2 ring-green-400' : ''}
                  `}
                  style={{
                    backgroundColor: getTileColor(tile),
                    fontSize: `${Math.max(16, 32 - gridSize * 2)}px`
                  }}
                >
                  {!isEmpty && tile.value}
                </button>
              )
            })}
          </div>
        )}

        {gameState === 'solved' && (
          <div className="text-center mt-4 text-green-600 font-semibold">
            Puzzle Solved! 🎉 Great job!
          </div>
        )}

        {gameState === 'failed' && (
          <div className="text-center mt-4 text-red-600 font-semibold">
            Out of moves! Try again
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SlidingPuzzleWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    // Scoring based on move efficiency
    if (score >= 1500) return 3
    if (score >= 1000) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="sliding-puzzle"
      gameName="Sliding Puzzle"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <SlidingPuzzleGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}