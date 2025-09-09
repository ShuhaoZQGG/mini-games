'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw } from 'lucide-react'

const GRAVITY = 0.6
const JUMP_STRENGTH = -10
const PIPE_WIDTH = 60
const BIRD_SIZE = 30
const GAME_HEIGHT = 400
const GAME_WIDTH = 600

interface Pipe {
  x: number
  height: number
  passed: boolean
}

interface FlappyBirdGameProps {
  levelConfig: {
    targetScore: number
    pipeGap: number
    pipeSpeed: number
    pipeSpacing: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Flight',
    difficulty: 'easy',
    config: { targetScore: 5, pipeGap: 180, pipeSpeed: 2.5, pipeSpacing: 250 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Normal Flight',
    difficulty: 'medium',
    config: { targetScore: 10, pipeGap: 150, pipeSpeed: 3, pipeSpacing: 220 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Challenging Sky',
    difficulty: 'hard',
    config: { targetScore: 15, pipeGap: 130, pipeSpeed: 3.5, pipeSpacing: 200 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Pilot',
    difficulty: 'expert',
    config: { targetScore: 20, pipeGap: 110, pipeSpeed: 4, pipeSpacing: 180 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Aviator',
    difficulty: 'master',
    config: { targetScore: 30, pipeGap: 90, pipeSpeed: 4.5, pipeSpacing: 160 },
    requiredStars: 12
  }
]

function FlappyBirdGame({ levelConfig, onScore }: FlappyBirdGameProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting')
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2)
  const [birdVelocity, setBirdVelocity] = useState(0)
  const [pipes, setPipes] = useState<Pipe[]>([])
  const [score, setScore] = useState(0)
  const gameRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)

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
        onScore(score)
        return y
      }
      return newY
    })

    // Update pipes
    setPipes(currentPipes => {
      let newPipes = currentPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - levelConfig.pipeSpeed
      }))

      // Remove off-screen pipes
      newPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH)

      // Add new pipe
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - levelConfig.pipeSpacing) {
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
        const pipeBottom = pipe.height + levelConfig.pipeGap

        // Check collision
        if (
          birdRight > pipeLeft &&
          birdLeft < pipeRight &&
          (birdTop < pipeTop || birdBottom > pipeBottom)
        ) {
          setGameState('gameOver')
          onScore(score)
        }

        // Check if passed pipe for scoring
        if (!pipe.passed && pipeRight < birdLeft) {
          pipe.passed = true
          setScore(s => s + 1)
        }
      })

      return newPipes
    })
  }, [gameState, birdVelocity, birdY, score, onScore, levelConfig])

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
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        jump()
      }
    }

    const handleClick = () => jump()

    window.addEventListener('keydown', handleKeyPress)
    gameRef.current?.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      gameRef.current?.removeEventListener('click', handleClick)
    }
  }, [jump])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-lg text-muted-foreground">
            Target: {levelConfig.targetScore}
          </div>
        </div>

        <div 
          ref={gameRef}
          className="relative bg-sky-200 mx-auto cursor-pointer overflow-hidden border-2 border-gray-300 rounded-lg"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Ground */}
          <div className="absolute bottom-0 w-full h-12 bg-green-400 border-t-4 border-green-600" />
          
          {/* Clouds */}
          <div className="absolute top-10 left-20 w-16 h-8 bg-white rounded-full opacity-70" />
          <div className="absolute top-20 right-32 w-20 h-10 bg-white rounded-full opacity-60" />
          
          {/* Bird */}
          <div
            className="absolute transition-none"
            style={{
              left: GAME_WIDTH / 2 - 50,
              top: birdY,
              width: BIRD_SIZE,
              height: BIRD_SIZE,
            }}
          >
            <div className="w-full h-full bg-yellow-400 rounded-full relative">
              {/* Eye */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
              {/* Beak */}
              <div className="absolute top-3 right-0 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-orange-500" />
              {/* Wing */}
              <div className="absolute top-3 left-1 w-3 h-4 bg-yellow-500 rounded-full" />
            </div>
          </div>

          {/* Pipes */}
          {pipes.map((pipe, index) => (
            <div key={index}>
              {/* Top pipe */}
              <div
                className="absolute bg-green-500 border-2 border-green-700"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.height,
                }}
              >
                <div className="absolute bottom-0 w-full h-8 bg-green-600 border-t-2 border-green-700" />
              </div>
              
              {/* Bottom pipe */}
              <div
                className="absolute bg-green-500 border-2 border-green-700"
                style={{
                  left: pipe.x,
                  top: pipe.height + levelConfig.pipeGap,
                  width: PIPE_WIDTH,
                  height: GAME_HEIGHT - pipe.height - levelConfig.pipeGap,
                }}
              >
                <div className="absolute top-0 w-full h-8 bg-green-600 border-b-2 border-green-700" />
              </div>
            </div>
          ))}

          {/* Game Over overlay */}
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-lg mb-4">Final Score: {score}</p>
                {score >= levelConfig.targetScore && (
                  <p className="text-green-600 font-semibold mb-4">Level Complete!</p>
                )}
              </div>
            </div>
          )}

          {/* Start prompt */}
          {gameState === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 p-4 rounded-lg text-center">
                <p className="text-lg">Click or press Space to start!</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          {gameState === 'waiting' && (
            <Button onClick={startGame} className="gap-2">
              <Play className="w-4 h-4" />
              Start Game
            </Button>
          )}
          
          {gameState === 'gameOver' && (
            <Button onClick={resetGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </Button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Click or press Space/Up/W to flap
        </div>
      </CardContent>
    </Card>
  )
}

export default function FlappyBirdWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="flappy-bird"
      gameName="Flappy Bird"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <FlappyBirdGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}