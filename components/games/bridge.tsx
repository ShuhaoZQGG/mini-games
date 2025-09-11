'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Users, Trophy, ChevronRight, Star } from 'lucide-react'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

interface PlayingCard {
  suit: Suit
  rank: Rank
  value: number
}

interface Bid {
  level: number
  suit: Suit | 'NT'
  player: number
}

type Position = 'North' | 'East' | 'South' | 'West'

const BridgeGame: React.FC = () => {
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [hands, setHands] = useState<PlayingCard[][]>([[], [], [], []])
  const [currentBid, setCurrentBid] = useState<Bid | null>(null)
  const [biddingHistory, setBiddingHistory] = useState<(Bid | 'Pass')[]>([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [phase, setPhase] = useState<'dealing' | 'bidding' | 'playing' | 'ended'>('dealing')
  const [tricks, setTricks] = useState<PlayingCard[][]>([])
  const [currentTrick, setCurrentTrick] = useState<PlayingCard[]>([])
  const [tricksWon, setTricksWon] = useState([0, 0])
  const [declarer, setDeclarer] = useState<number | null>(null)
  const [dummy, setDummy] = useState<number | null>(null)
  const [trumpSuit, setTrumpSuit] = useState<Suit | 'NT' | null>(null)
  const [score, setScore] = useState(0)
  const [consecutivePasses, setConsecutivePasses] = useState(0)
  const [leadPlayer, setLeadPlayer] = useState(0)
  const [message, setMessage] = useState('Click Deal to start')

  const positions: Position[] = ['South', 'West', 'North', 'East']

  const createDeck = (): PlayingCard[] => {
    const suits: Suit[] = ['♠', '♥', '♦', '♣']
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const newDeck: PlayingCard[] = []
    
    for (const suit of suits) {
      for (const rank of ranks) {
        let value = parseInt(rank) || 0
        if (rank === 'J') value = 11
        else if (rank === 'Q') value = 12
        else if (rank === 'K') value = 13
        else if (rank === 'A') value = 14
        
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
    const newHands: PlayingCard[][] = [[], [], [], []]
    
    // Deal 13 cards to each player
    for (let i = 0; i < 52; i++) {
      newHands[i % 4].push(newDeck[i])
    }
    
    // Sort hands by suit and rank
    newHands.forEach(hand => {
      hand.sort((a, b) => {
        const suitOrder = ['♠', '♥', '♦', '♣']
        const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
        if (suitDiff !== 0) return suitDiff
        return b.value - a.value
      })
    })
    
    setHands(newHands)
    setPhase('bidding')
    setCurrentPlayer(0)
    setBiddingHistory([])
    setCurrentBid(null)
    setConsecutivePasses(0)
    setMessage('Bidding phase - Make your bid or pass')
  }, [])

  const makeBid = useCallback((level: number, suit: Suit | 'NT') => {
    if (phase !== 'bidding' || currentPlayer !== 0) return
    
    const bid: Bid = { level, suit, player: currentPlayer }
    
    // Validate bid
    if (currentBid) {
      const currentBidValue = currentBid.level * 10 + (currentBid.suit === 'NT' ? 5 : ['♣', '♦', '♥', '♠'].indexOf(currentBid.suit))
      const newBidValue = level * 10 + (suit === 'NT' ? 5 : ['♣', '♦', '♥', '♠'].indexOf(suit))
      
      if (newBidValue <= currentBidValue) {
        setMessage('Bid must be higher than current bid')
        return
      }
    }
    
    setCurrentBid(bid)
    setBiddingHistory([...biddingHistory, bid])
    setConsecutivePasses(0)
    setCurrentPlayer((currentPlayer + 1) % 4)
    
    // AI bidding for other players
    setTimeout(() => aiPlayerBid(), 1000)
  }, [phase, currentPlayer, currentBid, biddingHistory])

  const pass = useCallback(() => {
    if (phase !== 'bidding') return
    
    setBiddingHistory([...biddingHistory, 'Pass'])
    const newPasses = consecutivePasses + 1
    setConsecutivePasses(newPasses)
    
    if (newPasses === 3 && currentBid) {
      // Bidding ends, start playing
      startPlay()
    } else if (newPasses === 4) {
      // All pass, redeal
      setMessage('All players passed. Redeal.')
      setPhase('dealing')
    } else {
      setCurrentPlayer((currentPlayer + 1) % 4)
      if (currentPlayer !== 3) {
        setTimeout(() => aiPlayerBid(), 1000)
      }
    }
  }, [phase, biddingHistory, consecutivePasses, currentBid, currentPlayer])

  const aiPlayerBid = useCallback(() => {
    const aiPlayer = currentPlayer
    
    // Simple AI: Pass 60% of the time, bid randomly 40%
    if (Math.random() < 0.6 || !currentBid) {
      pass()
    } else {
      // Make a random higher bid
      const suits: (Suit | 'NT')[] = ['♣', '♦', '♥', '♠', 'NT']
      let level = currentBid.level
      let suit = suits[Math.floor(Math.random() * suits.length)]
      
      if (suit === currentBid.suit || suits.indexOf(suit) <= suits.indexOf(currentBid.suit)) {
        level++
      }
      
      if (level <= 7) {
        makeBid(level, suit)
      } else {
        pass()
      }
    }
  }, [currentPlayer, currentBid, pass, makeBid])

  const startPlay = () => {
    if (!currentBid) return
    
    setPhase('playing')
    setDeclarer(currentBid.player)
    setDummy((currentBid.player + 2) % 4)
    setTrumpSuit(currentBid.suit)
    setLeadPlayer((currentBid.player + 1) % 4)
    setCurrentPlayer((currentBid.player + 1) % 4)
    setMessage(`Contract: ${currentBid.level} ${currentBid.suit}. Lead player: ${positions[(currentBid.player + 1) % 4]}`)
  }

  const playCard = useCallback((cardIndex: number, playerIndex: number) => {
    if (phase !== 'playing') return
    if (playerIndex !== currentPlayer && !(dummy === playerIndex && currentPlayer === declarer)) return
    
    const playerHand = hands[playerIndex]
    const card = playerHand[cardIndex]
    
    // Check if following suit
    if (currentTrick.length > 0) {
      const leadSuit = currentTrick[0].suit
      const hasSuit = playerHand.some(c => c.suit === leadSuit)
      
      if (hasSuit && card.suit !== leadSuit) {
        setMessage('You must follow suit')
        return
      }
    }
    
    // Remove card from hand
    const newHands = [...hands]
    newHands[playerIndex] = playerHand.filter((_, i) => i !== cardIndex)
    setHands(newHands)
    
    // Add to current trick
    const newTrick = [...currentTrick, card]
    setCurrentTrick(newTrick)
    
    if (newTrick.length === 4) {
      // Trick complete
      completeTrick(newTrick)
    } else {
      // Next player
      let nextPlayer = (playerIndex + 1) % 4
      if (nextPlayer === dummy) {
        nextPlayer = declarer!
      }
      setCurrentPlayer(nextPlayer)
      
      // AI play for computer players
      if (nextPlayer !== 0 && nextPlayer !== dummy) {
        setTimeout(() => aiPlayCard(nextPlayer), 1000)
      }
    }
  }, [phase, currentPlayer, hands, currentTrick, dummy, declarer])

  const aiPlayCard = (playerIndex: number) => {
    const hand = hands[playerIndex]
    if (hand.length === 0) return
    
    // Simple AI: play first valid card
    let cardToPlay = 0
    
    if (currentTrick.length > 0) {
      const leadSuit = currentTrick[0].suit
      const suitCards = hand.map((c, i) => ({ card: c, index: i })).filter(c => c.card.suit === leadSuit)
      
      if (suitCards.length > 0) {
        cardToPlay = suitCards[0].index
      }
    }
    
    playCard(cardToPlay, playerIndex)
  }

  const completeTrick = (trick: PlayingCard[]) => {
    // Determine winner
    const leadSuit = trick[0].suit
    let winningCard = trick[0]
    let winningPlayer = leadPlayer
    
    for (let i = 1; i < 4; i++) {
      const playerIndex = (leadPlayer + i) % 4
      const card = trick[i]
      
      if (trumpSuit !== 'NT') {
        if (card.suit === trumpSuit && winningCard.suit !== trumpSuit) {
          winningCard = card
          winningPlayer = playerIndex
        } else if (card.suit === trumpSuit && winningCard.suit === trumpSuit && card.value > winningCard.value) {
          winningCard = card
          winningPlayer = playerIndex
        } else if (card.suit === leadSuit && winningCard.suit !== trumpSuit && card.value > winningCard.value) {
          winningCard = card
          winningPlayer = playerIndex
        }
      } else {
        if (card.suit === leadSuit && card.value > winningCard.value) {
          winningCard = card
          winningPlayer = playerIndex
        }
      }
    }
    
    // Update tricks won
    const team = winningPlayer % 2
    const newTricksWon = [...tricksWon]
    newTricksWon[team]++
    setTricksWon(newTricksWon)
    
    // Next trick
    setTricks([...tricks, trick])
    setCurrentTrick([])
    setLeadPlayer(winningPlayer)
    setCurrentPlayer(winningPlayer)
    
    if (tricks.length === 12) {
      // Game over
      endGame()
    } else {
      setMessage(`${positions[winningPlayer]} wins the trick`)
      
      // AI play for computer players
      if (winningPlayer !== 0 && winningPlayer !== dummy) {
        setTimeout(() => aiPlayCard(winningPlayer), 1500)
      }
    }
  }

  const endGame = () => {
    setPhase('ended')
    const declarerTeam = declarer! % 2
    const contractTricks = 6 + currentBid!.level
    const actualTricks = tricksWon[declarerTeam]
    
    if (actualTricks >= contractTricks) {
      const overtricks = actualTricks - contractTricks
      const points = contractTricks * 20 + overtricks * 10
      setScore(score + points)
      setMessage(`Contract made! ${actualTricks} tricks won. +${points} points`)
    } else {
      const undertricks = contractTricks - actualTricks
      const points = undertricks * 50
      setScore(score - points)
      setMessage(`Contract failed! Only ${actualTricks} tricks won. -${points} points`)
    }
  }

  const reset = () => {
    setHands([[], [], [], []])
    setCurrentBid(null)
    setBiddingHistory([])
    setCurrentPlayer(0)
    setPhase('dealing')
    setTricks([])
    setCurrentTrick([])
    setTricksWon([0, 0])
    setDeclarer(null)
    setDummy(null)
    setTrumpSuit(null)
    setConsecutivePasses(0)
    setLeadPlayer(0)
    setMessage('Click Deal to start')
  }

  const renderCard = (card: PlayingCard, index: number, playerIndex: number, clickable: boolean) => {
    const isRed = card.suit === '♥' || card.suit === '♦'
    const canPlay = clickable && (playerIndex === currentPlayer || (dummy === playerIndex && currentPlayer === declarer))
    
    return (
      <div
        key={index}
        onClick={() => canPlay && playCard(index, playerIndex)}
        className={`
          inline-block mx-1 px-2 py-1 bg-white border rounded
          ${isRed ? 'text-red-500' : 'text-black'}
          ${canPlay ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}
          ${playerIndex === dummy && phase === 'playing' ? '' : (playerIndex !== 0 && phase !== 'ended' ? 'bg-gray-800' : '')}
        `}
      >
        {playerIndex === 0 || playerIndex === dummy || phase === 'ended' ? (
          <span className="font-bold">{card.rank}{card.suit}</span>
        ) : (
          <span className="text-gray-400">??</span>
        )}
      </div>
    )
  }

  // Calculate star rating based on score
  const getStarRating = () => {
    if (phase !== 'ended') return 0
    if (score >= 300) return 3
    if (score >= 150) return 2
    if (score > 0) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Bridge</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Tricks Won: {tricksWon[0]}/{tricksWon[1]}</span>
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
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {/* North (Partner) */}
          <div className="text-center">
            <div className="text-sm font-semibold mb-2">North {dummy === 2 && '(Dummy)'}</div>
            <div className="flex justify-center flex-wrap">
              {hands[2].map((card, i) => renderCard(card, i, 2, phase === 'playing'))}
            </div>
          </div>

          {/* West and East */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold mb-2">West {dummy === 1 && '(Dummy)'}</div>
              <div className="flex flex-col">
                {hands[1].map((card, i) => renderCard(card, i, 1, phase === 'playing'))}
              </div>
            </div>

            {/* Playing area */}
            <div className="flex-1 mx-8">
              <Card>
                <CardContent className="p-4">
                  {phase === 'bidding' && (
                    <div className="text-center">
                      <div className="mb-4">
                        <div className="font-semibold">Current Bid</div>
                        {currentBid ? (
                          <div className="text-2xl">
                            {currentBid.level} {currentBid.suit}
                          </div>
                        ) : (
                          <div className="text-gray-400">None</div>
                        )}
                      </div>
                      
                      {currentPlayer === 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(level => (
                              <Button
                                key={level}
                                size="sm"
                                variant="outline"
                                onClick={() => makeBid(level, '♠')}
                              >
                                {level}
                              </Button>
                            ))}
                          </div>
                          <div className="flex justify-center gap-2">
                            {(['♣', '♦', '♥', '♠', 'NT'] as const).map(suit => (
                              <Button
                                key={suit}
                                size="sm"
                                variant="outline"
                                onClick={() => currentBid && makeBid(currentBid.level, suit)}
                              >
                                {suit}
                              </Button>
                            ))}
                          </div>
                          <Button onClick={pass} variant="secondary">Pass</Button>
                        </div>
                      )}
                    </div>
                  )}

                  {phase === 'playing' && (
                    <div className="text-center">
                      <div className="mb-4">
                        <div className="font-semibold">Current Trick</div>
                        <div className="flex justify-center mt-2">
                          {currentTrick.map((card, i) => (
                            <div key={i} className="mx-1">
                              {renderCard(card, i, -1, false)}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div>NS Tricks: {tricksWon[0]}</div>
                        <div>Contract: {currentBid?.level} {currentBid?.suit}</div>
                        <div>EW Tricks: {tricksWon[1]}</div>
                      </div>
                    </div>
                  )}

                  {phase === 'ended' && (
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-4">{message}</div>
                      <div className="text-lg">Total Score: {score}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">East {dummy === 3 && '(Dummy)'}</div>
              <div className="flex flex-col">
                {hands[3].map((card, i) => renderCard(card, i, 3, phase === 'playing'))}
              </div>
            </div>
          </div>

          {/* South (Player) */}
          <div className="text-center">
            <div className="text-sm font-semibold mb-2">South (You) {dummy === 0 && '(Dummy)'}</div>
            <div className="flex justify-center flex-wrap">
              {hands[0].map((card, i) => renderCard(card, i, 0, phase === 'playing'))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {phase === 'dealing' && (
              <Button onClick={deal} size="lg">
                <Users className="mr-2" />
                Deal Cards
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            {message}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BridgeGame