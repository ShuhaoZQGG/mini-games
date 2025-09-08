'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Shuffle, Image, Hash, Clock, Move } from 'lucide-react'

type GridSize = 3 | 4 | 5
type PuzzleMode = 'numbers' | 'image'

interface Tile {
  value: number
  currentPosition: number
  correctPosition: number
}

export default function SlidingPuzzleGame() {
  const [gridSize, setGridSize] = useState<GridSize>(4)
  const [mode, setMode] = useState<PuzzleMode>('numbers')
  const [tiles, setTiles] = useState<Tile[]>([])
  const [emptyPosition, setEmptyPosition] = useState(0)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'solved'>('waiting')
  const [selectedImage, setSelectedImage] = useState('gradient')
  const [showNumbers, setShowNumbers] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const totalTiles = gridSize * gridSize

  // Image patterns for image mode
  const imagePatterns = {
    gradient: (row: number, col: number) => {
      const hue = (row * 360 / gridSize + col * 360 / gridSize) % 360
      return `hsl(${hue}, 70%, 50%)`
    },
    checker: (row: number, col: number) => {
      return (row + col) % 2 === 0 ? '#3B82F6' : '#10B981'
    },
    rainbow: (row: number, col: number) => {
      const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
      const index = (row * gridSize + col) % colors.length
      return colors[index]
    },
    waves: (row: number, col: number) => {
      const intensity = Math.sin(row * Math.PI / gridSize) * Math.cos(col * Math.PI / gridSize)
      const value = Math.floor(128 + intensity * 127)
      return `rgb(${value}, ${value}, 255)`
    }
  }

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

  // Shuffle puzzle
  const shufflePuzzle = useCallback(() => {
    let shuffled: Tile[]
    let attempts = 0
    
    do {
      shuffled = [...initializePuzzle()]
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i].currentPosition
        shuffled[i].currentPosition = shuffled[j].currentPosition
        shuffled[j].currentPosition = temp
      }
      
      // Reorder array by current position
      shuffled.sort((a, b) => a.currentPosition - b.currentPosition)
      attempts++
      
      // Prevent infinite loop
      if (attempts > 100) {
        console.warn('Could not generate solvable puzzle, using default')
        break
      }
    } while (!isSolvable(shuffled) || isSolved(shuffled))
    
    setTiles(shuffled)
    setEmptyPosition(shuffled.findIndex(t => t.value === totalTiles))
  }, [initializePuzzle, totalTiles, isSolvable])

  // Check if puzzle is solved
  const isSolved = (tiles: Tile[]): boolean => {
    return tiles.every(tile => tile.currentPosition === tile.correctPosition)
  }

  // Get adjacent positions
  const getAdjacentPositions = useCallback((position: number): number[] => {
    const adjacent: number[] = []
    const row = Math.floor(position / gridSize)
    const col = position % gridSize
    
    // Up
    if (row > 0) adjacent.push(position - gridSize)
    // Down
    if (row < gridSize - 1) adjacent.push(position + gridSize)
    // Left
    if (col > 0) adjacent.push(position - 1)
    // Right
    if (col < gridSize - 1) adjacent.push(position + 1)
    
    return adjacent
  }, [gridSize])

  // Check if move is valid
  const isValidMove = useCallback((tilePosition: number): boolean => {
    return getAdjacentPositions(tilePosition).includes(emptyPosition)
  }, [emptyPosition, getAdjacentPositions])

  // Move tile
  const moveTile = useCallback((tilePosition: number) => {
    if (!isValidMove(tilePosition) || gameState !== 'playing') return
    
    setTiles(current => {
      const newTiles = [...current]
      const tileIndex = newTiles.findIndex(t => t.currentPosition === tilePosition)
      const emptyIndex = newTiles.findIndex(t => t.currentPosition === emptyPosition)
      
      // Swap positions
      const temp = newTiles[tileIndex].currentPosition
      newTiles[tileIndex].currentPosition = newTiles[emptyIndex].currentPosition
      newTiles[emptyIndex].currentPosition = temp
      
      // Reorder array by current position
      newTiles.sort((a, b) => a.currentPosition - b.currentPosition)
      
      // Check if solved
      if (isSolved(newTiles)) {
        setGameState('solved')
      }
      
      return newTiles
    })
    
    setEmptyPosition(tilePosition)
    setMoves(prev => prev + 1)
  }, [emptyPosition, gameState, isValidMove])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      let tileToMove = -1
      const emptyRow = Math.floor(emptyPosition / gridSize)
      const emptyCol = emptyPosition % gridSize
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          // Move tile from below
          if (emptyRow < gridSize - 1) {
            tileToMove = emptyPosition + gridSize
          }
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          // Move tile from above
          if (emptyRow > 0) {
            tileToMove = emptyPosition - gridSize
          }
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          // Move tile from right
          if (emptyCol < gridSize - 1) {
            tileToMove = emptyPosition + 1
          }
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          // Move tile from left
          if (emptyCol > 0) {
            tileToMove = emptyPosition - 1
          }
          break
      }
      
      if (tileToMove >= 0) {
        e.preventDefault()
        moveTile(tileToMove)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, emptyPosition, gridSize, moveTile])

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState])

  const startGame = () => {
    shufflePuzzle()
    setMoves(0)
    setTime(0)
    setGameState('playing')
  }

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }

  const resetGame = () => {
    setGameState('waiting')
    setTiles(initializePuzzle())
    setEmptyPosition(totalTiles - 1)
    setMoves(0)
    setTime(0)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Save best score
  useEffect(() => {
    if (gameState === 'solved') {
      const key = `sliding-puzzle-${gridSize}-${mode}-best`
      const bestData = localStorage.getItem(key)
      
      if (!bestData) {
        localStorage.setItem(key, JSON.stringify({ moves, time }))
      } else {
        const best = JSON.parse(bestData)
        if (moves < best.moves || (moves === best.moves && time < best.time)) {
          localStorage.setItem(key, JSON.stringify({ moves, time }))
        }
      }
    }
  }, [gameState, gridSize, mode, moves, time])

  const getBestScore = () => {
    if (typeof window !== 'undefined') {
      const key = `sliding-puzzle-${gridSize}-${mode}-best`
      const bestData = localStorage.getItem(key)
      if (bestData) {
        const best = JSON.parse(bestData)
        return `${best.moves} moves in ${formatTime(best.time)}`
      }
    }
    return 'No record'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <Card className="p-6 max-w-2xl w-full">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4" />
                <span className="font-semibold">{moves}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">{formatTime(time)}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Best: {getBestScore()}
            </div>
          </div>

          {/* Settings */}
          {gameState === 'waiting' && (
            <div className="flex flex-col gap-4 w-full">
              <div>
                <label className="text-sm font-medium mb-2 block">Grid Size</label>
                <div className="flex gap-2">
                  {([3, 4, 5] as GridSize[]).map(size => (
                    <Button
                      key={size}
                      size="sm"
                      variant={gridSize === size ? 'default' : 'outline'}
                      onClick={() => {
                        setGridSize(size)
                        setTiles(initializePuzzle())
                        setEmptyPosition(size * size - 1)
                      }}
                    >
                      {size}x{size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={mode === 'numbers' ? 'default' : 'outline'}
                    onClick={() => setMode('numbers')}
                  >
                    <Hash className="w-4 h-4 mr-1" />
                    Numbers
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'image' ? 'default' : 'outline'}
                    onClick={() => setMode('image')}
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Image
                  </Button>
                </div>
              </div>

              {mode === 'image' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Pattern</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(imagePatterns).map(pattern => (
                      <Button
                        key={pattern}
                        size="sm"
                        variant={selectedImage === pattern ? 'default' : 'outline'}
                        onClick={() => setSelectedImage(pattern)}
                        className="capitalize"
                      >
                        {pattern}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Puzzle grid */}
          <div 
            className={`grid gap-1 p-4 bg-gray-800 rounded-lg ${
              gameState === 'paused' ? 'opacity-50' : ''
            }`}
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: 'min(400px, 90vw)',
              height: 'min(400px, 90vw)'
            }}
          >
            {tiles.map((tile, index) => {
              const isEmptyTile = tile.value === totalTiles
              const row = Math.floor(tile.correctPosition / gridSize)
              const col = tile.correctPosition % gridSize
              const canMove = isValidMove(tile.currentPosition)
              
              if (isEmptyTile) {
                return <div key={index} className="bg-gray-900 rounded" />
              }
              
              return (
                <button
                  key={index}
                  className={`
                    relative rounded font-bold text-lg transition-all duration-200
                    ${canMove && gameState === 'playing' 
                      ? 'cursor-pointer hover:scale-105 active:scale-95' 
                      : 'cursor-not-allowed'
                    }
                    ${mode === 'numbers' 
                      ? 'bg-blue-500 hover:bg-blue-400 text-white' 
                      : ''
                    }
                  `}
                  style={{
                    backgroundColor: mode === 'image' 
                      ? imagePatterns[selectedImage as keyof typeof imagePatterns](row, col)
                      : undefined
                  }}
                  onClick={() => moveTile(tile.currentPosition)}
                  disabled={!canMove || gameState !== 'playing'}
                >
                  {mode === 'numbers' && tile.value}
                  {mode === 'image' && showNumbers && (
                    <span className="absolute top-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
                      {tile.value}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Game state messages */}
          {gameState === 'solved' && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-2">Puzzle Solved!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Completed in {moves} moves and {formatTime(time)}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {gameState === 'waiting' && (
              <Button onClick={startGame} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
            )}
            {(gameState === 'playing' || gameState === 'paused') && (
              <>
                <Button onClick={togglePause} className="flex items-center gap-2">
                  {gameState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {gameState === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={shufflePuzzle} variant="outline" className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  New Puzzle
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Menu
                </Button>
                {mode === 'image' && (
                  <Button
                    onClick={() => setShowNumbers(!showNumbers)}
                    variant="outline"
                    size="sm"
                  >
                    {showNumbers ? 'Hide' : 'Show'} Numbers
                  </Button>
                )}
              </>
            )}
            {gameState === 'solved' && (
              <>
                <Button onClick={startGame} className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  New Puzzle
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Menu
                </Button>
              </>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
            Click tiles next to the empty space or use arrow keys/WASD to move tiles
          </div>
        </CardContent>
      </Card>
    </div>
  )
}