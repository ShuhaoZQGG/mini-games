'use client'

import React, { useState, useEffect } from 'react'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Swords, RotateCcw, Trophy, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
type Card = { suit: Suit; rank: Rank; value: number }

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const values = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }

const createDeck = (): Card[] => {
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, value: values[rank] })
    }
  }
  return deck.sort(() => Math.random() - 0.5)
}

const War: React.FC = () => {
  const [playerDeck, setPlayerDeck] = useState<Card[]>([])
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([])
  const [playerCard, setPlayerCard] = useState<Card | null>(null)
  const [opponentCard, setOpponentCard] = useState<Card | null>(null)
  const [warCards, setWarCards] = useState<Card[]>([])
  const [message, setMessage] = useState('Click Play to start')
  const [gameOver, setGameOver] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [score, setScore] = useState(0)
  const [level] = useState(1)

  const initGame = () => {
    const deck = createDeck()
    setPlayerDeck(deck.slice(0, 26))
    setOpponentDeck(deck.slice(26))
    setPlayerCard(null)
    setOpponentCard(null)
    setWarCards([])
    setMessage('Play a card!')
    setGameOver(false)
  }

  useEffect(() => {
    initGame()
  }, [])

  const playCard = () => {
    if (playerDeck.length === 0 || opponentDeck.length === 0) {
      endGame()
      return
    }

    const pCard = playerDeck[0]
    const oCard = opponentDeck[0]
    
    setPlayerCard(pCard)
    setOpponentCard(oCard)
    
    const newPlayerDeck = playerDeck.slice(1)
    const newOpponentDeck = opponentDeck.slice(1)
    
    if (pCard.value > oCard.value) {
      setMessage('You win this round!')
      setPlayerDeck([...newPlayerDeck, pCard, oCard, ...warCards])
      setOpponentDeck(newOpponentDeck)
      setWarCards([])
      setScore(prev => prev + 10 + warCards.length * 5)
    } else if (oCard.value > pCard.value) {
      setMessage('Opponent wins this round!')
      setOpponentDeck([...newOpponentDeck, pCard, oCard, ...warCards])
      setPlayerDeck(newPlayerDeck)
      setWarCards([])
    } else {
      setMessage('WAR!')
      if (newPlayerDeck.length < 4 || newOpponentDeck.length < 4) {
        endGame()
        return
      }
      setWarCards([...warCards, pCard, oCard, ...newPlayerDeck.slice(0, 3), ...newOpponentDeck.slice(0, 3)])
      setPlayerDeck(newPlayerDeck.slice(3))
      setOpponentDeck(newOpponentDeck.slice(3))
    }
  }

  const endGame = () => {
    setGameOver(true)
    const winner = playerDeck.length > opponentDeck.length ? 'You' : 'Opponent'
    setMessage(`Game Over! ${winner} win!`)
    if (winner === 'You') {
      setScore(prev => prev + 500)
    }
  }

  useEffect(() => {
    if (autoPlay && !gameOver) {
      const timer = setTimeout(playCard, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, playerCard, opponentCard, gameOver])

  return (
    <UICard className="w-full max-w-4xl mx-auto" data-testid="game-container">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Swords className="w-6 h-6" />
            War
          </CardTitle>
          <div className="flex gap-4">
            <div data-testid="level-display">Level {level}</div>
            <div data-testid="score-display">Score: {score}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-lg font-semibold">{message}</div>
          
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div data-testid="player-deck">Your Deck</div>
              <div data-testid="player-card-count" className="text-2xl font-bold">{playerDeck.length}</div>
            </div>
            <div className="text-center">
              <div data-testid="opponent-deck">Opponent Deck</div>
              <div data-testid="opponent-card-count" className="text-2xl font-bold">{opponentDeck.length}</div>
            </div>
          </div>
          
          <div className="flex justify-center gap-8">
            {playerCard && (
              <div
                data-testid="player-played-card"
                className={cn(
                  "w-20 h-28 bg-white rounded border-2 flex flex-col items-center justify-center",
                  playerCard.suit === '♥' || playerCard.suit === '♦' ? 'text-red-500' : 'text-black'
                )}
              >
                <div className="text-3xl font-bold">{playerCard.rank}</div>
                <div className="text-3xl">{playerCard.suit}</div>
              </div>
            )}
            {opponentCard && (
              <div
                data-testid="opponent-played-card"
                className={cn(
                  "w-20 h-28 bg-white rounded border-2 flex flex-col items-center justify-center",
                  opponentCard.suit === '♥' || opponentCard.suit === '♦' ? 'text-red-500' : 'text-black'
                )}
              >
                <div className="text-3xl font-bold">{opponentCard.rank}</div>
                <div className="text-3xl">{opponentCard.suit}</div>
              </div>
            )}
          </div>
          
          {warCards.length > 0 && (
            <div className="text-center">
              <div className="text-sm">War Pot: {warCards.length} cards</div>
            </div>
          )}
          
          <div className="flex justify-center gap-2">
            <Button onClick={playCard} disabled={gameOver}>
              <Play className="w-4 h-4 mr-1" />
              Play Card
            </Button>
            <Button onClick={() => setAutoPlay(!autoPlay)} variant="outline">
              {autoPlay ? 'Stop' : 'Auto-play'}
            </Button>
            <Button onClick={initGame} variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
          </div>
        </div>
      </CardContent>
    </UICard>
  )
}

export default War
