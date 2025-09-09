'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
// Multiplayer temporarily disabled
// import { useMultiplayerGame } from '@/hooks/use-multiplayer-game'
import { toast } from 'sonner'

interface Point {
  checkers: number
  color: 'white' | 'black' | null
}

interface GameState {
  board: Point[]
  currentPlayer: 'white' | 'black'
  dice: [number, number] | null
  diceRolled: boolean
  availableMoves: number[]
  barWhite: number
  barBlack: number
  homeWhite: number
  homeBlack: number
  selectedPoint: number | null
  possibleMoves: number[]
  winner: 'white' | 'black' | null
  doublingCube: number
  cubeOwner: 'white' | 'black' | null
}

const initialBoard: Point[] = Array(24).fill(null).map(() => ({ checkers: 0, color: null }))
// Set up initial positions
initialBoard[0] = { checkers: 2, color: 'white' }
initialBoard[5] = { checkers: 5, color: 'black' }
initialBoard[7] = { checkers: 3, color: 'black' }
initialBoard[11] = { checkers: 5, color: 'white' }
initialBoard[12] = { checkers: 5, color: 'black' }
initialBoard[16] = { checkers: 3, color: 'white' }
initialBoard[18] = { checkers: 5, color: 'white' }
initialBoard[23] = { checkers: 2, color: 'black' }

export default function BackgammonGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: initialBoard,
    currentPlayer: 'white',
    dice: null,
    diceRolled: false,
    availableMoves: [],
    barWhite: 0,
    barBlack: 0,
    homeWhite: 0,
    homeBlack: 0,
    selectedPoint: null,
    possibleMoves: [],
    winner: null,
    doublingCube: 1,
    cubeOwner: null,
  })

  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null)

  // Multiplayer functionality temporarily disabled
  const isConnected = false
  const roomCode = roomId
  const players: string[] = []
  const sendGameUpdate = (state: GameState) => {}
  const createRoom = async () => false
  const joinRoom = async (id: string) => false
  const leaveRoom = () => {}

  const rollDice = useCallback(() => {
    if (gameState.diceRolled || gameState.winner) return
    
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    const moves = die1 === die2 ? [die1, die1, die2, die2] : [die1, die2]
    
    const newState = {
      ...gameState,
      dice: [die1, die2] as [number, number],
      diceRolled: true,
      availableMoves: moves,
    }
    
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
  }, [gameState, isMultiplayer, sendGameUpdate])

  const getValidMoves = useCallback((point: number, player: 'white' | 'black'): number[] => {
    const moves: number[] = []
    if (!gameState.availableMoves.length) return moves
    
    // Check if player has checkers on the bar
    if (player === 'white' && gameState.barWhite > 0) {
      // White must enter from bar (points 0-5)
      gameState.availableMoves.forEach(die => {
        const targetPoint = die - 1
        if (targetPoint >= 0 && targetPoint < 6) {
          const target = gameState.board[targetPoint]
          if (!target.color || target.color === 'white' || (target.color === 'black' && target.checkers === 1)) {
            moves.push(targetPoint)
          }
        }
      })
      return moves
    }
    
    if (player === 'black' && gameState.barBlack > 0) {
      // Black must enter from bar (points 18-23)
      gameState.availableMoves.forEach(die => {
        const targetPoint = 24 - die
        if (targetPoint >= 18 && targetPoint < 24) {
          const target = gameState.board[targetPoint]
          if (!target.color || target.color === 'black' || (target.color === 'white' && target.checkers === 1)) {
            moves.push(targetPoint)
          }
        }
      })
      return moves
    }
    
    // Regular moves
    gameState.availableMoves.forEach(die => {
      const targetPoint = player === 'white' ? point + die : point - die
      
      // Check if move is within board
      if (targetPoint >= 0 && targetPoint < 24) {
        const target = gameState.board[targetPoint]
        if (!target.color || target.color === player || (target.color !== player && target.checkers === 1)) {
          moves.push(targetPoint)
        }
      }
      
      // Check bearing off
      if (canBearOff(player)) {
        if (player === 'white' && point >= 18 && point + die >= 24) {
          moves.push(-1) // -1 represents bearing off
        }
        if (player === 'black' && point < 6 && point - die < 0) {
          moves.push(-1)
        }
      }
    })
    
    return moves
  }, [gameState])

  const canBearOff = (player: 'white' | 'black'): boolean => {
    // Check if all checkers are in home board
    if (player === 'white') {
      if (gameState.barWhite > 0) return false
      for (let i = 0; i < 18; i++) {
        if (gameState.board[i].color === 'white' && gameState.board[i].checkers > 0) {
          return false
        }
      }
    } else {
      if (gameState.barBlack > 0) return false
      for (let i = 6; i < 24; i++) {
        if (gameState.board[i].color === 'black' && gameState.board[i].checkers > 0) {
          return false
        }
      }
    }
    return true
  }

  const selectPoint = useCallback((point: number) => {
    if (!gameState.diceRolled || gameState.winner) return
    if (isMultiplayer && playerColor !== gameState.currentPlayer) return
    
    const pointData = gameState.board[point]
    
    // If a point is already selected
    if (gameState.selectedPoint !== null) {
      // Check if this is a valid move
      if (gameState.possibleMoves.includes(point)) {
        makeMove(gameState.selectedPoint, point)
      } else {
        // Deselect
        setGameState(prev => ({ ...prev, selectedPoint: null, possibleMoves: [] }))
      }
    } else {
      // Select a point with current player's checkers
      if (pointData.color === gameState.currentPlayer && pointData.checkers > 0) {
        const validMoves = getValidMoves(point, gameState.currentPlayer)
        if (validMoves.length > 0) {
          setGameState(prev => ({ 
            ...prev, 
            selectedPoint: point, 
            possibleMoves: validMoves 
          }))
        }
      }
    }
  }, [gameState, isMultiplayer, playerColor, getValidMoves])

  const makeMove = (from: number, to: number) => {
    const newBoard = [...gameState.board]
    const player = gameState.currentPlayer
    let newBarWhite = gameState.barWhite
    let newBarBlack = gameState.barBlack
    let newHomeWhite = gameState.homeWhite
    let newHomeBlack = gameState.homeBlack
    
    // Remove checker from source
    newBoard[from].checkers--
    if (newBoard[from].checkers === 0) {
      newBoard[from].color = null
    }
    
    // Handle bearing off
    if (to === -1) {
      if (player === 'white') {
        newHomeWhite++
      } else {
        newHomeBlack++
      }
    } else {
      // Handle capturing
      if (newBoard[to].color && newBoard[to].color !== player && newBoard[to].checkers === 1) {
        if (newBoard[to].color === 'white') {
          newBarWhite++
        } else {
          newBarBlack++
        }
        newBoard[to].checkers = 0
        newBoard[to].color = null
      }
      
      // Add checker to destination
      if (!newBoard[to].color) {
        newBoard[to].color = player
        newBoard[to].checkers = 1
      } else {
        newBoard[to].checkers++
      }
    }
    
    // Calculate move distance and remove from available moves
    const moveDistance = to === -1 
      ? (player === 'white' ? 24 - from : from + 1)
      : Math.abs(to - from)
    const moveIndex = gameState.availableMoves.indexOf(moveDistance)
    const newAvailableMoves = [...gameState.availableMoves]
    if (moveIndex !== -1) {
      newAvailableMoves.splice(moveIndex, 1)
    }
    
    // Check for winner
    let winner: 'white' | 'black' | null = null
    if (newHomeWhite === 15) winner = 'white'
    if (newHomeBlack === 15) winner = 'black'
    
    // Switch turn if no moves left
    const nextPlayer = newAvailableMoves.length === 0 ? 
      (player === 'white' ? 'black' : 'white') : player
    
    const newState = {
      ...gameState,
      board: newBoard,
      barWhite: newBarWhite,
      barBlack: newBarBlack,
      homeWhite: newHomeWhite,
      homeBlack: newHomeBlack,
      availableMoves: newAvailableMoves,
      selectedPoint: null,
      possibleMoves: [],
      currentPlayer: nextPlayer,
      diceRolled: newAvailableMoves.length > 0,
      dice: newAvailableMoves.length === 0 ? null : gameState.dice,
      winner,
    }
    
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
    
    if (winner) {
      toast.success(`${winner === 'white' ? 'White' : 'Black'} wins!`)
    }
  }

  const handleCreateRoom = async () => {
    const success = await createRoom()
    if (success) {
      setIsMultiplayer(true)
      setPlayerColor('white')
      toast.success('Room created! Waiting for opponent...')
    }
  }

  const handleJoinRoom = async () => {
    if (!roomId) {
      toast.error('Please enter a room code')
      return
    }
    const success = await joinRoom(roomId)
    if (success) {
      setIsMultiplayer(true)
      setPlayerColor('black')
      toast.success('Joined room successfully!')
    }
  }

  const handleLeaveRoom = () => {
    leaveRoom()
    setIsMultiplayer(false)
    setPlayerColor(null)
    setRoomId('')
    resetGame()
  }

  const resetGame = () => {
    const newState = {
      board: initialBoard,
      currentPlayer: 'white' as const,
      dice: null,
      diceRolled: false,
      availableMoves: [],
      barWhite: 0,
      barBlack: 0,
      homeWhite: 0,
      homeBlack: 0,
      selectedPoint: null,
      possibleMoves: [],
      winner: null,
      doublingCube: 1,
      cubeOwner: null,
    }
    setGameState(newState)
    if (isMultiplayer) sendGameUpdate(newState)
  }

  const renderPoint = (index: number) => {
    const point = gameState.board[index]
    const isSelected = gameState.selectedPoint === index
    const isPossibleMove = gameState.possibleMoves.includes(index)
    const isTopRow = index >= 12
    
    return (
      <div
        key={index}
        className={`relative w-12 h-40 flex flex-col ${isTopRow ? 'flex-col-reverse' : 'flex-col'} items-center cursor-pointer
          ${index % 2 === 0 ? 'bg-amber-700' : 'bg-amber-900'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isPossibleMove ? 'ring-2 ring-green-500' : ''}
          hover:opacity-80 transition-opacity`}
        onClick={() => selectPoint(index)}
      >
        {Array.from({ length: Math.min(point.checkers, 5) }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full border-2 ${
              point.color === 'white' 
                ? 'bg-white border-gray-300' 
                : 'bg-gray-800 border-gray-600'
            }`}
          />
        ))}
        {point.checkers > 5 && (
          <div className="absolute top-1/2 -translate-y-1/2 text-xs font-bold">
            +{point.checkers - 5}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Backgammon</h1>
        {!isMultiplayer && (
          <p className="text-gray-600">Classic board game of strategy and luck</p>
        )}
      </div>

      {!isMultiplayer ? (
        <div className="flex gap-4 justify-center mb-6">
          <Button onClick={handleCreateRoom}>Create Room</Button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room Code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="px-3 py-2 border rounded"
              maxLength={6}
            />
            <Button onClick={handleJoinRoom}>Join Room</Button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-6">
          <p className="text-lg font-semibold">Room Code: {roomCode}</p>
          <p className="text-sm text-gray-600">
            Players: {players.length}/2
            {playerColor && ` | You are ${playerColor}`}
          </p>
          <Button onClick={handleLeaveRoom} variant="destructive" className="mt-2">
            Leave Room
          </Button>
        </div>
      )}

      <div className="mb-4 text-center">
        <p className="text-lg font-semibold mb-2">
          Current Player: {gameState.currentPlayer === 'white' ? 'White' : 'Black'}
        </p>
        {gameState.dice && (
          <div className="flex gap-2 justify-center mb-2">
            <div className="w-12 h-12 bg-white border-2 border-gray-800 rounded flex items-center justify-center text-2xl font-bold">
              {gameState.dice[0]}
            </div>
            <div className="w-12 h-12 bg-white border-2 border-gray-800 rounded flex items-center justify-center text-2xl font-bold">
              {gameState.dice[1]}
            </div>
          </div>
        )}
        {!gameState.diceRolled && !gameState.winner && (
          <Button 
            onClick={rollDice}
            disabled={isMultiplayer && playerColor !== gameState.currentPlayer}
          >
            Roll Dice
          </Button>
        )}
        {gameState.availableMoves.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Moves remaining: {gameState.availableMoves.join(', ')}
          </p>
        )}
      </div>

      <div className="relative bg-amber-600 p-4 rounded-lg shadow-lg">
        {/* Board */}
        <div className="flex gap-8">
          {/* Left side (points 12-23) */}
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => renderPoint(12 + i))}
          </div>
          <div className="w-8 bg-amber-800" /> {/* Bar */}
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => renderPoint(18 + i))}
          </div>
        </div>
        
        {/* Bar area */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-8 flex flex-col items-center justify-center gap-4">
          {gameState.barWhite > 0 && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300" />
              <span className="text-xs">{gameState.barWhite}</span>
            </div>
          )}
          {gameState.barBlack > 0 && (
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600" />
              <span className="text-xs text-white">{gameState.barBlack}</span>
            </div>
          )}
        </div>
        
        <div className="h-8" /> {/* Spacer */}
        
        {/* Bottom side (points 11-0) */}
        <div className="flex gap-8">
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => renderPoint(11 - i))}
          </div>
          <div className="w-8 bg-amber-800" /> {/* Bar */}
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => renderPoint(5 - i))}
          </div>
        </div>
        
        {/* Home areas */}
        <div className="absolute right-2 top-2 text-sm">
          <p>White Home: {gameState.homeWhite}/15</p>
          <p>Black Home: {gameState.homeBlack}/15</p>
        </div>
      </div>

      {gameState.winner && (
        <div className="text-center mt-6">
          <h2 className="text-2xl font-bold mb-4">
            {gameState.winner === 'white' ? 'White' : 'Black'} Wins!
          </h2>
          <Button onClick={resetGame}>New Game</Button>
        </div>
      )}
    </Card>
  )
}