'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Gem, Wheat, Factory, Store, TrendingUp, RotateCcw, Play, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Resource {
  type: 'gold' | 'gems' | 'wheat' | 'energy'
  amount: number
  production: number
  icon: typeof Coins
  color: string
}

interface Building {
  id: string
  name: string
  type: 'mine' | 'farm' | 'factory' | 'market'
  level: number
  cost: { [key: string]: number }
  production?: { type: string; amount: number }
  conversion?: { from: string; to: string; ratio: number }
  multiplier?: number
}

interface ResourceManagerConfig {
  targetGoals: { [key: string]: number }
  timeLimit: number // in seconds
  startingResources: { [key: string]: number }
  marketPrices: { [key: string]: number }
  difficultyMultiplier: number
}

interface ResourceManagerCoreProps {
  levelConfig: ResourceManagerConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Basic Economy',
    difficulty: 'easy',
    config: {
      targetGoals: { gold: 500, wheat: 200 },
      timeLimit: 180,
      startingResources: { gold: 100, gems: 10, wheat: 50, energy: 20 },
      marketPrices: { gold: 1, gems: 10, wheat: 2, energy: 5 },
      difficultyMultiplier: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Market Expansion',
    difficulty: 'medium',
    config: {
      targetGoals: { gold: 1000, gems: 100, wheat: 400 },
      timeLimit: 240,
      startingResources: { gold: 80, gems: 5, wheat: 40, energy: 15 },
      marketPrices: { gold: 1, gems: 15, wheat: 3, energy: 7 },
      difficultyMultiplier: 1.3
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Industrial Revolution',
    difficulty: 'hard',
    config: {
      targetGoals: { gold: 2000, gems: 200, wheat: 600, energy: 300 },
      timeLimit: 300,
      startingResources: { gold: 60, gems: 3, wheat: 30, energy: 10 },
      marketPrices: { gold: 1, gems: 20, wheat: 4, energy: 10 },
      difficultyMultiplier: 1.6
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Economic Crisis',
    difficulty: 'expert',
    config: {
      targetGoals: { gold: 3000, gems: 300, wheat: 800, energy: 500 },
      timeLimit: 360,
      startingResources: { gold: 40, gems: 2, wheat: 20, energy: 5 },
      marketPrices: { gold: 1, gems: 25, wheat: 5, energy: 12 },
      difficultyMultiplier: 2
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Tycoon Master',
    difficulty: 'master',
    config: {
      targetGoals: { gold: 5000, gems: 500, wheat: 1000, energy: 800 },
      timeLimit: 420,
      startingResources: { gold: 20, gems: 1, wheat: 10, energy: 2 },
      marketPrices: { gold: 1, gems: 30, wheat: 6, energy: 15 },
      difficultyMultiplier: 2.5
    },
    requiredStars: 12
  }
]

const BUILDING_TEMPLATES: Building[] = [
  {
    id: 'gold_mine',
    name: 'Gold Mine',
    type: 'mine',
    level: 1,
    cost: { gold: 100, energy: 10 },
    production: { type: 'gold', amount: 5 }
  },
  {
    id: 'gem_mine',
    name: 'Gem Mine',
    type: 'mine',
    level: 1,
    cost: { gold: 200, energy: 20 },
    production: { type: 'gems', amount: 1 }
  },
  {
    id: 'wheat_farm',
    name: 'Wheat Farm',
    type: 'farm',
    level: 1,
    cost: { gold: 50, energy: 5 },
    production: { type: 'wheat', amount: 3 }
  },
  {
    id: 'power_plant',
    name: 'Power Plant',
    type: 'factory',
    level: 1,
    cost: { gold: 150, wheat: 20 },
    production: { type: 'energy', amount: 2 }
  },
  {
    id: 'market',
    name: 'Market',
    type: 'market',
    level: 1,
    cost: { gold: 300, gems: 10 },
    multiplier: 1.2
  }
]

function ResourceManagerCore({ levelConfig, onScore }: ResourceManagerCoreProps) {
  const { targetGoals, timeLimit, startingResources, marketPrices, difficultyMultiplier } = levelConfig
  
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'victory' | 'defeat'>('playing')
  const [resources, setResources] = useState<{ [key: string]: number }>(startingResources)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [score, setScore] = useState(0)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const productionRef = useRef<NodeJS.Timeout | null>(null)

  const canAfford = useCallback((cost: { [key: string]: number }) => {
    return Object.entries(cost).every(([resource, amount]) => 
      resources[resource] >= amount
    )
  }, [resources])

  const buyBuilding = useCallback((buildingTemplate: Building) => {
    if (!canAfford(buildingTemplate.cost)) return
    
    // Deduct cost
    const newResources = { ...resources }
    Object.entries(buildingTemplate.cost).forEach(([resource, amount]) => {
      newResources[resource] -= amount
    })
    setResources(newResources)
    
    // Add building
    const newBuilding = {
      ...buildingTemplate,
      id: `${buildingTemplate.id}_${Date.now()}`,
      cost: Object.fromEntries(
        Object.entries(buildingTemplate.cost).map(([r, a]) => 
          [r, Math.floor(a * (1 + buildings.filter(b => b.type === buildingTemplate.type).length * 0.5))]
        )
      )
    }
    setBuildings(prev => [...prev, newBuilding])
    setScore(prev => prev + 50)
  }, [resources, buildings, canAfford])

  const upgradeBuilding = useCallback((buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return
    
    const upgradeCost = {
      gold: Math.floor(100 * building.level * difficultyMultiplier),
      gems: Math.floor(5 * building.level * difficultyMultiplier)
    }
    
    if (!canAfford(upgradeCost)) return
    
    // Deduct cost
    const newResources = { ...resources }
    Object.entries(upgradeCost).forEach(([resource, amount]) => {
      newResources[resource] -= amount
    })
    setResources(newResources)
    
    // Upgrade building
    setBuildings(prev => prev.map(b => {
      if (b.id === buildingId) {
        return {
          ...b,
          level: b.level + 1,
          production: b.production ? {
            ...b.production,
            amount: b.production.amount * 1.5
          } : b.production,
          multiplier: b.multiplier ? b.multiplier * 1.1 : b.multiplier
        }
      }
      return b
    }))
    setScore(prev => prev + 100)
  }, [buildings, resources, difficultyMultiplier, canAfford])

  const sellResource = useCallback((resourceType: string, amount: number) => {
    if (resources[resourceType] < amount) return
    
    const marketMultiplier = buildings
      .filter(b => b.type === 'market')
      .reduce((mult, b) => mult * (b.multiplier || 1), 1)
    
    const value = Math.floor(amount * marketPrices[resourceType] * marketMultiplier)
    
    setResources(prev => ({
      ...prev,
      [resourceType]: prev[resourceType] - amount,
      gold: prev.gold + value
    }))
    setScore(prev => prev + value)
  }, [resources, marketPrices, buildings])

  // Production cycle
  useEffect(() => {
    if (gameState !== 'playing') return
    
    productionRef.current = setInterval(() => {
      setResources(prev => {
        const newResources = { ...prev }
        
        buildings.forEach(building => {
          if (building.production) {
            const { type, amount } = building.production
            newResources[type] = (newResources[type] || 0) + amount * building.level
          }
        })
        
        return newResources
      })
    }, 1000)
    
    return () => {
      if (productionRef.current) {
        clearInterval(productionRef.current)
      }
    }
  }, [buildings, gameState])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGameState('defeat')
          onScore(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [gameState, score, onScore])

  // Check victory conditions
  useEffect(() => {
    const goalsAchieved = Object.entries(targetGoals).every(([resource, target]) => 
      resources[resource] >= target
    )
    
    if (goalsAchieved) {
      setGameState('victory')
      const timeBonus = timeRemaining * 10
      const finalScore = score + timeBonus + Object.values(resources).reduce((a, b) => a + b, 0)
      setScore(finalScore)
      onScore(finalScore)
    }
  }, [resources, targetGoals, timeRemaining, score, onScore])

  const reset = useCallback(() => {
    setGameState('playing')
    setResources(startingResources)
    setBuildings([])
    setTimeRemaining(timeLimit)
    setScore(0)
    setSelectedBuilding(null)
  }, [startingResources, timeLimit])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resourceIcons = {
    gold: Coins,
    gems: Gem,
    wheat: Wheat,
    energy: Factory
  }

  const resourceColors = {
    gold: 'text-yellow-500',
    gems: 'text-purple-500',
    wheat: 'text-amber-500',
    energy: 'text-blue-500'
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {Object.entries(resources).map(([type, amount]) => {
              const Icon = resourceIcons[type as keyof typeof resourceIcons] || Coins
              return (
                <div key={type} className="flex items-center gap-1">
                  <Icon className={cn("w-5 h-5", resourceColors[type as keyof typeof resourceColors])} />
                  <span className="font-bold">{Math.floor(amount)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1">
              <Timer className="w-5 h-5" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
            <Button onClick={reset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-slate-100 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2">Goals:</h3>
          <div className="flex gap-4">
            {Object.entries(targetGoals).map(([resource, target]) => {
              const Icon = resourceIcons[resource as keyof typeof resourceIcons] || Coins
              const current = resources[resource] || 0
              const progress = Math.min((current / target) * 100, 100)
              
              return (
                <div key={resource} className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon className={cn("w-4 h-4", resourceColors[resource as keyof typeof resourceColors])} />
                    <span className="text-xs">{Math.floor(current)}/{target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Buildings Shop */}
        <div className="space-y-2">
          <h3 className="font-semibold">Build & Upgrade:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BUILDING_TEMPLATES.map(template => (
              <Button
                key={template.id}
                variant={selectedBuilding === template.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => buyBuilding(template)}
                disabled={!canAfford(template.cost)}
                className="h-auto py-2 px-3"
              >
                <div className="text-left">
                  <div className="font-semibold text-xs">{template.name}</div>
                  <div className="text-xs opacity-75">
                    Cost: {Object.entries(template.cost).map(([r, a]) => `${a} ${r}`).join(', ')}
                  </div>
                  {template.production && (
                    <div className="text-xs text-green-600">
                      +{template.production.amount} {template.production.type}/s
                    </div>
                  )}
                  {template.multiplier && (
                    <div className="text-xs text-blue-600">
                      Market: {template.multiplier}x
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Owned Buildings */}
        {buildings.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Your Buildings:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {buildings.map(building => (
                <motion.div
                  key={building.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-slate-100 rounded-lg p-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-xs">{building.name}</div>
                      <div className="text-xs opacity-75">Level {building.level}</div>
                      {building.production && (
                        <div className="text-xs text-green-600">
                          +{Math.floor(building.production.amount * building.level)} {building.production.type}/s
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => upgradeBuilding(building.id)}
                    >
                      Upgrade
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Market */}
        <div className="space-y-2">
          <h3 className="font-semibold">Market (Sell Resources):</h3>
          <div className="flex gap-2">
            {Object.entries(marketPrices).map(([resource, price]) => {
              if (resource === 'gold') return null
              const Icon = resourceIcons[resource as keyof typeof resourceIcons] || Coins
              const amount = resources[resource] || 0
              
              return (
                <Button
                  key={resource}
                  variant="outline"
                  size="sm"
                  onClick={() => sellResource(resource, Math.min(10, amount))}
                  disabled={amount < 1}
                >
                  <Icon className={cn("w-4 h-4 mr-1", resourceColors[resource as keyof typeof resourceColors])} />
                  Sell 10 for {price * 10}g
                </Button>
              )
            })}
          </div>
        </div>

        {(gameState === 'victory' || gameState === 'defeat') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold">
              {gameState === 'victory' ? '🎉 Victory!' : '⏰ Time\'s Up!'}
            </h2>
            <p className="text-lg">Final Score: {score}</p>
            {gameState === 'victory' && (
              <p className="text-sm text-muted-foreground">
                Time Bonus: {timeRemaining * 10}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  )
}

export default function ResourceManagerWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const targetScore = Object.values(levelConfig.targetGoals).reduce((sum: number, val: any) => sum + val, 0) * 10
    if (score >= targetScore * 2) return 3
    if (score >= targetScore * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="resource-manager"
      gameName="Resource Manager"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <ResourceManagerCore levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}