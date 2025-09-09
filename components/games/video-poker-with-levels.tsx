'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Play, RotateCcw } from 'lucide-react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface PlayingCard {
  suit: Suit
  rank: Rank
  value: number
  held: boolean
}

interface Hand {
  name: string
  multiplier: number
  check: (cards: PlayingCard[]) => boolean
}

interface VideoPokerLevelConfig {
  startingCredits: number
  maxBet: number
  multiplierBonus: number
  minWinningHand: string
  wildCardsEnabled: boolean
}

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Stakes',
    difficulty: 'easy',
    config: {
      startingCredits: 200,
      maxBet: 5,
      multiplierBonus: 1,
      minWinningHand: 'Pair',
      wildCardsEnabled: false
    } as VideoPokerLevelConfig,
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Classic Poker',
    difficulty: 'medium',
    config: {
      startingCredits: 100,
      maxBet: 5,
      multiplierBonus: 1.5,
      minWinningHand: 'Jacks or Better',
      wildCardsEnabled: false
    } as VideoPokerLevelConfig,
    requiredStars: 2
  },
  {
    id: 3,
    name: 'High Stakes',
    difficulty: 'hard',
    config: {
      startingCredits: 100,
      maxBet: 10,
      multiplierBonus: 2,
      minWinningHand: 'Two Pair',
      wildCardsEnabled: false
    } as VideoPokerLevelConfig,
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Wild Card Fever',
    difficulty: 'expert',
    config: {
      startingCredits: 100,
      maxBet: 25,
      multiplierBonus: 2.5,
      minWinningHand: 'Three of a Kind',
      wildCardsEnabled: true
    } as VideoPokerLevelConfig,
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Professional',
    difficulty: 'master',
    config: {
      startingCredits: 50,
      maxBet: 50,
      multiplierBonus: 3,
      minWinningHand: 'Three of a Kind',
      wildCardsEnabled: false
    } as VideoPokerLevelConfig,
    requiredStars: 12
  }
]

function VideoPokerGame({ config, onScore }: { config: VideoPokerLevelConfig; onScore: (score: number) => void }) {
  const [gameState, setGameState] = useState<'waiting' | 'dealt' | 'finished'>('waiting')
  const [cards, setCards] = useState<PlayingCard[]>([])
  const [credits, setCredits] = useState(config.startingCredits)
  const [bet, setBet] = useState(1)
  const [winnings, setWinnings] = useState(0)
  const [lastHand, setLastHand] = useState<string>('')
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [totalWinnings, setTotalWinnings] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)

  const getHands = (): Hand[] => {
    const baseHands: Hand[] = [
      {
        name: 'Royal Flush',
        multiplier: 250,
        check: (cards) => {
          const sorted = [...cards].sort((a, b) => a.value - b.value)
          const sameSuit = cards.every(c => c.suit === cards[0].suit)
          const royalRanks = ['10', 'J', 'Q', 'K', 'A']
          return sameSuit && sorted.every((c, i) => royalRanks.includes(c.rank))
        }
      },
      {
        name: 'Straight Flush',
        multiplier: 50,
        check: (cards) => {
          const sorted = [...cards].sort((a, b) => a.value - b.value)
          const sameSuit = cards.every(c => c.suit === cards[0].suit)
          const straight = sorted.every((c, i) => i === 0 || c.value === sorted[i - 1].value + 1)
          return sameSuit && straight
        }
      },
      {
        name: 'Four of a Kind',
        multiplier: 25,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          return Array.from(rankCounts.values()).includes(4)
        }
      },
      {
        name: 'Full House',
        multiplier: 9,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          const counts = Array.from(rankCounts.values()).sort()
          return counts.length === 2 && counts[0] === 2 && counts[1] === 3
        }
      },
      {
        name: 'Flush',
        multiplier: 6,
        check: (cards) => cards.every(c => c.suit === cards[0].suit)
      },
      {
        name: 'Straight',
        multiplier: 4,
        check: (cards) => {
          const sorted = [...cards].sort((a, b) => a.value - b.value)
          return sorted.every((c, i) => i === 0 || c.value === sorted[i - 1].value + 1)
        }
      },
      {
        name: 'Three of a Kind',
        multiplier: 3,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          return Array.from(rankCounts.values()).includes(3)
        }
      },
      {
        name: 'Two Pair',
        multiplier: 2,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          return Array.from(rankCounts.values()).filter(c => c === 2).length === 2
        }
      },
      {
        name: 'Jacks or Better',
        multiplier: 1,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          return Array.from(rankCounts.entries()).some(([rank, count]) => 
            count >= 2 && ['J', 'Q', 'K', 'A'].includes(rank)
          )
        }
      },
      {
        name: 'Pair',
        multiplier: 0.5,
        check: (cards) => {
          const rankCounts = new Map<Rank, number>()
          cards.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1))
          return Array.from(rankCounts.values()).includes(2)
        }
      }
    ]

    // Filter hands based on minimum winning hand
    const minHandIndex = baseHands.findIndex(h => h.name === config.minWinningHand)
    const filteredHands = minHandIndex >= 0 ? baseHands.slice(0, minHandIndex + 1) : baseHands

    // Apply multiplier bonus
    return filteredHands.map(hand => ({
      ...hand,
      multiplier: Math.floor(hand.multiplier * config.multiplierBonus)
    }))
  }

  const createDeck = () => {
    const newDeck: PlayingCard[] = []
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        const value = rank === 'A' ? 14 : 
                     ['J', 'Q', 'K'].includes(rank) ? 
                     10 + ['J', 'Q', 'K'].indexOf(rank) + 1 : 
                     parseInt(rank)
        newDeck.push({ suit, rank, value, held: false })
      })
    })
    
    // Add wild cards if enabled (2s become wild)
    if (config.wildCardsEnabled) {
      return newDeck.map(card => ({
        ...card,
        value: card.rank === '2' ? 0 : card.value // Wild cards have value 0
      }))
    }
    
    return newDeck
  }

  const shuffleDeck = (deck: PlayingCard[]) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const dealCards = () => {
    if (credits < bet) return
    
    const shuffled = shuffleDeck(createDeck())
    const hand = shuffled.slice(0, 5)
    setDeck(shuffled.slice(5))
    setCards(hand)
    setCredits(prev => prev - bet)
    setGameState('dealt')
    setWinnings(0)
    setLastHand('')
    setGamesPlayed(prev => prev + 1)
  }

  const toggleHold = (index: number) => {
    if (gameState !== 'dealt') return
    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, held: !card.held } : card
    ))
  }

  const draw = () => {
    if (gameState !== 'dealt') return
    
    let newDeck = [...deck]
    const newCards = cards.map(card => {
      if (card.held) return card
      const newCard = newDeck.shift()
      return newCard || card
    })
    
    setCards(newCards)
    setDeck(newDeck)
    
    // Check for winning hands
    const hands = getHands()
    for (const hand of hands) {
      if (hand.check(newCards)) {
        const win = bet * hand.multiplier
        setWinnings(win)
        setCredits(prev => prev + win)
        setTotalWinnings(prev => prev + win)
        setLastHand(hand.name)
        break
      }
    }
    
    setGameState('finished')
  }

  const newGame = () => {
    setGameState('waiting')
    setCards([])
    setWinnings(0)
    setLastHand('')
  }

  const changeBet = (amount: number) => {
    if (gameState !== 'waiting') return
    setBet(prev => Math.max(1, Math.min(config.maxBet, Math.min(credits, prev + amount))))
  }

  const resetGame = () => {
    setCredits(config.startingCredits)
    setTotalWinnings(0)
    setGamesPlayed(0)
    newGame()
  }

  const getSuitColor = (suit: Suit) => {
    return ['♥', '♦'].includes(suit) ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
  }

  // Auto-submit score when out of credits
  useEffect(() => {
    if (credits <= 0 && gameState === 'finished') {
      onScore(totalWinnings)
    }
  }, [credits, gameState, totalWinnings, onScore])

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Video Poker</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {config.minWinningHand} - Draw Poker
              {config.wildCardsEnabled && ' (2s are Wild!)'}
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-semibold">
              Credits: <span className="text-green-600">{credits}</span>
            </div>
            <div className="text-lg font-semibold">
              Bet: <span className="text-blue-600">{bet}</span> (Max: {config.maxBet})
            </div>
            {winnings > 0 && (
              <div className="text-lg font-semibold">
                Win: <span className="text-yellow-600">+{winnings}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4 text-sm">
            <div>Games: {gamesPlayed}</div>
            <div>Total Won: {totalWinnings}</div>
            <div>Multiplier: ×{config.multiplierBonus}</div>
          </div>

          {lastHand && (
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-green-600">
                {lastHand}!
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 mb-6">
            {cards.length > 0 ? (
              cards.map((card, index) => (
                <button
                  key={index}
                  onClick={() => toggleHold(index)}
                  disabled={gameState !== 'dealt'}
                  className={`
                    relative aspect-[2/3] rounded-lg border-2 transition-all
                    ${card.held ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 bg-white dark:bg-gray-800'}
                    ${gameState === 'dealt' ? 'hover:scale-105 cursor-pointer' : ''}
                    ${config.wildCardsEnabled && card.rank === '2' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                  `}
                >
                  <div className={`text-4xl font-bold ${getSuitColor(card.suit)}`}>
                    {card.rank}
                  </div>
                  <div className={`text-3xl ${getSuitColor(card.suit)}`}>
                    {card.suit}
                  </div>
                  {card.held && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">
                      HELD
                    </div>
                  )}
                  {config.wildCardsEnabled && card.rank === '2' && (
                    <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">
                      WILD
                    </div>
                  )}
                </button>
              ))
            ) : (
              Array(5).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-lg border-2 border-gray-300 bg-gray-100 dark:bg-gray-800"
                />
              ))
            )}
          </div>

          <div className="flex justify-center gap-4">
            {gameState === 'waiting' && (
              <>
                <Button
                  onClick={() => changeBet(-1)}
                  disabled={bet <= 1}
                  variant="outline"
                  size="sm"
                >
                  Bet -
                </Button>
                <Button
                  onClick={dealCards}
                  disabled={credits < bet}
                  size="lg"
                  className="px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Deal Cards
                </Button>
                <Button
                  onClick={() => changeBet(1)}
                  disabled={bet >= config.maxBet || bet >= credits}
                  variant="outline"
                  size="sm"
                >
                  Bet +
                </Button>
              </>
            )}
            
            {gameState === 'dealt' && (
              <Button onClick={draw} size="lg" className="px-8">
                Draw
              </Button>
            )}
            
            {gameState === 'finished' && (
              <>
                {credits > 0 ? (
                  <Button onClick={newGame} size="lg" className="px-8">
                    Next Hand
                  </Button>
                ) : (
                  <Button onClick={resetGame} size="lg" className="px-8">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    New Game
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h3 className="font-semibold mb-2">Payouts (×{config.multiplierBonus} Bonus):</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {getHands().slice(0, 9).map(hand => (
                <div key={hand.name} className="flex justify-between">
                  <span>{hand.name}:</span>
                  <span className="font-mono">×{hand.multiplier}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function VideoPokerWithLevels() {
  const getStars = (score: number, config: VideoPokerLevelConfig): 1 | 2 | 3 => {
    const threshold = config.startingCredits * 2
    if (score >= threshold * 3) return 3
    if (score >= threshold * 1.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="video-poker"
      gameName="Video Poker"
      levels={levels}
      renderGame={(config, onScore) => <VideoPokerGame config={config} onScore={onScore} />}
      getStars={getStars}
    />
  )
}