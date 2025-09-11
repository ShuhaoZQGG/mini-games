'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users } from 'lucide-react'

interface Domino {
  left: number
  right: number
  id: string
}

interface Player {
  id: number
  name: string
  dominoes: Domino[]
  score: number
  isAI: boolean
}

interface PlacedDomino {
  domino: Domino
  position: 'left' | 'right'
  rotation: 0 | 90 | 180 | 270
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  players: Player[]
  currentPlayer: number
  board: PlacedDomino[]
  boneyard: Domino[]
  leftEnd: number
  rightEnd: number
  consecutivePasses: number
  roundWinner: Player | null
}

export default function OnlineDominoes() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    players: [],
    currentPlayer: 0,
    board: [],
    boneyard: [],
    leftEnd: -1,
    rightEnd: -1,
    consecutivePasses: 0,
    roundWinner: null
  })

  const [selectedDomino, setSelectedDomino] = useState<number | null>(null)
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null)

  const createDominoes = (): Domino[] => {
    const dominoes: Domino[] = []
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        dominoes.push({
          left: i,
          right: j,
          id: `${i}-${j}`
        })
      }
    }
    return shuffleDominoes(dominoes)
  }

  const shuffleDominoes = (dominoes: Domino[]): Domino[] => {
    const shuffled = [...dominoes]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const initializePlayers = (level: number): Player[] => {
    const numAI = Math.min(1 + Math.floor(level / 3), 3)
    const players: Player[] = [
      {
        id: 0,
        name: 'You',
        dominoes: [],
        score: 0,
        isAI: false
      }
    ]

    for (let i = 1; i <= numAI; i++) {
      players.push({
        id: i,
        name: `AI ${i}`,
        dominoes: [],
        score: 0,
        isAI: true
      })
    }

    return players
  }

  const dealDominoes = (dominoes: Domino[], players: Player[]): { boneyard: Domino[]; players: Player[] } => {
    let currentDominoes = [...dominoes]
    const tilesPerPlayer = players.length === 2 ? 7 : players.length === 3 ? 6 : 5
    
    const dealtPlayers = players.map(player => {
      const playerDominoes: Domino[] = []
      for (let i = 0; i < tilesPerPlayer; i++) {
        if (currentDominoes.length > 0) {
          playerDominoes.push(currentDominoes.pop()!)
        }
      }
      return { ...player, dominoes: playerDominoes }
    })

    return { boneyard: currentDominoes, players: dealtPlayers }
  }

  const canPlayDomino = (domino: Domino, leftEnd: number, rightEnd: number): { canPlay: boolean; sides: ('left' | 'right')[] } => {
    if (leftEnd === -1 && rightEnd === -1) {
      return { canPlay: true, sides: ['left'] }
    }

    const sides: ('left' | 'right')[] = []
    
    if (domino.left === leftEnd || domino.right === leftEnd) {
      sides.push('left')
    }
    if (domino.left === rightEnd || domino.right === rightEnd) {
      sides.push('right')
    }

    return { canPlay: sides.length > 0, sides }
  }

  const playDomino = (playerIndex: number, dominoIndex: number, side: 'left' | 'right') => {
    if (gameState.gameStatus !== 'playing') return

    setGameState(prev => {
      const players = [...prev.players]
      const player = players[playerIndex]
      const domino = player.dominoes[dominoIndex]
      
      let leftEnd = prev.leftEnd
      let rightEnd = prev.rightEnd
      
      // First domino
      if (leftEnd === -1 && rightEnd === -1) {
        leftEnd = domino.left
        rightEnd = domino.right
      } else {
        // Place on left side
        if (side === 'left') {
          if (domino.right === leftEnd) {
            leftEnd = domino.left
          } else if (domino.left === leftEnd) {
            leftEnd = domino.right
          }
        }
        // Place on right side
        else {
          if (domino.left === rightEnd) {
            rightEnd = domino.right
          } else if (domino.right === rightEnd) {
            rightEnd = domino.left
          }
        }
      }

      // Remove domino from player's hand
      player.dominoes.splice(dominoIndex, 1)
      
      // Add to board
      const board = [...prev.board, { domino, position: side, rotation: 0 } as PlacedDomino]
      
      // Check for win
      if (player.dominoes.length === 0) {
        // Calculate points
        let points = 0
        players.forEach(p => {
          if (p.id !== player.id) {
            p.dominoes.forEach(d => {
              points += d.left + d.right
            })
          }
        })
        
        player.score += points
        
        if (player.score >= 150 * prev.level) {
          return {
            ...prev,
            gameStatus: player.isAI ? 'gameOver' : 'victory',
            players,
            roundWinner: player,
            score: player.isAI ? prev.score : player.score
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

      // Next player
      const nextPlayer = (prev.currentPlayer + 1) % players.length
      
      return {
        ...prev,
        players,
        board,
        leftEnd,
        rightEnd,
        currentPlayer: nextPlayer,
        consecutivePasses: 0
      }
    })
    
    setSelectedDomino(null)
    setSelectedSide(null)
  }

  const drawFromBoneyard = () => {
    setGameState(prev => {
      if (prev.boneyard.length === 0) {
        // Pass turn if boneyard is empty
        return passTurn(prev)
      }

      const players = [...prev.players]
      const boneyard = [...prev.boneyard]
      const player = players[prev.currentPlayer]
      
      player.dominoes.push(boneyard.pop()!)
      
      return {
        ...prev,
        players,
        boneyard
      }
    })
  }

  const passTurn = (state: GameState): GameState => {
    const consecutivePasses = state.consecutivePasses + 1
    
    // End round if all players pass
    if (consecutivePasses >= state.players.length) {
      // Find winner with lowest pip count
      let minPips = Infinity
      let winner = state.players[0]
      
      state.players.forEach(player => {
        const pips = player.dominoes.reduce((sum, d) => sum + d.left + d.right, 0)
        if (pips < minPips) {
          minPips = pips
          winner = player
        }
      })
      
      return {
        ...state,
        gameStatus: winner.isAI ? 'gameOver' : 'victory',
        roundWinner: winner
      }
    }
    
    return {
      ...state,
      currentPlayer: (state.currentPlayer + 1) % state.players.length,
      consecutivePasses
    }
  }

  const makeAIMove = () => {
    const player = gameState.players[gameState.currentPlayer]
    
    // Find playable dominoes
    for (let i = 0; i < player.dominoes.length; i++) {
      const domino = player.dominoes[i]
      const { canPlay, sides } = canPlayDomino(domino, gameState.leftEnd, gameState.rightEnd)
      
      if (canPlay && sides.length > 0) {
        // Play the first valid move
        setTimeout(() => {
          playDomino(gameState.currentPlayer, i, sides[0])
        }, 1000)
        return
      }
    }
    
    // Draw or pass
    if (gameState.boneyard.length > 0) {
      setTimeout(() => drawFromBoneyard(), 1000)
    } else {
      setTimeout(() => setGameState(prev => passTurn(prev)), 1000)
    }
  }

  const startNewRound = (state: GameState): GameState => {
    const dominoes = createDominoes()
    const players = state.players.map(p => ({ ...p, dominoes: [] }))
    const { boneyard, players: dealtPlayers } = dealDominoes(dominoes, players)

    return {
      ...state,
      players: dealtPlayers,
      boneyard,
      board: [],
      leftEnd: -1,
      rightEnd: -1,
      currentPlayer: 0,
      consecutivePasses: 0,
      roundWinner: null
    }
  }

  const startGame = () => {
    const players = initializePlayers(1)
    const dominoes = createDominoes()
    const { boneyard, players: dealtPlayers } = dealDominoes(dominoes, players)

    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      players: dealtPlayers,
      currentPlayer: 0,
      board: [],
      boneyard,
      leftEnd: -1,
      rightEnd: -1,
      consecutivePasses: 0,
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
      const timer = setTimeout(() => makeAIMove(), 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineDominoes_score', gameState.score.toString())
      localStorage.setItem('onlineDominoes_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Online Dominoes
            </h1>
            <p className="text-muted-foreground">Classic tile matching game!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Match domino ends with same numbers</li>
              <li>• Place tiles on either end of the chain</li>
              <li>• Draw from boneyard if you can't play</li>
              <li>• First to play all tiles wins</li>
              <li>• Score points from opponents' remaining tiles</li>
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
  const isPlayerTurn = gameState.currentPlayer === 0

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
            <span className="text-lg font-semibold">Boneyard: {gameState.boneyard.length}</span>
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

        {/* Players */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.players.map(player => (
            <div 
              key={player.id}
              className={`p-3 rounded ${
                gameState.currentPlayer === player.id ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-gray-100'
              }`}
            >
              <div className="font-semibold">{player.name}</div>
              <div className="text-sm">Tiles: {player.dominoes.length}</div>
              <div className="text-sm">Score: {player.score}</div>
            </div>
          ))}
        </div>

        {/* Game Board */}
        <div className="bg-green-100 rounded-xl p-6 min-h-[200px]">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600">
              Ends: [{gameState.leftEnd === -1 ? '?' : gameState.leftEnd}] - [{gameState.rightEnd === -1 ? '?' : gameState.rightEnd}]
            </div>
          </div>
          
          {/* Board display */}
          <div className="flex justify-center items-center flex-wrap gap-2">
            {gameState.board.length === 0 ? (
              <div className="text-gray-400">Place first domino</div>
            ) : (
              gameState.board.map((placed, i) => (
                <div 
                  key={i}
                  className="bg-white border-2 border-gray-800 rounded px-2 py-1 flex gap-1"
                >
                  <span className="font-bold">{placed.domino.left}</span>
                  <span>|</span>
                  <span className="font-bold">{placed.domino.right}</span>
                </div>
              ))
            )}
          </div>

          {/* Side selection */}
          {isPlayerTurn && selectedDomino !== null && (
            <div className="mt-4 flex justify-center gap-4">
              {(() => {
                const domino = humanPlayer.dominoes[selectedDomino]
                const { sides } = canPlayDomino(domino, gameState.leftEnd, gameState.rightEnd)
                return sides.map(side => (
                  <Button
                    key={side}
                    onClick={() => playDomino(0, selectedDomino, side)}
                    variant="default"
                  >
                    Place on {side}
                  </Button>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Player's Dominoes */}
        {humanPlayer && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Your Dominoes:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {humanPlayer.dominoes.map((domino, i) => {
                const { canPlay } = canPlayDomino(domino, gameState.leftEnd, gameState.rightEnd)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isPlayerTurn || !canPlay) return
                      setSelectedDomino(selectedDomino === i ? null : i)
                    }}
                    className={`
                      bg-white border-2 border-gray-800 rounded px-4 py-2 flex gap-2
                      ${selectedDomino === i ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                      ${canPlay && isPlayerTurn ? 'cursor-pointer hover:bg-gray-100' : 'opacity-50'}
                    `}
                    disabled={!isPlayerTurn || !canPlay}
                  >
                    <span className="text-xl font-bold">{domino.left}</span>
                    <span className="text-xl">|</span>
                    <span className="text-xl font-bold">{domino.right}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        {isPlayerTurn && (
          <div className="flex justify-center gap-4">
            <Button 
              onClick={drawFromBoneyard}
              disabled={gameState.boneyard.length === 0}
              variant="outline"
            >
              Draw from Boneyard ({gameState.boneyard.length})
            </Button>
            <Button 
              onClick={() => setGameState(prev => passTurn(prev))}
              variant="destructive"
            >
              Pass Turn
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}