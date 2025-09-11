'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users, Target, Shield, Zap, Radar } from 'lucide-react'

interface Ship {
  name: string
  size: number
  positions: { row: number; col: number }[]
  hits: number
}

interface PowerUp {
  type: 'radar' | 'bomb' | 'shield'
  available: number
}

interface Player {
  id: number
  name: string
  ships: Ship[]
  board: ('empty' | 'ship' | 'hit' | 'miss')[][]
  powerUps: PowerUp[]
  score: number
  isAI: boolean
}

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory' | 'placement'
  soundEnabled: boolean
  players: Player[]
  currentPlayer: number
  phase: 'placement' | 'battle'
  selectedPowerUp: 'radar' | 'bomb' | 'shield' | null
}

const BOARD_SIZE = 10
const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
]

export default function OnlineBattleshipII() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    players: [],
    currentPlayer: 0,
    phase: 'placement',
    selectedPowerUp: null
  })

  const [placingShip, setPlacingShip] = useState<number>(0)
  const [shipOrientation, setShipOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)

  const initializeBoard = (): ('empty' | 'ship' | 'hit' | 'miss')[][] => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill('empty'))
  }

  const initializePlayers = (level: number): Player[] => {
    const powerUps: PowerUp[] = [
      { type: 'radar', available: 2 + Math.floor(level / 2) },
      { type: 'bomb', available: 1 + Math.floor(level / 3) },
      { type: 'shield', available: 1 + Math.floor(level / 4) }
    ]

    return [
      {
        id: 0,
        name: 'You',
        ships: [],
        board: initializeBoard(),
        powerUps: [...powerUps],
        score: 0,
        isAI: false
      },
      {
        id: 1,
        name: 'AI Commander',
        ships: [],
        board: initializeBoard(),
        powerUps: [...powerUps],
        score: 0,
        isAI: true
      }
    ]
  }

  const canPlaceShip = (board: any[][], ship: any, row: number, col: number, orientation: string): boolean => {
    if (orientation === 'horizontal') {
      if (col + ship.size > BOARD_SIZE) return false
      for (let i = 0; i < ship.size; i++) {
        if (board[row][col + i] !== 'empty') return false
      }
    } else {
      if (row + ship.size > BOARD_SIZE) return false
      for (let i = 0; i < ship.size; i++) {
        if (board[row + i][col] !== 'empty') return false
      }
    }
    return true
  }

  const placeShip = (playerIndex: number, shipIndex: number, row: number, col: number, orientation: 'horizontal' | 'vertical') => {
    setGameState(prev => {
      const players = [...prev.players]
      const player = players[playerIndex]
      const shipData = SHIPS[shipIndex]
      
      if (!canPlaceShip(player.board, shipData, row, col, orientation)) {
        return prev
      }

      const positions: { row: number; col: number }[] = []
      
      if (orientation === 'horizontal') {
        for (let i = 0; i < shipData.size; i++) {
          player.board[row][col + i] = 'ship'
          positions.push({ row, col: col + i })
        }
      } else {
        for (let i = 0; i < shipData.size; i++) {
          player.board[row + i][col] = 'ship'
          positions.push({ row: row + i, col })
        }
      }

      player.ships.push({
        name: shipData.name,
        size: shipData.size,
        positions,
        hits: 0
      })

      // Check if all ships placed
      if (player.ships.length === SHIPS.length) {
        if (playerIndex === 0) {
          // AI places ships
          placeAIShips(prev)
        }
        return {
          ...prev,
          players,
          phase: 'battle',
          gameStatus: 'playing'
        }
      }

      return {
        ...prev,
        players
      }
    })

    if (placingShip < SHIPS.length - 1) {
      setPlacingShip(placingShip + 1)
    }
  }

  const placeAIShips = (state: GameState) => {
    const aiPlayer = state.players[1]
    
    SHIPS.forEach(shipData => {
      let placed = false
      while (!placed) {
        const row = Math.floor(Math.random() * BOARD_SIZE)
        const col = Math.floor(Math.random() * BOARD_SIZE)
        const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical'
        
        if (canPlaceShip(aiPlayer.board, shipData, row, col, orientation)) {
          const positions: { row: number; col: number }[] = []
          
          if (orientation === 'horizontal') {
            for (let i = 0; i < shipData.size; i++) {
              aiPlayer.board[row][col + i] = 'ship'
              positions.push({ row, col: col + i })
            }
          } else {
            for (let i = 0; i < shipData.size; i++) {
              aiPlayer.board[row + i][col] = 'ship'
              positions.push({ row: row + i, col })
            }
          }

          aiPlayer.ships.push({
            name: shipData.name,
            size: shipData.size,
            positions,
            hits: 0
          })
          
          placed = true
        }
      }
    })
  }

  const fireAt = (targetPlayer: number, row: number, col: number) => {
    setGameState(prev => {
      const players = [...prev.players]
      const target = players[targetPlayer]
      const attacker = players[prev.currentPlayer]
      
      if (target.board[row][col] === 'hit' || target.board[row][col] === 'miss') {
        return prev // Already attacked
      }

      let hit = false
      let sunk = false
      let shipName = ''

      if (target.board[row][col] === 'ship') {
        target.board[row][col] = 'hit'
        hit = true
        
        // Check which ship was hit
        target.ships.forEach(ship => {
          if (ship.positions.some(p => p.row === row && p.col === col)) {
            ship.hits++
            if (ship.hits === ship.size) {
              sunk = true
              shipName = ship.name
            }
          }
        })
        
        attacker.score += 10
        if (sunk) {
          attacker.score += 50
        }
      } else {
        target.board[row][col] = 'miss'
      }

      // Check for victory
      const allSunk = target.ships.every(ship => ship.hits === ship.size)
      if (allSunk) {
        return {
          ...prev,
          gameStatus: attacker.isAI ? 'gameOver' : 'victory',
          players,
          score: attacker.isAI ? prev.score : attacker.score
        }
      }

      return {
        ...prev,
        players,
        currentPlayer: (prev.currentPlayer + 1) % 2,
        selectedPowerUp: null,
        score: attacker.isAI ? prev.score : attacker.score
      }
    })
  }

  const usePowerUp = (type: 'radar' | 'bomb' | 'shield', row?: number, col?: number) => {
    setGameState(prev => {
      const players = [...prev.players]
      const player = players[prev.currentPlayer]
      const powerUp = player.powerUps.find(p => p.type === type)
      
      if (!powerUp || powerUp.available === 0) return prev
      
      powerUp.available--

      if (type === 'radar' && row !== undefined && col !== undefined) {
        // Reveal 3x3 area
        const target = players[1 - prev.currentPlayer]
        for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
            if (target.board[r][c] === 'empty') {
              target.board[r][c] = 'miss'
            }
          }
        }
      } else if (type === 'bomb' && row !== undefined && col !== undefined) {
        // Attack 2x2 area
        const target = players[1 - prev.currentPlayer]
        for (let r = row; r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
          for (let c = col; c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
            if (target.board[r][c] === 'ship') {
              target.board[r][c] = 'hit'
            } else if (target.board[r][c] === 'empty') {
              target.board[r][c] = 'miss'
            }
          }
        }
      }

      return {
        ...prev,
        players,
        selectedPowerUp: null,
        currentPlayer: (prev.currentPlayer + 1) % 2
      }
    })
  }

  const makeAIMove = () => {
    const aiPlayer = gameState.players[1]
    const humanBoard = gameState.players[0].board
    
    // Find a cell to attack
    const targets: { row: number; col: number }[] = []
    
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (humanBoard[r][c] === 'empty' || humanBoard[r][c] === 'ship') {
          targets.push({ row: r, col: c })
        }
      }
    }
    
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)]
      setTimeout(() => {
        fireAt(0, target.row, target.col)
      }, 1000)
    }
  }

  const startGame = () => {
    const players = initializePlayers(1)
    
    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'placement',
      soundEnabled: true,
      players,
      currentPlayer: 0,
      phase: 'placement',
      selectedPowerUp: null
    })
    
    setPlacingShip(0)
  }

  const toggleSound = () => {
    setGameState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }))
  }

  // AI turns
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer === 1) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  // Save to localStorage
  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineBattleshipII_score', gameState.score.toString())
      localStorage.setItem('onlineBattleshipII_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Battleship II: Enhanced Combat
            </h1>
            <p className="text-muted-foreground">Naval combat with power-ups!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Place your ships on the grid</li>
              <li>• Take turns attacking enemy positions</li>
              <li>• Use power-ups strategically:</li>
              <li>  - Radar: Reveal 3x3 area</li>
              <li>  - Bomb: Attack 2x2 area</li>
              <li>  - Shield: Protect your ships</li>
              <li>• Sink all enemy ships to win</li>
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
              'Defeated!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
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
  const aiPlayer = gameState.players[1]

  if (gameState.gameStatus === 'placement') {
    const currentShip = SHIPS[placingShip]
    
    return (
      <Card className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Place Your Ships</h2>
            <p>Placing: {currentShip.name} (Size: {currentShip.size})</p>
            <Button onClick={() => setShipOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}>
              Rotate ({shipOrientation})
            </Button>
          </div>
          
          <div className="grid grid-cols-10 gap-0.5 mx-auto w-fit">
            {humanPlayer.board.map((row, r) => 
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => placeShip(0, placingShip, r, c, shipOrientation)}
                  onMouseEnter={() => setHoveredCell({ row: r, col: c })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`
                    w-10 h-10 border
                    ${cell === 'ship' ? 'bg-gray-600' : 'bg-blue-100'}
                    ${hoveredCell?.row === r && hoveredCell?.col === c ? 'bg-yellow-200' : ''}
                    hover:bg-blue-200
                  `}
                />
              ))
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
          </div>
          <Button size="sm" variant="outline" onClick={toggleSound}>
            {gameState.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>

        {/* Power-ups */}
        <div className="flex gap-4 justify-center">
          {humanPlayer?.powerUps.map(powerUp => (
            <Button
              key={powerUp.type}
              onClick={() => setGameState(prev => ({ 
                ...prev, 
                selectedPowerUp: prev.selectedPowerUp === powerUp.type ? null : powerUp.type 
              }))}
              disabled={powerUp.available === 0 || gameState.currentPlayer !== 0}
              variant={gameState.selectedPowerUp === powerUp.type ? 'default' : 'outline'}
              className="gap-2"
            >
              {powerUp.type === 'radar' && <Radar className="w-4 h-4" />}
              {powerUp.type === 'bomb' && <Zap className="w-4 h-4" />}
              {powerUp.type === 'shield' && <Shield className="w-4 h-4" />}
              {powerUp.type} ({powerUp.available})
            </Button>
          ))}
        </div>

        {/* Game Boards */}
        <div className="grid grid-cols-2 gap-8">
          {/* Your Board */}
          <div>
            <h3 className="text-center font-semibold mb-2">Your Fleet</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {humanPlayer?.board.map((row, r) => 
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`
                      w-10 h-10 border
                      ${cell === 'empty' ? 'bg-blue-100' : ''}
                      ${cell === 'ship' ? 'bg-gray-600' : ''}
                      ${cell === 'hit' ? 'bg-red-500' : ''}
                      ${cell === 'miss' ? 'bg-blue-300' : ''}
                    `}
                  />
                ))
              )}
            </div>
          </div>

          {/* Enemy Board */}
          <div>
            <h3 className="text-center font-semibold mb-2">Enemy Waters</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {aiPlayer?.board.map((row, r) => 
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => {
                      if (gameState.currentPlayer === 0) {
                        if (gameState.selectedPowerUp) {
                          usePowerUp(gameState.selectedPowerUp, r, c)
                        } else {
                          fireAt(1, r, c)
                        }
                      }
                    }}
                    disabled={gameState.currentPlayer !== 0}
                    className={`
                      w-10 h-10 border cursor-pointer
                      ${cell === 'empty' || cell === 'ship' ? 'bg-blue-100 hover:bg-blue-200' : ''}
                      ${cell === 'hit' ? 'bg-red-500' : ''}
                      ${cell === 'miss' ? 'bg-blue-300' : ''}
                    `}
                  >
                    {cell === 'hit' && <Target className="w-6 h-6 text-white" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center p-4 bg-gray-100 rounded">
          {gameState.currentPlayer === 0 ? "Your turn - Click enemy waters to attack!" : "Enemy is targeting..."}
        </div>
      </div>
    </Card>
  )
}