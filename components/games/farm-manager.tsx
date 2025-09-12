'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'

interface FarmManagerGameProps {
  levelConfig: {
    difficulty: number
    speed: number
    targetScore: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy',
    config: { difficulty: 1, speed: 1, targetScore: 100 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium',
    config: { difficulty: 2, speed: 1.5, targetScore: 200 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard',
    config: { difficulty: 3, speed: 2, targetScore: 300 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert',
    config: { difficulty: 4, speed: 2.5, targetScore: 400 },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master',
    difficulty: 'master',
    config: { difficulty: 5, speed: 3, targetScore: 500 },
    requiredStars: 14
  }
]

function FarmManagerGame({ levelConfig, onScore }: FarmManagerGameProps) {
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameOver'>('ready')

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
  }, [])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
  }, [])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && score >= levelConfig.targetScore) {
      setGameState('gameOver')
      onScore(score)
    }
  }, [score, levelConfig.targetScore, gameState, onScore])

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">
              Score: <span className="text-primary">{score}</span>
            </div>
            <div className="text-lg">
              Target: <span className="text-primary">{levelConfig.targetScore}</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-background to-muted rounded-lg p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Farm Manager</h2>
              <p className="text-muted-foreground mb-8">Quick agricultural simulation</p>
              
              {gameState === 'playing' && (
                <Button
                  size="lg"
                  onClick={() => setScore(prev => prev + 10)}
                  className="min-w-[200px]"
                >
                  Click to Score!
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            {gameState === 'ready' && (
              <Button onClick={startGame} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Game
              </Button>
            )}
            {gameState === 'playing' && (
              <Button onClick={togglePause} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {gameState === 'paused' && (
              <Button onClick={togglePause} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {(gameState === 'gameOver' || gameState === 'paused') && (
              <Button onClick={resetGame} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Game
              </Button>
            )}
          </div>

          {gameState === 'gameOver' && (
            <div className="text-center mt-4">
              <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
              <p className="text-lg">
                Final Score: <span className="text-primary font-bold">{score}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function FarmManager() {
  const getStars = (score: number, config: any) => {
    const { targetScore } = config
    if (score >= targetScore * 0.9) return 3 as const
    if (score >= targetScore * 0.6) return 2 as const
    return 1 as const
  }

  return (
    <GameWithLevels
      gameId="farm-manager"
      gameName="Farm Manager"
      levels={levels}
      renderGame={(config, onScore) => (
        <FarmManagerGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}