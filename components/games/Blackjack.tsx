'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Coins } from 'lucide-react'

type PlayingCard = {
  suit: '♠' | '♥' | '♦' | '♣'
  rank: string
  value: number
}

const Blackjack: React.FC = () => {
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([])
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([])
  const [playerScore, setPlayerScore] = useState(0)
  const [dealerScore, setDealerScore] = useState(0)
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'ended'>('betting')
  const [bet, setBet] = useState(10)
  const [chips, setChips] = useState(100)
  const [message, setMessage] = useState('')
  const [showDealerCard, setShowDealerCard] = useState(false)

  const createDeck = (): PlayingCard[] => {
    const suits: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const newDeck: PlayingCard[] = []
    
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank)
        if (rank === 'A') value = 11
        else if (['J', 'Q', 'K'].includes(rank)) value = 10
        
        newDeck.push({ suit, rank, value })
      }
    }
    
    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }
    
    return newDeck
  }

  const calculateScore = (hand: PlayingCard[]): number => {
    let score = hand.reduce((sum, card) => sum + card.value, 0)
    let aces = hand.filter(card => card.rank === 'A').length
    
    while (score > 21 && aces > 0) {
      score -= 10
      aces--
    }
    
    return score
  }

  const deal = useCallback(() => {
    if (chips < bet) {
      setMessage('Not enough chips!')
      return
    }
    
    const newDeck = createDeck()
    const pHand = [newDeck[0], newDeck[2]]
    const dHand = [newDeck[1], newDeck[3]]
    
    setDeck(newDeck.slice(4))
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setPlayerScore(calculateScore(pHand))
    setDealerScore(calculateScore([dHand[0]]))
    setGameState('playing')
    setShowDealerCard(false)
    setMessage('')
  }, [bet, chips])

  const hit = useCallback(() => {
    if (gameState !== 'playing' || deck.length === 0) return
    
    const newCard = deck[0]
    const newHand = [...playerHand, newCard]
    const newScore = calculateScore(newHand)
    
    setPlayerHand(newHand)
    setPlayerScore(newScore)
    setDeck(deck.slice(1))
    
    if (newScore > 21) {
      setGameState('ended')
      setMessage('Bust! You lose.')
      setChips(chips - bet)
      setShowDealerCard(true)
      setDealerScore(calculateScore(dealerHand))
    } else if (newScore === 21) {
      stand()
    }
  }, [gameState, deck, playerHand, chips, bet, dealerHand])

  const stand = useCallback(() => {
    setGameState('dealer')
    setShowDealerCard(true)
    
    let dHand = [...dealerHand]
    let dScore = calculateScore(dHand)
    let currentDeck = [...deck]
    
    while (dScore < 17 && currentDeck.length > 0) {
      dHand.push(currentDeck[0])
      currentDeck = currentDeck.slice(1)
      dScore = calculateScore(dHand)
    }
    
    setDealerHand(dHand)
    setDealerScore(dScore)
    setDeck(currentDeck)
    
    // Determine winner
    const pScore = playerScore
    
    if (dScore > 21) {
      setMessage('Dealer busts! You win!')
      setChips(chips + bet)
    } else if (pScore > dScore) {
      setMessage('You win!')
      setChips(chips + bet)
    } else if (pScore < dScore) {
      setMessage('Dealer wins!')
      setChips(chips - bet)
    } else {
      setMessage('Push!')
    }
    
    setGameState('ended')
  }, [dealerHand, deck, playerScore, chips, bet])

  const newGame = () => {
    setPlayerHand([])
    setDealerHand([])
    setPlayerScore(0)
    setDealerScore(0)
    setGameState('betting')
    setMessage('')
    setShowDealerCard(false)
    
    if (chips <= 0) {
      setChips(100)
      setMessage('Chips reset to 100')
    }
  }

  const renderCard = (card: PlayingCard, hidden = false) => {
    if (hidden) {
      return (
        <div className="w-20 h-28 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center">
          <span className="text-3xl text-white">?</span>
        </div>
      )
    }
    
    const isRed = card.suit === '♥' || card.suit === '♦'
    return (
      <div className={`w-20 h-28 bg-white rounded-lg border-2 border-gray-800 flex flex-col items-center justify-center ${isRed ? 'text-red-500' : 'text-black'}`}>
        <span className="text-2xl font-bold">{card.rank}</span>
        <span className="text-3xl">{card.suit}</span>
      </div>
    )
  }

  useEffect(() => {
    setDeck(createDeck())
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Blackjack</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{chips}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-500" />
              <span>Bet: {bet}</span>
            </div>
          </div>
          <Button onClick={newGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dealer Hand */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Dealer {showDealerCard && `(${dealerScore})`}
            </h3>
            <div className="flex gap-2">
              {dealerHand.map((card, i) => (
                <div key={i}>
                  {renderCard(card, i === 1 && !showDealerCard)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Player Hand */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Player ({playerScore})
            </h3>
            <div className="flex gap-2">
              {playerHand.map((card, i) => (
                <div key={i}>
                  {renderCard(card)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Message */}
          {message && (
            <div className="text-center text-xl font-bold">
              {message}
            </div>
          )}
          
          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {gameState === 'betting' && (
              <>
                <Button onClick={() => setBet(Math.max(5, bet - 5))} variant="outline">
                  Bet -5
                </Button>
                <Button onClick={deal} className="px-8">
                  Deal (Bet: {bet})
                </Button>
                <Button onClick={() => setBet(Math.min(chips, bet + 5))} variant="outline">
                  Bet +5
                </Button>
              </>
            )}
            
            {gameState === 'playing' && (
              <>
                <Button onClick={hit} className="px-8">
                  Hit
                </Button>
                <Button onClick={stand} variant="outline" className="px-8">
                  Stand
                </Button>
              </>
            )}
            
            {gameState === 'ended' && (
              <Button onClick={newGame} className="px-8">
                New Round
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Blackjack