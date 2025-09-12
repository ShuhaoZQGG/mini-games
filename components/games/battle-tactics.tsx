'use client'

import { useState, useCallback, useEffect } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Shield, Heart, Zap, Move, RotateCcw, Trophy, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Unit {
  id: number
  team: 'player' | 'enemy'
  type: 'warrior' | 'archer' | 'mage' | 'tank'
  x: number
  y: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  range: number
  movement: number
  hasActed: boolean
  icon: typeof Sword
}

interface BattleTacticsConfig {
  gridSize: number
  playerUnits: number
  enemyUnits: number
  aiDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  turnLimit: number
}

interface BattleTacticsCoreProps {
  levelConfig: BattleTacticsConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Training Battle',
    difficulty: 'easy',
    config: {
      gridSize: 6,
      playerUnits: 3,
      enemyUnits: 2,
      aiDifficulty: 'easy',
      turnLimit: 20
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Skirmish',
    difficulty: 'medium',
    config: {
      gridSize: 7,
      playerUnits: 4,
      enemyUnits: 4,
      aiDifficulty: 'medium',
      turnLimit: 25
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Battlefield',
    difficulty: 'hard',
    config: {
      gridSize: 8,
      playerUnits: 5,
      enemyUnits: 5,
      aiDifficulty: 'hard',
      turnLimit: 30
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'War Zone',
    difficulty: 'expert',
    config: {
      gridSize: 9,
      playerUnits: 6,
      enemyUnits: 7,
      aiDifficulty: 'expert',
      turnLimit: 35
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Epic Battle',
    difficulty: 'master',
    config: {
      gridSize: 10,
      playerUnits: 7,
      enemyUnits: 8,
      aiDifficulty: 'expert',
      turnLimit: 40
    },
    requiredStars: 12
  }
]

const UNIT_TYPES = {
  warrior: { health: 100, attack: 25, defense: 15, range: 1, movement: 3, icon: Sword, color: 'bg-red-500' },
  archer: { health: 70, attack: 20, defense: 10, range: 3, movement: 2, icon: Target, color: 'bg-green-500' },
  mage: { health: 60, attack: 30, defense: 5, range: 2, movement: 2, icon: Zap, color: 'bg-purple-500' },
  tank: { health: 150, attack: 15, defense: 25, range: 1, movement: 2, icon: Shield, color: 'bg-gray-500' }
}

function createUnit(id: number, team: 'player' | 'enemy', type: keyof typeof UNIT_TYPES, x: number, y: number): Unit {
  const unitType = UNIT_TYPES[type]
  return {
    id,
    team,
    type,
    x,
    y,
    health: unitType.health,
    maxHealth: unitType.health,
    attack: unitType.attack,
    defense: unitType.defense,
    range: unitType.range,
    movement: unitType.movement,
    hasActed: false,
    icon: unitType.icon
  }
}

function BattleTacticsCore({ levelConfig, onScore }: BattleTacticsCoreProps) {
  const { gridSize, playerUnits, enemyUnits, aiDifficulty, turnLimit } = levelConfig
  
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing')
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('player')
  const [turnCount, setTurnCount] = useState(0)
  const [score, setScore] = useState(0)
  const [actionMode, setActionMode] = useState<'move' | 'attack' | null>(null)
  const [validMoves, setValidMoves] = useState<{x: number, y: number}[]>([])
  const [validTargets, setValidTargets] = useState<{x: number, y: number}[]>([])

  // Initialize units
  useEffect(() => {
    const newUnits: Unit[] = []
    let unitId = 0
    
    // Create player units
    const playerTypes: (keyof typeof UNIT_TYPES)[] = ['warrior', 'archer', 'mage', 'tank']
    for (let i = 0; i < playerUnits; i++) {
      const type = playerTypes[i % playerTypes.length]
      const x = i % gridSize
      const y = gridSize - 1 - Math.floor(i / gridSize)
      newUnits.push(createUnit(unitId++, 'player', type, x, y))
    }
    
    // Create enemy units
    for (let i = 0; i < enemyUnits; i++) {
      const type = playerTypes[Math.floor(Math.random() * playerTypes.length)]
      const x = (gridSize - 1) - (i % gridSize)
      const y = Math.floor(i / gridSize)
      newUnits.push(createUnit(unitId++, 'enemy', type, x, y))
    }
    
    setUnits(newUnits)
  }, [gridSize, playerUnits, enemyUnits])

  const getDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }, [])

  const getUnitAt = useCallback((x: number, y: number) => {
    return units.find(u => u.x === x && u.y === y && u.health > 0)
  }, [units])

  const calculateValidMoves = useCallback((unit: Unit) => {
    const moves: {x: number, y: number}[] = []
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const distance = getDistance(unit.x, unit.y, x, y)
        if (distance <= unit.movement && !getUnitAt(x, y)) {
          moves.push({x, y})
        }
      }
    }
    
    return moves
  }, [gridSize, getDistance, getUnitAt])

  const calculateValidTargets = useCallback((unit: Unit) => {
    const targets: {x: number, y: number}[] = []
    
    units.forEach(target => {
      if (target.team !== unit.team && target.health > 0) {
        const distance = getDistance(unit.x, unit.y, target.x, target.y)
        if (distance <= unit.range) {
          targets.push({x: target.x, y: target.y})
        }
      }
    })
    
    return targets
  }, [units, getDistance])

  const handleUnitClick = useCallback((unit: Unit) => {
    if (currentTurn !== 'player') return
    
    if (unit.team === 'player' && !unit.hasActed) {
      setSelectedUnit(unit)
      setActionMode(null)
      setValidMoves([])
      setValidTargets([])
    } else if (unit.team === 'enemy' && selectedUnit && actionMode === 'attack') {
      // Attack enemy unit
      const distance = getDistance(selectedUnit.x, selectedUnit.y, unit.x, unit.y)
      if (distance <= selectedUnit.range) {
        performAttack(selectedUnit, unit)
      }
    }
  }, [currentTurn, selectedUnit, actionMode, getDistance])

  const performAttack = useCallback((attacker: Unit, defender: Unit) => {
    const damage = Math.max(1, attacker.attack - defender.defense / 2)
    const actualDamage = Math.floor(damage * (0.8 + Math.random() * 0.4))
    
    setUnits(prev => prev.map(u => {
      if (u.id === defender.id) {
        return { ...u, health: Math.max(0, u.health - actualDamage) }
      }
      if (u.id === attacker.id) {
        return { ...u, hasActed: true }
      }
      return u
    }))
    
    setScore(prev => prev + actualDamage * 2)
    
    setSelectedUnit(null)
    setActionMode(null)
    setValidTargets([])
    
    // Check if turn should end
    checkTurnEnd()
  }, [])

  const moveUnit = useCallback((unit: Unit, x: number, y: number) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unit.id) {
        return { ...u, x, y, hasActed: true }
      }
      return u
    }))
    
    setSelectedUnit(null)
    setActionMode(null)
    setValidMoves([])
    
    checkTurnEnd()
  }, [])

  const handleCellClick = useCallback((x: number, y: number) => {
    if (!selectedUnit || currentTurn !== 'player') return
    
    if (actionMode === 'move') {
      const isValidMove = validMoves.some(m => m.x === x && m.y === y)
      if (isValidMove) {
        moveUnit(selectedUnit, x, y)
      }
    } else if (actionMode === 'attack') {
      const target = getUnitAt(x, y)
      if (target && target.team === 'enemy') {
        const isValidTarget = validTargets.some(t => t.x === x && t.y === y)
        if (isValidTarget) {
          performAttack(selectedUnit, target)
        }
      }
    }
  }, [selectedUnit, currentTurn, actionMode, validMoves, validTargets, moveUnit, getUnitAt, performAttack])

  const checkTurnEnd = useCallback(() => {
    const playerUnitsLeft = units.filter(u => u.team === 'player' && !u.hasActed && u.health > 0)
    if (playerUnitsLeft.length === 0) {
      endTurn()
    }
  }, [units])

  const endTurn = useCallback(() => {
    setTurnCount(prev => prev + 1)
    
    // Reset units for next turn
    setUnits(prev => prev.map(u => ({ ...u, hasActed: false })))
    
    if (currentTurn === 'player') {
      setCurrentTurn('enemy')
      setTimeout(() => performAITurn(), 1000)
    } else {
      setCurrentTurn('player')
    }
    
    setSelectedUnit(null)
    setActionMode(null)
    setValidMoves([])
    setValidTargets([])
  }, [currentTurn])

  const performAITurn = useCallback(() => {
    const enemyUnits = units.filter(u => u.team === 'enemy' && u.health > 0)
    const playerUnitsAlive = units.filter(u => u.team === 'player' && u.health > 0)
    
    enemyUnits.forEach((unit, index) => {
      setTimeout(() => {
        // Find closest player unit
        let closestTarget: Unit | null = null
        let minDistance = Infinity
        
        playerUnitsAlive.forEach(player => {
          const distance = getDistance(unit.x, unit.y, player.x, player.y)
          if (distance < minDistance) {
            minDistance = distance
            closestTarget = player
          }
        })
        
        if (!closestTarget) {
          if (index === enemyUnits.length - 1) {
            setTimeout(() => endTurn(), 500)
          }
          return
        }
        
        const target: Unit = closestTarget // Explicit type assertion
        
        // If in range, attack
        if (minDistance <= unit.range) {
          performAttack(unit, target)
        } else {
          // Move towards target
          const dx = Math.sign(target.x - unit.x)
          const dy = Math.sign(target.y - unit.y)
          
          let newX = unit.x
          let newY = unit.y
          let moved = 0
          
          while (moved < unit.movement) {
            const testX = newX + dx
            const testY = newY + dy
            
            if (testX >= 0 && testX < gridSize && !getUnitAt(testX, newY)) {
              newX = testX
              moved++
            } else if (testY >= 0 && testY < gridSize && !getUnitAt(newX, testY)) {
              newY = testY
              moved++
            } else {
              break
            }
          }
          
          if (newX !== unit.x || newY !== unit.y) {
            moveUnit(unit, newX, newY)
          }
        }
        
        if (index === enemyUnits.length - 1) {
          setTimeout(() => endTurn(), 500)
        }
      }, index * 1000)
    })
  }, [units, gridSize, getDistance, getUnitAt, performAttack, moveUnit, endTurn])

  // Check victory/defeat conditions
  useEffect(() => {
    const playerUnitsAlive = units.filter(u => u.team === 'player' && u.health > 0).length
    const enemyUnitsAlive = units.filter(u => u.team === 'enemy' && u.health > 0).length
    
    if (units.length > 0) {
      if (playerUnitsAlive === 0) {
        setGameState('defeat')
        onScore(score)
      } else if (enemyUnitsAlive === 0) {
        setGameState('victory')
        const turnBonus = Math.max(0, (turnLimit - turnCount) * 50)
        const healthBonus = units
          .filter(u => u.team === 'player' && u.health > 0)
          .reduce((sum, u) => sum + u.health, 0)
        const finalScore = score + turnBonus + healthBonus
        setScore(finalScore)
        onScore(finalScore)
      } else if (turnCount >= turnLimit) {
        setGameState('defeat')
        onScore(score)
      }
    }
  }, [units, turnCount, turnLimit, score, onScore])

  const reset = useCallback(() => {
    setGameState('playing')
    setSelectedUnit(null)
    setCurrentTurn('player')
    setTurnCount(0)
    setScore(0)
    setActionMode(null)
    setValidMoves([])
    setValidTargets([])
    
    // Reinitialize units
    const newUnits: Unit[] = []
    let unitId = 0
    
    const playerTypes: (keyof typeof UNIT_TYPES)[] = ['warrior', 'archer', 'mage', 'tank']
    for (let i = 0; i < playerUnits; i++) {
      const type = playerTypes[i % playerTypes.length]
      const x = i % gridSize
      const y = gridSize - 1 - Math.floor(i / gridSize)
      newUnits.push(createUnit(unitId++, 'player', type, x, y))
    }
    
    for (let i = 0; i < enemyUnits; i++) {
      const type = playerTypes[Math.floor(Math.random() * playerTypes.length)]
      const x = (gridSize - 1) - (i % gridSize)
      const y = Math.floor(i / gridSize)
      newUnits.push(createUnit(unitId++, 'enemy', type, x, y))
    }
    
    setUnits(newUnits)
  }, [gridSize, playerUnits, enemyUnits])

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="font-bold">Turn: {turnCount}/{turnLimit}</span>
            <span className={cn(
              "font-bold",
              currentTurn === 'player' ? "text-blue-500" : "text-red-500"
            )}>
              {currentTurn === 'player' ? 'Your Turn' : 'Enemy Turn'}
            </span>
            <span>Score: {score}</span>
          </div>
          <div className="flex gap-2">
            {currentTurn === 'player' && (
              <Button onClick={endTurn} size="sm" variant="outline">
                End Turn
              </Button>
            )}
            <Button onClick={reset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {selectedUnit && (
          <div className="bg-slate-100 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <selectedUnit.icon className="w-5 h-5" />
                <span className="font-semibold capitalize">{selectedUnit.type}</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm">{selectedUnit.health}/{selectedUnit.maxHealth}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={actionMode === 'move' ? 'default' : 'outline'}
                  onClick={() => {
                    setActionMode('move')
                    setValidMoves(calculateValidMoves(selectedUnit))
                    setValidTargets([])
                  }}
                >
                  <Move className="w-4 h-4 mr-1" />
                  Move
                </Button>
                <Button
                  size="sm"
                  variant={actionMode === 'attack' ? 'default' : 'outline'}
                  onClick={() => {
                    setActionMode('attack')
                    setValidTargets(calculateValidTargets(selectedUnit))
                    setValidMoves([])
                  }}
                >
                  <Sword className="w-4 h-4 mr-1" />
                  Attack
                </Button>
              </div>
            </div>
          </div>
        )}

        <div 
          className="grid gap-1 bg-slate-200 p-4 rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize
            const y = Math.floor(index / gridSize)
            const unit = getUnitAt(x, y)
            const isValidMove = validMoves.some(m => m.x === x && m.y === y)
            const isValidTarget = validTargets.some(t => t.x === x && t.y === y)
            
            return (
              <motion.div
                key={index}
                className={cn(
                  "relative border-2 rounded cursor-pointer transition-all",
                  "hover:border-gray-400",
                  isValidMove && "bg-green-200 border-green-400",
                  isValidTarget && "bg-red-200 border-red-400",
                  !isValidMove && !isValidTarget && "bg-white border-gray-300"
                )}
                onClick={() => unit ? handleUnitClick(unit) : handleCellClick(x, y)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {unit && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={cn(
                        "absolute inset-1 rounded flex flex-col items-center justify-center",
                        unit.team === 'player' ? UNIT_TYPES[unit.type].color : 'bg-red-600',
                        unit.hasActed && "opacity-50",
                        selectedUnit?.id === unit.id && "ring-2 ring-yellow-400"
                      )}
                    >
                      <unit.icon className="w-4 h-4 text-white" />
                      <div className="w-full bg-gray-200 h-1 mt-1 rounded-full">
                        <div
                          className="bg-green-500 h-1 rounded-full"
                          style={{ width: `${(unit.health / unit.maxHealth) * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            )
          })}
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
            {gameState === 'victory' && (
              <p className="text-sm text-muted-foreground">
                Completed in {turnCount} turns
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  )
}

export default function BattleTacticsWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const baseScore = levelConfig.playerUnits * 100
    if (score >= baseScore * 2) return 3
    if (score >= baseScore * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="battle-tactics"
      gameName="Battle Tactics"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <BattleTacticsCore levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}