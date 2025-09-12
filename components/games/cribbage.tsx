'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star } from 'lucide-react'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface PlayingCard {
  suit: Suit
  rank: Rank
  value: number
}

const Cribbage: React.FC = () => {
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([])
  const [computerHand, setComputerHand] = useState<PlayingCard[]>([])
  const [crib, setCrib] = useState<PlayingCard[]>([])
  const [starter, setStarter] = useState<PlayingCard | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [computerScore, setComputerScore] = useState(0)
  const [dealer, setDealer] = useState<'player' | 'computer'>('player')
  const [phase, setPhase] = useState<'dealing' | 'discarding' | 'pegging' | 'counting' | 'ended'>('dealing')
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [playedCards, setPlayedCards] = useState<PlayingCard[]>([])
  const [currentCount, setCurrentCount] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Click Deal to start')
  const [canPlay, setCanPlay] = useState(true)
  const [lastToPlay, setLastToPlay] = useState<'player' | 'computer' | null>(null)

  const createDeck = (): PlayingCard[] => {
    const suits: Suit[] = ['♠', '♥', '♦', '♣']
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const newDeck: PlayingCard[] = []
    
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank) || 0
        if (rank === 'A') value = 1
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

  const deal = useCallback(() => {
    const newDeck = createDeck()
    
    // Deal 6 cards to each player
    const pHand = newDeck.slice(0, 6)
    const cHand = newDeck.slice(6, 12)
    
    setDeck(newDeck.slice(12))
    setPlayerHand(pHand)
    setComputerHand(cHand)
    setCrib([])
    setStarter(null)
    setPhase('discarding')
    setSelectedCards([])
    setPlayedCards([])
    setCurrentCount(0)
    setMessage('Select 2 cards to discard to the crib')
  }, [])

  const discardToCrib = useCallback(() => {
    if (selectedCards.length !== 2) {
      setMessage('Please select exactly 2 cards to discard')
      return
    }
    
    const discardedCards = selectedCards.map(i => playerHand[i])
    const newPlayerHand = playerHand.filter((_, i) => !selectedCards.includes(i))
    
    // Computer discards 2 random cards
    const computerDiscards = [0, 1]
    const computerDiscardedCards = computerDiscards.map(i => computerHand[i])
    const newComputerHand = computerHand.filter((_, i) => !computerDiscards.includes(i))
    
    setCrib([...discardedCards, ...computerDiscardedCards])
    setPlayerHand(newPlayerHand)
    setComputerHand(newComputerHand)
    setSelectedCards([])
    
    // Cut for starter card
    const starterCard = deck[0]
    setStarter(starterCard)
    setDeck(deck.slice(1))
    
    // Check for "his heels" (Jack as starter)
    if (starterCard.rank === 'J') {
      if (dealer === 'player') {
        setPlayerScore(playerScore + 2)
        setMessage('His heels! +2 points for dealer')
      } else {
        setComputerScore(computerScore + 2)
        setMessage('His heels! +2 points for dealer')
      }
    }
    
    setPhase('pegging')
    setCurrentPlayer(dealer === 'player' ? 'computer' : 'player')
    setMessage('Pegging phase - Play cards to make 31')
  }, [selectedCards, playerHand, computerHand, deck, dealer, playerScore, computerScore])

  const playCard = useCallback((cardIndex: number) => {
    if (phase !== 'pegging' || currentPlayer !== 'player') return
    
    const card = playerHand[cardIndex]
    
    if (currentCount + card.value > 31) {
      setMessage('That card would exceed 31!')
      return
    }
    
    const newCount = currentCount + card.value
    const newPlayedCards = [...playedCards, card]
    const newPlayerHand = playerHand.filter((_, i) => i !== cardIndex)
    
    setCurrentCount(newCount)
    setPlayedCards(newPlayedCards)
    setPlayerHand(newPlayerHand)
    setLastToPlay('player')
    
    // Check for points
    let points = 0
    
    // 15
    if (newCount === 15) {
      points += 2
      setMessage('Fifteen for 2!')
    }
    // 31
    else if (newCount === 31) {
      points += 2
      setMessage('Thirty-one for 2!')
      setCurrentCount(0)
      setPlayedCards([])
    }
    // Pairs, runs, etc.
    else {
      points += checkPeggingPoints(newPlayedCards)
    }
    
    if (points > 0) {
      setPlayerScore(playerScore + points)
    }
    
    // Check if either player can play
    const computerCanPlay = computerHand.some(c => currentCount + c.value <= 31)
    const playerCanPlay = newPlayerHand.some(c => currentCount + c.value <= 31)
    
    if (!computerCanPlay && !playerCanPlay) {
      // Go
      if (lastToPlay === 'player') {
        setPlayerScore(playerScore + 1)
        setMessage('Go for 1!')
      } else {
        setComputerScore(computerScore + 1)
      }
      setCurrentCount(0)
      setPlayedCards([])
      
      if (newPlayerHand.length === 0 && computerHand.length === 0) {
        startCounting()
      } else {
        setCurrentPlayer('computer')
        setTimeout(() => computerPlay(), 1000)
      }
    } else if (computerCanPlay) {
      setCurrentPlayer('computer')
      setTimeout(() => computerPlay(), 1000)
    } else {
      setMessage('Computer cannot play - your turn')
    }
  }, [phase, currentPlayer, playerHand, playedCards, currentCount, playerScore, computerScore, computerHand, lastToPlay])

  const computerPlay = () => {
    const validCards = computerHand.filter(c => currentCount + c.value <= 31)
    
    if (validCards.length === 0) {
      setMessage('Computer says "Go"')
      setCurrentPlayer('player')
      return
    }
    
    // Simple AI: play first valid card
    const card = validCards[0]
    const newCount = currentCount + card.value
    const newPlayedCards = [...playedCards, card]
    const newComputerHand = computerHand.filter(c => c !== card)
    
    setCurrentCount(newCount)
    setPlayedCards(newPlayedCards)
    setComputerHand(newComputerHand)
    setLastToPlay('computer')
    
    let points = 0
    
    if (newCount === 15) {
      points += 2
    } else if (newCount === 31) {
      points += 2
      setCurrentCount(0)
      setPlayedCards([])
    } else {
      points += checkPeggingPoints(newPlayedCards)
    }
    
    if (points > 0) {
      setComputerScore(computerScore + points)
    }
    
    // Check if game continues
    const computerCanPlay = newComputerHand.some(c => newCount + c.value <= 31)
    const playerCanPlay = playerHand.some(c => newCount + c.value <= 31)
    
    if (!computerCanPlay && !playerCanPlay) {
      if (lastToPlay === 'computer') {
        setComputerScore(computerScore + 1)
      } else {
        setPlayerScore(playerScore + 1)
      }
      setCurrentCount(0)
      setPlayedCards([])
      
      if (playerHand.length === 0 && newComputerHand.length === 0) {
        startCounting()
      } else {
        setCurrentPlayer('player')
      }
    } else if (playerCanPlay) {
      setCurrentPlayer('player')
      setMessage('Your turn')
    } else {
      setTimeout(() => computerPlay(), 1000)
    }
  }

  const checkPeggingPoints = (cards: PlayingCard[]): number => {
    if (cards.length < 2) return 0
    
    let points = 0
    const len = cards.length
    
    // Check for pairs
    if (cards[len - 1].rank === cards[len - 2].rank) {
      points += 2
      
      // Check for three of a kind
      if (len >= 3 && cards[len - 2].rank === cards[len - 3].rank) {
        points += 4 // Total of 6 for three of a kind
        
        // Check for four of a kind
        if (len >= 4 && cards[len - 3].rank === cards[len - 4].rank) {
          points += 6 // Total of 12 for four of a kind
        }
      }
    }
    
    // Check for runs (3+ cards in sequence)
    for (let runLength = Math.min(7, len); runLength >= 3; runLength--) {
      const recentCards = cards.slice(-runLength)
      if (isRun(recentCards)) {
        points += runLength
        break
      }
    }
    
    return points
  }

  const isRun = (cards: PlayingCard[]): boolean => {
    if (cards.length < 3) return false
    
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const indices = cards.map(c => ranks.indexOf(c.rank)).sort((a, b) => a - b)
    
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        return false
      }
    }
    
    return true
  }

  const startCounting = () => {
    setPhase('counting')
    setMessage('Counting phase - calculating hand scores')
    
    // Count hands
    const playerPoints = countHand([...playerHand, starter!])
    const computerPoints = countHand([...computerHand, starter!])
    
    setPlayerScore(playerScore + playerPoints)
    setComputerScore(computerScore + computerPoints)
    
    // Count crib for dealer
    if (dealer === 'player') {
      const cribPoints = countHand([...crib, starter!])
      setPlayerScore(playerScore + playerPoints + cribPoints)
      setMessage(`You scored ${playerPoints} for hand and ${cribPoints} for crib`)
    } else {
      const cribPoints = countHand([...crib, starter!])
      setComputerScore(computerScore + computerPoints + cribPoints)
      setMessage(`Computer scored ${computerPoints} for hand and ${cribPoints} for crib`)
    }
    
    // Check for game over
    if (playerScore >= 121 || computerScore >= 121) {
      endGame()
    } else {
      setTimeout(() => nextRound(), 3000)
    }
  }

  const countHand = (cards: PlayingCard[]): number => {
    let points = 0
    
    // Count fifteens
    points += countFifteens(cards) * 2
    
    // Count pairs
    points += countPairs(cards)
    
    // Count runs
    points += countRuns(cards)
    
    // Count flush
    points += countFlush(cards.slice(0, 4), cards[4])
    
    // Count nobs (Jack of same suit as starter)
    const jacks = cards.slice(0, 4).filter(c => c.rank === 'J')
    if (jacks.some(j => j.suit === cards[4].suit)) {
      points += 1
    }
    
    return points
  }

  const countFifteens = (cards: PlayingCard[]): number => {
    let count = 0
    const n = cards.length
    
    // Check all combinations
    for (let i = 0; i < (1 << n); i++) {
      let sum = 0
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          sum += cards[j].rank === 'A' ? 1 : 
                 ['J', 'Q', 'K'].includes(cards[j].rank) ? 10 : 
                 parseInt(cards[j].rank)
        }
      }
      if (sum === 15) count++
    }
    
    return count
  }

  const countPairs = (cards: PlayingCard[]): number => {
    let points = 0
    
    for (let i = 0; i < cards.length - 1; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[i].rank === cards[j].rank) {
          points += 2
        }
      }
    }
    
    return points
  }

  const countRuns = (cards: PlayingCard[]): number => {
    // Complex run counting logic simplified
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    let maxRun = 0
    
    // Check all combinations for runs
    for (let i = 0; i < (1 << cards.length); i++) {
      const subset: PlayingCard[] = []
      for (let j = 0; j < cards.length; j++) {
        if (i & (1 << j)) {
          subset.push(cards[j])
        }
      }
      
      if (subset.length >= 3 && isRun(subset)) {
        maxRun = Math.max(maxRun, subset.length)
      }
    }
    
    return maxRun
  }

  const countFlush = (hand: PlayingCard[], starter: PlayingCard): number => {
    const suit = hand[0].suit
    
    if (hand.every(c => c.suit === suit)) {
      if (starter.suit === suit) {
        return 5
      }
      return 4
    }
    
    return 0
  }

  const nextRound = () => {
    setDealer(dealer === 'player' ? 'computer' : 'player')
    deal()
  }

  const endGame = () => {
    setPhase('ended')
    if (playerScore >= 121) {
      setMessage(`You win! Final score: ${playerScore} - ${computerScore}`)
    } else {
      setMessage(`Computer wins! Final score: ${computerScore} - ${playerScore}`)
    }
  }

  const reset = () => {
    setPlayerScore(0)
    setComputerScore(0)
    setDealer('player')
    setPhase('dealing')
    setMessage('Click Deal to start')
    setPlayerHand([])
    setComputerHand([])
    setCrib([])
    setStarter(null)
  }

  const renderCard = (card: PlayingCard, index: number, selectable: boolean = false) => {
    const isRed = card.suit === '♥' || card.suit === '♦'
    const isSelected = selectedCards.includes(index)
    
    return (
      <div
        key={index}
        onClick={() => selectable && toggleCardSelection(index)}
        className={`
          inline-block mx-1 px-3 py-2 bg-white border-2 rounded
          ${isRed ? 'text-red-500' : 'text-black'}
          ${selectable ? 'cursor-pointer hover:bg-gray-100' : ''}
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <span className="font-bold text-lg">{card.rank}{card.suit}</span>
      </div>
    )
  }

  const toggleCardSelection = (index: number) => {
    if (phase === 'discarding') {
      if (selectedCards.includes(index)) {
        setSelectedCards(selectedCards.filter(i => i !== index))
      } else if (selectedCards.length < 2) {
        setSelectedCards([...selectedCards, index])
      }
    }
  }

  const renderPegBoard = () => {
    const holes = []
    for (let i = 0; i <= 120; i++) {
      const isPlayerPeg = i === playerScore
      const isComputerPeg = i === computerScore
      
      holes.push(
        <div
          key={i}
          className={`
            w-2 h-2 rounded-full border
            ${isPlayerPeg ? 'bg-blue-500' : ''}
            ${isComputerPeg ? 'bg-red-500' : ''}
            ${!isPlayerPeg && !isComputerPeg ? 'bg-gray-200' : ''}
          `}
        />
      )
    }
    
    return (
      <div className="grid grid-cols-30 gap-1 p-4 bg-amber-100 rounded">
        {holes}
      </div>
    )
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    if (phase !== 'ended') return 0
    if (playerScore >= 121 && computerScore < 91) return 3  // Skunk
    if (playerScore >= 121 && computerScore < 106) return 2 // Double skunk
    if (playerScore >= 121) return 1
    return 0
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cribbage</CardTitle>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Player: {playerScore}/121</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Computer: {computerScore}/121</span>
              </div>
            </div>
            <div className="flex gap-2">
              {phase === 'ended' && (
                <div className="flex gap-1">
                  {[1, 2, 3].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        getStarRating() >= star
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                New Game
              </Button>
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {renderPegBoard()}
            <div className="flex justify-between mt-2">
              <div>Player: {playerScore}/121</div>
              <div>Computer: {computerScore}/121</div>
            </div>
          </CardContent>
        </Card>

        {/* Game Area */}
        <Card>
          <CardContent className="p-6">
            {/* Computer Hand */}
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">Computer Hand</div>
              <div className="flex justify-center">
                {computerHand.map((_, i) => (
                  <div key={i} className="inline-block mx-1 px-3 py-2 bg-gray-800 border-2 rounded">
                    <span className="text-gray-400">??</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Playing Area */}
            <div className="mb-4 p-4 bg-gray-100 rounded">
              <div className="text-center mb-2">
                <div className="font-semibold">Playing Area (Count: {currentCount})</div>
              </div>
              <div className="flex justify-center flex-wrap">
                {playedCards.map((card, i) => renderCard(card, i))}
              </div>
              
              {starter && (
                <div className="mt-4 text-center">
                  <div className="text-sm font-semibold">Starter Card</div>
                  {renderCard(starter, -1)}
                </div>
              )}
            </div>

            {/* Player Hand */}
            <div className="mb-4">
              <div className="text-sm font-semibold mb-2">Your Hand</div>
              <div className="flex justify-center">
                {playerHand.map((card, i) => renderCard(card, i, phase === 'discarding' || (phase === 'pegging' && currentPlayer === 'player')))}
              </div>
            </div>

            {/* Crib (shown during counting) */}
            {phase === 'counting' && (
              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">Crib ({dealer === 'player' ? 'Yours' : "Computer's"})</div>
                <div className="flex justify-center">
                  {crib.map((card, i) => renderCard(card, i))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {phase === 'dealing' && (
                <Button onClick={deal} size="lg">Deal Cards</Button>
              )}
              
              {phase === 'discarding' && (
                <Button 
                  onClick={discardToCrib} 
                  disabled={selectedCards.length !== 2}
                  size="lg"
                >
                  Discard to Crib
                </Button>
              )}
              
              {phase === 'pegging' && currentPlayer === 'player' && playerHand.length > 0 && (
                <div className="text-center">
                  <div className="mb-2">Click a card to play</div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              {message}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}

export default Cribbage