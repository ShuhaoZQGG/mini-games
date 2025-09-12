'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, Map, Sword, Shield } from 'lucide-react'

interface Territory {
  id: string
  name: string
  continent: string
  owner: number
  armies: number
  neighbors: string[]
  x: number
  y: number
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  territories: Territory[]
  currentPlayer: number
  phase: 'placement' | 'attack' | 'fortify'
  reinforcements: number
  selectedTerritory: string | null
  targetTerritory: string | null
  turnCount: number
}

const CONTINENTS = {
  'North America': { bonus: 5, territories: ['Alaska', 'Alberta', 'Central America', 'Eastern US', 'Greenland', 'Northwest', 'Ontario', 'Quebec', 'Western US'] },
  'South America': { bonus: 2, territories: ['Argentina', 'Brazil', 'Peru', 'Venezuela'] },
  'Europe': { bonus: 5, territories: ['Britain', 'Iceland', 'Northern Europe', 'Scandinavia', 'Southern Europe', 'Ukraine', 'Western Europe'] },
  'Africa': { bonus: 3, territories: ['Congo', 'East Africa', 'Egypt', 'Madagascar', 'North Africa', 'South Africa'] },
  'Asia': { bonus: 7, territories: ['Afghanistan', 'China', 'India', 'Irkutsk', 'Japan', 'Kamchatka', 'Middle East', 'Mongolia', 'Siam', 'Siberia', 'Ural', 'Yakutsk'] },
  'Australia': { bonus: 2, territories: ['Eastern Australia', 'Indonesia', 'New Guinea', 'Western Australia'] }
}

const createTerritories = (): Territory[] => {
  const territories: Territory[] = [
    // North America
    { id: 'Alaska', name: 'Alaska', continent: 'North America', owner: 0, armies: 1, neighbors: ['Northwest', 'Alberta', 'Kamchatka'], x: 50, y: 100 },
    { id: 'Alberta', name: 'Alberta', continent: 'North America', owner: 0, armies: 1, neighbors: ['Alaska', 'Northwest', 'Ontario', 'Western US'], x: 120, y: 120 },
    { id: 'Central America', name: 'Central America', continent: 'North America', owner: 0, armies: 1, neighbors: ['Western US', 'Eastern US', 'Venezuela'], x: 120, y: 250 },
    { id: 'Eastern US', name: 'Eastern US', continent: 'North America', owner: 0, armies: 1, neighbors: ['Central America', 'Western US', 'Ontario', 'Quebec'], x: 180, y: 180 },
    { id: 'Greenland', name: 'Greenland', continent: 'North America', owner: 0, armies: 1, neighbors: ['Northwest', 'Ontario', 'Quebec', 'Iceland'], x: 280, y: 50 },
    { id: 'Northwest', name: 'Northwest', continent: 'North America', owner: 0, armies: 1, neighbors: ['Alaska', 'Alberta', 'Ontario', 'Greenland'], x: 150, y: 80 },
    { id: 'Ontario', name: 'Ontario', continent: 'North America', owner: 0, armies: 1, neighbors: ['Northwest', 'Alberta', 'Greenland', 'Quebec', 'Eastern US', 'Western US'], x: 180, y: 120 },
    { id: 'Quebec', name: 'Quebec', continent: 'North America', owner: 0, armies: 1, neighbors: ['Ontario', 'Greenland', 'Eastern US'], x: 220, y: 120 },
    { id: 'Western US', name: 'Western US', continent: 'North America', owner: 0, armies: 1, neighbors: ['Alberta', 'Ontario', 'Eastern US', 'Central America'], x: 120, y: 180 },
    
    // South America (simplified)
    { id: 'Venezuela', name: 'Venezuela', continent: 'South America', owner: 0, armies: 1, neighbors: ['Central America', 'Brazil', 'Peru'], x: 180, y: 300 },
    { id: 'Brazil', name: 'Brazil', continent: 'South America', owner: 0, armies: 1, neighbors: ['Venezuela', 'Peru', 'Argentina', 'North Africa'], x: 230, y: 350 },
    { id: 'Peru', name: 'Peru', continent: 'South America', owner: 0, armies: 1, neighbors: ['Venezuela', 'Brazil', 'Argentina'], x: 180, y: 380 },
    { id: 'Argentina', name: 'Argentina', continent: 'South America', owner: 0, armies: 1, neighbors: ['Peru', 'Brazil'], x: 180, y: 450 },
    
    // Europe (simplified)
    { id: 'Iceland', name: 'Iceland', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Greenland', 'Britain', 'Scandinavia'], x: 380, y: 80 },
    { id: 'Britain', name: 'Britain', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Iceland', 'Scandinavia', 'Northern Europe', 'Western Europe'], x: 380, y: 140 },
    { id: 'Scandinavia', name: 'Scandinavia', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Iceland', 'Britain', 'Northern Europe', 'Ukraine'], x: 450, y: 100 },
    { id: 'Northern Europe', name: 'Northern Europe', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Britain', 'Scandinavia', 'Ukraine', 'Southern Europe', 'Western Europe'], x: 450, y: 160 },
    { id: 'Western Europe', name: 'Western Europe', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Britain', 'Northern Europe', 'Southern Europe', 'North Africa'], x: 380, y: 200 },
    { id: 'Southern Europe', name: 'Southern Europe', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Western Europe', 'Northern Europe', 'Ukraine', 'Middle East', 'Egypt', 'North Africa'], x: 450, y: 220 },
    { id: 'Ukraine', name: 'Ukraine', continent: 'Europe', owner: 0, armies: 1, neighbors: ['Scandinavia', 'Northern Europe', 'Southern Europe', 'Middle East', 'Afghanistan', 'Ural'], x: 520, y: 160 }
  ]
  
  return territories
}

export default function OnlineRisk() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    territories: [],
    currentPlayer: 1,
    phase: 'placement',
    reinforcements: 0,
    selectedTerritory: null,
    targetTerritory: null,
    turnCount: 0
  })

  const initializeGame = () => {
    const territories = createTerritories()
    
    // Randomly assign territories
    const shuffled = [...territories]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    // Assign to players (simplified 2 players)
    shuffled.forEach((territory, index) => {
      territory.owner = (index % 2) + 1
      territory.armies = 3
    })
    
    return shuffled
  }

  const calculateReinforcements = (player: number): number => {
    const playerTerritories = gameState.territories.filter(t => t.owner === player)
    let reinforcements = Math.max(3, Math.floor(playerTerritories.length / 3))
    
    // Check for continent bonuses
    Object.entries(CONTINENTS).forEach(([continent, data]) => {
      const continentTerritories = gameState.territories.filter(t => t.continent === continent)
      if (continentTerritories.every(t => t.owner === player)) {
        reinforcements += data.bonus
      }
    })
    
    return reinforcements
  }

  const attack = (from: string, to: string) => {
    const attacker = gameState.territories.find(t => t.id === from)
    const defender = gameState.territories.find(t => t.id === to)
    
    if (!attacker || !defender || attacker.armies <= 1) return
    
    // Simple dice roll combat
    const attackDice = Math.min(3, attacker.armies - 1)
    const defendDice = Math.min(2, defender.armies)
    
    const attackRolls = Array(attackDice).fill(0).map(() => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a)
    const defendRolls = Array(defendDice).fill(0).map(() => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a)
    
    let attackerLosses = 0
    let defenderLosses = 0
    
    for (let i = 0; i < Math.min(attackRolls.length, defendRolls.length); i++) {
      if (attackRolls[i] > defendRolls[i]) {
        defenderLosses++
      } else {
        attackerLosses++
      }
    }
    
    setGameState(prev => {
      const territories = [...prev.territories]
      const att = territories.find(t => t.id === from)!
      const def = territories.find(t => t.id === to)!
      
      att.armies -= attackerLosses
      def.armies -= defenderLosses
      
      // Territory captured
      if (def.armies === 0) {
        def.owner = att.owner
        def.armies = Math.min(3, att.armies - 1)
        att.armies = Math.max(1, att.armies - def.armies)
        
        // Check for victory
        const player1Territories = territories.filter(t => t.owner === 1).length
        const player2Territories = territories.filter(t => t.owner === 2).length
        
        if (player1Territories === 0) {
          return {
            ...prev,
            territories,
            gameStatus: 'gameOver',
            score: prev.score
          }
        } else if (player2Territories === 0) {
          return {
            ...prev,
            territories,
            gameStatus: 'victory',
            score: prev.score + 1000
          }
        }
      }
      
      return {
        ...prev,
        territories,
        selectedTerritory: null,
        targetTerritory: null
      }
    })
  }

  const placeReinforcement = (territoryId: string) => {
    if (gameState.phase !== 'placement' || gameState.reinforcements === 0) return
    
    setGameState(prev => {
      const territories = [...prev.territories]
      const territory = territories.find(t => t.id === territoryId)
      
      if (territory && territory.owner === prev.currentPlayer) {
        territory.armies++
        
        const reinforcements = prev.reinforcements - 1
        if (reinforcements === 0) {
          return {
            ...prev,
            territories,
            reinforcements,
            phase: 'attack'
          }
        }
        
        return {
          ...prev,
          territories,
          reinforcements
        }
      }
      
      return prev
    })
  }

  const endTurn = () => {
    setGameState(prev => {
      const nextPlayer = prev.currentPlayer === 1 ? 2 : 1
      const reinforcements = calculateReinforcements(nextPlayer)
      
      return {
        ...prev,
        currentPlayer: nextPlayer,
        phase: 'placement',
        reinforcements,
        selectedTerritory: null,
        targetTerritory: null,
        turnCount: prev.turnCount + 1
      }
    })
  }

  const makeAIMove = () => {
    // Simple AI
    if (gameState.phase === 'placement') {
      const aiTerritories = gameState.territories.filter(t => t.owner === 2)
      if (aiTerritories.length > 0) {
        const territory = aiTerritories[Math.floor(Math.random() * aiTerritories.length)]
        
        for (let i = 0; i < gameState.reinforcements; i++) {
          setTimeout(() => placeReinforcement(territory.id), i * 200)
        }
        
        setTimeout(() => {
          setGameState(prev => ({ ...prev, phase: 'attack' }))
          setTimeout(() => endTurn(), 1000)
        }, gameState.reinforcements * 200 + 500)
      }
    }
  }

  const startGame = () => {
    const territories = initializeGame()
    const reinforcements = calculateReinforcements(1)
    
    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      territories,
      currentPlayer: 1,
      phase: 'placement',
      reinforcements,
      selectedTerritory: null,
      targetTerritory: null,
      turnCount: 0
    })
  }

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer === 2) {
      setTimeout(() => makeAIMove(), 1000)
    }
  }, [gameState.currentPlayer, gameState.phase])

  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineRisk_score', gameState.score.toString())
      localStorage.setItem('onlineRisk_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Map className="w-8 h-8" />
              Risk: Global Domination
            </h1>
            <p className="text-muted-foreground">Conquer territories and dominate the world!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Place reinforcements on your territories</li>
              <li>• Attack neighboring enemy territories</li>
              <li>• Control continents for bonus armies</li>
              <li>• Eliminate all enemies to win</li>
            </ul>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState.gameStatus === 'gameOver' || gameState.gameStatus === 'victory') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            {gameState.gameStatus === 'victory' ? (
              <>
                <Trophy className="w-8 h-8 text-yellow-500" />
                World Conquered!
              </>
            ) : (
              'Defeated!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            <p className="text-lg text-muted-foreground">Turns: {gameState.turnCount}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  const playerTerritories = gameState.territories.filter(t => t.owner === 1).length
  const aiTerritories = gameState.territories.filter(t => t.owner === 2).length

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Turn: {gameState.turnCount}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={toggleSound}>
              {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={togglePause}>
              {gameState.gameStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-blue-100 p-3 rounded text-center">
          <div className="font-semibold">
            {gameState.currentPlayer === 1 ? 'Your Turn' : "AI's Turn"} - {gameState.phase}
          </div>
          <div className="flex justify-center gap-8 mt-2">
            <span>Your Territories: {playerTerritories}</span>
            <span>Enemy Territories: {aiTerritories}</span>
            {gameState.phase === 'placement' && (
              <span>Reinforcements: {gameState.reinforcements}</span>
            )}
          </div>
        </div>

        {/* Simplified map view */}
        <div className="bg-green-50 rounded-lg p-4 relative" style={{ height: '500px' }}>
          <svg width="100%" height="100%" viewBox="0 0 700 500">
            {/* Draw connections */}
            {gameState.territories.map(territory => 
              territory.neighbors?.map(neighbor => {
                const neighborTerritory = gameState.territories.find(t => t.id === neighbor)
                if (neighborTerritory && territory.x < neighborTerritory.x) {
                  return (
                    <line
                      key={`${territory.id}-${neighbor}`}
                      x1={territory.x}
                      y1={territory.y}
                      x2={neighborTerritory.x}
                      y2={neighborTerritory.y}
                      stroke="#ccc"
                      strokeWidth="1"
                    />
                  )
                }
                return null
              })
            )}
            
            {/* Draw territories */}
            {gameState.territories.map(territory => (
              <g key={territory.id}>
                <circle
                  cx={territory.x}
                  cy={territory.y}
                  r="25"
                  fill={territory.owner === 1 ? '#3B82F6' : '#EF4444'}
                  stroke={
                    gameState.selectedTerritory === territory.id ? '#FACC15' :
                    gameState.targetTerritory === territory.id ? '#F97316' : '#000'
                  }
                  strokeWidth={gameState.selectedTerritory === territory.id ? "3" : "1"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => {
                    if (gameState.currentPlayer !== 1) return
                    
                    if (gameState.phase === 'placement') {
                      placeReinforcement(territory.id)
                    } else if (gameState.phase === 'attack') {
                      if (!gameState.selectedTerritory) {
                        if (territory.owner === 1 && territory.armies > 1) {
                          setGameState(prev => ({ ...prev, selectedTerritory: territory.id }))
                        }
                      } else if (gameState.selectedTerritory === territory.id) {
                        setGameState(prev => ({ ...prev, selectedTerritory: null }))
                      } else {
                        const selected = gameState.territories.find(t => t.id === gameState.selectedTerritory)
                        if (selected && selected.neighbors.includes(territory.id) && territory.owner !== 1) {
                          attack(gameState.selectedTerritory, territory.id)
                        }
                      }
                    }
                  }}
                />
                <text
                  x={territory.x}
                  y={territory.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="16"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {territory.armies}
                </text>
                <text
                  x={territory.x}
                  y={territory.y + 35}
                  textAnchor="middle"
                  fontSize="10"
                  pointerEvents="none"
                >
                  {territory.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {gameState.currentPlayer === 1 && gameState.phase === 'attack' && (
          <div className="text-center">
            <Button onClick={endTurn} size="lg">
              End Turn
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}