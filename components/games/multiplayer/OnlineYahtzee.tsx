'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'

interface Player {
  id: number
  name: string
  scorecard: { [key: string]: number | null }
  totalScore: number
  isAI: boolean
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  players: Player[]
  currentPlayer: number
  dice: number[]
  keptDice: boolean[]
  rollsLeft: number
  currentRound: number
  maxRounds: number
}

const CATEGORIES = [
  { id: 'ones', name: 'Ones', section: 'upper' },
  { id: 'twos', name: 'Twos', section: 'upper' },
  { id: 'threes', name: 'Threes', section: 'upper' },
  { id: 'fours', name: 'Fours', section: 'upper' },
  { id: 'fives', name: 'Fives', section: 'upper' },
  { id: 'sixes', name: 'Sixes', section: 'upper' },
  { id: 'threeOfKind', name: 'Three of a Kind', section: 'lower' },
  { id: 'fourOfKind', name: 'Four of a Kind', section: 'lower' },
  { id: 'fullHouse', name: 'Full House', section: 'lower' },
  { id: 'smallStraight', name: 'Small Straight', section: 'lower' },
  { id: 'largeStraight', name: 'Large Straight', section: 'lower' },
  { id: 'yahtzee', name: 'Yahtzee', section: 'lower' },
  { id: 'chance', name: 'Chance', section: 'lower' }
]

const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
  const Icon = icons[value - 1]
  return <Icon className="w-12 h-12" />
}

export default function OnlineYahtzee() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    players: [],
    currentPlayer: 0,
    dice: [1, 1, 1, 1, 1],
    keptDice: [false, false, false, false, false],
    rollsLeft: 3,
    currentRound: 1,
    maxRounds: 13
  })

  const initializePlayers = (level: number): Player[] => {
    const numAI = Math.min(1 + Math.floor(level / 3), 3)
    const players: Player[] = [
      {
        id: 0,
        name: 'You',
        scorecard: Object.fromEntries(CATEGORIES.map(c => [c.id, null])),
        totalScore: 0,
        isAI: false
      }
    ]

    for (let i = 1; i <= numAI; i++) {
      players.push({
        id: i,
        name: `AI ${i}`,
        scorecard: Object.fromEntries(CATEGORIES.map(c => [c.id, null])),
        totalScore: 0,
        isAI: true
      })
    }

    return players
  }

  const rollDice = () => {
    if (gameState.rollsLeft === 0) return

    setGameState(prev => {
      const newDice = prev.dice.map((die, i) => 
        prev.keptDice[i] ? die : Math.floor(Math.random() * 6) + 1
      )

      return {
        ...prev,
        dice: newDice,
        rollsLeft: prev.rollsLeft - 1
      }
    })
  }

  const toggleKeepDie = (index: number) => {
    if (gameState.rollsLeft === 3) return // Can't keep dice before first roll

    setGameState(prev => {
      const keptDice = [...prev.keptDice]
      keptDice[index] = !keptDice[index]
      return { ...prev, keptDice }
    })
  }

  const calculateScore = (category: string, dice: number[]): number => {
    const counts = new Array(7).fill(0)
    dice.forEach(die => counts[die]++)
    const sum = dice.reduce((a, b) => a + b, 0)

    switch (category) {
      case 'ones': return counts[1] * 1
      case 'twos': return counts[2] * 2
      case 'threes': return counts[3] * 3
      case 'fours': return counts[4] * 4
      case 'fives': return counts[5] * 5
      case 'sixes': return counts[6] * 6
      
      case 'threeOfKind':
        return counts.some(c => c >= 3) ? sum : 0
      
      case 'fourOfKind':
        return counts.some(c => c >= 4) ? sum : 0
      
      case 'fullHouse':
        const hasThree = counts.includes(3)
        const hasTwo = counts.includes(2)
        return (hasThree && hasTwo) ? 25 : 0
      
      case 'smallStraight':
        const sortedUnique = [...new Set(dice)].sort()
        for (let i = 0; i <= sortedUnique.length - 4; i++) {
          if (sortedUnique[i + 3] - sortedUnique[i] === 3) return 30
        }
        return 0
      
      case 'largeStraight':
        const sorted = [...dice].sort()
        if (sorted.join('') === '12345' || sorted.join('') === '23456') return 40
        return 0
      
      case 'yahtzee':
        return counts.some(c => c === 5) ? 50 : 0
      
      case 'chance':
        return sum
      
      default:
        return 0
    }
  }

  const selectCategory = (category: string) => {
    if (gameState.rollsLeft === 3) return // Must roll at least once
    
    const player = gameState.players[gameState.currentPlayer]
    if (player.scorecard[category] !== null) return // Already scored

    const score = calculateScore(category, gameState.dice)
    
    setGameState(prev => {
      const players = [...prev.players]
      const currentPlayer = players[prev.currentPlayer]
      
      currentPlayer.scorecard[category] = score
      
      // Calculate total score
      let upperTotal = 0
      let lowerTotal = 0
      
      CATEGORIES.forEach(cat => {
        const catScore = currentPlayer.scorecard[cat.id]
        if (catScore !== null) {
          if (cat.section === 'upper') {
            upperTotal += catScore
          } else {
            lowerTotal += catScore
          }
        }
      })
      
      // Upper section bonus
      const upperBonus = upperTotal >= 63 ? 35 : 0
      currentPlayer.totalScore = upperTotal + upperBonus + lowerTotal

      // Check for game end
      const allFilled = players.every(p => 
        CATEGORIES.every(cat => p.scorecard[cat.id] !== null)
      )
      
      if (allFilled) {
        const winner = players.reduce((max, p) => p.totalScore > max.totalScore ? p : max)
        return {
          ...prev,
          gameStatus: winner.isAI ? 'gameOver' : 'victory',
          players,
          score: currentPlayer.isAI ? prev.score : currentPlayer.totalScore
        }
      }

      // Next player
      const nextPlayer = (prev.currentPlayer + 1) % players.length
      
      return {
        ...prev,
        players,
        currentPlayer: nextPlayer,
        dice: [1, 1, 1, 1, 1],
        keptDice: [false, false, false, false, false],
        rollsLeft: 3,
        currentRound: nextPlayer === 0 ? prev.currentRound + 1 : prev.currentRound,
        score: currentPlayer.isAI ? prev.score : currentPlayer.totalScore
      }
    })
  }

  const makeAIMove = () => {
    const player = gameState.players[gameState.currentPlayer]
    
    // Simple AI strategy
    setTimeout(() => {
      // Roll dice
      rollDice()
      
      setTimeout(() => {
        // Roll again
        rollDice()
        
        setTimeout(() => {
          // Find best category
          let bestCategory = ''
          let bestScore = -1
          
          CATEGORIES.forEach(cat => {
            if (player.scorecard[cat.id] === null) {
              const score = calculateScore(cat.id, gameState.dice)
              if (score > bestScore) {
                bestScore = score
                bestCategory = cat.id
              }
            }
          })
          
          if (bestCategory) {
            selectCategory(bestCategory)
          }
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const startGame = () => {
    const players = initializePlayers(1)

    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      players,
      currentPlayer: 0,
      dice: [1, 1, 1, 1, 1],
      keptDice: [false, false, false, false, false],
      rollsLeft: 3,
      currentRound: 1,
      maxRounds: 13
    })
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  const toggleSound = () => {
    setGameState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }))
  }

  // AI turns
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return
    
    const currentPlayer = gameState.players[gameState.currentPlayer]
    if (currentPlayer && currentPlayer.isAI) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineYahtzee_score', gameState.score.toString())
      localStorage.setItem('onlineYahtzee_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Online Yahtzee
            </h1>
            <p className="text-muted-foreground">Classic dice game with scorecard!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Roll 5 dice up to 3 times per turn</li>
              <li>• Keep dice between rolls</li>
              <li>• Score in different categories</li>
              <li>• Get bonus for upper section ≥63</li>
              <li>• Highest total score wins</li>
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
    const winner = gameState.players.reduce((max, p) => p.totalScore > max.totalScore ? p : max)
    
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            {gameState.gameStatus === 'victory' ? (
              <>
                <Trophy className="w-8 h-8 text-yellow-500" />
                Victory!
              </>
            ) : (
              'Game Over!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            <p className="text-lg">Winner: {winner.name} ({winner.totalScore} points)</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isPlayerTurn = gameState.currentPlayer === 0

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Round: {gameState.currentRound}/{gameState.maxRounds}</span>
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

        {/* Current Player */}
        <div className="bg-blue-100 rounded p-3 text-center">
          <span className="font-semibold">Current Player: {currentPlayer?.name}</span>
          <span className="ml-4">Rolls Left: {gameState.rollsLeft}</span>
        </div>

        {/* Dice */}
        <div className="bg-green-100 rounded-xl p-6">
          <div className="flex justify-center gap-4 mb-4">
            {gameState.dice.map((die, i) => (
              <button
                key={i}
                onClick={() => isPlayerTurn && toggleKeepDie(i)}
                disabled={!isPlayerTurn || gameState.rollsLeft === 3}
                className={`
                  p-2 rounded transition-all
                  ${gameState.keptDice[i] ? 'bg-yellow-200 ring-2 ring-yellow-500' : 'bg-white'}
                  ${isPlayerTurn && gameState.rollsLeft < 3 ? 'hover:scale-105 cursor-pointer' : ''}
                `}
              >
                <DiceIcon value={die} />
              </button>
            ))}
          </div>
          
          {isPlayerTurn && (
            <div className="text-center">
              <Button 
                onClick={rollDice}
                disabled={gameState.rollsLeft === 0}
                size="lg"
              >
                Roll Dice ({gameState.rollsLeft} left)
              </Button>
            </div>
          )}
        </div>

        {/* Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameState.players.map(player => (
            <div key={player.id} className="bg-white rounded p-4 border">
              <h3 className="font-semibold mb-2">{player.name}'s Scorecard</h3>
              <div className="space-y-1 text-sm">
                <div className="font-semibold border-b">Upper Section</div>
                {CATEGORIES.filter(c => c.section === 'upper').map(cat => (
                  <div key={cat.id} className="flex justify-between">
                    <span>{cat.name}:</span>
                    <span>
                      {player.scorecard[cat.id] !== null ? (
                        player.scorecard[cat.id]
                      ) : isPlayerTurn && player.id === 0 && gameState.rollsLeft < 3 ? (
                        <button
                          onClick={() => selectCategory(cat.id)}
                          className="text-blue-500 hover:underline"
                        >
                          ({calculateScore(cat.id, gameState.dice)})
                        </button>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                ))}
                
                <div className="font-semibold border-b mt-2">Lower Section</div>
                {CATEGORIES.filter(c => c.section === 'lower').map(cat => (
                  <div key={cat.id} className="flex justify-between">
                    <span>{cat.name}:</span>
                    <span>
                      {player.scorecard[cat.id] !== null ? (
                        player.scorecard[cat.id]
                      ) : isPlayerTurn && player.id === 0 && gameState.rollsLeft < 3 ? (
                        <button
                          onClick={() => selectCategory(cat.id)}
                          className="text-blue-500 hover:underline"
                        >
                          ({calculateScore(cat.id, gameState.dice)})
                        </button>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                ))}
                
                <div className="font-bold border-t pt-1">
                  Total: {player.totalScore}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}