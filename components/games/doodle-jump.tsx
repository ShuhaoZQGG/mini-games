'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw } from 'lucide-react'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const DOODLE_SIZE = 40
const PLATFORM_WIDTH = 60
const PLATFORM_HEIGHT = 10
const GRAVITY = 0.5
const JUMP_STRENGTH = -15
const MOVE_SPEED = 5

interface Platform {
  x: number
  y: number
  type: 'normal' | 'moving' | 'breaking'
  vx?: number
  broken?: boolean
}

export default function DoodleJump() {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [doodleX, setDoodleX] = useState(GAME_WIDTH / 2 - DOODLE_SIZE / 2)
  const [doodleY, setDoodleY] = useState(GAME_HEIGHT - 100)
  const [doodleVY, setDoodleVY] = useState(0)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [cameraY, setCameraY] = useState(0)
  const [keys, setKeys] = useState({ left: false, right: false })
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const saved = localStorage.getItem('doodleJumpHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const generatePlatforms = (startY: number, count: number) => {
    const newPlatforms: Platform[] = []
    for (let i = 0; i < count; i++) {
      const type = Math.random() < 0.7 ? 'normal' : 
                   Math.random() < 0.5 ? 'moving' : 'breaking'
      newPlatforms.push({
        x: Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
        y: startY - i * 80 - Math.random() * 40,
        type,
        vx: type === 'moving' ? (Math.random() - 0.5) * 2 : 0
      })
    }
    return newPlatforms
  }

  const startGame = () => {
    setDoodleX(GAME_WIDTH / 2 - DOODLE_SIZE / 2)
    setDoodleY(GAME_HEIGHT - 100)
    setDoodleVY(-JUMP_STRENGTH)
    setPlatforms([
      { x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2, y: GAME_HEIGHT - 50, type: 'normal' },
      ...generatePlatforms(GAME_HEIGHT - 150, 10)
    ])
    setScore(0)
    setCameraY(0)
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('waiting')
    setDoodleX(GAME_WIDTH / 2 - DOODLE_SIZE / 2)
    setDoodleY(GAME_HEIGHT - 100)
    setDoodleVY(0)
    setPlatforms([])
    setScore(0)
    setCameraY(0)
  }

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    // Update doodle horizontal movement
    setDoodleX(x => {
      let newX = x
      if (keys.left) newX -= MOVE_SPEED
      if (keys.right) newX += MOVE_SPEED
      
      // Wrap around screen
      if (newX < -DOODLE_SIZE) newX = GAME_WIDTH
      if (newX > GAME_WIDTH) newX = -DOODLE_SIZE
      
      return newX
    })

    // Update doodle vertical movement
    setDoodleVY(vy => vy + GRAVITY)
    setDoodleY(y => {
      const newY = y + doodleVY
      
      // Check for game over (fell below screen)
      if (newY > GAME_HEIGHT + cameraY) {
        setGameState('gameOver')
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('doodleJumpHighScore', score.toString())
        }
      }
      
      return newY
    })

    // Update platforms
    setPlatforms(currentPlatforms => {
      const updated = currentPlatforms.map(platform => {
        if (platform.type === 'moving' && platform.vx) {
          let newX = platform.x + platform.vx
          if (newX < 0 || newX > GAME_WIDTH - PLATFORM_WIDTH) {
            platform.vx = -platform.vx
          }
          return { ...platform, x: newX }
        }
        return platform
      })

      // Check collisions with platforms
      updated.forEach(platform => {
        if (!platform.broken &&
            doodleVY > 0 && // Only when falling
            doodleX < platform.x + PLATFORM_WIDTH &&
            doodleX + DOODLE_SIZE > platform.x &&
            doodleY < platform.y + PLATFORM_HEIGHT &&
            doodleY + DOODLE_SIZE > platform.y) {
          
          if (platform.type === 'breaking') {
            platform.broken = true
          } else {
            setDoodleVY(-JUMP_STRENGTH)
          }
        }
      })

      // Remove platforms below screen and add new ones above
      const filtered = updated.filter(p => p.y > cameraY - 100)
      
      // Add new platforms if needed
      if (filtered.length < 15) {
        const topPlatform = Math.min(...filtered.map(p => p.y))
        filtered.push(...generatePlatforms(topPlatform, 5))
      }
      
      return filtered
    })

    // Update camera and score
    if (doodleY < cameraY + 200) {
      const diff = cameraY - doodleY + 200
      setCameraY(prev => prev - diff)
      setScore(prev => Math.max(prev, Math.floor(Math.abs(cameraY) / 10)))
    }
  }, [gameState, doodleVY, doodleY, keys, cameraY, score, highScore, doodleX])

  useEffect(() => {
    if (gameState === 'playing') {
      const animate = () => {
        gameLoop()
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setKeys(prev => ({ ...prev, left: true }))
      if (e.key === 'ArrowRight') setKeys(prev => ({ ...prev, right: true }))
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
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Doodle Jump</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Use arrow keys to jump higher!
            </p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">
              Score: <span className="text-blue-600">{score}</span>
            </div>
            <div className="text-lg font-semibold">
              High Score: <span className="text-green-600">{highScore}</span>
            </div>
          </div>

          <div 
            className="relative mx-auto bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800 overflow-hidden rounded-lg"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Doodle */}
            <div
              className="absolute bg-green-500 rounded-full z-10"
              style={{
                width: DOODLE_SIZE,
                height: DOODLE_SIZE,
                left: doodleX,
                bottom: GAME_HEIGHT - doodleY + cameraY,
                transition: 'none'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
                😊
              </div>
            </div>

            {/* Platforms */}
            {platforms.map((platform, index) => (
              !platform.broken && (
                <div
                  key={index}
                  className={`absolute ${
                    platform.type === 'normal' ? 'bg-green-600' :
                    platform.type === 'moving' ? 'bg-blue-600' :
                    'bg-red-600'
                  } rounded`}
                  style={{
                    width: PLATFORM_WIDTH,
                    height: PLATFORM_HEIGHT,
                    left: platform.x,
                    bottom: GAME_HEIGHT - platform.y + cameraY
                  }}
                />
              )
            ))}

            {/* Game state overlays */}
            {gameState === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Doodle Jump</h3>
                  <p className="mb-2">Jump as high as you can!</p>
                  <p className="mb-4 text-sm">Use ← → arrow keys to move</p>
                  <Button onClick={startGame} variant="secondary">
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                  <p className="mb-4">Final Score: {score}</p>
                  <Button onClick={resetGame} variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Jumping
              </Button>
            )}
            {gameState === 'playing' && (
              <div className="text-gray-600 dark:text-gray-400">
                <p>← → Arrow keys to move</p>
                <p className="text-sm mt-1">
                  Green = Normal | Blue = Moving | Red = Breaking
                </p>
              </div>
            )}
            {gameState === 'gameOver' && (
              <Button onClick={resetGame} size="lg">
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}