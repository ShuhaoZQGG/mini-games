'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Users, Dice1, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Player = 'white' | 'black'
type Point = {
  pieces: number
  player: Player | null
}

const OnlineBackgammon: React.FC = () => {
  const [board, setBoard] = useState<Point[]>(() => {
    const initialBoard: Point[] = Array(24).fill(null).map(() => ({ pieces: 0, player: null }))
    // Initial setup
    initialBoard[0] = { pieces: 2, player: 'white' }
    initialBoard[5] = { pieces: 5, player: 'black' }
    initialBoard[7] = { pieces: 3, player: 'black' }
    initialBoard[11] = { pieces: 5, player: 'white' }
    initialBoard[12] = { pieces: 5, player: 'black' }
    initialBoard[16] = { pieces: 3, player: 'white' }
    initialBoard[18] = { pieces: 5, player: 'white' }
    initialBoard[23] = { pieces: 2, player: 'black' }
    return initialBoard
  })

  const [currentPlayer, setCurrentPlayer] = useState<Player>('white')
  const [dice, setDice] = useState<number[]>([0, 0])
  const [diceRolled, setDiceRolled] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<number[]>([])
  const [bar, setBar] = useState<{ white: number, black: number }>({ white: 0, black: 0 })
  const [bearOff, setBearOff] = useState<{ white: number, black: number }>({ white: 0, black: 0 })
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing')
  const [winner, setWinner] = useState<Player | null>(null)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [tournamentPoints, setTournamentPoints] = useState(0)
  const [isOnline, setIsOnline] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [doublingCube, setDoublingCube] = useState(1)
  const [canDouble, setCanDouble] = useState({ white: true, black: true })

  const rollDice = useCallback(() => {
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    setDice([die1, die2])
    setDiceRolled(true)
    
    // If doubles, player gets 4 moves
    const moves = die1 === die2 ? [die1, die1, die2, die2] : [die1, die2]
    // In a real game, we'd calculate valid moves here
  }, [])

  const canBearOff = useCallback((player: Player): boolean => {
    // Check if all pieces are in home board
    const homeStart = player === 'white' ? 18 : 0
    const homeEnd = player === 'white' ? 24 : 6
    
    for (let i = 0; i < board.length; i++) {
      if (i < homeStart || i >= homeEnd) {
        if (board[i].player === player && board[i].pieces > 0) {
          return false
        }
      }
    }
    
    return bar[player] === 0
  }, [board, bar])

  const getPossibleMoves = useCallback((from: number, diceValue: number): number[] => {
    const moves: number[] = []
    const direction = currentPlayer === 'white' ? 1 : -1
    const to = from + (diceValue * direction)
    
    // Check if move is within board
    if (to >= 0 && to < 24) {
      const targetPoint = board[to]
      // Can move if empty, owned by player, or opponent has only 1 piece (can hit)
      if (!targetPoint.player || targetPoint.player === currentPlayer || targetPoint.pieces === 1) {
        moves.push(to)
      }
    }
    
    // Check bearing off
    if (canBearOff(currentPlayer)) {
      const homeStart = currentPlayer === 'white' ? 18 : 0
      const bearOffPoint = currentPlayer === 'white' ? 24 : -1
      
      if (from >= homeStart && from < homeStart + 6) {
        const exactBearOff = from + (diceValue * direction)
        if (exactBearOff === bearOffPoint || 
            (currentPlayer === 'white' && exactBearOff > 23) ||
            (currentPlayer === 'black' && exactBearOff < 0)) {
          moves.push(-1) // -1 represents bearing off
        }
      }
    }
    
    return moves
  }, [board, currentPlayer, canBearOff])

  const makeMove = useCallback((from: number, to: number) => {
    const newBoard = [...board]
    const player = currentPlayer
    
    // Remove piece from origin
    if (from >= 0) {
      newBoard[from].pieces--
      if (newBoard[from].pieces === 0) {
        newBoard[from].player = null
      }
    } else {
      // Moving from bar
      setBar(prev => ({ ...prev, [player]: prev[player] - 1 }))
    }
    
    // Add piece to destination
    if (to >= 0) {
      if (newBoard[to].player && newBoard[to].player !== player) {
        // Hit opponent's piece
        const opponent = player === 'white' ? 'black' : 'white'
        setBar(prev => ({ ...prev, [opponent]: prev[opponent] + 1 }))
        newBoard[to].pieces = 1
        newBoard[to].player = player
      } else {
        newBoard[to].pieces = (newBoard[to].pieces || 0) + 1
        newBoard[to].player = player
      }
    } else {
      // Bearing off
      setBearOff(prev => ({ ...prev, [player]: prev[player] + 1 }))
    }
    
    setBoard(newBoard)
    setSelectedPoint(null)
    setPossibleMoves([])
    
    // Check for win
    if (bearOff[player] + 1 === 15) {
      setGameStatus('won')
      setWinner(player)
      const points = doublingCube * (bearOff[player === 'white' ? 'black' : 'white'] === 0 ? 2 : 1)
      setTournamentPoints(prev => prev + points)
    }
    
    // Add to move history
    const moveNotation = `${player}: ${from + 1} → ${to >= 0 ? to + 1 : 'off'}`
    setMoveHistory(prev => [...prev, moveNotation])
  }, [board, currentPlayer, bearOff, doublingCube])

  const handlePointClick = useCallback((pointIndex: number) => {
    if (!diceRolled || gameStatus !== 'playing') return
    
    if (selectedPoint === null) {
      // Select a piece to move
      if (board[pointIndex].player === currentPlayer && board[pointIndex].pieces > 0) {
        setSelectedPoint(pointIndex)
        const moves = dice.flatMap(die => getPossibleMoves(pointIndex, die))
        setPossibleMoves([...new Set(moves)])
      }
    } else {
      // Make a move
      if (possibleMoves.includes(pointIndex)) {
        makeMove(selectedPoint, pointIndex)
      } else {
        // Deselect
        setSelectedPoint(null)
        setPossibleMoves([])
      }
    }
  }, [diceRolled, gameStatus, selectedPoint, board, currentPlayer, dice, possibleMoves, getPossibleMoves, makeMove])

  const offerDouble = () => {
    if (canDouble[currentPlayer]) {
      setDoublingCube(prev => prev * 2)
      setCanDouble(prev => ({ ...prev, [currentPlayer]: false }))
      // In online play, opponent would accept or decline
    }
  }

  const endTurn = () => {
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white')
    setDiceRolled(false)
    setDice([0, 0])
    setSelectedPoint(null)
    setPossibleMoves([])
  }

  const resetGame = useCallback(() => {
    const initialBoard: Point[] = Array(24).fill(null).map(() => ({ pieces: 0, player: null }))
    initialBoard[0] = { pieces: 2, player: 'white' }
    initialBoard[5] = { pieces: 5, player: 'black' }
    initialBoard[7] = { pieces: 3, player: 'black' }
    initialBoard[11] = { pieces: 5, player: 'white' }
    initialBoard[12] = { pieces: 5, player: 'black' }
    initialBoard[16] = { pieces: 3, player: 'white' }
    initialBoard[18] = { pieces: 5, player: 'white' }
    initialBoard[23] = { pieces: 2, player: 'black' }
    
    setBoard(initialBoard)
    setCurrentPlayer('white')
    setDice([0, 0])
    setDiceRolled(false)
    setSelectedPoint(null)
    setPossibleMoves([])
    setBar({ white: 0, black: 0 })
    setBearOff({ white: 0, black: 0 })
    setGameStatus('playing')
    setWinner(null)
    setMoveHistory([])
    setDoublingCube(1)
    setCanDouble({ white: true, black: true })
  }, [])

  const joinTournament = () => {
    setIsOnline(true)
    setRoomCode(`BG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
  }

  // Update level based on tournament points
  useEffect(() => {
    const newLevel = Math.floor(tournamentPoints / 10) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(3, Math.floor(tournamentPoints / 20)))
    }
  }, [tournamentPoints, level])

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Online Backgammon - Tournament Points: {tournamentPoints}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Level {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/3 Stars</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Cube: {doublingCube}x</span>
            </div>
            {isOnline && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Tournament: {roomCode}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isOnline && (
              <Button onClick={joinTournament} variant="outline" size="sm">
                <Users className="w-4 h-4 mr-1" />
                Join Tournament
              </Button>
            )}
            <Button onClick={resetGame} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              New Game
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Control Panel */}
          <div className="flex justify-center items-center gap-4">
            <Button 
              onClick={rollDice} 
              disabled={diceRolled || gameStatus !== 'playing'}
              className="flex items-center gap-2"
            >
              <Dice1 className="w-4 h-4" />
              Roll Dice
            </Button>
            {dice[0] > 0 && (
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-white border-2 border-gray-800 rounded flex items-center justify-center text-xl font-bold">
                  {dice[0]}
                </div>
                <div className="w-10 h-10 bg-white border-2 border-gray-800 rounded flex items-center justify-center text-xl font-bold">
                  {dice[1]}
                </div>
              </div>
            )}
            {diceRolled && (
              <Button onClick={endTurn} variant="outline">
                End Turn
              </Button>
            )}
            {canDouble[currentPlayer] && !diceRolled && (
              <Button onClick={offerDouble} variant="outline">
                Double ({doublingCube * 2}x)
              </Button>
            )}
          </div>

          {/* Board */}
          <div className="bg-amber-700 p-4 rounded-lg">
            <div className="grid grid-cols-12 gap-1">
              {/* Top half */}
              {[...Array(12)].map((_, i) => {
                const pointIndex = 11 - i
                const point = board[pointIndex]
                const isSelected = selectedPoint === pointIndex
                const isPossibleMove = possibleMoves.includes(pointIndex)
                
                return (
                  <div
                    key={`top-${i}`}
                    className={`
                      h-32 bg-amber-${i % 2 === 0 ? '600' : '800'} flex flex-col items-center justify-start cursor-pointer
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
                    `}
                    onClick={() => handlePointClick(pointIndex)}
                  >
                    {[...Array(Math.min(5, point.pieces))].map((_, j) => (
                      <div
                        key={j}
                        className={`
                          w-8 h-8 rounded-full border-2 mt-1
                          ${point.player === 'white' 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gray-900 border-gray-700'}
                        `}
                      />
                    ))}
                    {point.pieces > 5 && (
                      <span className="text-xs mt-1">{point.pieces}</span>
                    )}
                  </div>
                )
              })}
              
              {/* Bottom half */}
              {[...Array(12)].map((_, i) => {
                const pointIndex = 12 + i
                const point = board[pointIndex]
                const isSelected = selectedPoint === pointIndex
                const isPossibleMove = possibleMoves.includes(pointIndex)
                
                return (
                  <div
                    key={`bottom-${i}`}
                    className={`
                      h-32 bg-amber-${i % 2 === 0 ? '600' : '800'} flex flex-col-reverse items-center justify-start cursor-pointer
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
                    `}
                    onClick={() => handlePointClick(pointIndex)}
                  >
                    {[...Array(Math.min(5, point.pieces))].map((_, j) => (
                      <div
                        key={j}
                        className={`
                          w-8 h-8 rounded-full border-2 mb-1
                          ${point.player === 'white' 
                            ? 'bg-white border-gray-300' 
                            : 'bg-gray-900 border-gray-700'}
                        `}
                      />
                    ))}
                    {point.pieces > 5 && (
                      <span className="text-xs mb-1">{point.pieces}</span>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Bar and Bear Off */}
            <div className="mt-4 flex justify-between">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <h4 className="text-sm font-semibold mb-1">Bar</h4>
                <div>White: {bar.white} | Black: {bar.black}</div>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold capitalize">{currentPlayer}'s Turn</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                <h4 className="text-sm font-semibold mb-1">Bear Off</h4>
                <div>White: {bearOff.white} | Black: {bearOff.black}</div>
              </div>
            </div>
          </div>

          {/* Game Over */}
          <AnimatePresence>
            {gameStatus === 'won' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 bg-green-100 dark:bg-green-900 rounded-lg"
              >
                <h3 className="text-2xl font-bold mb-2">{winner === 'white' ? 'White' : 'Black'} Wins!</h3>
                <p className="mb-2">Points Earned: {doublingCube}</p>
                <Button onClick={resetGame}>New Game</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default OnlineBackgammon