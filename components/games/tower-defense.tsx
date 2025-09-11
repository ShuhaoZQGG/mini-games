'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Target, Play, Pause, RotateCcw, DollarSign, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Enemy {
  id: number
  x: number
  y: number
  health: number
  maxHealth: number
  speed: number
  value: number
  pathIndex: number
  type: 'normal' | 'fast' | 'tank'
}

interface Tower {
  id: number
  x: number
  y: number
  type: 'basic' | 'sniper' | 'splash'
  damage: number
  range: number
  fireRate: number
  lastFired: number
  cost: number
}

interface Projectile {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  damage: number
  speed: number
  type: 'bullet' | 'laser' | 'bomb'
}

interface TowerDefenseConfig {
  waves: number
  startingMoney: number
  startingLives: number
  enemySpawnRate: number
  difficultyMultiplier: number
}

interface TowerDefenseCoreProps {
  levelConfig: TowerDefenseConfig
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Training Grounds',
    difficulty: 'easy',
    config: {
      waves: 5,
      startingMoney: 150,
      startingLives: 20,
      enemySpawnRate: 2000,
      difficultyMultiplier: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Forest Path',
    difficulty: 'medium',
    config: {
      waves: 8,
      startingMoney: 120,
      startingLives: 15,
      enemySpawnRate: 1800,
      difficultyMultiplier: 1.3
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Desert Defense',
    difficulty: 'hard',
    config: {
      waves: 10,
      startingMoney: 100,
      startingLives: 10,
      enemySpawnRate: 1500,
      difficultyMultiplier: 1.6
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Mountain Pass',
    difficulty: 'expert',
    config: {
      waves: 12,
      startingMoney: 80,
      startingLives: 8,
      enemySpawnRate: 1200,
      difficultyMultiplier: 2
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Ultimate Siege',
    difficulty: 'master',
    config: {
      waves: 15,
      startingMoney: 60,
      startingLives: 5,
      enemySpawnRate: 1000,
      difficultyMultiplier: 2.5
    },
    requiredStars: 12
  }
]

const GRID_SIZE = 10
const CELL_SIZE = 40
const PATH = [
  { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
  { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 },
  { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
  { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 6, y: 7 }, { x: 7, y: 7 },
  { x: 8, y: 7 }, { x: 9, y: 7 }
]

const TOWER_TYPES = {
  basic: { cost: 50, damage: 10, range: 2, fireRate: 1000, color: 'bg-blue-500' },
  sniper: { cost: 100, damage: 30, range: 4, fireRate: 2000, color: 'bg-purple-500' },
  splash: { cost: 150, damage: 15, range: 2.5, fireRate: 1500, color: 'bg-orange-500' }
}

function TowerDefenseCore({ levelConfig, onScore }: TowerDefenseCoreProps) {
  const { waves, startingMoney, startingLives, enemySpawnRate, difficultyMultiplier } = levelConfig
  
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'paused' | 'gameOver' | 'victory'>('setup')
  const [money, setMoney] = useState(startingMoney)
  const [lives, setLives] = useState(startingLives)
  const [currentWave, setCurrentWave] = useState(0)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [towers, setTowers] = useState<Tower[]>([])
  const [projectiles, setProjectiles] = useState<Projectile[]>([])
  const [selectedTowerType, setSelectedTowerType] = useState<'basic' | 'sniper' | 'splash'>('basic')
  const [score, setScore] = useState(0)
  const [enemiesKilled, setEnemiesKilled] = useState(0)
  
  const gameLoopRef = useRef<number | null>(null)
  const spawnTimerRef = useRef<number | null>(null)
  const enemyIdRef = useRef(0)
  const towerIdRef = useRef(0)
  const projectileIdRef = useRef(0)
  const lastTimeRef = useRef(0)

  const startGame = useCallback(() => {
    setGameState('playing')
    setCurrentWave(1)
    startWave(1)
  }, [])

  const startWave = useCallback((wave: number) => {
    let enemiesSpawned = 0
    const totalEnemies = 5 + wave * 2
    
    const spawnEnemy = () => {
      if (enemiesSpawned >= totalEnemies) {
        if (spawnTimerRef.current) {
          clearInterval(spawnTimerRef.current)
        }
        return
      }

      const enemyType = wave > 5 && Math.random() < 0.3 ? 
        (Math.random() < 0.5 ? 'fast' : 'tank') : 'normal'
      
      const newEnemy: Enemy = {
        id: enemyIdRef.current++,
        x: PATH[0].x * CELL_SIZE,
        y: PATH[0].y * CELL_SIZE,
        health: enemyType === 'tank' ? 50 * difficultyMultiplier : 
                enemyType === 'fast' ? 20 * difficultyMultiplier : 
                30 * difficultyMultiplier,
        maxHealth: enemyType === 'tank' ? 50 * difficultyMultiplier : 
                   enemyType === 'fast' ? 20 * difficultyMultiplier : 
                   30 * difficultyMultiplier,
        speed: enemyType === 'fast' ? 2 : 1,
        value: enemyType === 'tank' ? 20 : enemyType === 'fast' ? 15 : 10,
        pathIndex: 0,
        type: enemyType
      }
      
      setEnemies(prev => [...prev, newEnemy])
      enemiesSpawned++
    }

    spawnTimerRef.current = window.setInterval(spawnEnemy, enemySpawnRate)
  }, [enemySpawnRate, difficultyMultiplier])

  const placeTower = useCallback((gridX: number, gridY: number) => {
    const towerType = TOWER_TYPES[selectedTowerType]
    
    if (money < towerType.cost) return
    
    // Check if position is on path
    const isOnPath = PATH.some(p => p.x === gridX && p.y === gridY)
    if (isOnPath) return
    
    // Check if tower already exists at position
    const existingTower = towers.find(t => 
      Math.floor(t.x / CELL_SIZE) === gridX && 
      Math.floor(t.y / CELL_SIZE) === gridY
    )
    if (existingTower) return
    
    const newTower: Tower = {
      id: towerIdRef.current++,
      x: gridX * CELL_SIZE + CELL_SIZE / 2,
      y: gridY * CELL_SIZE + CELL_SIZE / 2,
      type: selectedTowerType,
      damage: towerType.damage,
      range: towerType.range * CELL_SIZE,
      fireRate: towerType.fireRate,
      lastFired: 0,
      cost: towerType.cost
    }
    
    setTowers(prev => [...prev, newTower])
    setMoney(prev => prev - towerType.cost)
  }, [money, selectedTowerType, towers])

  const updateGame = useCallback((currentTime: number) => {
    if (gameState !== 'playing') return
    
    const deltaTime = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime
    
    // Update enemies
    setEnemies(prev => {
      const updatedEnemies = prev.map(enemy => {
        if (enemy.pathIndex >= PATH.length - 1) {
          setLives(l => l - 1)
          return null
        }
        
        const target = PATH[enemy.pathIndex + 1]
        const dx = target.x * CELL_SIZE - enemy.x
        const dy = target.y * CELL_SIZE - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 2) {
          return { ...enemy, pathIndex: enemy.pathIndex + 1 }
        }
        
        const moveX = (dx / distance) * enemy.speed
        const moveY = (dy / distance) * enemy.speed
        
        return {
          ...enemy,
          x: enemy.x + moveX,
          y: enemy.y + moveY
        }
      }).filter(Boolean) as Enemy[]
      
      return updatedEnemies
    })
    
    // Update towers and create projectiles
    setTowers(prev => {
      prev.forEach(tower => {
        if (currentTime - tower.lastFired < tower.fireRate) return
        
        const target = enemies.find(enemy => {
          const dx = enemy.x - tower.x
          const dy = enemy.y - tower.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          return distance <= tower.range
        })
        
        if (target) {
          tower.lastFired = currentTime
          
          const newProjectile: Projectile = {
            id: projectileIdRef.current++,
            x: tower.x,
            y: tower.y,
            targetX: target.x,
            targetY: target.y,
            damage: tower.damage,
            speed: 5,
            type: tower.type === 'sniper' ? 'laser' : 
                  tower.type === 'splash' ? 'bomb' : 'bullet'
          }
          
          setProjectiles(p => [...p, newProjectile])
        }
      })
      
      return prev
    })
    
    // Update projectiles
    setProjectiles(prev => {
      return prev.map(projectile => {
        const dx = projectile.targetX - projectile.x
        const dy = projectile.targetY - projectile.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 5) {
          // Hit target
          setEnemies(e => e.map(enemy => {
            if (Math.abs(enemy.x - projectile.targetX) < 20 && 
                Math.abs(enemy.y - projectile.targetY) < 20) {
              const newHealth = enemy.health - projectile.damage
              if (newHealth <= 0) {
                setMoney(m => m + enemy.value)
                setScore(s => s + enemy.value * 10)
                setEnemiesKilled(k => k + 1)
                return null
              }
              return { ...enemy, health: newHealth }
            }
            return enemy
          }).filter(Boolean) as Enemy[])
          
          return null
        }
        
        const moveX = (dx / distance) * projectile.speed
        const moveY = (dy / distance) * projectile.speed
        
        return {
          ...projectile,
          x: projectile.x + moveX,
          y: projectile.y + moveY
        }
      }).filter(Boolean) as Projectile[]
    })
    
    // Check wave completion
    if (enemies.length === 0 && gameState === 'playing') {
      if (currentWave >= waves) {
        setGameState('victory')
        const finalScore = score + lives * 100 + money * 2
        setScore(finalScore)
        onScore(finalScore)
      } else {
        setCurrentWave(prev => prev + 1)
        setTimeout(() => startWave(currentWave + 1), 2000)
      }
    }
    
    // Check game over
    if (lives <= 0) {
      setGameState('gameOver')
      onScore(score)
    }
  }, [gameState, enemies, currentWave, waves, lives, score, onScore, startWave])

  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = (currentTime: number) => {
        updateGame(currentTime)
        gameLoopRef.current = requestAnimationFrame(gameLoop)
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current)
      }
    }
  }, [gameState, updateGame])

  const reset = useCallback(() => {
    setGameState('setup')
    setMoney(startingMoney)
    setLives(startingLives)
    setCurrentWave(0)
    setEnemies([])
    setTowers([])
    setProjectiles([])
    setScore(0)
    setEnemiesKilled(0)
    enemyIdRef.current = 0
    towerIdRef.current = 0
    projectileIdRef.current = 0
  }, [startingMoney, startingLives])

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <span className="font-bold">{money}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold">{lives}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Wave: {currentWave}/{waves}
            </div>
          </div>
          <div className="flex gap-2">
            {gameState === 'setup' && (
              <Button onClick={startGame} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {gameState === 'playing' && (
              <Button 
                onClick={() => setGameState('paused')} 
                size="sm"
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {gameState === 'paused' && (
              <Button 
                onClick={() => setGameState('playing')} 
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            <Button onClick={reset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {gameState === 'setup' && (
          <div className="space-y-2">
            <h3 className="font-semibold">Select Tower Type:</h3>
            <div className="flex gap-2">
              {Object.entries(TOWER_TYPES).map(([type, config]) => (
                <Button
                  key={type}
                  variant={selectedTowerType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTowerType(type as keyof typeof TOWER_TYPES)}
                  disabled={money < config.cost}
                >
                  <div className="text-xs">
                    <div>{type}</div>
                    <div>${config.cost}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="relative bg-green-50 rounded-lg p-4" 
             style={{ width: GRID_SIZE * CELL_SIZE + 32, height: GRID_SIZE * CELL_SIZE + 32 }}>
          {/* Grid */}
          <div className="absolute inset-4 grid grid-cols-10 gap-0">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE
              const y = Math.floor(i / GRID_SIZE)
              const isPath = PATH.some(p => p.x === x && p.y === y)
              
              return (
                <div
                  key={i}
                  className={cn(
                    "border border-gray-200 cursor-pointer hover:bg-gray-100",
                    isPath && "bg-yellow-100 cursor-not-allowed hover:bg-yellow-100"
                  )}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  onClick={() => !isPath && gameState !== 'gameOver' && placeTower(x, y)}
                />
              )
            })}
          </div>

          {/* Towers */}
          <AnimatePresence>
            {towers.map(tower => (
              <motion.div
                key={tower.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  "absolute w-8 h-8 rounded-full flex items-center justify-center",
                  TOWER_TYPES[tower.type].color
                )}
                style={{
                  left: tower.x - 16 + 16,
                  top: tower.y - 16 + 16
                }}
              >
                {tower.type === 'basic' && <Shield className="w-4 h-4 text-white" />}
                {tower.type === 'sniper' && <Target className="w-4 h-4 text-white" />}
                {tower.type === 'splash' && <Zap className="w-4 h-4 text-white" />}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Enemies */}
          <AnimatePresence>
            {enemies.map(enemy => (
              <motion.div
                key={enemy.id}
                className={cn(
                  "absolute w-6 h-6 rounded-full",
                  enemy.type === 'fast' ? "bg-yellow-500" :
                  enemy.type === 'tank' ? "bg-gray-700" :
                  "bg-red-500"
                )}
                style={{
                  left: enemy.x - 12 + 16,
                  top: enemy.y - 12 + 16
                }}
              >
                <div className="absolute -top-2 left-0 w-6 h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Projectiles */}
          <AnimatePresence>
            {projectiles.map(projectile => (
              <motion.div
                key={projectile.id}
                className={cn(
                  "absolute rounded-full",
                  projectile.type === 'laser' ? "w-2 h-2 bg-purple-400" :
                  projectile.type === 'bomb' ? "w-3 h-3 bg-orange-400" :
                  "w-1 h-1 bg-blue-400"
                )}
                style={{
                  left: projectile.x - 2 + 16,
                  top: projectile.y - 2 + 16
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {(gameState === 'gameOver' || gameState === 'victory') && (
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {gameState === 'victory' ? '🎉 Victory!' : '💀 Game Over'}
            </h2>
            <p className="text-lg">Final Score: {score}</p>
            <p className="text-sm text-muted-foreground">
              Enemies Killed: {enemiesKilled}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function TowerDefenseWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const baseScore = levelConfig.waves * 100
    if (score >= baseScore * 2) return 3
    if (score >= baseScore * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="tower-defense"
      gameName="Tower Defense Lite"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <TowerDefenseCore levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}