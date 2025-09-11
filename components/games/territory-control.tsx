'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, Shield, Swords, Play, RotateCcw, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Territory {
  id: number
  owner: 'player' | 'ai' | 'neutral'
  troops: number
  x: number
  y: number
  connections: number[]
  isCapital?: boolean
}

interface TerritoryControlConfig {
  mapSize: number
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  startingTroops: number
  reinforcementRate: number
  victoryPercentage: number
}

interface TerritoryControlCoreProps {
  levelConfig: TerritoryControlConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Small Skirmish',
    difficulty: 'easy',
    config: {
      mapSize: 6,
      aiDifficulty: 'easy',
      startingTroops: 10,
      reinforcementRate: 3,
      victoryPercentage: 60
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Border Conflict',
    difficulty: 'medium',
    config: {
      mapSize: 8,
      aiDifficulty: 'medium',
      startingTroops: 15,
      reinforcementRate: 4,
      victoryPercentage: 65
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Continental War',
    difficulty: 'hard',
    config: {
      mapSize: 10,
      aiDifficulty: 'hard',
      startingTroops: 20,
      reinforcementRate: 5,
      victoryPercentage: 70
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'World Domination',
    difficulty: 'expert',
    config: {
      mapSize: 12,
      aiDifficulty: 'expert',
      startingTroops: 25,
      reinforcementRate: 6,
      victoryPercentage: 75
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Ultimate Conquest',
    difficulty: 'master',
    config: {
      mapSize: 15,
      aiDifficulty: 'expert',
      startingTroops: 30,
      reinforcementRate: 8,
      victoryPercentage: 80
    },
    requiredStars: 12
  }
]

function generateMap(size: number): Territory[] {
  const territories: Territory[] = []
  const gridSize = Math.ceil(Math.sqrt(size))
  
  for (let i = 0; i < size; i++) {
    const x = (i % gridSize) * 100 + 50
    const y = Math.floor(i / gridSize) * 100 + 50
    
    // Generate connections (adjacent territories)
    const connections: number[] = []
    if (i % gridSize > 0 && i - 1 >= 0) connections.push(i - 1) // left
    if (i % gridSize < gridSize - 1 && i + 1 < size) connections.push(i + 1) // right
    if (i - gridSize >= 0) connections.push(i - gridSize) // up
    if (i + gridSize < size) connections.push(i + gridSize) // down
    
    territories.push({
      id: i,
      owner: 'neutral',
      troops: 5,
      x,
      y,
      connections
    })
  }
  
  // Set starting positions
  territories[0].owner = 'player'
  territories[0].troops = 20
  territories[0].isCapital = true
  
  territories[size - 1].owner = 'ai'
  territories[size - 1].troops = 20
  territories[size - 1].isCapital = true
  
  return territories
}

function TerritoryControlCore({ levelConfig, onScore }: TerritoryControlCoreProps) {
  const { mapSize, aiDifficulty, startingTroops, reinforcementRate, victoryPercentage } = levelConfig
  
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'victory' | 'defeat'>('playing')
  const [territories, setTerritories] = useState<Territory[]>(() => generateMap(mapSize))
  const [selectedTerritory, setSelectedTerritory] = useState<number | null>(null)
  const [turn, setTurn] = useState<'player' | 'ai'>('player')
  const [turnCount, setTurnCount] = useState(0)
  const [score, setScore] = useState(0)
  const [actionPoints, setActionPoints] = useState(3)
  
  const aiThinkingRef = useRef<NodeJS.Timeout | null>(null)

  const getTerritoryCounts = useCallback(() => {
    const counts = { player: 0, ai: 0, neutral: 0 }
    territories.forEach(t => {
      counts[t.owner]++
    })
    return counts
  }, [territories])

  const calculateReinforcements = useCallback((owner: 'player' | 'ai') => {
    const ownedTerritories = territories.filter(t => t.owner === owner)
    return Math.floor(ownedTerritories.length / 2) + reinforcementRate
  }, [territories, reinforcementRate])

  const attack = useCallback((fromId: number, toId: number) => {
    const from = territories.find(t => t.id === fromId)
    const to = territories.find(t => t.id === toId)
    
    if (!from || !to) return false
    if (from.owner !== 'player') return false
    if (from.troops <= 1) return false
    if (!from.connections.includes(toId)) return false
    
    const attackingTroops = Math.floor(from.troops * 0.8)
    const defendingTroops = to.troops
    
    // Simple combat resolution
    const attackRoll = Math.random() * attackingTroops
    const defenseRoll = Math.random() * defendingTroops * 1.2 // Defender advantage
    
    setTerritories(prev => prev.map(t => {
      if (t.id === fromId) {
        return { ...t, troops: Math.ceil(from.troops * 0.2) }
      }
      if (t.id === toId) {
        if (attackRoll > defenseRoll) {
          // Attacker wins
          const remainingTroops = Math.ceil(attackingTroops - defenseRoll / 2)
          setScore(s => s + 100)
          return { ...t, owner: 'player', troops: remainingTroops }
        } else {
          // Defender wins
          const remainingTroops = Math.ceil(defendingTroops - attackRoll / 2)
          return { ...t, troops: Math.max(1, remainingTroops) }
        }
      }
      return t
    }))
    
    return true
  }, [territories])

  const reinforce = useCallback((territoryId: number, troops: number) => {
    setTerritories(prev => prev.map(t => {
      if (t.id === territoryId && t.owner === 'player') {
        return { ...t, troops: t.troops + troops }
      }
      return t
    }))
  }, [])

  const aiTurn = useCallback(() => {
    const aiTerritories = territories.filter(t => t.owner === 'ai')
    const reinforcements = calculateReinforcements('ai')
    
    // Distribute reinforcements
    aiTerritories.forEach((territory, index) => {
      if (index < reinforcements) {
        territory.troops += 1
      }
    })
    
    // AI attack logic based on difficulty
    const aggressiveness = 
      aiDifficulty === 'easy' ? 0.3 :
      aiDifficulty === 'medium' ? 0.5 :
      aiDifficulty === 'hard' ? 0.7 : 0.9
    
    aiTerritories.forEach(territory => {
      if (Math.random() < aggressiveness && territory.troops > 3) {
        const targets = territory.connections
          .map(id => territories.find(t => t.id === id))
          .filter(t => t && t.owner !== 'ai') as Territory[]
        
        if (targets.length > 0) {
          const target = targets.reduce((weakest, current) => 
            current.troops < weakest.troops ? current : weakest
          )
          
          const attackingTroops = Math.floor(territory.troops * 0.8)
          const defendingTroops = target.troops
          
          const attackRoll = Math.random() * attackingTroops * 1.1 // AI bonus
          const defenseRoll = Math.random() * defendingTroops
          
          setTerritories(prev => prev.map(t => {
            if (t.id === territory.id) {
              return { ...t, troops: Math.ceil(territory.troops * 0.2) }
            }
            if (t.id === target.id) {
              if (attackRoll > defenseRoll) {
                const remainingTroops = Math.ceil(attackingTroops - defenseRoll / 2)
                return { ...t, owner: 'ai', troops: remainingTroops }
              } else {
                const remainingTroops = Math.ceil(defendingTroops - attackRoll / 2)
                return { ...t, troops: Math.max(1, remainingTroops) }
              }
            }
            return t
          }))
        }
      }
    })
    
    setTurn('player')
    setActionPoints(3)
  }, [territories, aiDifficulty, calculateReinforcements])

  const endTurn = useCallback(() => {
    // Add reinforcements
    const reinforcements = calculateReinforcements('player')
    const playerTerritories = territories.filter(t => t.owner === 'player')
    
    if (playerTerritories.length > 0) {
      const capital = playerTerritories.find(t => t.isCapital) || playerTerritories[0]
      reinforce(capital.id, reinforcements)
    }
    
    setTurn('ai')
    setTurnCount(prev => prev + 1)
    
    aiThinkingRef.current = setTimeout(() => {
      aiTurn()
    }, 1000)
  }, [calculateReinforcements, territories, reinforce, aiTurn])

  const handleTerritoryClick = useCallback((territoryId: number) => {
    if (turn !== 'player' || actionPoints <= 0) return
    
    const territory = territories.find(t => t.id === territoryId)
    if (!territory) return
    
    if (selectedTerritory === null) {
      if (territory.owner === 'player') {
        setSelectedTerritory(territoryId)
      }
    } else {
      const from = territories.find(t => t.id === selectedTerritory)
      if (!from) return
      
      if (territoryId === selectedTerritory) {
        setSelectedTerritory(null)
      } else if (territory.owner === 'player') {
        setSelectedTerritory(territoryId)
      } else if (from.connections.includes(territoryId)) {
        if (attack(selectedTerritory, territoryId)) {
          setActionPoints(prev => prev - 1)
          setSelectedTerritory(null)
        }
      }
    }
  }, [selectedTerritory, territories, turn, actionPoints, attack])

  useEffect(() => {
    const counts = getTerritoryCounts()
    const totalTerritories = territories.length
    const playerPercentage = (counts.player / totalTerritories) * 100
    const aiPercentage = (counts.ai / totalTerritories) * 100
    
    if (playerPercentage >= victoryPercentage) {
      setGameState('victory')
      const finalScore = score + counts.player * 50 + (100 - turnCount) * 10
      setScore(finalScore)
      onScore(finalScore)
    } else if (aiPercentage >= victoryPercentage || counts.player === 0) {
      setGameState('defeat')
      onScore(score)
    }
  }, [territories, victoryPercentage, score, turnCount, onScore, getTerritoryCounts])

  useEffect(() => {
    return () => {
      if (aiThinkingRef.current) {
        clearTimeout(aiThinkingRef.current)
      }
    }
  }, [])

  const reset = useCallback(() => {
    setGameState('playing')
    setTerritories(generateMap(mapSize))
    setSelectedTerritory(null)
    setTurn('player')
    setTurnCount(0)
    setScore(0)
    setActionPoints(3)
  }, [mapSize])

  const counts = getTerritoryCounts()

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="font-bold">Player: {counts.player}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="font-bold">AI: {counts.ai}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded" />
              <span>Neutral: {counts.neutral}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              Turn {turnCount} | Actions: {actionPoints}
            </span>
            <Button 
              onClick={endTurn} 
              size="sm"
              disabled={turn !== 'player'}
            >
              End Turn
            </Button>
            <Button onClick={reset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {turn === 'player' ? 'Your Turn' : 'AI Thinking...'}
        </div>

        <div 
          className="relative bg-slate-100 rounded-lg p-8"
          style={{ height: '500px' }}
        >
          <svg 
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 500 500"
          >
            {/* Draw connections */}
            {territories.map(territory => 
              territory.connections.map(connId => {
                const conn = territories.find(t => t.id === connId)
                if (!conn || territory.id > connId) return null
                
                return (
                  <line
                    key={`${territory.id}-${connId}`}
                    x1={territory.x}
                    y1={territory.y}
                    x2={conn.x}
                    y2={conn.y}
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                )
              })
            )}
          </svg>

          {/* Territories */}
          <AnimatePresence>
            {territories.map(territory => (
              <motion.div
                key={territory.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute w-16 h-16 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all",
                  territory.owner === 'player' && "bg-blue-500 hover:bg-blue-600",
                  territory.owner === 'ai' && "bg-red-500 hover:bg-red-600",
                  territory.owner === 'neutral' && "bg-gray-400 hover:bg-gray-500",
                  selectedTerritory === territory.id && "ring-4 ring-yellow-400",
                  selectedTerritory !== null && 
                    territories.find(t => t.id === selectedTerritory)?.connections.includes(territory.id) &&
                    territory.owner !== 'player' && "ring-2 ring-orange-400"
                )}
                style={{
                  left: territory.x - 32,
                  top: territory.y - 32
                }}
                onClick={() => handleTerritoryClick(territory.id)}
              >
                {territory.isCapital && (
                  <Flag className="w-4 h-4 text-white mb-1" />
                )}
                <span className="text-white font-bold text-lg">
                  {territory.troops}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {(gameState === 'victory' || gameState === 'defeat') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold">
              {gameState === 'victory' ? '🎉 Victory!' : '💀 Defeat'}
            </h2>
            <p className="text-lg">Final Score: {score}</p>
            <p className="text-sm text-muted-foreground">
              Completed in {turnCount} turns
            </p>
          </motion.div>
        )}
      </div>
    </Card>
  )
}

export default function TerritoryControlWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const baseScore = levelConfig.mapSize * 50
    if (score >= baseScore * 2) return 3
    if (score >= baseScore * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="territory-control"
      gameName="Territory Control"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <TerritoryControlCore levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}