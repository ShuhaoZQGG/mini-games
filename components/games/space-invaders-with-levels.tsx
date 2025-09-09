'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 20
const INVADER_WIDTH = 30
const INVADER_HEIGHT = 20
const BULLET_WIDTH = 3
const BULLET_HEIGHT = 10
const BARRIER_WIDTH = 60
const BARRIER_HEIGHT = 40

interface Position {
  x: number
  y: number
}

interface Invader extends Position {
  type: 'squid' | 'crab' | 'octopus'
  alive: boolean
}

interface Bullet extends Position {
  active: boolean
  velocity: number
}

interface Barrier extends Position {
  health: number
  pixels: boolean[][]
}

interface UFO extends Position {
  active: boolean
  points: number
}

interface SpaceInvadersGameProps {
  levelConfig: {
    invaderSpeed: number
    invaderRows: number
    shootingFrequency: number
    ufoChance: number
    targetScore: number
    playerBulletSpeed: number
    enableBarriers: boolean
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Training Mission',
    difficulty: 'easy',
    config: {
      invaderSpeed: 0.8,
      invaderRows: 3,
      shootingFrequency: 100,
      ufoChance: 0.001,
      targetScore: 1000,
      playerBulletSpeed: 8,
      enableBarriers: true
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Defensive Stand',
    difficulty: 'medium',
    config: {
      invaderSpeed: 1.2,
      invaderRows: 4,
      shootingFrequency: 80,
      ufoChance: 0.002,
      targetScore: 2000,
      playerBulletSpeed: 8,
      enableBarriers: true
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Alien Assault',
    difficulty: 'hard',
    config: {
      invaderSpeed: 1.5,
      invaderRows: 5,
      shootingFrequency: 60,
      ufoChance: 0.003,
      targetScore: 3500,
      playerBulletSpeed: 10,
      enableBarriers: true
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Space War',
    difficulty: 'expert',
    config: {
      invaderSpeed: 2.0,
      invaderRows: 5,
      shootingFrequency: 45,
      ufoChance: 0.004,
      targetScore: 5000,
      playerBulletSpeed: 10,
      enableBarriers: false
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Galaxy Defender',
    difficulty: 'master',
    config: {
      invaderSpeed: 2.5,
      invaderRows: 6,
      shootingFrequency: 30,
      ufoChance: 0.005,
      targetScore: 7500,
      playerBulletSpeed: 12,
      enableBarriers: false
    },
    requiredStars: 12
  }
]

function SpaceInvadersCore({ levelConfig, onScore }: SpaceInvadersGameProps) {
  const [playerX, setPlayerX] = useState(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2)
  const [invaders, setInvaders] = useState<Invader[]>([])
  const [playerBullet, setPlayerBullet] = useState<Bullet>({ x: 0, y: 0, active: false, velocity: -5 })
  const [invaderBullets, setInvaderBullets] = useState<Bullet[]>([])
  const [barriers, setBarriers] = useState<Barrier[]>([])
  const [ufo, setUfo] = useState<UFO>({ x: -50, y: 30, active: false, points: 0 })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver' | 'waveComplete'>('waiting')
  
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const invaderDirectionRef = useRef(1)
  const frameCountRef = useRef(0)
  const keysRef = useRef<Set<string>>(new Set())

  // Initialize invaders with level config
  const initializeInvaders = useCallback((waveNumber: number) => {
    const newInvaders: Invader[] = []
    const rows = Math.min(levelConfig.invaderRows, 3 + Math.floor(waveNumber / 2))
    const cols = 11
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type: 'squid' | 'crab' | 'octopus' = 'octopus'
        if (row < 1) type = 'squid'
        else if (row < 3) type = 'crab'
        
        newInvaders.push({
          x: 50 + col * 45,
          y: 50 + row * 35,
          type,
          alive: true
        })
      }
    }
    
    return newInvaders
  }, [levelConfig.invaderRows])

  // Initialize barriers
  const initializeBarriers = useCallback(() => {
    if (!levelConfig.enableBarriers) return []
    
    const newBarriers: Barrier[] = []
    const barrierCount = 4
    const spacing = CANVAS_WIDTH / (barrierCount + 1)
    
    for (let i = 0; i < barrierCount; i++) {
      const pixels: boolean[][] = []
      for (let y = 0; y < 8; y++) {
        pixels[y] = []
        for (let x = 0; x < 12; x++) {
          // Create barrier shape
          if (y < 2 || (y < 6 && x > 1 && x < 10)) {
            pixels[y][x] = true
          } else if (y >= 6 && (x < 3 || x > 8)) {
            pixels[y][x] = true
          } else {
            pixels[y][x] = false
          }
        }
      }
      
      newBarriers.push({
        x: spacing * (i + 1) - BARRIER_WIDTH / 2,
        y: CANVAS_HEIGHT - 120,
        health: 100,
        pixels
      })
    }
    
    return newBarriers
  }, [levelConfig.enableBarriers])

  // Move invaders
  const moveInvaders = useCallback(() => {
    let shouldDropDown = false
    let rightMost = 0
    let leftMost = CANVAS_WIDTH
    
    invaders.forEach(invader => {
      if (invader.alive) {
        if (invader.x > rightMost) rightMost = invader.x
        if (invader.x < leftMost) leftMost = invader.x
      }
    })
    
    if (rightMost >= CANVAS_WIDTH - INVADER_WIDTH - 10 && invaderDirectionRef.current > 0) {
      shouldDropDown = true
      invaderDirectionRef.current = -1
    } else if (leftMost <= 10 && invaderDirectionRef.current < 0) {
      shouldDropDown = true
      invaderDirectionRef.current = 1
    }
    
    setInvaders(current => 
      current.map(invader => ({
        ...invader,
        x: invader.x + (invaderDirectionRef.current * levelConfig.invaderSpeed),
        y: shouldDropDown ? invader.y + 20 : invader.y
      }))
    )
    
    // Check if invaders reached bottom
    const lowestInvader = Math.max(...invaders.filter(i => i.alive).map(i => i.y))
    if (lowestInvader >= CANVAS_HEIGHT - 100) {
      setLives(0)
      setGameState('gameOver')
      onScore(score)
    }
  }, [invaders, levelConfig.invaderSpeed, score, onScore])

  // Fire invader bullets
  const fireInvaderBullet = useCallback(() => {
    const aliveInvaders = invaders.filter(i => i.alive)
    if (aliveInvaders.length === 0) return
    
    const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)]
    
    setInvaderBullets(current => [
      ...current.filter(b => b.active),
      {
        x: shooter.x + INVADER_WIDTH / 2,
        y: shooter.y + INVADER_HEIGHT,
        active: true,
        velocity: 3 + levelConfig.invaderSpeed * 0.5
      }
    ])
  }, [invaders, levelConfig.invaderSpeed])

  // Spawn UFO
  const spawnUFO = useCallback(() => {
    if (!ufo.active && Math.random() < levelConfig.ufoChance) {
      const points = [50, 100, 150, 300][Math.floor(Math.random() * 4)]
      setUfo({
        x: Math.random() < 0.5 ? -50 : CANVAS_WIDTH + 50,
        y: 30,
        active: true,
        points
      })
    }
  }, [ufo.active, levelConfig.ufoChance])

  // Move UFO
  const moveUFO = useCallback(() => {
    if (ufo.active) {
      setUfo(current => {
        const direction = current.x < CANVAS_WIDTH / 2 ? 2 : -2
        const newX = current.x + direction
        
        if (newX < -60 || newX > CANVAS_WIDTH + 60) {
          return { ...current, active: false }
        }
        
        return { ...current, x: newX }
      })
    }
  }, [ufo.active])

  // Update bullets
  const updateBullets = useCallback(() => {
    // Player bullet
    if (playerBullet.active) {
      setPlayerBullet(current => {
        const newY = current.y + current.velocity
        if (newY < 0) {
          return { ...current, active: false }
        }
        return { ...current, y: newY }
      })
    }
    
    // Invader bullets
    setInvaderBullets(current => 
      current.map(bullet => {
        if (!bullet.active) return bullet
        
        const newY = bullet.y + bullet.velocity
        if (newY > CANVAS_HEIGHT) {
          return { ...bullet, active: false }
        }
        return { ...bullet, y: newY }
      }).filter(b => b.active || b.y < CANVAS_HEIGHT)
    )
  }, [playerBullet.active])

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Player bullet vs invaders
    if (playerBullet.active) {
      setInvaders(current => {
        let hit = false
        const updated = current.map(invader => {
          if (!invader.alive || hit) return invader
          
          if (
            playerBullet.x >= invader.x &&
            playerBullet.x <= invader.x + INVADER_WIDTH &&
            playerBullet.y >= invader.y &&
            playerBullet.y <= invader.y + INVADER_HEIGHT
          ) {
            hit = true
            const points = invader.type === 'squid' ? 30 : invader.type === 'crab' ? 20 : 10
            setScore(prev => prev + points)
            return { ...invader, alive: false }
          }
          return invader
        })
        
        if (hit) {
          setPlayerBullet(prev => ({ ...prev, active: false }))
        }
        
        return updated
      })
      
      // Player bullet vs UFO
      if (ufo.active &&
          playerBullet.x >= ufo.x &&
          playerBullet.x <= ufo.x + 50 &&
          playerBullet.y >= ufo.y &&
          playerBullet.y <= ufo.y + 20) {
        setScore(prev => prev + ufo.points)
        setUfo(prev => ({ ...prev, active: false }))
        setPlayerBullet(prev => ({ ...prev, active: false }))
      }
    }
    
    // Invader bullets vs player
    invaderBullets.forEach(bullet => {
      if (bullet.active &&
          bullet.x >= playerX &&
          bullet.x <= playerX + PLAYER_WIDTH &&
          bullet.y >= CANVAS_HEIGHT - 40 &&
          bullet.y <= CANVAS_HEIGHT - 20) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState('gameOver')
            onScore(score)
          }
          return newLives
        })
        bullet.active = false
      }
    })
    
    // Bullets vs barriers
    setBarriers(current => {
      return current.map(barrier => {
        if (barrier.health <= 0) return barrier
        
        let newBarrier = { ...barrier }
        
        // Check player bullet
        if (playerBullet.active &&
            playerBullet.x >= barrier.x &&
            playerBullet.x <= barrier.x + BARRIER_WIDTH &&
            playerBullet.y >= barrier.y &&
            playerBullet.y <= barrier.y + BARRIER_HEIGHT) {
          newBarrier.health -= 10
          setPlayerBullet(prev => ({ ...prev, active: false }))
        }
        
        // Check invader bullets
        invaderBullets.forEach(bullet => {
          if (bullet.active &&
              bullet.x >= barrier.x &&
              bullet.x <= barrier.x + BARRIER_WIDTH &&
              bullet.y >= barrier.y &&
              bullet.y <= barrier.y + BARRIER_HEIGHT) {
            newBarrier.health -= 10
            bullet.active = false
          }
        })
        
        return newBarrier
      })
    })
  }, [playerBullet, invaderBullets, playerX, ufo, score, onScore])

  // Check wave complete
  const checkWaveComplete = useCallback(() => {
    const aliveInvaders = invaders.filter(i => i.alive)
    if (aliveInvaders.length === 0 && gameState === 'playing') {
      setGameState('waveComplete')
      setTimeout(() => {
        setWave(prev => prev + 1)
        setInvaders(initializeInvaders(wave + 1))
        setInvaderBullets([])
        setPlayerBullet({ x: 0, y: 0, active: false, velocity: -levelConfig.playerBulletSpeed })
        setGameState('playing')
      }, 2000)
    }
  }, [invaders, gameState, wave, initializeInvaders, levelConfig.playerBulletSpeed])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        frameCountRef.current++
        
        // Move player based on keys
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          setPlayerX(prev => Math.max(0, prev - 5))
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          setPlayerX(prev => Math.min(CANVAS_WIDTH - PLAYER_WIDTH, prev + 5))
        }
        
        // Update game state
        if (frameCountRef.current % 30 === 0) {
          moveInvaders()
        }
        
        if (frameCountRef.current % levelConfig.shootingFrequency === 0) {
          fireInvaderBullet()
        }
        
        updateBullets()
        checkCollisions()
        checkWaveComplete()
        spawnUFO()
        moveUFO()
      }, 1000 / 60) // 60 FPS
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
  }, [gameState, moveInvaders, fireInvaderBullet, updateBullets, checkCollisions, checkWaveComplete, spawnUFO, moveUFO, levelConfig.shootingFrequency])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      keysRef.current.add(e.key)
      
      if (e.key === ' ' && !playerBullet.active) {
        e.preventDefault()
        setPlayerBullet({
          x: playerX + PLAYER_WIDTH / 2,
          y: CANVAS_HEIGHT - 40,
          active: true,
          velocity: -levelConfig.playerBulletSpeed
        })
      }
      
      if (e.key === 'Escape') {
        setGameState('paused')
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, playerBullet.active, playerX, levelConfig.playerBulletSpeed])

  const startGame = () => {
    setPlayerX(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2)
    setInvaders(initializeInvaders(1))
    setBarriers(initializeBarriers())
    setPlayerBullet({ x: 0, y: 0, active: false, velocity: -levelConfig.playerBulletSpeed })
    setInvaderBullets([])
    setUfo({ x: -50, y: 30, active: false, points: 0 })
    setScore(0)
    setLives(3)
    setWave(1)
    frameCountRef.current = 0
    invaderDirectionRef.current = 1
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
  }

  // Save high score
  useEffect(() => {
    if (gameState === 'gameOver') {
      const highScore = localStorage.getItem('space-invaders-high-score')
      if (!highScore || score > parseInt(highScore)) {
        localStorage.setItem('space-invaders-high-score', score.toString())
      }
    }
  }, [gameState, score])

  const highScore = typeof window !== 'undefined' 
    ? localStorage.getItem('space-invaders-high-score') || '0'
    : '0'

  return (
    <Card className="p-6">
      <CardContent className="flex flex-col items-center gap-4 p-0">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="text-lg font-semibold">
            Score: {score} | High Score: {highScore}
          </div>
          <div className="text-lg font-semibold">
            Wave: {wave} | Lives: {'🚀'.repeat(Math.max(0, lives))}
          </div>
        </div>

        <div 
          className="relative bg-black border-2 border-gray-600 rounded"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT
          }}
        >
          {/* Player */}
          <div
            className="absolute bg-green-500"
            style={{
              left: playerX,
              bottom: 20,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
            }}
          />

          {/* Invaders */}
          {invaders.map((invader, index) => (
            invader.alive && (
              <div
                key={index}
                className={`absolute ${
                  invader.type === 'squid' ? 'bg-purple-500' :
                  invader.type === 'crab' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}
                style={{
                  left: invader.x,
                  top: invader.y,
                  width: INVADER_WIDTH,
                  height: INVADER_HEIGHT,
                  clipPath: frameCountRef.current % 60 < 30
                    ? 'polygon(20% 0%, 80% 0%, 100% 40%, 80% 100%, 60% 60%, 40% 60%, 20% 100%, 0% 40%)'
                    : 'polygon(20% 0%, 80% 0%, 100% 60%, 80% 100%, 60% 40%, 40% 40%, 20% 100%, 0% 60%)'
                }}
              />
            )
          ))}

          {/* UFO */}
          {ufo.active && (
            <div
              className="absolute bg-red-500 rounded-full"
              style={{
                left: ufo.x,
                top: ufo.y,
                width: 50,
                height: 20
              }}
            >
              <div className="text-white text-xs text-center mt-1">{ufo.points}</div>
            </div>
          )}

          {/* Barriers */}
          {barriers.map((barrier, index) => (
            barrier.health > 0 && (
              <div
                key={index}
                className="absolute"
                style={{
                  left: barrier.x,
                  top: barrier.y,
                  width: BARRIER_WIDTH,
                  height: BARRIER_HEIGHT
                }}
              >
                {barrier.pixels.map((row, y) => 
                  row.map((pixel, x) => 
                    pixel && barrier.health > y * 10 && (
                      <div
                        key={`${y}-${x}`}
                        className="absolute bg-green-600"
                        style={{
                          left: x * 5,
                          top: y * 5,
                          width: 5,
                          height: 5,
                          opacity: barrier.health / 100
                        }}
                      />
                    )
                  )
                )}
              </div>
            )
          ))}

          {/* Player bullet */}
          {playerBullet.active && (
            <div
              className="absolute bg-white"
              style={{
                left: playerBullet.x - BULLET_WIDTH / 2,
                top: playerBullet.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
              }}
            />
          )}

          {/* Invader bullets */}
          {invaderBullets.map((bullet, index) => (
            bullet.active && (
              <div
                key={index}
                className="absolute bg-red-400"
                style={{
                  left: bullet.x - BULLET_WIDTH / 2,
                  top: bullet.y,
                  width: BULLET_WIDTH,
                  height: BULLET_HEIGHT
                }}
              />
            )
          ))}

          {/* Game over overlay */}
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-2xl font-bold">GAME OVER</div>
            </div>
          )}

          {/* Wave complete overlay */}
          {gameState === 'waveComplete' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-white text-2xl font-bold">WAVE {wave} COMPLETE!</div>
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
        <div className="flex gap-2 md:hidden mt-4">
          <Button 
            size="sm"
            onTouchStart={() => keysRef.current.add('ArrowLeft')}
            onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
            className="touch-none"
          >
            ←
          </Button>
          <Button 
            size="sm"
            onTouchStart={() => keysRef.current.add('ArrowRight')}
            onTouchEnd={() => keysRef.current.delete('ArrowRight')}
            className="touch-none"
          >
            →
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              if (!playerBullet.active && gameState === 'playing') {
                setPlayerBullet({
                  x: playerX + PLAYER_WIDTH / 2,
                  y: CANVAS_HEIGHT - 40,
                  active: true,
                  velocity: -levelConfig.playerBulletSpeed
                })
              }
            }}
            className="touch-none"
          >
            Fire
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Use arrow keys or A/D to move. Space to shoot. ESC to pause.
        </div>
      </CardContent>
    </Card>
  )
}

export default function SpaceInvadersWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="space-invaders"
      gameName="Space Invaders"
      levels={levels}
      renderGame={(config, onScore) => <SpaceInvadersCore levelConfig={config} onScore={onScore} />}
      getStars={getStars}
    />
  )
}