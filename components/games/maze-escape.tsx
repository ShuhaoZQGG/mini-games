'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Key, DoorOpen, RotateCcw, Trophy, Footprints, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MazeCell {
  x: number
  y: number
  walls: {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
  }
  visited: boolean
  isPath?: boolean
  hasKey?: boolean
  hasDoor?: boolean
  hasTrap?: boolean
  hasBonus?: boolean
}

interface MazeEscapeConfig {
  mazeSize: number
  movesLimit: number
  keysRequired: number
  trapsCount: number
  bonusCount: number
}

interface MazeEscapeCoreProps {
  levelConfig: MazeEscapeConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Maze',
    difficulty: 'easy',
    config: {
      mazeSize: 7,
      movesLimit: 50,
      keysRequired: 1,
      trapsCount: 2,
      bonusCount: 3
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Key Hunter',
    difficulty: 'medium',
    config: {
      mazeSize: 9,
      movesLimit: 60,
      keysRequired: 2,
      trapsCount: 4,
      bonusCount: 4
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Trap Dodger',
    difficulty: 'hard',
    config: {
      mazeSize: 11,
      movesLimit: 70,
      keysRequired: 3,
      trapsCount: 6,
      bonusCount: 5
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Complex Labyrinth',
    difficulty: 'expert',
    config: {
      mazeSize: 13,
      movesLimit: 80,
      keysRequired: 4,
      trapsCount: 8,
      bonusCount: 6
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Ultimate Escape',
    difficulty: 'master',
    config: {
      mazeSize: 15,
      movesLimit: 90,
      keysRequired: 5,
      trapsCount: 10,
      bonusCount: 7
    },
    requiredStars: 12
  }
]

function generateMaze(size: number): MazeCell[][] {
  const maze: MazeCell[][] = []
  
  // Initialize maze with all walls
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false
      }
    }
  }
  
  // Generate maze using recursive backtracking
  const stack: MazeCell[] = []
  const current = maze[0][0]
  current.visited = true
  stack.push(current)
  
  while (stack.length > 0) {
    const cell = stack[stack.length - 1]
    const neighbors = getUnvisitedNeighbors(cell, maze, size)
    
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]
      removeWall(cell, next, maze)
      next.visited = true
      stack.push(next)
    } else {
      stack.pop()
    }
  }
  
  // Reset visited flags for gameplay
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      maze[y][x].visited = false
    }
  }
  
  return maze
}

function getUnvisitedNeighbors(cell: MazeCell, maze: MazeCell[][], size: number): MazeCell[] {
  const neighbors: MazeCell[] = []
  const { x, y } = cell
  
  if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x])
  if (x < size - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1])
  if (y < size - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x])
  if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1])
  
  return neighbors
}

function removeWall(current: MazeCell, next: MazeCell, maze: MazeCell[][]) {
  const dx = current.x - next.x
  const dy = current.y - next.y
  
  if (dx === 1) {
    maze[current.y][current.x].walls.left = false
    maze[next.y][next.x].walls.right = false
  } else if (dx === -1) {
    maze[current.y][current.x].walls.right = false
    maze[next.y][next.x].walls.left = false
  } else if (dy === 1) {
    maze[current.y][current.x].walls.top = false
    maze[next.y][next.x].walls.bottom = false
  } else if (dy === -1) {
    maze[current.y][current.x].walls.bottom = false
    maze[next.y][next.x].walls.top = false
  }
}

function MazeEscapeCore({ levelConfig, onScore }: MazeEscapeCoreProps) {
  const { mazeSize, movesLimit, keysRequired, trapsCount, bonusCount } = levelConfig
  
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing')
  const [maze, setMaze] = useState<MazeCell[][]>([])
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
  const [exitPos, setExitPos] = useState({ x: mazeSize - 1, y: mazeSize - 1 })
  const [keysCollected, setKeysCollected] = useState(0)
  const [movesRemaining, setMovesRemaining] = useState(movesLimit)
  const [score, setScore] = useState(0)
  const [path, setPath] = useState<{x: number, y: number}[]>([])
  const [showSolution, setShowSolution] = useState(false)
  
  const mazeRef = useRef<MazeCell[][]>([])

  // Initialize maze
  useEffect(() => {
    const newMaze = generateMaze(mazeSize)
    
    // Place exit door
    newMaze[exitPos.y][exitPos.x].hasDoor = true
    
    // Place keys randomly
    const availableCells: MazeCell[] = []
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        if ((x !== 0 || y !== 0) && (x !== exitPos.x || y !== exitPos.y)) {
          availableCells.push(newMaze[y][x])
        }
      }
    }
    
    // Shuffle and place items
    for (let i = availableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]]
    }
    
    for (let i = 0; i < keysRequired && i < availableCells.length; i++) {
      availableCells[i].hasKey = true
    }
    
    for (let i = keysRequired; i < keysRequired + trapsCount && i < availableCells.length; i++) {
      availableCells[i].hasTrap = true
    }
    
    for (let i = keysRequired + trapsCount; i < keysRequired + trapsCount + bonusCount && i < availableCells.length; i++) {
      availableCells[i].hasBonus = true
    }
    
    setMaze(newMaze)
    mazeRef.current = newMaze
  }, [mazeSize, exitPos.x, exitPos.y, keysRequired, trapsCount, bonusCount])

  const canMove = useCallback((from: {x: number, y: number}, direction: string): boolean => {
    const cell = mazeRef.current[from.y]?.[from.x]
    if (!cell) return false
    
    switch (direction) {
      case 'up':
        return !cell.walls.top && from.y > 0
      case 'right':
        return !cell.walls.right && from.x < mazeSize - 1
      case 'down':
        return !cell.walls.bottom && from.y < mazeSize - 1
      case 'left':
        return !cell.walls.left && from.x > 0
      default:
        return false
    }
  }, [mazeSize])

  const move = useCallback((direction: string) => {
    if (gameState !== 'playing' || movesRemaining <= 0) return
    
    const newPos = { ...playerPos }
    
    switch (direction) {
      case 'up':
        if (canMove(playerPos, 'up')) newPos.y--
        break
      case 'right':
        if (canMove(playerPos, 'right')) newPos.x++
        break
      case 'down':
        if (canMove(playerPos, 'down')) newPos.y++
        break
      case 'left':
        if (canMove(playerPos, 'left')) newPos.x--
        break
    }
    
    if (newPos.x !== playerPos.x || newPos.y !== playerPos.y) {
      setPlayerPos(newPos)
      setMovesRemaining(prev => prev - 1)
      setPath(prev => [...prev, newPos])
      
      // Check cell contents
      const cell = mazeRef.current[newPos.y][newPos.x]
      
      if (cell.hasKey) {
        setKeysCollected(prev => prev + 1)
        setScore(prev => prev + 100)
        cell.hasKey = false
        setMaze([...mazeRef.current])
      }
      
      if (cell.hasTrap) {
        setMovesRemaining(prev => Math.max(0, prev - 5))
        setScore(prev => Math.max(0, prev - 50))
        cell.hasTrap = false
        setMaze([...mazeRef.current])
      }
      
      if (cell.hasBonus) {
        setMovesRemaining(prev => prev + 10)
        setScore(prev => prev + 50)
        cell.hasBonus = false
        setMaze([...mazeRef.current])
      }
      
      // Check victory
      if (newPos.x === exitPos.x && newPos.y === exitPos.y && keysCollected >= keysRequired) {
        setGameState('victory')
        const moveBonus = movesRemaining * 10
        const pathBonus = Math.max(0, (mazeSize * mazeSize - path.length) * 5)
        const finalScore = score + moveBonus + pathBonus + 500
        setScore(finalScore)
        onScore(finalScore)
      }
    }
  }, [gameState, playerPos, movesRemaining, canMove, exitPos, keysCollected, keysRequired, score, path.length, mazeSize, onScore])

  // Check defeat
  useEffect(() => {
    if (movesRemaining <= 0 && gameState === 'playing') {
      setGameState('defeat')
      onScore(score)
    }
  }, [movesRemaining, gameState, score, onScore])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          move('up')
          break
        case 'ArrowRight':
        case 'd':
          move('right')
          break
        case 'ArrowDown':
        case 's':
          move('down')
          break
        case 'ArrowLeft':
        case 'a':
          move('left')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [move])

  const reset = useCallback(() => {
    setGameState('playing')
    setPlayerPos({ x: 0, y: 0 })
    setKeysCollected(0)
    setMovesRemaining(movesLimit)
    setScore(0)
    setPath([{ x: 0, y: 0 }])
    setShowSolution(false)
    
    const newMaze = generateMaze(mazeSize)
    newMaze[exitPos.y][exitPos.x].hasDoor = true
    
    const availableCells: MazeCell[] = []
    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        if ((x !== 0 || y !== 0) && (x !== exitPos.x || y !== exitPos.y)) {
          availableCells.push(newMaze[y][x])
        }
      }
    }
    
    for (let i = availableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]]
    }
    
    for (let i = 0; i < keysRequired && i < availableCells.length; i++) {
      availableCells[i].hasKey = true
    }
    
    for (let i = keysRequired; i < keysRequired + trapsCount && i < availableCells.length; i++) {
      availableCells[i].hasTrap = true
    }
    
    for (let i = keysRequired + trapsCount; i < keysRequired + trapsCount + bonusCount && i < availableCells.length; i++) {
      availableCells[i].hasBonus = true
    }
    
    setMaze(newMaze)
    mazeRef.current = newMaze
  }, [mazeSize, movesLimit, exitPos, keysRequired, trapsCount, bonusCount])

  const findSolution = useCallback(() => {
    // Simple BFS to find shortest path
    const queue: {x: number, y: number, path: {x: number, y: number}[]}[] = [
      {x: 0, y: 0, path: [{x: 0, y: 0}]}
    ]
    const visited = new Set<string>()
    visited.add('0,0')
    
    while (queue.length > 0) {
      const current = queue.shift()!
      
      if (current.x === exitPos.x && current.y === exitPos.y) {
        current.path.forEach(p => {
          if (mazeRef.current[p.y] && mazeRef.current[p.y][p.x]) {
            mazeRef.current[p.y][p.x].isPath = true
          }
        })
        setMaze([...mazeRef.current])
        setShowSolution(true)
        setScore(prev => Math.max(0, prev - 100))
        return
      }
      
      const directions = [
        { dx: 0, dy: -1, dir: 'up' },
        { dx: 1, dy: 0, dir: 'right' },
        { dx: 0, dy: 1, dir: 'down' },
        { dx: -1, dy: 0, dir: 'left' }
      ]
      
      for (const { dx, dy, dir } of directions) {
        const newX = current.x + dx
        const newY = current.y + dy
        const key = `${newX},${newY}`
        
        if (!visited.has(key) && canMove({x: current.x, y: current.y}, dir)) {
          visited.add(key)
          queue.push({
            x: newX,
            y: newY,
            path: [...current.path, {x: newX, y: newY}]
          })
        }
      }
    }
  }, [exitPos, canMove])

  const cellSize = Math.min(40, 400 / mazeSize)

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <Key className="w-5 h-5 text-yellow-500" />
              <span className="font-bold">{keysCollected}/{keysRequired}</span>
            </div>
            <div className="flex items-center gap-1">
              <Footprints className="w-5 h-5 text-blue-500" />
              <span className="font-bold">{movesRemaining}</span>
            </div>
            <span>Score: {score}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={findSolution} 
              size="sm" 
              variant="outline"
              disabled={showSolution}
            >
              Show Path (-100)
            </Button>
            <Button onClick={reset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div 
            className="relative bg-slate-800 p-2 rounded-lg"
            style={{
              width: mazeSize * cellSize + 16,
              height: mazeSize * cellSize + 16
            }}
          >
            {maze.map((row, y) => 
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "absolute bg-slate-100 transition-colors",
                    cell.isPath && showSolution && "bg-green-200",
                    cell.walls.top && "border-t-2 border-slate-800",
                    cell.walls.right && "border-r-2 border-slate-800",
                    cell.walls.bottom && "border-b-2 border-slate-800",
                    cell.walls.left && "border-l-2 border-slate-800"
                  )}
                  style={{
                    left: x * cellSize + 8,
                    top: y * cellSize + 8,
                    width: cellSize,
                    height: cellSize
                  }}
                >
                  {/* Items */}
                  {cell.hasKey && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Key className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                  )}
                  {cell.hasDoor && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <DoorOpen className={cn(
                        "w-5 h-5",
                        keysCollected >= keysRequired ? "text-green-500" : "text-red-500"
                      )} />
                    </motion.div>
                  )}
                  {cell.hasTrap && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                    </motion.div>
                  )}
                  {cell.hasBonus && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Timer className="w-4 h-4 text-blue-500" />
                    </motion.div>
                  )}
                  
                  {/* Player */}
                  {playerPos.x === x && playerPos.y === y && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center z-10"
                    >
                      <div className="w-4 h-4 bg-blue-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-2 w-36">
            <div />
            <Button
              size="sm"
              onClick={() => move('up')}
              disabled={gameState !== 'playing' || !canMove(playerPos, 'up')}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <div />
            <Button
              size="sm"
              onClick={() => move('left')}
              disabled={gameState !== 'playing' || !canMove(playerPos, 'left')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div />
            <Button
              size="sm"
              onClick={() => move('right')}
              disabled={gameState !== 'playing' || !canMove(playerPos, 'right')}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div />
            <Button
              size="sm"
              onClick={() => move('down')}
              disabled={gameState !== 'playing' || !canMove(playerPos, 'down')}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <div />
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Use arrow keys or WASD to move
        </div>

        {(gameState === 'victory' || gameState === 'defeat') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold">
              {gameState === 'victory' ? '🎉 Escaped!' : '😵 Out of Moves!'}
            </h2>
            <p className="text-lg">Final Score: {score}</p>
            {gameState === 'victory' && (
              <p className="text-sm text-muted-foreground">
                Moves Bonus: {movesRemaining * 10}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  )
}

export default function MazeEscapeWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const baseScore = levelConfig.movesLimit * 10 + levelConfig.keysRequired * 100
    if (score >= baseScore * 1.8) return 3
    if (score >= baseScore * 1.4) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="maze-escape"
      gameName="Maze Escape"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <MazeEscapeCore levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}