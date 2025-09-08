'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Play, RotateCcw } from 'lucide-react'

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

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const hands: Hand[] = [
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
  }
]

export default function VideoPoker() {
  const [gameState, setGameState] = useState<'waiting' | 'dealt' | 'finished'>('waiting')
  const [cards, setCards] = useState<PlayingCard[]>([])
  const [credits, setCredits] = useState(100)
  const [bet, setBet] = useState(1)
  const [winnings, setWinnings] = useState(0)
  const [lastHand, setLastHand] = useState<string>('')
  const [deck, setDeck] = useState<PlayingCard[]>([])

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
    for (const hand of hands) {
      if (hand.check(newCards)) {
        const win = bet * hand.multiplier
        setWinnings(win)
        setCredits(prev => prev + win)
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
    setBet(prev => Math.max(1, Math.min(5, prev + amount)))
  }

  const getSuitColor = (suit: Suit) => {
    return ['♥', '♦'].includes(suit) ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Video Poker</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Jacks or Better - Draw Poker
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-semibold">
              Credits: <span className="text-green-600">{credits}</span>
            </div>
            <div className="text-lg font-semibold">
              Bet: <span className="text-blue-600">{bet}</span>
            </div>
            {winnings > 0 && (
              <div className="text-lg font-semibold">
                Win: <span className="text-yellow-600">+{winnings}</span>
              </div>
            )}
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
                  disabled={bet >= 5 || bet >= credits}
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
              <Button onClick={newGame} size="lg" className="px-8">
                <RotateCcw className="w-5 h-5 mr-2" />
                New Game
              </Button>
            )}
          </div>

          {credits <= 0 && gameState === 'finished' && (
            <div className="text-center mt-4">
              <p className="text-red-600 mb-2">Out of credits!</p>
              <Button onClick={() => setCredits(100)} variant="outline">
                Add 100 Credits
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Payouts (per credit bet):</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {hands.map(hand => (
                <div key={hand.name} className="flex justify-between">
                  <span>{hand.name}:</span>
                  <span className="font-mono">{hand.multiplier}x</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}