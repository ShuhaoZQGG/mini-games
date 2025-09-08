'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw } from 'lucide-react'

const GRAVITY = 0.6
const JUMP_STRENGTH = -10
const PIPE_WIDTH = 60
const PIPE_GAP = 150
const PIPE_SPEED = 3
const BIRD_SIZE = 30
const GAME_HEIGHT = 400
const GAME_WIDTH = 600

interface Pipe {
  x: number
  height: number
  passed: boolean
}

export default function FlappyBird() {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2)
  const [birdVelocity, setBirdVelocity] = useState(0)
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const gameRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const saved = localStorage.getItem('flappyBirdHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const jump = useCallback(() => {
    if (gameState === 'playing') {
      setBirdVelocity(JUMP_STRENGTH)
    } else if (gameState === 'waiting') {
      startGame()
    }
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setBirdY(GAME_HEIGHT / 2)
    setBirdVelocity(0)
    setPipes([{ x: GAME_WIDTH, height: Math.random() * 200 + 50, passed: false }])
    setScore(0)
  }

  const resetGame = () => {
    setGameState('waiting')
    setBirdY(GAME_HEIGHT / 2)
    setBirdVelocity(0)
    setPipes([])
    setScore(0)
  }

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    // Update bird position
    setBirdVelocity(v => v + GRAVITY)
    setBirdY(y => {
      const newY = y + birdVelocity
      // Check boundaries
      if (newY < 0 || newY > GAME_HEIGHT - BIRD_SIZE) {
        setGameState('gameOver')
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('flappyBirdHighScore', score.toString())
        }
        return y
      }
      return newY
    })

    // Update pipes
    setPipes(currentPipes => {
      let newPipes = currentPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      }))

      // Remove off-screen pipes
      newPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH)

      // Add new pipe
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 200) {
        newPipes.push({
          x: GAME_WIDTH,
          height: Math.random() * 200 + 50,
          passed: false
        })
      }

      // Check collisions and scoring
      newPipes.forEach(pipe => {
        const birdLeft = GAME_WIDTH / 2 - 50
        const birdRight = birdLeft + BIRD_SIZE
        const birdTop = birdY
        const birdBottom = birdY + BIRD_SIZE

        const pipeLeft = pipe.x
        const pipeRight = pipe.x + PIPE_WIDTH
        const pipeTop = pipe.height
        const pipeBottom = pipe.height + PIPE_GAP

        // Check collision
        if (
          birdRight > pipeLeft &&
          birdLeft < pipeRight &&
          (birdTop < pipeTop || birdBottom > pipeBottom)
        ) {
          setGameState('gameOver')
          if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('flappyBirdHighScore', score.toString())
          }
        }

        // Check if passed pipe for scoring
        if (!pipe.passed && pipeRight < birdLeft) {
          pipe.passed = true
          setScore(s => s + 1)
        }
      })

      return newPipes
    })
  }, [gameState, birdVelocity, birdY, score, highScore])

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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        jump()
      }
    }

    const handleClick = () => {
      jump()
    }

    window.addEventListener('keydown', handleKeyPress)
    if (gameRef.current) {
      gameRef.current.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (gameRef.current) {
        gameRef.current.removeEventListener('click', handleClick)
      }
    }
  }, [jump])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Flappy Bird</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Click or press Space to fly!
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
            ref={gameRef}
            className="relative mx-auto bg-sky-200 dark:bg-sky-800 overflow-hidden rounded-lg cursor-pointer"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Bird */}
            <div
              className="absolute bg-yellow-400 rounded-full z-10"
              style={{
                width: BIRD_SIZE,
                height: BIRD_SIZE,
                left: GAME_WIDTH / 2 - 50,
                top: birdY,
                transition: 'none'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs">
                🐦
              </div>
            </div>

            {/* Pipes */}
            {pipes.map((pipe, index) => (
              <div key={index}>
                {/* Top pipe */}
                <div
                  className="absolute bg-green-600 dark:bg-green-700"
                  style={{
                    width: PIPE_WIDTH,
                    height: pipe.height,
                    left: pipe.x,
                    top: 0
                  }}
                />
                {/* Bottom pipe */}
                <div
                  className="absolute bg-green-600 dark:bg-green-700"
                  style={{
                    width: PIPE_WIDTH,
                    height: GAME_HEIGHT - pipe.height - PIPE_GAP,
                    left: pipe.x,
                    top: pipe.height + PIPE_GAP
                  }}
                />
              </div>
            ))}

            {/* Game state overlays */}
            {gameState === 'waiting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Click to Start</h3>
                  <p>Press Space or Click to fly</p>
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
                Start Game
              </Button>
            )}
            {gameState === 'playing' && (
              <p className="text-gray-600 dark:text-gray-400">
                Keep clicking or pressing space to stay airborne!
              </p>
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