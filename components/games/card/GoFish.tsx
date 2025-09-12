'use client'

import React, { useState, useEffect } from 'react'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Fish, RotateCcw, Trophy, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
type Card = { suit: Suit; rank: Rank; id: string }

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const createDeck = (): Card[] => {
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, id: `${rank}${suit}` })
    }
  }
  return deck
}

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const GoFish: React.FC = () => {
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [aiHand, setAiHand] = useState<Card[]>([])
  const [playerSets, setPlayerSets] = useState<Rank[]>([])
  const [aiSets, setAiSets] = useState<Rank[]>([])
  const [pond, setPond] = useState<Card[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player')
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null)
  const [message, setMessage] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [level] = useState(1)
  const [aiMemory, setAiMemory] = useState<Set<Rank>>(new Set())

  const initGame = () => {
    const newDeck = shuffleDeck(createDeck())
    const playerCards = newDeck.slice(0, 7)
    const aiCards = newDeck.slice(7, 14)
    const pondCards = newDeck.slice(14)
    
    setPlayerHand(playerCards)
    setAiHand(aiCards)
    setPond(pondCards)
    setPlayerSets([])
    setAiSets([])
    setCurrentPlayer('player')
    setMessage('Your turn! Ask for a card.')
    setGameOver(false)
    setAiMemory(new Set())
  }

  useEffect(() => {
    initGame()
  }, [])

  const checkForSets = (hand: Card[], isPlayer: boolean): { newHand: Card[]; sets: Rank[] } => {
    const rankCounts = new Map<Rank, number>()
    hand.forEach(card => {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1)
    })
    
    const newSets: Rank[] = []
    const newHand = hand.filter(card => {
      if (rankCounts.get(card.rank) === 4) {
        if (!newSets.includes(card.rank)) {
          newSets.push(card.rank)
          if (isPlayer) setScore(prev => prev + 100)
        }
        return false
      }
      return true
    })
    
    return { newHand, sets: newSets }
  }

  const askForCard = (rank: Rank) => {
    if (currentPlayer !== 'player' || !rank) return
    
    const aiCards = aiHand.filter(card => card.rank === rank)
    
    if (aiCards.length > 0) {
      setMessage(`AI has ${aiCards.length} ${rank}(s)! Take them.`)
      const newPlayerHand = [...playerHand, ...aiCards]
      const newAiHand = aiHand.filter(card => card.rank !== rank)
      
      const { newHand, sets } = checkForSets(newPlayerHand, true)
      setPlayerHand(newHand)
      setAiHand(newAiHand)
      if (sets.length > 0) {
        setPlayerSets(prev => [...prev, ...sets])
      }
      
      // Player continues
      checkGameEnd()
    } else {
      goFish(true)
    }
  }

  const goFish = (isPlayer: boolean) => {
    if (pond.length === 0) {
      setMessage('Pond is empty!')
      endTurn()
      return
    }
    
    const drawnCard = pond[0]
    const newPond = pond.slice(1)
    setPond(newPond)
    
    if (isPlayer) {
      setMessage(`Go Fish! You drew a ${drawnCard.rank}`)
      const newHand = [...playerHand, drawnCard]
      const { newHand: finalHand, sets } = checkForSets(newHand, true)
      setPlayerHand(finalHand)
      if (sets.length > 0) {
        setPlayerSets(prev => [...prev, ...sets])
      }
      
      if (drawnCard.rank === selectedRank) {
        setMessage(`Lucky! You drew the ${selectedRank} you asked for. Go again!`)
      } else {
        endTurn()
      }
    } else {
      const newHand = [...aiHand, drawnCard]
      const { newHand: finalHand, sets } = checkForSets(newHand, false)
      setAiHand(finalHand)
      if (sets.length > 0) {
        setAiSets(prev => [...prev, ...sets])
      }
      endTurn()
    }
  }

  const endTurn = () => {
    setCurrentPlayer(prev => prev === 'player' ? 'ai' : 'player')
    setSelectedRank(null)
    checkGameEnd()
  }

  const checkGameEnd = () => {
    if (playerHand.length === 0 || aiHand.length === 0 || 
        (pond.length === 0 && playerHand.length === 0 && aiHand.length === 0)) {
      setGameOver(true)
      const winner = playerSets.length > aiSets.length ? 'player' : 'ai'
      setMessage(`Game Over! ${winner === 'player' ? 'You' : 'AI'} win!`)
      if (winner === 'player') {
        setScore(prev => prev + 500)
      }
    }
  }

  // AI turn
  useEffect(() => {
    if (currentPlayer === 'ai' && !gameOver) {
      const timer = setTimeout(() => {
        // Count ranks in AI hand
        const rankCounts = new Map<Rank, Card[]>()
        aiHand.forEach(card => {
          if (!rankCounts.has(card.rank)) {
            rankCounts.set(card.rank, [])
          }
          rankCounts.get(card.rank)!.push(card)
        })
        
        // Choose rank to ask for (prefer ranks with more cards)
        let chosenRank: Rank | null = null
        let maxCount = 0
        
        // Use memory in harder difficulties
        if (difficulty !== 'Easy' && aiMemory.size > 0) {
          for (const rank of aiMemory) {
            if (rankCounts.has(rank)) {
              chosenRank = rank
              break
            }
          }
        }
        
        if (!chosenRank) {
          rankCounts.forEach((cards, rank) => {
            if (cards.length > maxCount) {
              maxCount = cards.length
              chosenRank = rank
            }
          })
        }
        
        if (chosenRank) {
          const playerCards = playerHand.filter(card => card.rank === chosenRank)
          setMessage(`AI asks: Do you have any ${chosenRank}s?`)
          
          if (playerCards.length > 0) {
            setTimeout(() => {
              setMessage(`You have ${playerCards.length} ${chosenRank}(s). AI takes them.`)
              const newAiHand = [...aiHand, ...playerCards]
              const newPlayerHand = playerHand.filter(card => card.rank !== chosenRank)
              
              const { newHand, sets } = checkForSets(newAiHand, false)
              setAiHand(newHand)
              setPlayerHand(newPlayerHand)
              if (sets.length > 0) {
                setAiSets(prev => [...prev, ...sets])
              }
              
              // AI continues
              setCurrentPlayer('ai')
            }, 1500)
          } else {
            setTimeout(() => {
              setMessage('Go Fish!')
              goFish(false)
            }, 1500)
          }
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameOver, aiHand, playerHand, difficulty, aiMemory])

  // Update AI memory when player asks for cards
  useEffect(() => {
    if (selectedRank && difficulty !== 'Easy') {
      setAiMemory(prev => new Set([...prev, selectedRank]))
    }
  }, [selectedRank, difficulty])

  const resetGame = () => {
    initGame()
    setScore(0)
  }

  return (
    <UICard className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            Go Fish
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="px-2 py-1 border rounded"
                data-testid="difficulty-selector"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
            <div data-testid="level-display">
              <Trophy className="w-4 h-4 inline mr-1" />
              Level {level}
            </div>
            <div data-testid="score-display">Score: {score}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-lg font-semibold">{message}</div>
          
          <div className="flex justify-between items-center">
            <div data-testid="sets-area" className="space-y-2">
              <div>Your Sets: {playerSets.join(', ') || 'None'}</div>
              <div>AI Sets: {aiSets.join(', ') || 'None'}</div>
            </div>
            <div data-testid="pond" className="text-center">
              <div>Pond</div>
              <div className="text-2xl">{pond.length} cards</div>
            </div>
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="w-4 h-4 mr-1" />
              Restart
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">AI Hand ({aiHand.length} cards)</h3>
              <div className="flex gap-1">
                {aiHand.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-16 bg-blue-600 rounded border-2 border-gray-300"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Your Hand</h3>
              <div data-testid="player-hand" className="flex flex-wrap gap-2">
                {playerHand.map((card) => (
                  <div
                    key={card.id}
                    data-testid={`card-${card.id}`}
                    data-suit={card.suit}
                    data-rank={card.rank}
                    className={cn(
                      "w-16 h-24 bg-white rounded border-2 flex flex-col items-center justify-center cursor-pointer animated",
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black',
                      selectedRank === card.rank && 'ring-2 ring-blue-500'
                    )}
                    onClick={() => setSelectedRank(card.rank)}
                  >
                    <div className="text-2xl font-bold">{card.rank}</div>
                    <div className="text-2xl">{card.suit}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {currentPlayer === 'player' && selectedRank && !gameOver && (
              <Button
                onClick={() => askForCard(selectedRank)}
                className="w-full"
              >
                Ask for {selectedRank}s
              </Button>
            )}
          </div>
          
          {gameOver && (
            <div className="text-center text-xl font-bold">
              Final Score - You: {playerSets.length} sets, AI: {aiSets.length} sets
            </div>
          )}
        </div>
      </CardContent>
    </UICard>
  )
}

export default GoFish