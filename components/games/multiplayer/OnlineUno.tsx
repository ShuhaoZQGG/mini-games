'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, ArrowRight, ArrowLeft } from 'lucide-react'

interface UnoCard {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  value: string
  type: 'number' | 'action' | 'wild'
}

interface Player {
  id: number
  name: string
  cards: UnoCard[]
  isAI: boolean
  score: number
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  players: Player[]
  currentPlayer: number
  discardPile: UnoCard[]
  drawPile: UnoCard[]
  direction: 1 | -1
  currentColor: 'red' | 'blue' | 'green' | 'yellow'
  mustDraw: number
  roundWinner: Player | null
}

const COLORS: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow']
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ACTIONS = ['Skip', 'Reverse', 'Draw Two']
const WILDS = ['Wild', 'Wild Draw Four']

const COLOR_CLASSES = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-400 text-black',
  wild: 'bg-gradient-to-br from-red-500 via-blue-500 to-green-500 text-white'
}

export default function OnlineUno() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    players: [],
    currentPlayer: 0,
    discardPile: [],
    drawPile: [],
    direction: 1,
    currentColor: 'red',
    mustDraw: 0,
    roundWinner: null
  })

  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [wildColorSelection, setWildColorSelection] = useState(false)

  const createDeck = (): UnoCard[] => {
    const deck: UnoCard[] = []
    
    // Number cards (0 once, 1-9 twice per color)
    for (const color of COLORS) {
      deck.push({ color, value: '0', type: 'number' })
      for (let i = 1; i <= 9; i++) {
        deck.push({ color, value: i.toString(), type: 'number' })
        deck.push({ color, value: i.toString(), type: 'number' })
      }
    }
    
    // Action cards (2 of each per color)
    for (const color of COLORS) {
      for (const action of ACTIONS) {
        deck.push({ color, value: action, type: 'action' })
        deck.push({ color, value: action, type: 'action' })
      }
    }
    
    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', value: 'Wild', type: 'wild' })
      deck.push({ color: 'wild', value: 'Wild Draw Four', type: 'wild' })
    }
    
    return shuffleDeck(deck)
  }

  const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initializePlayers = (level: number): Player[] => {
    const numAI = Math.min(1 + Math.floor(level / 2), 3)
    const players: Player[] = [
      {
        id: 0,
        name: 'You',
        cards: [],
        isAI: false,
        score: 0
      }
    ]

    for (let i = 1; i <= numAI; i++) {
      players.push({
        id: i,
        name: `AI ${i}`,
        cards: [],
        isAI: true,
        score: 0
      })
    }

    return players
  }

  const dealCards = (deck: UnoCard[], players: Player[]): { deck: UnoCard[], players: Player[] } => {
    let currentDeck = [...deck]
    const updatedPlayers = players.map(player => {
      const cards: UnoCard[] = []
      for (let i = 0; i < 7; i++) {
        cards.push(currentDeck.pop()!)
      }
      return { ...player, cards }
    })
    return { deck: currentDeck, players: updatedPlayers }
  }

  const canPlayCard = (card: UnoCard, topCard: UnoCard, currentColor: string): boolean => {
    if (card.color === 'wild') return true
    if (card.color === currentColor) return true
    if (card.value === topCard.value) return true
    return false
  }

  const getNextPlayer = (current: number, players: Player[], direction: number): number => {
    let next = current + direction
    if (next < 0) next = players.length - 1
    if (next >= players.length) next = 0
    return next
  }

  const playCard = (playerIndex: number, cardIndex: number, selectedColor?: 'red' | 'blue' | 'green' | 'yellow') => {
    if (gameState.gameStatus !== 'playing') return

    setGameState(prev => {
      const players = [...prev.players]
      const player = players[playerIndex]
      const card = player.cards[cardIndex]
      
      if (!canPlayCard(card, prev.discardPile[prev.discardPile.length - 1], prev.currentColor)) {
        return prev
      }

      // Remove card from player's hand
      player.cards.splice(cardIndex, 1)
      
      // Add to discard pile
      const discardPile = [...prev.discardPile, card]
      
      let nextPlayer = getNextPlayer(playerIndex, players, prev.direction)
      let direction = prev.direction
      let currentColor = card.color === 'wild' ? (selectedColor || 'red') : card.color
      let mustDraw = 0

      // Handle action cards
      if (card.type === 'action') {
        if (card.value === 'Skip') {
          nextPlayer = getNextPlayer(nextPlayer, players, direction)
        } else if (card.value === 'Reverse') {
          direction = direction === 1 ? -1 : 1
          if (players.length === 2) {
            nextPlayer = getNextPlayer(nextPlayer, players, direction)
          }
        } else if (card.value === 'Draw Two') {
          mustDraw = 2
        }
      } else if (card.type === 'wild') {
        if (card.value === 'Wild Draw Four') {
          mustDraw = 4
        }
      }

      // Check for win
      if (player.cards.length === 0) {
        // Calculate points
        let points = 0
        players.forEach(p => {
          if (p.id !== player.id) {
            p.cards.forEach(c => {
              if (c.type === 'number') {
                points += parseInt(c.value)
              } else if (c.type === 'action') {
                points += 20
              } else {
                points += 50
              }
            })
          }
        })
        
        player.score += points
        
        if (player.score >= 500 * prev.level) {
          return {
            ...prev,
            gameStatus: player.isAI ? 'gameOver' : 'victory',
            players,
            roundWinner: player
          }
        }

        // Start new round
        return startNewRound({
          ...prev,
          players,
          roundWinner: player,
          score: player.isAI ? prev.score : prev.score + points
        })
      }

      return {
        ...prev,
        players,
        discardPile,
        currentPlayer: nextPlayer,
        direction,
        currentColor,
        mustDraw
      }
    })
  }

  const drawCard = (playerIndex: number) => {
    setGameState(prev => {
      const players = [...prev.players]
      const player = players[playerIndex]
      const drawPile = [...prev.drawPile]
      
      const numCards = prev.mustDraw > 0 ? prev.mustDraw : 1
      
      for (let i = 0; i < numCards; i++) {
        if (drawPile.length === 0) {
          // Reshuffle discard pile
          const newDraw = shuffleDeck(prev.discardPile.slice(0, -1))
          drawPile.push(...newDraw)
        }
        if (drawPile.length > 0) {
          player.cards.push(drawPile.pop()!)
        }
      }

      return {
        ...prev,
        players,
        drawPile,
        currentPlayer: getNextPlayer(playerIndex, players, prev.direction),
        mustDraw: 0
      }
    })
  }

  const makeAIDecision = (player: Player): number | null => {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]
    const playableCards = player.cards.filter((_, i) => 
      canPlayCard(player.cards[i], topCard, gameState.currentColor)
    )
    
    if (playableCards.length === 0) return null
    
    // Prefer action cards and high value cards
    const cardIndex = player.cards.findIndex(card => 
      playableCards.includes(card) && (card.type === 'action' || card.type === 'wild')
    )
    
    if (cardIndex !== -1) return cardIndex
    
    // Play any playable card
    return player.cards.findIndex(card => playableCards.includes(card))
  }

  const startNewRound = (state: GameState): GameState => {
    const deck = createDeck()
    const players = state.players.map(p => ({ ...p, cards: [] }))
    const { deck: newDeck, players: dealtPlayers } = dealCards(deck, players)
    
    // First card on discard pile
    let firstCard = newDeck.pop()!
    while (firstCard.type === 'wild') {
      newDeck.unshift(firstCard)
      firstCard = newDeck.pop()!
    }

    return {
      ...state,
      players: dealtPlayers,
      drawPile: newDeck,
      discardPile: [firstCard],
      currentPlayer: 0,
      direction: 1,
      currentColor: firstCard.color as 'red' | 'blue' | 'green' | 'yellow',
      mustDraw: 0,
      roundWinner: null
    }
  }

  const startGame = () => {
    const players = initializePlayers(1)
    const deck = createDeck()
    const { deck: newDeck, players: dealtPlayers } = dealCards(deck, players)
    
    // First card on discard pile
    let firstCard = newDeck.pop()!
    while (firstCard.type === 'wild') {
      newDeck.unshift(firstCard)
      firstCard = newDeck.pop()!
    }

    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      players: dealtPlayers,
      currentPlayer: 0,
      discardPile: [firstCard],
      drawPile: newDeck,
      direction: 1,
      currentColor: firstCard.color as 'red' | 'blue' | 'green' | 'yellow',
      mustDraw: 0,
      roundWinner: null
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
      const timer = setTimeout(() => {
        if (gameState.mustDraw > 0) {
          drawCard(gameState.currentPlayer)
        } else {
          const cardIndex = makeAIDecision(currentPlayer)
          if (cardIndex !== null) {
            const card = currentPlayer.cards[cardIndex]
            if (card.color === 'wild') {
              const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
              playCard(gameState.currentPlayer, cardIndex, randomColor)
            } else {
              playCard(gameState.currentPlayer, cardIndex)
            }
          } else {
            drawCard(gameState.currentPlayer)
          }
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer, gameState.gameStatus, gameState.mustDraw])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineUno_score', gameState.score.toString())
      localStorage.setItem('onlineUno_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Online UNO
            </h1>
            <p className="text-muted-foreground">Classic card game with special rules!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Match cards by color or number</li>
              <li>• Use action cards strategically</li>
              <li>• Wild cards can change the color</li>
              <li>• First to empty hand wins the round</li>
              <li>• Reach 500 points to win the game</li>
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
                Victory!
              </>
            ) : (
              'Game Over!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            {gameState.roundWinner && (
              <p className="text-lg">Winner: {gameState.roundWinner.name}</p>
            )}
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  const humanPlayer = gameState.players[0]
  const topCard = gameState.discardPile[gameState.discardPile.length - 1]
  const isPlayerTurn = gameState.currentPlayer === 0

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Cards: {humanPlayer?.cards.length || 0}</span>
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

        {/* Game Table */}
        <div className="bg-green-100 rounded-xl p-6 min-h-[400px]">
          {/* Direction indicator */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-2xl">
              {gameState.direction === 1 ? (
                <>Direction <ArrowRight className="w-6 h-6" /></>
              ) : (
                <>Direction <ArrowLeft className="w-6 h-6" /></>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {gameState.players.map(player => (
              <div 
                key={player.id}
                className={`p-3 rounded ${
                  gameState.currentPlayer === player.id ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-white'
                }`}
              >
                <div className="font-semibold text-sm">{player.name}</div>
                <div className="text-xs text-gray-600">Cards: {player.cards.length}</div>
                <div className="text-xs text-gray-600">Score: {player.score}</div>
              </div>
            ))}
          </div>

          {/* Discard Pile & Draw Pile */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-sm font-semibold mb-2">Draw Pile</div>
              <div className="w-24 h-32 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                {gameState.drawPile.length}
              </div>
              {gameState.mustDraw > 0 && (
                <div className="mt-2 text-red-600 font-bold">Draw {gameState.mustDraw}!</div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-sm font-semibold mb-2">Discard Pile</div>
              {topCard && (
                <div className={`w-24 h-32 rounded-lg flex flex-col items-center justify-center ${COLOR_CLASSES[topCard.color]} shadow-lg`}>
                  <span className="text-3xl font-bold">{topCard.value}</span>
                </div>
              )}
              <div className="mt-2 text-sm">Color: {gameState.currentColor}</div>
            </div>
          </div>

          {/* Wild Color Selection */}
          {wildColorSelection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Choose a color:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {COLORS.map(color => (
                    <Button
                      key={color}
                      className={COLOR_CLASSES[color]}
                      onClick={() => {
                        playCard(0, selectedCard!, color)
                        setWildColorSelection(false)
                        setSelectedCard(null)
                      }}
                    >
                      {color.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Player's Hand */}
        {humanPlayer && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Your Cards:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {humanPlayer.cards.map((card, i) => {
                const playable = isPlayerTurn && canPlayCard(card, topCard, gameState.currentColor)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isPlayerTurn || !playable) return
                      if (card.color === 'wild') {
                        setSelectedCard(i)
                        setWildColorSelection(true)
                      } else {
                        playCard(0, i)
                      }
                    }}
                    className={`w-16 h-24 rounded flex flex-col items-center justify-center ${
                      COLOR_CLASSES[card.color]
                    } ${playable ? 'ring-2 ring-yellow-400 cursor-pointer hover:scale-105' : 'opacity-50'} 
                    transition-transform shadow-md`}
                    disabled={!isPlayerTurn || !playable}
                  >
                    <span className="text-lg font-bold">
                      {card.value.length > 5 ? card.value.substring(0, 4) : card.value}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPlayerTurn && (
          <div className="flex justify-center gap-4">
            {gameState.mustDraw > 0 ? (
              <Button onClick={() => drawCard(0)} size="lg" variant="destructive">
                Draw {gameState.mustDraw} Cards
              </Button>
            ) : (
              <Button onClick={() => drawCard(0)} size="lg" variant="outline">
                Draw Card
              </Button>
            )}
          </div>
        )}

        {/* Round Winner */}
        {gameState.roundWinner && (
          <div className="text-center p-4 bg-yellow-100 rounded">
            <p className="text-lg font-semibold">
              Round Winner: {gameState.roundWinner.name} (+{gameState.roundWinner.score} points)
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}