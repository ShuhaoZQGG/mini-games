'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, MousePointer, Zap, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Upgrade {
  id: string
  name: string
  description: string
  cost: number
  value: number
  type: 'clickPower' | 'autoClick' | 'multiplier'
  icon: React.ReactNode
  purchased: number
}

interface IdleClickerGameProps {
  levelConfig: {
    targetScore: number
    timeLimit: number
    baseClickPower: number
    upgradeCostMultiplier: number
    autoClickerBase: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Clicker Novice',
    difficulty: 'easy',
    config: { 
      targetScore: 1000, 
      timeLimit: 120,
      baseClickPower: 1,
      upgradeCostMultiplier: 1.5,
      autoClickerBase: 0.1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Click Master',
    difficulty: 'medium',
    config: { 
      targetScore: 10000, 
      timeLimit: 180,
      baseClickPower: 1,
      upgradeCostMultiplier: 1.7,
      autoClickerBase: 0.2
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Idle Expert',
    difficulty: 'hard',
    config: { 
      targetScore: 50000, 
      timeLimit: 240,
      baseClickPower: 1,
      upgradeCostMultiplier: 2,
      autoClickerBase: 0.3
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Click Tycoon',
    difficulty: 'expert',
    config: { 
      targetScore: 250000, 
      timeLimit: 300,
      baseClickPower: 2,
      upgradeCostMultiplier: 2.2,
      autoClickerBase: 0.5
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Idle Legend',
    difficulty: 'master',
    config: { 
      targetScore: 1000000, 
      timeLimit: 360,
      baseClickPower: 2,
      upgradeCostMultiplier: 2.5,
      autoClickerBase: 1
    },
    requiredStars: 14
  }
]

function IdleClickerGame({ levelConfig, onScore }: IdleClickerGameProps) {
  const [score, setScore] = useState(0)
  const [clickPower, setClickPower] = useState(levelConfig.baseClickPower)
  const [autoClickPower, setAutoClickPower] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready')
  const [clickEffects, setClickEffects] = useState<Array<{id: string, x: number, y: number, value: number}>>([])
  
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'clickPower',
      name: 'Stronger Clicks',
      description: 'Increase click power by 1',
      cost: 10,
      value: 1,
      type: 'clickPower',
      icon: <MousePointer className="w-4 h-4" />,
      purchased: 0
    },
    {
      id: 'autoClicker',
      name: 'Auto Clicker',
      description: `+${levelConfig.autoClickerBase} clicks/sec`,
      cost: 50,
      value: levelConfig.autoClickerBase,
      type: 'autoClick',
      icon: <Zap className="w-4 h-4" />,
      purchased: 0
    },
    {
      id: 'multiplier',
      name: 'Score Multiplier',
      description: 'x1.5 all points',
      cost: 200,
      value: 1.5,
      type: 'multiplier',
      icon: <TrendingUp className="w-4 h-4" />,
      purchased: 0
    }
  ])

  const clickAreaRef = useRef<HTMLDivElement>(null)
  const autoClickIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setClickPower(levelConfig.baseClickPower)
    setAutoClickPower(0)
    setMultiplier(1)
    setUpgrades(prev => prev.map(u => ({ ...u, purchased: 0, cost: u.id === 'clickPower' ? 10 : u.id === 'autoClicker' ? 50 : 200 })))
  }, [levelConfig])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setClickEffects([])
  }, [levelConfig.timeLimit])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return

    const rect = clickAreaRef.current?.getBoundingClientRect()
    if (!rect) return

    const points = Math.floor(clickPower * multiplier)
    setScore(prev => prev + points)

    // Add click effect
    const effectId = Math.random().toString(36).substr(2, 9)
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setClickEffects(prev => [...prev, { id: effectId, x, y, value: points }])

    // Remove effect after animation
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== effectId))
    }, 1000)
  }, [gameState, clickPower, multiplier])

  const purchaseUpgrade = useCallback((upgradeId: string) => {
    setUpgrades(prev => {
      const upgrade = prev.find(u => u.id === upgradeId)
      if (!upgrade || score < upgrade.cost) return prev

      setScore(s => s - upgrade.cost)

      if (upgrade.type === 'clickPower') {
        setClickPower(p => p + upgrade.value)
      } else if (upgrade.type === 'autoClick') {
        setAutoClickPower(p => p + upgrade.value)
      } else if (upgrade.type === 'multiplier') {
        setMultiplier(m => m * upgrade.value)
      }

      return prev.map(u => {
        if (u.id === upgradeId) {
          const newCost = Math.floor(u.cost * levelConfig.upgradeCostMultiplier)
          return { ...u, cost: newCost, purchased: u.purchased + 1 }
        }
        return u
      })
    })
  }, [score, levelConfig.upgradeCostMultiplier])

  // Auto clicker
  useEffect(() => {
    if (gameState !== 'playing' || autoClickPower === 0) return

    autoClickIntervalRef.current = setInterval(() => {
      const points = Math.floor(autoClickPower * multiplier)
      setScore(prev => prev + points)

      // Add auto-click effect
      const effectId = Math.random().toString(36).substr(2, 9)
      const x = Math.random() * 300 + 50
      const y = Math.random() * 300 + 50

      setClickEffects(prev => [...prev, { id: effectId, x, y, value: points }])

      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== effectId))
      }, 1000)
    }, 100) // 10 times per second, autoClickPower is per second

    return () => {
      if (autoClickIntervalRef.current) {
        clearInterval(autoClickIntervalRef.current)
      }
    }
  }, [gameState, autoClickPower, multiplier])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameOver')
          onScore(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, score, onScore])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-3xl font-bold">{formatNumber(score)} points</div>
            <div className="text-sm text-muted-foreground">
              Target: {formatNumber(levelConfig.targetScore)}
            </div>
            <div className="text-sm space-x-4">
              <span>Click: {clickPower}x{multiplier > 1 ? multiplier.toFixed(1) : ''}</span>
              {autoClickPower > 0 && (
                <span>Auto: {(autoClickPower * 10).toFixed(1)}/s</span>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xl font-semibold">
              Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground">
              Progress: {Math.min(100, Math.floor((score / levelConfig.targetScore) * 100))}%
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Click Area */}
          <div className="space-y-4">
            <div 
              ref={clickAreaRef}
              className="relative h-[400px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg cursor-pointer select-none overflow-hidden"
              onClick={handleClick}
            >
              {gameState === 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <Button onClick={startGame} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    Start Game
                  </Button>
                </div>
              )}

              {gameState === 'gameOver' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <div className="text-center space-y-4 bg-white p-6 rounded-lg">
                    <div className="text-2xl font-bold">Game Over!</div>
                    <div className="text-xl">Final Score: {formatNumber(score)}</div>
                    <div className="text-lg">
                      {score >= levelConfig.targetScore ? '⭐ Level Complete!' : 'Try Again!'}
                    </div>
                    <Button onClick={resetGame} size="lg">
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Play Again
                    </Button>
                  </div>
                </div>
              )}

              {gameState === 'playing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-6xl cursor-pointer select-none"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    💎
                  </motion.div>
                </div>
              )}

              <AnimatePresence>
                {clickEffects.map(effect => (
                  <motion.div
                    key={effect.id}
                    className="absolute text-2xl font-bold text-yellow-600 pointer-events-none"
                    style={{ left: effect.x, top: effect.y }}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -50 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    +{effect.value}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Upgrades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upgrades</h3>
            <div className="space-y-2">
              {upgrades.map(upgrade => (
                <Card key={upgrade.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {upgrade.icon}
                      </div>
                      <div>
                        <div className="font-medium">{upgrade.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {upgrade.description}
                        </div>
                        {upgrade.purchased > 0 && (
                          <div className="text-xs text-green-600">
                            Owned: {upgrade.purchased}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => purchaseUpgrade(upgrade.id)}
                      disabled={score < upgrade.cost || gameState !== 'playing'}
                    >
                      {formatNumber(upgrade.cost)}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={resetGame} variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Game
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function IdleClicker() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 150) return 3
    if (percentage >= 100) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="idle-clicker"
      gameName="Idle Clicker"
      levels={levels}
      renderGame={(config, onScore) => (
        <IdleClickerGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}