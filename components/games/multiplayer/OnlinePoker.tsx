'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users } from 'lucide-react'

interface CardType {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  rank: string
  value: number
}

interface Player {
  id: number
  name: string
  chips: number
  cards: CardType[]
  bet: number
  folded: boolean
  isAI: boolean
  position: 'dealer' | 'small' | 'big' | 'player'
  handRank?: string
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  pot: number
  communityCards: CardType[]
  currentBet: number
  currentPlayer: number
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
  deck: CardType[]
  players: Player[]
  round: number
}

const SUITS: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
}

const SUIT_COLORS = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-black',
  spades: 'text-black'
}

export default function OnlinePoker() {
  const [gameState, setGameState] = useState<GameState>({
    score: 1000,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    pot: 0,
    communityCards: [],
    currentBet: 0,
    currentPlayer: 0,
    phase: 'preflop',
    deck: [],
    players: [],
    round: 1
  })

  const createDeck = (): CardType[] => {
    const deck: CardType[] = []
    for (const suit of SUITS) {
      for (let i = 0; i < RANKS.length; i++) {
        deck.push({
          suit,
          rank: RANKS[i],
          value: i + 2
        })
      }
    }
    return shuffleDeck(deck)
  }

  const shuffleDeck = (deck: CardType[]): CardType[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initializePlayers = (level: number): Player[] => {
    const numAI = Math.min(2 + Math.floor(level / 2), 5)
    const players: Player[] = [
      {
        id: 0,
        name: 'You',
        chips: 1000,
        cards: [],
        bet: 0,
        folded: false,
        isAI: false,
        position: 'player'
      }
    ]

    for (let i = 1; i <= numAI; i++) {
      players.push({
        id: i,
        name: `AI ${i}`,
        chips: 800 + Math.random() * 400,
        cards: [],
        bet: 0,
        folded: false,
        isAI: true,
        position: i === 1 ? 'dealer' : i === 2 ? 'small' : i === 3 ? 'big' : 'player'
      })
    }

    return players
  }

  const dealCards = (deck: CardType[], players: Player[]): { deck: CardType[], players: Player[] } => {
    let currentDeck = [...deck]
    const updatedPlayers = players.map(player => {
      if (!player.folded) {
        const cards = [currentDeck.pop()!, currentDeck.pop()!]
        return { ...player, cards }
      }
      return player
    })
    return { deck: currentDeck, players: updatedPlayers }
  }

  const evaluateHand = (cards: CardType[]): { rank: number, description: string } => {
    // Simplified poker hand evaluation
    const sortedCards = [...cards].sort((a, b) => b.value - a.value)
    const suits = cards.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const ranks = cards.reduce((acc, card) => {
      acc[card.rank] = (acc[card.rank] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const rankCounts = Object.values(ranks).sort((a, b) => b - a)
    const isFlush = Object.values(suits).some(count => count >= 5)
    
    // Check for straight
    let isStraight = false
    for (let i = 0; i <= sortedCards.length - 5; i++) {
      if (sortedCards[i].value - sortedCards[i + 4].value === 4) {
        isStraight = true
        break
      }
    }

    if (isStraight && isFlush) return { rank: 9, description: 'Straight Flush' }
    if (rankCounts[0] === 4) return { rank: 8, description: 'Four of a Kind' }
    if (rankCounts[0] === 3 && rankCounts[1] === 2) return { rank: 7, description: 'Full House' }
    if (isFlush) return { rank: 6, description: 'Flush' }
    if (isStraight) return { rank: 5, description: 'Straight' }
    if (rankCounts[0] === 3) return { rank: 4, description: 'Three of a Kind' }
    if (rankCounts[0] === 2 && rankCounts[1] === 2) return { rank: 3, description: 'Two Pair' }
    if (rankCounts[0] === 2) return { rank: 2, description: 'Pair' }
    
    return { rank: 1, description: 'High Card' }
  }

  const makeAIDecision = (player: Player, currentBet: number, pot: number): 'fold' | 'call' | 'raise' => {
    const allCards = [...player.cards, ...gameState.communityCards]
    const handStrength = evaluateHand(allCards).rank
    const random = Math.random()
    
    if (handStrength >= 6) {
      return random > 0.3 ? 'raise' : 'call'
    } else if (handStrength >= 3) {
      return random > 0.6 ? 'call' : random > 0.3 ? 'fold' : 'raise'
    } else {
      return random > 0.7 ? 'fold' : 'call'
    }
  }

  const handlePlayerAction = (action: 'fold' | 'call' | 'raise', raiseAmount?: number) => {
    if (gameState.gameStatus !== 'playing') return

    setGameState(prev => {
      const players = [...prev.players]
      const currentPlayer = players[prev.currentPlayer]
      
      if (action === 'fold') {
        currentPlayer.folded = true
      } else if (action === 'call') {
        const callAmount = prev.currentBet - currentPlayer.bet
        currentPlayer.chips -= callAmount
        currentPlayer.bet = prev.currentBet
        return {
          ...prev,
          pot: prev.pot + callAmount,
          players,
          currentPlayer: getNextPlayer(prev.currentPlayer, players)
        }
      } else if (action === 'raise' && raiseAmount) {
        const totalBet = prev.currentBet + raiseAmount
        const betAmount = totalBet - currentPlayer.bet
        currentPlayer.chips -= betAmount
        currentPlayer.bet = totalBet
        return {
          ...prev,
          currentBet: totalBet,
          pot: prev.pot + betAmount,
          players,
          currentPlayer: getNextPlayer(prev.currentPlayer, players)
        }
      }

      return {
        ...prev,
        players,
        currentPlayer: getNextPlayer(prev.currentPlayer, players)
      }
    })
  }

  const getNextPlayer = (current: number, players: Player[]): number => {
    let next = (current + 1) % players.length
    while (players[next].folded && next !== current) {
      next = (next + 1) % players.length
    }
    return next
  }

  const dealCommunityCards = () => {
    setGameState(prev => {
      const deck = [...prev.deck]
      let communityCards = [...prev.communityCards]
      let phase = prev.phase

      if (phase === 'preflop') {
        // Deal flop (3 cards)
        communityCards = [deck.pop()!, deck.pop()!, deck.pop()!]
        phase = 'flop'
      } else if (phase === 'flop') {
        // Deal turn (1 card)
        communityCards.push(deck.pop()!)
        phase = 'turn'
      } else if (phase === 'turn') {
        // Deal river (1 card)
        communityCards.push(deck.pop()!)
        phase = 'river'
      } else if (phase === 'river') {
        phase = 'showdown'
        return showdown(prev)
      }

      return {
        ...prev,
        deck,
        communityCards,
        phase,
        currentBet: 0,
        currentPlayer: 0
      }
    })
  }

  const showdown = (state: GameState): GameState => {
    const activePlayers = state.players.filter(p => !p.folded)
    
    const playerHands = activePlayers.map(player => {
      const allCards = [...player.cards, ...state.communityCards]
      const evaluation = evaluateHand(allCards)
      return {
        player,
        ...evaluation
      }
    })

    playerHands.sort((a, b) => b.rank - a.rank)
    const winner = playerHands[0].player

    // Award pot to winner
    const updatedPlayers = state.players.map(p => {
      if (p.id === winner.id) {
        return { ...p, chips: p.chips + state.pot }
      }
      return p
    })

    // Check for level completion
    const humanPlayer = updatedPlayers.find(p => !p.isAI)
    if (humanPlayer && humanPlayer.chips >= 2000 * state.level) {
      return {
        ...state,
        gameStatus: 'victory',
        players: updatedPlayers
      }
    }

    if (humanPlayer && humanPlayer.chips <= 0) {
      return {
        ...state,
        gameStatus: 'gameOver',
        players: updatedPlayers
      }
    }

    // Start new round
    return startNewRound({
      ...state,
      players: updatedPlayers,
      round: state.round + 1
    })
  }

  const startNewRound = (state: GameState): GameState => {
    const deck = createDeck()
    const { deck: newDeck, players: dealtPlayers } = dealCards(deck, state.players.map(p => ({
      ...p,
      cards: [],
      bet: 0,
      folded: false
    })))

    return {
      ...state,
      deck: newDeck,
      players: dealtPlayers,
      communityCards: [],
      pot: 0,
      currentBet: 10,
      phase: 'preflop',
      currentPlayer: 0
    }
  }

  const startGame = () => {
    const deck = createDeck()
    const players = initializePlayers(1)
    const { deck: newDeck, players: dealtPlayers } = dealCards(deck, players)

    setGameState({
      score: 1000,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      pot: 0,
      communityCards: [],
      currentBet: 10,
      currentPlayer: 0,
      phase: 'preflop',
      deck: newDeck,
      players: dealtPlayers,
      round: 1
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
    if (currentPlayer && currentPlayer.isAI && !currentPlayer.folded) {
      const timer = setTimeout(() => {
        const decision = makeAIDecision(currentPlayer, gameState.currentBet, gameState.pot)
        if (decision === 'raise') {
          handlePlayerAction('raise', 20 + Math.floor(Math.random() * 50))
        } else {
          handlePlayerAction(decision)
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlinePoker_score', gameState.score.toString())
      localStorage.setItem('onlinePoker_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Texas Hold'em Poker
            </h1>
            <p className="text-muted-foreground">Play against AI opponents and climb the stakes!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Start with 1000 chips</li>
              <li>• Play Texas Hold'em against AI opponents</li>
              <li>• Make the best 5-card hand</li>
              <li>• Double your chips to advance levels</li>
              <li>• More opponents as you progress</li>
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
                Level Complete!
              </>
            ) : (
              'Game Over!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Chips: {gameState.players[0]?.chips || 0}</p>
            <p className="text-lg text-muted-foreground">Level Reached: {gameState.level}</p>
            <p className="text-lg text-muted-foreground">Rounds Played: {gameState.round}</p>
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
  const isPlayerTurn = gameState.currentPlayer === 0 && !humanPlayer.folded

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Chips: ${humanPlayer.chips}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Pot: ${gameState.pot}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleSound}
            >
              {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={togglePause}
            >
              {gameState.gameStatus === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Game Table */}
        <div className="bg-green-800 rounded-xl p-8 min-h-[400px] relative">
          {/* Community Cards */}
          <div className="flex justify-center gap-2 mb-8">
            {gameState.communityCards.map((card, i) => (
              <div key={i} className="bg-white rounded p-4 w-16 h-24 flex flex-col items-center justify-center shadow-lg">
                <span className={`text-2xl font-bold ${SUIT_COLORS[card.suit]}`}>
                  {card.rank}
                </span>
                <span className={`text-2xl ${SUIT_COLORS[card.suit]}`}>
                  {SUIT_SYMBOLS[card.suit]}
                </span>
              </div>
            ))}
            {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-green-700 rounded p-4 w-16 h-24 border-2 border-green-600" />
            ))}
          </div>

          {/* Pot Display */}
          <div className="text-center mb-4">
            <div className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-full">
              Pot: ${gameState.pot}
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-3 gap-4">
            {gameState.players.map(player => (
              <div 
                key={player.id} 
                className={`p-3 rounded ${
                  gameState.currentPlayer === player.id ? 'bg-blue-600' : 'bg-gray-700'
                } ${player.folded ? 'opacity-50' : ''}`}
              >
                <div className="text-white text-sm font-semibold mb-2">
                  {player.name} {player.position !== 'player' && `(${player.position})`}
                </div>
                <div className="text-white text-xs mb-2">
                  Chips: ${player.chips} | Bet: ${player.bet}
                </div>
                {/* Show cards only for human player */}
                {!player.isAI && player.cards.length > 0 && (
                  <div className="flex gap-1">
                    {player.cards.map((card, i) => (
                      <div key={i} className="bg-white rounded p-1 text-xs">
                        <span className={SUIT_COLORS[card.suit]}>
                          {card.rank}{SUIT_SYMBOLS[card.suit]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {player.folded && <div className="text-red-400 text-xs">Folded</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Your Cards */}
        {humanPlayer.cards.length > 0 && (
          <div className="text-center">
            <h3 className="text-sm font-semibold mb-2">Your Cards</h3>
            <div className="flex justify-center gap-2">
              {humanPlayer.cards.map((card, i) => (
                <div key={i} className="bg-white rounded p-4 w-20 h-28 flex flex-col items-center justify-center shadow-lg">
                  <span className={`text-3xl font-bold ${SUIT_COLORS[card.suit]}`}>
                    {card.rank}
                  </span>
                  <span className={`text-3xl ${SUIT_COLORS[card.suit]}`}>
                    {SUIT_SYMBOLS[card.suit]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPlayerTurn && (
          <div className="flex justify-center gap-4">
            <Button onClick={() => handlePlayerAction('fold')} variant="destructive">
              Fold
            </Button>
            <Button onClick={() => handlePlayerAction('call')}>
              Call ${gameState.currentBet - humanPlayer.bet}
            </Button>
            <Button onClick={() => handlePlayerAction('raise', 50)} variant="default">
              Raise $50
            </Button>
          </div>
        )}

        {/* Next Phase Button */}
        {gameState.players.every(p => p.folded || p.bet === gameState.currentBet) && (
          <div className="text-center">
            <Button onClick={dealCommunityCards} size="lg">
              Deal {gameState.phase === 'preflop' ? 'Flop' : 
                     gameState.phase === 'flop' ? 'Turn' : 
                     gameState.phase === 'turn' ? 'River' : 'Showdown'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}