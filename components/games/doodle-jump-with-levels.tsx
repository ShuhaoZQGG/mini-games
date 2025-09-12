'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw } from 'lucide-react'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const DOODLE_SIZE = 40
const PLATFORM_WIDTH = 60
const PLATFORM_HEIGHT = 10
const GRAVITY = 0.5
const MOVE_SPEED = 5

interface Platform {
  x: number
  y: number
  type: 'normal' | 'moving' | 'breaking' | 'spring'
  vx?: number
  broken?: boolean
  hasSpring?: boolean
}

interface DoodleJumpGameProps {
  levelConfig: {
    targetScore: number
    jumpStrength: number
    platformSpacing: number
    movingPlatformSpeed: number
    specialPlatformChance: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Jumper',
    difficulty: 'easy',
    config: { 
      targetScore: 1000, 
      jumpStrength: -15, 
      platformSpacing: 60, 
      movingPlatformSpeed: 1,
      specialPlatformChance: 0.1 
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Sky Explorer',
    difficulty: 'medium',
    config: { 
      targetScore: 2500, 
      jumpStrength: -14, 
      platformSpacing: 70, 
      movingPlatformSpeed: 1.5,
      specialPlatformChance: 0.2 
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Cloud Hopper',
    difficulty: 'hard',
    config: { 
      targetScore: 5000, 
      jumpStrength: -13, 
      platformSpacing: 80, 
      movingPlatformSpeed: 2,
      specialPlatformChance: 0.3 
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Atmosphere Climber',
    difficulty: 'expert',
    config: { 
      targetScore: 8000, 
      jumpStrength: -12, 
      platformSpacing: 90, 
      movingPlatformSpeed: 2.5,
      specialPlatformChance: 0.4 
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Space Jumper',
    difficulty: 'master',
    config: { 
      targetScore: 12000, 
      jumpStrength: -11, 
      platformSpacing: 100, 
      movingPlatformSpeed: 3,
      specialPlatformChance: 0.5 
    },
    requiredStars: 12
  }
]

function DoodleJumpGame({ levelConfig, onScore }: DoodleJumpGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [doodleX, setDoodleX] = useState(GAME_WIDTH / 2 - DOODLE_SIZE / 2)
  const [doodleY, setDoodleY] = useState(GAME_HEIGHT - 100)
  const [doodleVY, setDoodleVY] = useState(0)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [score, setScore] = useState(0)
  const [cameraY, setCameraY] = useState(0)
  const [keys, setKeys] = useState({ left: false, right: false })
  const animationRef = useRef<number | undefined>(undefined)

  const generatePlatforms = useCallback((startY: number, count: number) => {
    const newPlatforms: Platform[] = []
    for (let i = 0; i < count; i++) {
      const rand = Math.random()
      let type: 'normal' | 'moving' | 'breaking' | 'spring' = 'normal'
      let hasSpring = false
      
      if (rand < levelConfig.specialPlatformChance) {
        const specialRand = Math.random()
        if (specialRand < 0.33) {
          type = 'moving'
        } else if (specialRand < 0.66) {
          type = 'breaking'
        } else {
          type = 'normal'
          hasSpring = true
        }
      }
      
      newPlatforms.push({
        x: Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
        y: startY - i * levelConfig.platformSpacing - Math.random() * 40,
        type,
        vx: type === 'moving' ? levelConfig.movingPlatformSpeed : 0,
        hasSpring
      })
    }
    return newPlatforms
  }, [levelConfig])

  const startGame = useCallback(() => {
    setGameState('playing')
    setDoodleX(GAME_WIDTH / 2 - DOODLE_SIZE / 2)
    setDoodleY(GAME_HEIGHT - 100)
    setDoodleVY(levelConfig.jumpStrength)
    setCameraY(0)
    setScore(0)
    
    const initialPlatforms = [
      { x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2, y: GAME_HEIGHT - 50, type: 'normal' as const },
      ...generatePlatforms(GAME_HEIGHT - 150, 20)
    ]
    setPlatforms(initialPlatforms)
  }, [levelConfig, generatePlatforms])

  const resetGame = useCallback(() => {
    setGameState('waiting')
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    // Update doodle position
    let newDoodleX = doodleX
    let newDoodleY = doodleY
    let newDoodleVY = doodleVY + GRAVITY

    // Handle movement
    if (keys.left) {
      newDoodleX -= MOVE_SPEED
      if (newDoodleX < -DOODLE_SIZE) newDoodleX = GAME_WIDTH
    }
    if (keys.right) {
      newDoodleX += MOVE_SPEED
      if (newDoodleX > GAME_WIDTH) newDoodleX = -DOODLE_SIZE
    }

    newDoodleY += newDoodleVY

    // Check platform collisions
    let hasJumped = false
    if (newDoodleVY > 0) { // Only check when falling
      platforms.forEach(platform => {
        if (!platform.broken &&
            newDoodleX < platform.x + PLATFORM_WIDTH &&
            newDoodleX + DOODLE_SIZE > platform.x &&
            newDoodleY < platform.y + PLATFORM_HEIGHT &&
            newDoodleY + DOODLE_SIZE > platform.y &&
            doodleY + DOODLE_SIZE <= platform.y) {
          
          if (platform.type === 'breaking') {
            platform.broken = true
          } else {
            newDoodleVY = platform.hasSpring ? levelConfig.jumpStrength * 1.5 : levelConfig.jumpStrength
            hasJumped = true
            
            // Update score based on height
            const heightScore = Math.floor(Math.abs(cameraY) / 10)
            if (heightScore > score) {
              setScore(heightScore)
            }
          }
        }
      })
    }

    // Update camera when doodle goes high
    let newCameraY = cameraY
    if (newDoodleY < GAME_HEIGHT / 2) {
      const diff = GAME_HEIGHT / 2 - newDoodleY
      newCameraY -= diff
      newDoodleY = GAME_HEIGHT / 2
      
      // Move platforms down
      setPlatforms(prevPlatforms => {
        const movedPlatforms = prevPlatforms.map(p => ({
          ...p,
          y: p.y + diff
        })).filter(p => p.y < GAME_HEIGHT + 100)
        
        // Generate new platforms at the top
        if (movedPlatforms.length < 15) {
          const topY = Math.min(...movedPlatforms.map(p => p.y))
          const newPlats = generatePlatforms(topY, 10)
          return [...movedPlatforms, ...newPlats]
        }
        
        return movedPlatforms
      })
    }

    // Update moving platforms
    setPlatforms(prevPlatforms => 
      prevPlatforms.map(platform => {
        if (platform.type === 'moving' && platform.vx) {
          let newX = platform.x + platform.vx
          let newVX = platform.vx
          
          if (newX <= 0 || newX >= GAME_WIDTH - PLATFORM_WIDTH) {
            newVX = -newVX
            newX = Math.max(0, Math.min(GAME_WIDTH - PLATFORM_WIDTH, newX))
          }
          
          return { ...platform, x: newX, vx: newVX }
        }
        return platform
      })
    )

    // Check game over
    if (newDoodleY > GAME_HEIGHT) {
      setGameState('gameOver')
      onScore(score)
      return
    }

    // Check level complete
    if (score >= levelConfig.targetScore) {
      setGameState('gameOver')
      onScore(score)
      return
    }

    setDoodleX(newDoodleX)
    setDoodleY(newDoodleY)
    setDoodleVY(newDoodleVY)
    setCameraY(newCameraY)

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, doodleX, doodleY, doodleVY, platforms, score, cameraY, keys, levelConfig, generatePlatforms, onScore])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setKeys(prev => ({ ...prev, left: true }))
      if (e.key === 'ArrowRight') setKeys(prev => ({ ...prev, right: true }))
      if (e.key === ' ' && gameState === 'waiting') startGame()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setKeys(prev => ({ ...prev, left: false }))
      if (e.key === 'ArrowRight') setKeys(prev => ({ ...prev, right: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, startGame])

  // Touch controls for mobile
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (gameState !== 'playing') return
      const touch = e.touches[0]
      const rect = document.getElementById('game-area')?.getBoundingClientRect()
      if (rect) {
        const x = touch.clientX - rect.left
        setKeys({
          left: x < GAME_WIDTH / 2,
          right: x >= GAME_WIDTH / 2
        })
      }
    }

    const handleTouchEnd = () => {
      setKeys({ left: false, right: false })
    }

    window.addEventListener('touchstart', handleTouch)
    window.addEventListener('touchmove', handleTouch)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouch)
      window.removeEventListener('touchmove', handleTouch)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  if (gameState === 'waiting') {
    return (
      <Card className="bg-white/10 backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Doodle Jump</h2>
            <p className="text-gray-300">
              Target Score: {levelConfig.targetScore} | Platform Spacing: {levelConfig.platformSpacing}px
            </p>
            <p className="text-gray-300 text-sm">
              Use arrow keys to move, jump on platforms to go higher!
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score Display */}
      <div className="flex justify-between w-full max-w-[400px] text-white">
        <span>Score: {score}</span>
        <span>Target: {levelConfig.targetScore}</span>
      </div>

      {/* Game Area */}
      <div 
        id="game-area"
        className="relative bg-gradient-to-b from-sky-200 to-sky-400 overflow-hidden"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Platforms */}
        {platforms.map((platform, index) => (
          <div
            key={index}
            className={`absolute ${
              platform.type === 'normal' ? 'bg-green-500' :
              platform.type === 'moving' ? 'bg-blue-500' :
              platform.type === 'breaking' ? (platform.broken ? 'opacity-50 bg-red-800' : 'bg-red-500') :
              'bg-green-500'
            }`}
            style={{
              left: platform.x,
              top: platform.y,
              width: PLATFORM_WIDTH,
              height: PLATFORM_HEIGHT,
            }}
          >
            {platform.hasSpring && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-yellow-400 rounded-t-full" />
            )}
          </div>
        ))}

        {/* Doodle */}
        <div
          className="absolute bg-yellow-400 rounded-full"
          style={{
            left: doodleX,
            top: doodleY,
            width: DOODLE_SIZE,
            height: DOODLE_SIZE,
          }}
        >
          {/* Simple face */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-black rounded-full" />
        </div>

        {/* Game Over Overlay */}
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Card className="bg-white/90">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold">
                    {score >= levelConfig.targetScore ? 'Level Complete!' : 'Game Over!'}
                  </h3>
                  <p className="text-gray-700">Final Score: {score}</p>
                  <div className="flex gap-2">
                    <Button onClick={startGame} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </Button>
                    <Button onClick={resetGame} variant="outline">
                      Back to Menu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <p className="text-gray-300 text-sm text-center">
        Use ← → arrow keys or touch left/right side to move
      </p>
    </div>
  )
}

export default function DoodleJumpWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="doodle-jump"
      gameName="Doodle Jump"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <DoodleJumpGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}