'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

export default function PacManGame() {
  const [maze, setMaze] = useState<number[][]>([])
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 9, y: 15 })
  const [pacmanDirection, setPacmanDirection] = useState<Position>({ x: 0, y: 0 })
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver' | 'levelComplete'>('waiting')
  const [powerMode, setPowerMode] = useState(false)
  const [level, setLevel] = useState(1)
  const [dotCount, setDotCount] = useState(0)
  
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const powerModeTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
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
    setDotCount(dots)
    return newMaze
  }, [])

  // Initialize ghosts
  const initializeGhosts = useCallback((): Ghost[] => {
    return [
      { position: { x: 9, y: 9 }, color: '#FF0000', personality: 'blinky', isScared: false, isEaten: false, direction: { x: 0, y: -1 } },
      { position: { x: 8, y: 9 }, color: '#FFB6C1', personality: 'pinky', isScared: false, isEaten: false, direction: { x: 1, y: 0 } },
      { position: { x: 10, y: 9 }, color: '#00FFFF', personality: 'inky', isScared: false, isEaten: false, direction: { x: -1, y: 0 } },
      { position: { x: 9, y: 10 }, color: '#FFB347', personality: 'clyde', isScared: false, isEaten: false, direction: { x: 0, y: 1 } }
    ]
  }, [])

  // Check if position is valid
  const isValidPosition = useCallback((x: number, y: number) => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return false
    return maze[y] && maze[y][x] !== 0
  }, [maze])

  // Handle Pac-Man movement
  const movePacman = useCallback(() => {
    if (gameState !== 'playing') return

    // Check if next direction is valid
    const nextX = pacmanPos.x + nextDirectionRef.current.x
    const nextY = pacmanPos.y + nextDirectionRef.current.y
    
    if (isValidPosition(nextX, nextY)) {
      setPacmanDirection(nextDirectionRef.current)
    }

    // Move in current direction
    const newX = pacmanPos.x + pacmanDirection.x
    const newY = pacmanPos.y + pacmanDirection.y

    if (isValidPosition(newX, newY)) {
      setPacmanPos({ x: newX, y: newY })

      // Check for dots/pellets
      setMaze(currentMaze => {
        const newMaze = [...currentMaze]
        const cell = newMaze[newY][newX]
        
        if (cell === 1) {
          newMaze[newY][newX] = 2
          setScore(prev => prev + 10)
          setDotCount(prev => prev - 1)
        } else if (cell === 3) {
          newMaze[newY][newX] = 2
          setScore(prev => prev + 50)
          setDotCount(prev => prev - 1)
          activatePowerMode()
        }
        
        return newMaze
      })
    }
  }, [pacmanPos, pacmanDirection, gameState, isValidPosition])

  // Activate power mode
  const activatePowerMode = useCallback(() => {
    setPowerMode(true)
    setGhosts(currentGhosts => 
      currentGhosts.map(ghost => ({ ...ghost, isScared: !ghost.isEaten }))
    )
    
    if (powerModeTimerRef.current) {
      clearTimeout(powerModeTimerRef.current)
    }
    
    powerModeTimerRef.current = setTimeout(() => {
      setPowerMode(false)
      setGhosts(currentGhosts => 
        currentGhosts.map(ghost => ({ ...ghost, isScared: false }))
      )
    }, 8000)
  }, [])

  // Ghost AI movement
  const moveGhosts = useCallback(() => {
    if (gameState !== 'playing') return

    setGhosts(currentGhosts => {
      return currentGhosts.map(ghost => {
        let newGhost = { ...ghost }
        
        // If eaten, move back to center
        if (ghost.isEaten) {
          const centerX = 9
          const centerY = 9
          if (ghost.position.x === centerX && ghost.position.y === centerY) {
            newGhost.isEaten = false
            newGhost.isScared = false
          } else {
            // Move towards center
            const dx = centerX - ghost.position.x
            const dy = centerY - ghost.position.y
            newGhost.direction = { 
              x: dx === 0 ? 0 : dx > 0 ? 1 : -1,
              y: dy === 0 ? 0 : dy > 0 ? 1 : -1
            }
          }
        } else if (ghost.isScared) {
          // Random movement when scared
          const directions = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
          ]
          const validDirections = directions.filter(dir => 
            isValidPosition(ghost.position.x + dir.x, ghost.position.y + dir.y)
          )
          if (validDirections.length > 0) {
            newGhost.direction = validDirections[Math.floor(Math.random() * validDirections.length)]
          }
        } else {
          // Normal ghost AI based on personality
          let targetX = pacmanPos.x
          let targetY = pacmanPos.y
          
          switch (ghost.personality) {
            case 'blinky': // Direct chase
              break
            case 'pinky': // Ambush - target ahead of Pac-Man
              targetX += pacmanDirection.x * 4
              targetY += pacmanDirection.y * 4
              break
            case 'inky': // Flanking
              targetX += pacmanDirection.x * 2
              targetY += pacmanDirection.y * 2
              break
            case 'clyde': // Random/shy
              const distance = Math.sqrt(
                Math.pow(ghost.position.x - pacmanPos.x, 2) + 
                Math.pow(ghost.position.y - pacmanPos.y, 2)
              )
              if (distance < 5) {
                targetX = 0
                targetY = MAZE_HEIGHT - 1
              }
              break
          }
          
          // Find best direction towards target
          const directions = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
          ].filter(dir => 
            // Don't reverse direction
            !(dir.x === -ghost.direction.x && dir.y === -ghost.direction.y) &&
            isValidPosition(ghost.position.x + dir.x, ghost.position.y + dir.y)
          )
          
          if (directions.length > 0) {
            const bestDirection = directions.reduce((best, dir) => {
              const distCurrent = Math.sqrt(
                Math.pow(ghost.position.x + dir.x - targetX, 2) + 
                Math.pow(ghost.position.y + dir.y - targetY, 2)
              )
              const distBest = Math.sqrt(
                Math.pow(ghost.position.x + best.x - targetX, 2) + 
                Math.pow(ghost.position.y + best.y - targetY, 2)
              )
              return distCurrent < distBest ? dir : best
            }, directions[0])
            
            newGhost.direction = bestDirection
          }
        }
        
        // Move ghost
        const newX = ghost.position.x + newGhost.direction.x
        const newY = ghost.position.y + newGhost.direction.y
        
        if (isValidPosition(newX, newY)) {
          newGhost.position = { x: newX, y: newY }
        }
        
        return newGhost
      })
    })
  }, [pacmanPos, pacmanDirection, gameState, isValidPosition])

  // Check collisions
  const checkCollisions = useCallback(() => {
    ghosts.forEach(ghost => {
      if (ghost.position.x === pacmanPos.x && ghost.position.y === pacmanPos.y) {
        if (ghost.isScared && !ghost.isEaten) {
          // Eat ghost
          setGhosts(currentGhosts => 
            currentGhosts.map(g => 
              g.personality === ghost.personality 
                ? { ...g, isEaten: true, isScared: false }
                : g
            )
          )
          setScore(prev => prev + 200)
        } else if (!ghost.isEaten) {
          // Pac-Man dies
          setLives(prev => {
            const newLives = prev - 1
            if (newLives <= 0) {
              setGameState('gameOver')
            } else {
              // Reset positions
              setPacmanPos({ x: 9, y: 15 })
              setPacmanDirection({ x: 0, y: 0 })
              setGhosts(initializeGhosts())
            }
            return newLives
          })
        }
      }
    })
  }, [ghosts, pacmanPos, initializeGhosts])

  // Check win condition
  useEffect(() => {
    if (dotCount === 0 && gameState === 'playing') {
      setGameState('levelComplete')
      setTimeout(() => {
        setLevel(prev => prev + 1)
        const newMaze = initializeMaze()
        setMaze(newMaze)
        setPacmanPos({ x: 9, y: 15 })
        setPacmanDirection({ x: 0, y: 0 })
        setGhosts(initializeGhosts())
        setGameState('playing')
      }, 2000)
    }
  }, [dotCount, gameState, initializeMaze, initializeGhosts])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        animationFrameRef.current++
        
        // Move Pac-Man every frame
        if (animationFrameRef.current % 2 === 0) {
          movePacman()
        }
        
        // Move ghosts slightly slower
        if (animationFrameRef.current % 3 === 0) {
          moveGhosts()
        }
        
        // Check collisions
        checkCollisions()
      }, 100 - (level * 5))
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, level, movePacman, moveGhosts, checkCollisions])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault()
          nextDirectionRef.current = { x: 0, y: -1 }
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault()
          nextDirectionRef.current = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          nextDirectionRef.current = { x: -1, y: 0 }
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          nextDirectionRef.current = { x: 1, y: 0 }
          break
        case ' ':
          e.preventDefault()
          if (gameState === 'playing') {
            setGameState('paused')
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState])

  // Touch controls
  const handleTouchDirection = (direction: Position) => {
    if (gameState === 'playing') {
      nextDirectionRef.current = direction
    }
  }

  const startGame = () => {
    const newMaze = initializeMaze()
    setMaze(newMaze)
    setPacmanPos({ x: 9, y: 15 })
    setPacmanDirection({ x: 0, y: 0 })
    nextDirectionRef.current = { x: 0, y: 0 }
    setGhosts(initializeGhosts())
    setScore(0)
    setLives(3)
    setLevel(1)
    setPowerMode(false)
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
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
    if (powerModeTimerRef.current) {
      clearTimeout(powerModeTimerRef.current)
    }
  }

  // Save high score
  useEffect(() => {
    if (gameState === 'gameOver') {
      const highScore = localStorage.getItem('pacman-high-score')
      if (!highScore || score > parseInt(highScore)) {
        localStorage.setItem('pacman-high-score', score.toString())
      }
    }
  }, [gameState, score])

  const highScore = typeof window !== 'undefined' 
    ? localStorage.getItem('pacman-high-score') || '0'
    : '0'

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <Card className="p-6">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="text-lg font-semibold">
              Score: {score} | High Score: {highScore}
            </div>
            <div className="text-lg font-semibold">
              Level: {level} | Lives: {'❤️'.repeat(Math.max(0, lives))}
            </div>
          </div>

          <div 
            className="relative bg-black border-2 border-gray-600 rounded"
            style={{
              width: MAZE_WIDTH * CELL_SIZE,
              height: MAZE_HEIGHT * CELL_SIZE
            }}
          >
            {/* Render maze */}
            {maze.map((row, y) => 
              row.map((cell, x) => {
                if (cell === 0) {
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="absolute bg-blue-800"
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
                      className="absolute flex items-center justify-center"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE
                      }}
                    >
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  )
                } else if (cell === 3) {
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="absolute flex items-center justify-center"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE
                      }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )
                }
                return null
              })
            )}

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
                  backgroundColor: ghost.isEaten ? 'transparent' : (ghost.isScared ? '#0000FF' : ghost.color),
                  borderRadius: '50% 50% 0 0',
                  opacity: ghost.isEaten ? 0.3 : 1
                }}
              >
                {!ghost.isEaten && (
                  <>
                    <div className="absolute flex gap-1 top-1 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-white rounded-full" />
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Render Pac-Man */}
            <div
              className="absolute bg-yellow-400 rounded-full transition-all duration-100"
              style={{
                left: pacmanPos.x * CELL_SIZE + 2,
                top: pacmanPos.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                transform: `rotate(${
                  pacmanDirection.x === 1 ? 0 :
                  pacmanDirection.x === -1 ? 180 :
                  pacmanDirection.y === 1 ? 90 :
                  pacmanDirection.y === -1 ? 270 : 0
                }deg)`,
                clipPath: animationFrameRef.current % 4 < 2 
                  ? 'polygon(100% 50%, 50% 50%, 0 0, 0 100%, 50% 50%)'
                  : 'circle(50%)'
              }}
            />

            {/* Game over overlay */}
            {gameState === 'gameOver' && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">GAME OVER</div>
              </div>
            )}

            {/* Level complete overlay */}
            {gameState === 'levelComplete' && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">LEVEL COMPLETE!</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-4">
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
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </>
            )}
            {gameState === 'gameOver' && (
              <Button onClick={startGame} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            )}
          </div>

          {/* Touch controls for mobile */}
          <div className="grid grid-cols-3 gap-2 md:hidden mt-4">
            <div />
            <Button 
              size="sm" 
              onClick={() => handleTouchDirection({ x: 0, y: -1 })}
              className="touch-none"
            >
              ↑
            </Button>
            <div />
            <Button 
              size="sm" 
              onClick={() => handleTouchDirection({ x: -1, y: 0 })}
              className="touch-none"
            >
              ←
            </Button>
            <div />
            <Button 
              size="sm" 
              onClick={() => handleTouchDirection({ x: 1, y: 0 })}
              className="touch-none"
            >
              →
            </Button>
            <div />
            <Button 
              size="sm" 
              onClick={() => handleTouchDirection({ x: 0, y: 1 })}
              className="touch-none"
            >
              ↓
            </Button>
            <div />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Use arrow keys or WASD to move. Space to pause.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}