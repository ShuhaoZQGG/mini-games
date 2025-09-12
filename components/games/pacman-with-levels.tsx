'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'

const CELL_SIZE = 20
const MAZE_WIDTH = 19
const MAZE_HEIGHT = 21

// 0 = wall, 1 = dot, 2 = empty, 3 = power pellet, 4 = fruit
const MAZE_TEMPLATE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,3,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,3,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0],
  [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
  [0,0,0,0,1,0,1,0,0,2,0,0,1,0,1,0,0,0,0],
  [1,1,1,1,1,1,1,0,2,2,2,0,1,1,1,1,1,1,1],
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
  [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
  [0,3,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,3,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]

interface Position {
  x: number
  y: number
}

interface Ghost {
  position: Position
  color: string
  personality: 'blinky' | 'pinky' | 'inky' | 'clyde'
  isScared: boolean
  isEaten: boolean
  direction: Position
}

interface PacManGameProps {
  levelConfig: {
    ghostSpeed: number
    ghostCount: number
    pelletsToWin: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Maze',
    difficulty: 'easy',
    config: { ghostSpeed: 1, ghostCount: 4, pelletsToWin: 20 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Faster Ghosts',
    difficulty: 'medium',
    config: { ghostSpeed: 1.5, ghostCount: 4, pelletsToWin: 40 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Speed Challenge',
    difficulty: 'hard',
    config: { ghostSpeed: 2, ghostCount: 4, pelletsToWin: 60 },
    requiredStars: 4
  },
  {
    id: 4,
    name: 'Expert Chase',
    difficulty: 'expert',
    config: { ghostSpeed: 2.5, ghostCount: 4, pelletsToWin: 80 },
    requiredStars: 6
  },
  {
    id: 5,
    name: 'Master Mode',
    difficulty: 'master',
    config: { ghostSpeed: 3, ghostCount: 4, pelletsToWin: -1 }, // -1 means all pellets
    requiredStars: 8
  }
]

function PacManGame({ levelConfig, onScore }: PacManGameProps) {
  const [maze, setMaze] = useState<number[][]>([])
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 9, y: 15 })
  const [pacmanDirection, setPacmanDirection] = useState<Position>({ x: 0, y: 0 })
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver' | 'levelComplete'>('waiting')
  const [powerMode, setPowerMode] = useState(false)
  const [dotsEaten, setDotsEaten] = useState(0)
  const [totalDots, setTotalDots] = useState(0)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const powerModeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef(0)
  const nextDirectionRef = useRef<Position>({ x: 0, y: 0 })

  // Initialize maze
  const initializeMaze = useCallback(() => {
    const newMaze = MAZE_TEMPLATE.map(row => [...row])
    let dots = 0
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (newMaze[y][x] === 1 || newMaze[y][x] === 3) {
          dots++
        }
      }
    }
    setTotalDots(dots)
    return newMaze
  }, [])

  // Initialize ghosts based on level config
  const initializeGhosts = useCallback((): Ghost[] => {
    const allGhosts = [
      { position: { x: 9, y: 9 }, color: '#FF0000', personality: 'blinky' as const, isScared: false, isEaten: false, direction: { x: 0, y: -1 } },
      { position: { x: 8, y: 9 }, color: '#FFB6C1', personality: 'pinky' as const, isScared: false, isEaten: false, direction: { x: 1, y: 0 } },
      { position: { x: 10, y: 9 }, color: '#00FFFF', personality: 'inky' as const, isScared: false, isEaten: false, direction: { x: -1, y: 0 } },
      { position: { x: 9, y: 10 }, color: '#FFB347', personality: 'clyde' as const, isScared: false, isEaten: false, direction: { x: 0, y: 1 } }
    ]
    return allGhosts.slice(0, levelConfig.ghostCount)
  }, [levelConfig.ghostCount])

  // Check if position is valid
  const isValidPosition = useCallback((x: number, y: number) => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return false
    return maze[y] && maze[y][x] !== 0
  }, [maze])

  // Handle Pac-Man movement
  const movePacman = useCallback(() => {
    if (gameState !== 'playing') return

    let newX = pacmanPos.x + pacmanDirection.x
    let newY = pacmanPos.y + pacmanDirection.y

    // Tunnel wrapping
    if (newX < 0) newX = MAZE_WIDTH - 1
    if (newX >= MAZE_WIDTH) newX = 0

    if (isValidPosition(newX, newY)) {
      setPacmanPos({ x: newX, y: newY })

      // Check for dots
      const cell = maze[newY][newX]
      if (cell === 1 || cell === 3) {
        const newMaze = [...maze]
        newMaze[newY][newX] = 2
        setMaze(newMaze)
        setDotsEaten(dotsEaten + 1)
        
        if (cell === 1) {
          setScore(score + 10)
        } else if (cell === 3) {
          setScore(score + 50)
          setPowerMode(true)
          
          // Clear existing power mode timer
          if (powerModeTimerRef.current) {
            clearTimeout(powerModeTimerRef.current)
          }
          
          // Set power mode timer
          powerModeTimerRef.current = setTimeout(() => {
            setPowerMode(false)
          }, 5000)
          
          // Make ghosts scared
          setGhosts(ghosts.map(g => ({ ...g, isScared: true, isEaten: false })))
        }

        // Check win condition
        const pelletsNeeded = levelConfig.pelletsToWin === -1 ? totalDots : levelConfig.pelletsToWin
        if (dotsEaten + 1 >= pelletsNeeded) {
          setGameState('levelComplete')
          onScore(score + 10 + (lives * 100))
        }
      }
    }
  }, [gameState, pacmanPos, pacmanDirection, maze, isValidPosition, score, ghosts, powerMode, dotsEaten, totalDots, levelConfig.pelletsToWin, lives, onScore])

  // Move ghosts
  const moveGhosts = useCallback(() => {
    if (gameState !== 'playing') return

    setGhosts(prevGhosts => {
      return prevGhosts.map(ghost => {
        if (ghost.isEaten) return ghost

        const speed = ghost.isScared ? levelConfig.ghostSpeed * 0.5 : levelConfig.ghostSpeed
        
        // Simple AI: move randomly but avoid walls
        const directions = [
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: -1, y: 0 }
        ]
        
        const validDirections = directions.filter(dir => {
          const newX = ghost.position.x + dir.x
          const newY = ghost.position.y + dir.y
          return isValidPosition(newX, newY)
        })
        
        if (validDirections.length > 0 && Math.random() < speed / 10) {
          const newDir = validDirections[Math.floor(Math.random() * validDirections.length)]
          const newX = ghost.position.x + newDir.x
          const newY = ghost.position.y + newDir.y
          
          return {
            ...ghost,
            position: { x: newX, y: newY },
            direction: newDir
          }
        }
        
        return ghost
      })
    })
  }, [gameState, isValidPosition, levelConfig.ghostSpeed])

  // Check collisions
  const checkCollisions = useCallback(() => {
    ghosts.forEach(ghost => {
      if (ghost.position.x === pacmanPos.x && ghost.position.y === pacmanPos.y) {
        if (powerMode && !ghost.isEaten) {
          // Eat ghost
          setScore(score + 200)
          setGhosts(ghosts.map(g => 
            g.personality === ghost.personality 
              ? { ...g, isEaten: true, isScared: false }
              : g
          ))
        } else if (!ghost.isEaten) {
          // Lose life
          setLives(lives - 1)
          setPacmanPos({ x: 9, y: 15 })
          setPacmanDirection({ x: 0, y: 0 })
          
          if (lives <= 1) {
            setGameState('gameOver')
            onScore(score)
          }
        }
      }
    })
  }, [ghosts, pacmanPos, powerMode, score, lives, onScore])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        movePacman()
        moveGhosts()
        checkCollisions()
      }, 100)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, movePacman, moveGhosts, checkCollisions])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
          setPacmanDirection({ x: 0, y: -1 })
          break
        case 'ArrowDown':
          setPacmanDirection({ x: 0, y: 1 })
          break
        case 'ArrowLeft':
          setPacmanDirection({ x: -1, y: 0 })
          break
        case 'ArrowRight':
          setPacmanDirection({ x: 1, y: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState])

  // Start game
  const startGame = useCallback(() => {
    const newMaze = initializeMaze()
    setMaze(newMaze)
    setGhosts(initializeGhosts())
    setPacmanPos({ x: 9, y: 15 })
    setPacmanDirection({ x: 0, y: 0 })
    setScore(0)
    setLives(3)
    setDotsEaten(0)
    setPowerMode(false)
    setGameState('playing')
  }, [initializeMaze, initializeGhosts])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState('waiting')
    if (powerModeTimerRef.current) {
      clearTimeout(powerModeTimerRef.current)
    }
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div>Score: {score}</div>
            <div>Lives: {lives}</div>
            <div>Pellets: {dotsEaten}/{levelConfig.pelletsToWin === -1 ? totalDots : levelConfig.pelletsToWin}</div>
          </div>
          <div className="flex gap-2">
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {gameState === 'playing' && (
              <Button 
                onClick={() => setGameState('paused')} 
                size="sm"
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {gameState === 'paused' && (
              <Button 
                onClick={() => setGameState('playing')} 
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            {(gameState === 'gameOver' || gameState === 'levelComplete') && (
              <Button onClick={startGame} size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        <div 
          className="relative bg-black mx-auto"
          style={{
            width: MAZE_WIDTH * CELL_SIZE,
            height: MAZE_HEIGHT * CELL_SIZE
          }}
        >
          {/* Render maze */}
          {maze.map((row, y) => (
            row.map((cell, x) => {
              if (cell === 0) {
                return (
                  <div
                    key={`${x}-${y}`}
                    className="absolute bg-blue-900"
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE
                    }}
                  />
                )
              } else if (cell === 1) {
                return (
                  <div
                    key={`${x}-${y}`}
                    className="absolute"
                    style={{
                      left: x * CELL_SIZE + CELL_SIZE / 2 - 2,
                      top: y * CELL_SIZE + CELL_SIZE / 2 - 2,
                      width: 4,
                      height: 4,
                      backgroundColor: '#FFF',
                      borderRadius: '50%'
                    }}
                  />
                )
              } else if (cell === 3) {
                return (
                  <div
                    key={`${x}-${y}`}
                    className="absolute animate-pulse"
                    style={{
                      left: x * CELL_SIZE + CELL_SIZE / 2 - 5,
                      top: y * CELL_SIZE + CELL_SIZE / 2 - 5,
                      width: 10,
                      height: 10,
                      backgroundColor: '#FFF',
                      borderRadius: '50%'
                    }}
                  />
                )
              }
              return null
            })
          ))}

          {/* Render Pac-Man */}
          <div
            className="absolute transition-all duration-100"
            style={{
              left: pacmanPos.x * CELL_SIZE + 2,
              top: pacmanPos.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              backgroundColor: '#FFFF00',
              borderRadius: '50%',
              transform: `rotate(${
                pacmanDirection.x === 1 ? 0 :
                pacmanDirection.x === -1 ? 180 :
                pacmanDirection.y === 1 ? 90 :
                pacmanDirection.y === -1 ? 270 : 0
              }deg)`
            }}
          />

          {/* Render ghosts */}
          {ghosts.map((ghost, index) => (
            <div
              key={index}
              className="absolute transition-all duration-100"
              style={{
                left: ghost.position.x * CELL_SIZE + 2,
                top: ghost.position.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                backgroundColor: ghost.isScared ? '#0000FF' : ghost.isEaten ? 'transparent' : ghost.color,
                borderRadius: '40% 40% 0 0',
                opacity: ghost.isEaten ? 0.3 : 1
              }}
            />
          ))}
        </div>

        {gameState === 'gameOver' && (
          <div className="text-center mt-4 text-red-600 font-semibold">
            Game Over! Final Score: {score}
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="text-center mt-4 text-green-600 font-semibold">
            Level Complete! 🎉
          </div>
        )}

        <div className="text-center mt-4 text-sm text-gray-600">
          Use arrow keys to move
        </div>
      </CardContent>
    </Card>
  )
}

export default function PacManWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    // Scoring based on score and lives
    if (score >= 2000) return 3
    if (score >= 1000) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="pacman"
      gameName="Pac-Man"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <PacManGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}