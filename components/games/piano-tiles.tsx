'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Tile {
  id: number
  column: number
  y: number
  isBlack: boolean
  clicked: boolean
}

interface PianoTilesGameProps {
  levelConfig: {
    speed: number
    targetScore: number
    columns: number
    tileHeight: number
    gameTime: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Pianist',
    difficulty: 'easy',
    config: { 
      speed: 2,
      targetScore: 50,
      columns: 4,
      tileHeight: 120,
      gameTime: 60
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Amateur Pianist',
    difficulty: 'medium',
    config: { 
      speed: 3,
      targetScore: 100,
      columns: 4,
      tileHeight: 100,
      gameTime: 60
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Skilled Pianist',
    difficulty: 'hard',
    config: { 
      speed: 4,
      targetScore: 150,
      columns: 4,
      tileHeight: 90,
      gameTime: 60
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Pianist',
    difficulty: 'expert',
    config: { 
      speed: 5,
      targetScore: 200,
      columns: 4,
      tileHeight: 80,
      gameTime: 60
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Piano Master',
    difficulty: 'master',
    config: { 
      speed: 6,
      targetScore: 300,
      columns: 4,
      tileHeight: 70,
      gameTime: 60
    },
    requiredStars: 14
  }
]

function PianoTilesGame({ levelConfig, onScore }: PianoTilesGameProps) {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(levelConfig.gameTime)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameOver'>('ready')
  const [combo, setCombo] = useState(0)
  const [missedTiles, setMissedTiles] = useState(0)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastUpdateRef = useRef(Date.now())
  const nextIdRef = useRef(0)
  const countdownTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(levelConfig.gameTime)
    setTiles([])
    setCombo(0)
    setMissedTiles(0)
    nextIdRef.current = 0
    lastUpdateRef.current = Date.now()
    
    // Generate initial tiles
    const initialTiles: Tile[] = []
    for (let i = 0; i < 6; i++) {
      const column = Math.floor(Math.random() * levelConfig.columns)
      initialTiles.push({
        id: nextIdRef.current++,
        column,
        y: -i * levelConfig.tileHeight - 50,
        isBlack: true,
        clicked: false
      })
    }
    setTiles(initialTiles)
  }, [levelConfig.gameTime, levelConfig.columns, levelConfig.tileHeight])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
    setTimeLeft(levelConfig.gameTime)
    setTiles([])
    setCombo(0)
    setMissedTiles(0)
  }, [levelConfig.gameTime])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
      lastUpdateRef.current = Date.now()
    }
  }, [gameState])

  const handleTileClick = useCallback((tileId: number) => {
    if (gameState !== 'playing') return

    setTiles(prevTiles => {
      const tile = prevTiles.find(t => t.id === tileId)
      if (!tile || tile.clicked || !tile.isBlack) return prevTiles

      const newScore = 10 + combo * 2
      setScore(prev => prev + newScore)
      setCombo(prev => prev + 1)

      return prevTiles.map(t => 
        t.id === tileId ? { ...t, clicked: true } : t
      )
    })
  }, [gameState, combo])

  const handleMissClick = useCallback(() => {
    if (gameState !== 'playing') return
    setCombo(0)
    setMissedTiles(prev => prev + 1)
    
    if (missedTiles >= 2) {
      setGameState('gameOver')
      onScore(score)
    }
  }, [gameState, missedTiles, score, onScore])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now

      setTiles(prevTiles => {
        let newTiles = prevTiles.map(tile => ({
          ...tile,
          y: tile.y + levelConfig.speed * deltaTime / 16
        }))

        // Remove tiles that have gone off screen
        const removedTiles = newTiles.filter(tile => tile.y > 600)
        removedTiles.forEach(tile => {
          if (tile.isBlack && !tile.clicked) {
            setMissedTiles(prev => prev + 1)
            setCombo(0)
          }
        })

        newTiles = newTiles.filter(tile => tile.y <= 600)

        // Add new tiles
        if (newTiles.length === 0 || 
            (newTiles.length > 0 && newTiles[newTiles.length - 1].y > levelConfig.tileHeight)) {
          const column = Math.floor(Math.random() * levelConfig.columns)
          newTiles.push({
            id: nextIdRef.current++,
            column,
            y: -levelConfig.tileHeight,
            isBlack: true,
            clicked: false
          })
        }

        return newTiles
      })

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, levelConfig])

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing') {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver')
            onScore(score)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [gameState, score, onScore])

  // Check for game over due to missed tiles
  useEffect(() => {
    if (missedTiles >= 3) {
      setGameState('gameOver')
      onScore(score)
    }
  }, [missedTiles, score, onScore])

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">
                Score: <span className="text-primary">{score}</span>
              </div>
              <div className="text-lg">
                Time: <span className="text-primary">{timeLeft}s</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Combo: <span className="text-primary font-bold">x{combo}</span>
              </div>
              <div className="text-sm text-destructive">
                Misses: {missedTiles}/3
              </div>
            </div>
          </div>

          <div 
            ref={gameAreaRef}
            className="relative bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden"
            style={{ width: '400px', height: '500px', margin: '0 auto' }}
          >
            {/* Piano columns */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: levelConfig.columns }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-border/20 hover:bg-muted/10"
                  onClick={() => handleMissClick()}
                />
              ))}
            </div>

            {/* Tiles */}
            <AnimatePresence>
              {tiles.map(tile => (
                <motion.div
                  key={tile.id}
                  className={`absolute cursor-pointer transition-colors ${
                    tile.clicked 
                      ? 'bg-green-500' 
                      : tile.isBlack 
                        ? 'bg-foreground hover:bg-primary' 
                        : 'bg-transparent'
                  }`}
                  style={{
                    left: `${(tile.column * 100) / levelConfig.columns}%`,
                    top: `${tile.y}px`,
                    width: `${100 / levelConfig.columns}%`,
                    height: `${levelConfig.tileHeight}px`,
                    borderRadius: '4px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                  onClick={() => handleTileClick(tile.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </AnimatePresence>

            {/* Target line */}
            <div 
              className="absolute w-full h-1 bg-primary/50"
              style={{ bottom: '100px' }}
            />
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
              <p className="text-sm text-muted-foreground mt-2">
                Best Combo: x{combo}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Music className="h-5 w-5" />
            How to Play
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tap the black tiles as they fall</li>
            <li>• Don't tap the white tiles</li>
            <li>• Build combos for bonus points</li>
            <li>• Missing 3 tiles ends the game</li>
            <li>• Speed increases with each level</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PianoTiles() {
  const getStars = (score: number, config: any) => {
    const { targetScore } = config
    if (score >= targetScore * 0.9) return 3 as const
    if (score >= targetScore * 0.6) return 2 as const
    return 1 as const
  }

  return (
    <GameWithLevels
      gameId="piano-tiles"
      gameName="Piano Tiles"
      levels={levels}
      renderGame={(config, onScore) => (
        <PianoTilesGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}