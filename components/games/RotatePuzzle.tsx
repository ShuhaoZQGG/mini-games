'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Play, RotateCcw, RotateCw, Target, Trophy } from 'lucide-react'

interface RotatePuzzleProps {
  levelConfig: {
    gridSize: number
    pieceTypes: number
    targetRotations: number
    obstacles: boolean
    timeLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Rotation',
    difficulty: 'easy',
    config: { gridSize: 4, pieceTypes: 2, targetRotations: 10, obstacles: false, timeLimit: 120 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Complex Paths',
    difficulty: 'medium',
    config: { gridSize: 5, pieceTypes: 3, targetRotations: 15, obstacles: false, timeLimit: 180 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Obstacle Course',
    difficulty: 'hard',
    config: { gridSize: 6, pieceTypes: 4, targetRotations: 20, obstacles: true, timeLimit: 240 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Rotation',
    difficulty: 'expert',
    config: { gridSize: 7, pieceTypes: 5, targetRotations: 25, obstacles: true, timeLimit: 300 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Puzzle',
    difficulty: 'master',
    config: { gridSize: 8, pieceTypes: 6, targetRotations: 30, obstacles: true, timeLimit: 360 },
    requiredStars: 12
  }
]

type PieceType = 'empty' | 'straight' | 'corner' | 'tee' | 'cross' | 'start' | 'end' | 'obstacle'
type Direction = 0 | 90 | 180 | 270

interface Piece {
  type: PieceType
  rotation: Direction
  connections: boolean[] // [top, right, bottom, left]
  isConnected: boolean
  isPath: boolean
}

const PIECE_CONFIGS = {
  empty: [false, false, false, false],
  straight: [true, false, true, false],
  corner: [true, true, false, false],
  tee: [true, true, true, false],
  cross: [true, true, true, true],
  start: [false, true, false, false],
  end: [false, false, false, true],
  obstacle: [false, false, false, false]
}

const PIECE_ICONS = {
  empty: '',
  straight: '━',
  corner: '┗',
  tee: '┻',
  cross: '╋',
  start: '▶',
  end: '◀',
  obstacle: '▓'
}

function RotatePuzzle({ levelConfig, onScore }: RotatePuzzleProps) {
  const { gridSize, pieceTypes, targetRotations, obstacles, timeLimit } = levelConfig
  const [grid, setGrid] = useState<Piece[][]>([])
  const [rotations, setRotations] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [score, setScore] = useState(0)
  const [startPos, setStartPos] = useState<[number, number]>([0, 0])
  const [endPos, setEndPos] = useState<[number, number]>([0, 0])
  const [isComplete, setIsComplete] = useState(false)

  // Rotate connections array based on rotation angle
  const rotateConnections = (connections: boolean[], rotation: Direction): boolean[] => {
    const steps = rotation / 90
    const rotated = [...connections]
    for (let i = 0; i < steps; i++) {
      rotated.unshift(rotated.pop()!)
    }
    return rotated
  }

  // Generate puzzle grid
  const generatePuzzle = useCallback(() => {
    const newGrid: Piece[][] = []
    const availableTypes: PieceType[] = ['straight', 'corner']
    if (pieceTypes >= 3) availableTypes.push('tee')
    if (pieceTypes >= 4) availableTypes.push('cross')
    
    // Initialize empty grid
    for (let i = 0; i < gridSize; i++) {
      const row: Piece[] = []
      for (let j = 0; j < gridSize; j++) {
        row.push({
          type: 'empty',
          rotation: 0,
          connections: [false, false, false, false],
          isConnected: false,
          isPath: false
        })
      }
      newGrid.push(row)
    }
    
    // Place start and end points
    const startRow = Math.floor(Math.random() * gridSize)
    const startCol = 0
    const endRow = Math.floor(Math.random() * gridSize)
    const endCol = gridSize - 1
    
    setStartPos([startRow, startCol])
    setEndPos([endRow, endCol])
    
    newGrid[startRow][startCol] = {
      type: 'start',
      rotation: 0,
      connections: rotateConnections(PIECE_CONFIGS.start, 0),
      isConnected: true,
      isPath: true
    }
    
    newGrid[endRow][endCol] = {
      type: 'end',
      rotation: 0,
      connections: rotateConnections(PIECE_CONFIGS.end, 0),
      isConnected: false,
      isPath: true
    }
    
    // Generate a solution path
    const path = generatePath(startRow, startCol, endRow, endCol, gridSize)
    
    // Place pieces along the path
    for (let i = 1; i < path.length - 1; i++) {
      const [row, col] = path[i]
      const prev = path[i - 1]
      const next = path[i + 1]
      
      // Determine required connections
      const connections = [false, false, false, false]
      if (prev[0] < row) connections[0] = true // top
      if (prev[1] > col) connections[1] = true // right
      if (prev[0] > row) connections[2] = true // bottom
      if (prev[1] < col) connections[3] = true // left
      
      if (next[0] < row) connections[0] = true // top
      if (next[1] > col) connections[1] = true // right
      if (next[0] > row) connections[2] = true // bottom
      if (next[1] < col) connections[3] = true // left
      
      // Select appropriate piece type
      const connectionCount = connections.filter(c => c).length
      let type: PieceType = 'straight'
      
      if (connectionCount === 2) {
        if ((connections[0] && connections[2]) || (connections[1] && connections[3])) {
          type = 'straight'
        } else {
          type = 'corner'
        }
      } else if (connectionCount === 3 && availableTypes.includes('tee')) {
        type = 'tee'
      } else if (connectionCount === 4 && availableTypes.includes('cross')) {
        type = 'cross'
      }
      
      newGrid[row][col] = {
        type,
        rotation: 0,
        connections: PIECE_CONFIGS[type],
        isConnected: false,
        isPath: true
      }
    }
    
    // Fill remaining cells with random pieces
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (newGrid[i][j].type === 'empty') {
          if (obstacles && Math.random() < 0.1) {
            newGrid[i][j] = {
              type: 'obstacle',
              rotation: 0,
              connections: [false, false, false, false],
              isConnected: false,
              isPath: false
            }
          } else if (Math.random() < 0.7) {
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
            newGrid[i][j] = {
              type,
              rotation: 0,
              connections: PIECE_CONFIGS[type],
              isConnected: false,
              isPath: false
            }
          }
        }
      }
    }
    
    // Randomly rotate all pieces (except start/end)
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (newGrid[i][j].type !== 'start' && 
            newGrid[i][j].type !== 'end' && 
            newGrid[i][j].type !== 'empty' &&
            newGrid[i][j].type !== 'obstacle') {
          const rotation = (Math.floor(Math.random() * 4) * 90) as Direction
          newGrid[i][j].rotation = rotation
          newGrid[i][j].connections = rotateConnections(PIECE_CONFIGS[newGrid[i][j].type], rotation)
        }
      }
    }
    
    return newGrid
  }, [gridSize, pieceTypes, obstacles])

  // Generate a path from start to end
  const generatePath = (startRow: number, startCol: number, endRow: number, endCol: number, size: number): [number, number][] => {
    const path: [number, number][] = [[startRow, startCol]]
    let currentRow = startRow
    let currentCol = startCol
    
    while (currentRow !== endRow || currentCol !== endCol) {
      const options: [number, number][] = []
      
      // Move towards the end
      if (currentRow < endRow && !path.some(([r, c]) => r === currentRow + 1 && c === currentCol)) {
        options.push([currentRow + 1, currentCol])
      }
      if (currentRow > endRow && !path.some(([r, c]) => r === currentRow - 1 && c === currentCol)) {
        options.push([currentRow - 1, currentCol])
      }
      if (currentCol < endCol && !path.some(([r, c]) => r === currentRow && c === currentCol + 1)) {
        options.push([currentRow, currentCol + 1])
      }
      if (currentCol > endCol && !path.some(([r, c]) => r === currentRow && c === currentCol - 1)) {
        options.push([currentRow, currentCol - 1])
      }
      
      // Add some randomness
      if (options.length === 0) {
        // If stuck, try any valid move
        const moves = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        for (const [dr, dc] of moves) {
          const newRow = currentRow + dr
          const newCol = currentCol + dc
          if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size &&
              !path.some(([r, c]) => r === newRow && c === newCol)) {
            options.push([newRow, newCol])
          }
        }
      }
      
      if (options.length > 0) {
        const next = options[Math.floor(Math.random() * options.length)]
        path.push(next)
        currentRow = next[0]
        currentCol = next[1]
      } else {
        // Backtrack if completely stuck
        path.pop()
        if (path.length > 0) {
          const prev = path[path.length - 1]
          currentRow = prev[0]
          currentCol = prev[1]
        } else {
          break
        }
      }
      
      // Prevent infinite loops
      if (path.length > size * size) break
    }
    
    return path
  }

  // Rotate a piece
  const rotatePiece = (row: number, col: number) => {
    if (!gameStarted || gameOver) return
    
    const piece = grid[row][col]
    if (piece.type === 'empty' || piece.type === 'start' || piece.type === 'end' || piece.type === 'obstacle') {
      return
    }
    
    const newGrid = [...grid]
    const newRotation = ((piece.rotation + 90) % 360) as Direction
    newGrid[row][col] = {
      ...piece,
      rotation: newRotation,
      connections: rotateConnections(PIECE_CONFIGS[piece.type], newRotation)
    }
    
    setGrid(newGrid)
    setRotations(rotations + 1)
    
    // Check if puzzle is solved
    checkSolution(newGrid)
  }

  // Check if the puzzle is solved
  const checkSolution = (currentGrid: Piece[][]) => {
    // Reset all connections
    const newGrid = currentGrid.map(row =>
      row.map(piece => ({ ...piece, isConnected: false }))
    )
    
    // Start from the start position
    const [startRow, startCol] = startPos
    newGrid[startRow][startCol].isConnected = true
    
    // BFS to find connected path
    const queue: [number, number][] = [[startRow, startCol]]
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const [row, col] = queue.shift()!
      const key = `${row},${col}`
      
      if (visited.has(key)) continue
      visited.add(key)
      
      const piece = newGrid[row][col]
      
      // Check all four directions
      const directions = [
        { dr: -1, dc: 0, myConn: 0, theirConn: 2 }, // top
        { dr: 0, dc: 1, myConn: 1, theirConn: 3 },  // right
        { dr: 1, dc: 0, myConn: 2, theirConn: 0 },  // bottom
        { dr: 0, dc: -1, myConn: 3, theirConn: 1 }  // left
      ]
      
      for (const { dr, dc, myConn, theirConn } of directions) {
        const newRow = row + dr
        const newCol = col + dc
        
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
          const neighbor = newGrid[newRow][newCol]
          
          if (piece.connections[myConn] && neighbor.connections[theirConn] && 
              neighbor.type !== 'obstacle' && neighbor.type !== 'empty') {
            if (!neighbor.isConnected) {
              neighbor.isConnected = true
              queue.push([newRow, newCol])
            }
          }
        }
      }
    }
    
    setGrid(newGrid)
    
    // Check if end is connected
    const [endRow, endCol] = endPos
    if (newGrid[endRow][endCol].isConnected) {
      setIsComplete(true)
      setGameOver(true)
      
      // Calculate score
      const timeBonus = timeLeft * 5
      const rotationPenalty = Math.max(0, rotations - targetRotations) * 10
      const finalScore = Math.max(0, 1000 + timeBonus - rotationPenalty)
      setScore(finalScore)
      onScore(finalScore)
    }
  }

  // Timer
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true)
      setScore(0)
    }
  }, [gameStarted, gameOver, timeLeft])

  const startGame = () => {
    const newGrid = generatePuzzle()
    setGrid(newGrid)
    setRotations(0)
    setScore(0)
    setTimeLeft(timeLimit)
    setGameStarted(true)
    setGameOver(false)
    setIsComplete(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPieceColor = (piece: Piece) => {
    if (piece.type === 'start') return 'bg-green-500'
    if (piece.type === 'end') return 'bg-red-500'
    if (piece.type === 'obstacle') return 'bg-gray-600'
    if (piece.type === 'empty') return 'bg-gray-200 dark:bg-gray-700'
    if (piece.isConnected) return 'bg-blue-500'
    if (piece.isPath) return 'bg-yellow-400'
    return 'bg-gray-400'
  }

  const renderPiece = (piece: Piece) => {
    if (piece.type === 'empty') return null
    if (piece.type === 'obstacle') return '▓'
    
    const style: React.CSSProperties = {
      transform: `rotate(${piece.rotation}deg)`,
      transition: 'transform 0.2s'
    }
    
    return (
      <div style={style} className="text-2xl font-bold">
        {PIECE_ICONS[piece.type]}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Rotate Puzzle</h3>
            <p className="text-sm text-muted-foreground">
              Rotations: {rotations} | Target: {targetRotations}
            </p>
            <p className="text-sm text-muted-foreground">
              Time: {formatTime(timeLeft)}
            </p>
          </div>
          
          {!gameStarted ? (
            <Button onClick={startGame} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button onClick={startGame} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Puzzle
            </Button>
          )}
        </div>

        {gameStarted && (
          <div className="relative">
            <div 
              className="grid gap-1 bg-gray-300 dark:bg-gray-700 p-2 rounded-lg mx-auto"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: 'fit-content'
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-12 h-12 rounded flex items-center justify-center ${getPieceColor(piece)} ${
                      piece.type !== 'empty' && piece.type !== 'start' && piece.type !== 'end' && piece.type !== 'obstacle'
                        ? 'hover:opacity-80 cursor-pointer'
                        : 'cursor-default'
                    }`}
                    onClick={() => rotatePiece(rowIndex, colIndex)}
                    whileHover={
                      piece.type !== 'empty' && piece.type !== 'start' && piece.type !== 'end' && piece.type !== 'obstacle'
                        ? { scale: 1.1 }
                        : {}
                    }
                    whileTap={
                      piece.type !== 'empty' && piece.type !== 'start' && piece.type !== 'end' && piece.type !== 'obstacle'
                        ? { scale: 0.95 }
                        : {}
                    }
                    initial={{ scale: 0, rotate: Math.random() * 360 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: (rowIndex * gridSize + colIndex) * 0.02 }}
                  >
                    {renderPiece(piece)}
                  </motion.button>
                ))
              )}
            </div>

            {gameOver && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
                >
                  <h2 className="text-2xl font-bold mb-2">
                    {isComplete ? 'Puzzle Complete!' : 'Time\'s Up!'}
                  </h2>
                  {isComplete && (
                    <>
                      <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-2" />
                      <p className="text-lg mb-2">Score: {score}</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Completed in {rotations} rotations
                      </p>
                    </>
                  )}
                  <Button onClick={startGame}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Click pieces to rotate them. Connect the green start to the red end!</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RotatePuzzleWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const maxScore = 1000 + (levelConfig.timeLimit * 5)
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 3
    if (percentage >= 50) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="rotate-puzzle"
      gameName="Rotate Puzzle"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <RotatePuzzle levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}