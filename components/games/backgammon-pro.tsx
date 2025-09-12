'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, Star } from 'lucide-react'

interface Point {
  checkers: number
  player: 1 | 2 | null
}

const BackgammonPro: React.FC = () => {
  const [board, setBoard] = useState<Point[]>(Array(24).fill({ checkers: 0, player: null }))
  const [dice, setDice] = useState<[number, number]>([0, 0])
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<number[]>([])
  const [bar, setBar] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 })
  const [bearOff, setBearOff] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 })
  const [doublingCube, setDoublingCube] = useState(1)
  const [cubeOwner, setCubeOwner] = useState<1 | 2 | null>(null)
  const [gameState, setGameState] = useState<'rolling' | 'moving' | 'ended'>('rolling')
  const [score, setScore] = useState({ player1: 0, player2: 0 })
  const [movesRemaining, setMovesRemaining] = useState<number[]>([])
  const [message, setMessage] = useState('Player 1: Roll dice to start')

  const DiceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

  // Initialize board with starting position
  useEffect(() => {
    const initialBoard: Point[] = Array(24).fill(null).map(() => ({ checkers: 0, player: null }))
    
    // Player 1 starting positions (moving counterclockwise from 0-23)
    initialBoard[0] = { checkers: 2, player: 1 }
    initialBoard[11] = { checkers: 5, player: 1 }
    initialBoard[16] = { checkers: 3, player: 1 }
    initialBoard[18] = { checkers: 5, player: 1 }
    
    // Player 2 starting positions (moving clockwise from 23-0)
    initialBoard[23] = { checkers: 2, player: 2 }
    initialBoard[12] = { checkers: 5, player: 2 }
    initialBoard[7] = { checkers: 3, player: 2 }
    initialBoard[5] = { checkers: 5, player: 2 }
    
    setBoard(initialBoard)
  }, [])

  const rollDice = useCallback(() => {
    if (gameState !== 'rolling') return
    
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    setDice([die1, die2])
    
    const moves = die1 === die2 ? [die1, die1, die2, die2] : [die1, die2]
    setMovesRemaining(moves)
    setGameState('moving')
    setMessage(`Player ${currentPlayer}: Move your checkers (${moves.join(', ')} remaining)`)
    
    // Check if player has any valid moves
    if (!hasValidMoves(currentPlayer, moves)) {
      setMessage(`Player ${currentPlayer}: No valid moves. Switching turns.`)
      setTimeout(() => switchTurn(), 2000)
    }
  }, [gameState, currentPlayer])

  const hasValidMoves = (player: 1 | 2, moves: number[]): boolean => {
    // Check if player has checkers on bar
    if ((player === 1 && bar.player1 > 0) || (player === 2 && bar.player2 > 0)) {
      return moves.some(move => {
        const targetPoint = player === 1 ? move - 1 : 24 - move
        return canMoveToPoint(targetPoint, player)
      })
    }
    
    // Check all points for valid moves
    return board.some((point, index) => {
      if (point.player !== player) return false
      return moves.some(move => {
        const targetPoint = player === 1 ? index + move : index - move
        if (targetPoint < 0 || targetPoint > 23) {
          // Check bear off
          return canBearOff(player)
        }
        return canMoveToPoint(targetPoint, player)
      })
    })
  }

  const canMoveToPoint = (pointIndex: number, player: 1 | 2): boolean => {
    if (pointIndex < 0 || pointIndex > 23) return false
    const point = board[pointIndex]
    return !point.player || point.player === player || point.checkers <= 1
  }

  const canBearOff = (player: 1 | 2): boolean => {
    // Check if all checkers are in home board
    const homeStart = player === 1 ? 18 : 0
    const homeEnd = player === 1 ? 23 : 5
    
    for (let i = 0; i < 24; i++) {
      if (board[i].player === player) {
        if (player === 1 && i < homeStart) return false
        if (player === 2 && i > homeEnd) return false
      }
    }
    
    // Check bar
    return player === 1 ? bar.player1 === 0 : bar.player2 === 0
  }

  const selectPoint = useCallback((pointIndex: number) => {
    if (gameState !== 'moving') return
    
    // Handle bar moves
    if (pointIndex === -1) {
      if ((currentPlayer === 1 && bar.player1 > 0) || (currentPlayer === 2 && bar.player2 > 0)) {
        setSelectedPoint(-1)
        const moves = movesRemaining.map(move => 
          currentPlayer === 1 ? move - 1 : 24 - move
        ).filter(target => canMoveToPoint(target, currentPlayer))
        setPossibleMoves(moves)
      }
      return
    }
    
    const point = board[pointIndex]
    
    if (selectedPoint === null) {
      // Select a checker to move
      if (point.player === currentPlayer && point.checkers > 0) {
        // Check if player must move from bar first
        if ((currentPlayer === 1 && bar.player1 > 0) || (currentPlayer === 2 && bar.player2 > 0)) {
          setMessage('You must move checkers from the bar first!')
          return
        }
        
        setSelectedPoint(pointIndex)
        
        // Calculate possible moves
        const moves = movesRemaining.map(move => {
          const target = currentPlayer === 1 ? pointIndex + move : pointIndex - move
          return target
        }).filter(target => {
          if (target < 0 || target > 23) {
            return canBearOff(currentPlayer)
          }
          return canMoveToPoint(target, currentPlayer)
        })
        
        setPossibleMoves(moves)
      }
    } else {
      // Move checker to selected point
      makeMove(selectedPoint, pointIndex)
    }
  }, [gameState, currentPlayer, selectedPoint, movesRemaining, board, bar])

  const makeMove = (from: number, to: number) => {
    const moveDistance = Math.abs(to - from)
    
    // Check if this is a valid move distance
    if (!movesRemaining.includes(moveDistance) && from !== -1) {
      setMessage('Invalid move distance')
      setSelectedPoint(null)
      setPossibleMoves([])
      return
    }
    
    const newBoard = [...board.map(p => ({ ...p }))]
    const newBar = { ...bar }
    const newBearOff = { ...bearOff }
    
    // Move from bar
    if (from === -1) {
      if (currentPlayer === 1) {
        newBar.player1--
        const actualTo = currentPlayer === 1 ? 
          movesRemaining.find(m => m - 1 === to)! - 1 : 
          24 - movesRemaining.find(m => 24 - m === to)!
        
        if (newBoard[actualTo].player === 2 && newBoard[actualTo].checkers === 1) {
          newBoard[actualTo] = { checkers: 1, player: 1 }
          newBar.player2++
        } else {
          newBoard[actualTo].checkers++
          newBoard[actualTo].player = 1
        }
      } else {
        newBar.player2--
        const actualTo = 24 - movesRemaining.find(m => 24 - m === to)!
        
        if (newBoard[actualTo].player === 1 && newBoard[actualTo].checkers === 1) {
          newBoard[actualTo] = { checkers: 1, player: 2 }
          newBar.player1++
        } else {
          newBoard[actualTo].checkers++
          newBoard[actualTo].player = 2
        }
      }
    } else {
      // Regular move
      newBoard[from].checkers--
      if (newBoard[from].checkers === 0) {
        newBoard[from].player = null
      }
      
      // Bear off
      if (to < 0 || to > 23) {
        if (currentPlayer === 1) {
          newBearOff.player1++
        } else {
          newBearOff.player2++
        }
      } else {
        // Hit opponent's blot
        if (newBoard[to].player && newBoard[to].player !== currentPlayer && newBoard[to].checkers === 1) {
          if (newBoard[to].player === 1) {
            newBar.player1++
          } else {
            newBar.player2++
          }
          newBoard[to] = { checkers: 1, player: currentPlayer }
        } else {
          newBoard[to].checkers++
          newBoard[to].player = currentPlayer
        }
      }
    }
    
    setBoard(newBoard)
    setBar(newBar)
    setBearOff(newBearOff)
    
    // Remove used move
    const usedMove = from === -1 ? 
      movesRemaining.find(m => (currentPlayer === 1 ? m - 1 === to : 24 - m === to))! :
      moveDistance
    
    const newMoves = [...movesRemaining]
    const moveIndex = newMoves.indexOf(usedMove)
    newMoves.splice(moveIndex, 1)
    setMovesRemaining(newMoves)
    
    setSelectedPoint(null)
    setPossibleMoves([])
    
    // Check for win
    if (newBearOff.player1 === 15 || newBearOff.player2 === 15) {
      endGame(currentPlayer)
    } else if (newMoves.length === 0) {
      switchTurn()
    } else {
      setMessage(`Player ${currentPlayer}: ${newMoves.join(', ')} remaining`)
      
      // Check if player has any valid moves with remaining dice
      if (!hasValidMoves(currentPlayer, newMoves)) {
        setMessage(`Player ${currentPlayer}: No more valid moves. Switching turns.`)
        setTimeout(() => switchTurn(), 2000)
      }
    }
  }

  const switchTurn = () => {
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    setGameState('rolling')
    setMovesRemaining([])
    setMessage(`Player ${currentPlayer === 1 ? 2 : 1}: Roll dice`)
    
    // AI move for player 2
    if (currentPlayer === 1) {
      setTimeout(() => aiTurn(), 1000)
    }
  }

  const aiTurn = () => {
    // Simple AI: Roll dice and make random valid moves
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    setDice([die1, die2])
    
    const moves = die1 === die2 ? [die1, die1, die2, die2] : [die1, die2]
    
    // Make moves
    let remainingMoves = [...moves]
    let attempts = 0
    
    const makeAIMove = () => {
      if (remainingMoves.length === 0 || attempts > 20) {
        setCurrentPlayer(1)
        setGameState('rolling')
        setMessage('Player 1: Roll dice')
        return
      }
      
      attempts++
      
      // Try to move from bar first
      if (bar.player2 > 0) {
        for (const move of remainingMoves) {
          const target = 24 - move
          if (canMoveToPoint(target, 2)) {
            // Make move animation would go here
            remainingMoves = remainingMoves.filter(m => m !== move)
            setTimeout(makeAIMove, 500)
            return
          }
        }
      }
      
      // Try regular moves
      for (let i = 23; i >= 0; i--) {
        if (board[i].player === 2 && board[i].checkers > 0) {
          for (const move of remainingMoves) {
            const target = i - move
            if (target >= 0 && canMoveToPoint(target, 2)) {
              // Make move animation would go here
              remainingMoves = remainingMoves.filter(m => m !== move)
              setTimeout(makeAIMove, 500)
              return
            } else if (target < 0 && canBearOff(2)) {
              // Bear off
              remainingMoves = remainingMoves.filter(m => m !== move)
              setTimeout(makeAIMove, 500)
              return
            }
          }
        }
      }
      
      // No valid moves
      setCurrentPlayer(1)
      setGameState('rolling')
      setMessage('Player 1: Roll dice')
    }
    
    setTimeout(makeAIMove, 1000)
  }

  const offerDouble = () => {
    if (cubeOwner && cubeOwner !== currentPlayer) {
      setMessage("You don't own the doubling cube")
      return
    }
    
    // Simple AI always accepts doubles for now
    if (currentPlayer === 1) {
      setDoublingCube(doublingCube * 2)
      setCubeOwner(2)
      setMessage('Player 2 accepts the double')
    }
  }

  const endGame = (winner: 1 | 2) => {
    setGameState('ended')
    
    const loser = winner === 1 ? 2 : 1
    const loserBearOff = winner === 1 ? bearOff.player2 : bearOff.player1
    const loserBar = winner === 1 ? bar.player2 : bar.player1
    
    let points = doublingCube
    
    // Gammon (opponent hasn't borne off any checkers)
    if (loserBearOff === 0) {
      points *= 2
      
      // Backgammon (opponent still has checkers on bar or in winner's home)
      if (loserBar > 0) {
        points *= 3
      }
    }
    
    const newScore = { ...score }
    if (winner === 1) {
      newScore.player1 += points
    } else {
      newScore.player2 += points
    }
    
    setScore(newScore)
    setMessage(`Player ${winner} wins! +${points} points`)
  }

  const reset = () => {
    const initialBoard: Point[] = Array(24).fill(null).map(() => ({ checkers: 0, player: null }))
    
    initialBoard[0] = { checkers: 2, player: 1 }
    initialBoard[11] = { checkers: 5, player: 1 }
    initialBoard[16] = { checkers: 3, player: 1 }
    initialBoard[18] = { checkers: 5, player: 1 }
    
    initialBoard[23] = { checkers: 2, player: 2 }
    initialBoard[12] = { checkers: 5, player: 2 }
    initialBoard[7] = { checkers: 3, player: 2 }
    initialBoard[5] = { checkers: 5, player: 2 }
    
    setBoard(initialBoard)
    setDice([0, 0])
    setCurrentPlayer(1)
    setSelectedPoint(null)
    setPossibleMoves([])
    setBar({ player1: 0, player2: 0 })
    setBearOff({ player1: 0, player2: 0 })
    setDoublingCube(1)
    setCubeOwner(null)
    setGameState('rolling')
    setMovesRemaining([])
    setMessage('Player 1: Roll dice to start')
  }

  const renderPoint = (index: number, isTop: boolean) => {
    const point = board[index]
    const isSelected = selectedPoint === index
    const isPossibleMove = possibleMoves.includes(index)
    const pointColor = isTop ? (index % 2 === 0 ? 'bg-red-700' : 'bg-gray-700') : 
                              (index % 2 === 1 ? 'bg-red-700' : 'bg-gray-700')
    
    return (
      <div
        key={index}
        onClick={() => selectPoint(index)}
        className={`
          relative w-12 h-32 cursor-pointer
          ${pointColor}
          ${isSelected ? 'ring-2 ring-yellow-400' : ''}
          ${isPossibleMove ? 'ring-2 ring-green-400' : ''}
          ${isTop ? 'clip-triangle-down' : 'clip-triangle-up'}
        `}
        style={{
          clipPath: isTop ? 
            'polygon(50% 100%, 0 0, 100% 0)' : 
            'polygon(50% 0%, 0 100%, 100% 100%)'
        }}
      >
        <div className={`absolute ${isTop ? 'top-2' : 'bottom-2'} left-1/2 transform -translate-x-1/2`}>
          {point.checkers > 0 && (
            <div className="flex flex-col items-center">
              {[...Array(Math.min(5, point.checkers))].map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-8 h-8 rounded-full border-2
                    ${point.player === 1 ? 'bg-white border-gray-800' : 'bg-black border-gray-400'}
                    ${i > 0 ? '-mt-6' : ''}
                  `}
                />
              ))}
              {point.checkers > 5 && (
                <span className="text-xs text-white mt-1">+{point.checkers - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Calculate star rating based on performance
  const getStarRating = () => {
    if (gameState !== 'ended') return 0
    const pointsWon = score.player1 - score.player2
    if (pointsWon >= 10) return 3
    if (pointsWon >= 5) return 2
    if (pointsWon > 0) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Backgammon Pro</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Score: P1: {score.player1} - P2: {score.player2}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {gameState === 'ended' && (
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
            {/* Board */}
            <div className="bg-amber-900 p-4 rounded-lg">
              {/* Top half */}
              <div className="flex justify-between mb-4">
                <div className="flex gap-1">
                  {[11, 10, 9, 8, 7, 6].map(i => renderPoint(i, true))}
                </div>
                <div className="w-8 bg-amber-700" />
                <div className="flex gap-1">
                  {[5, 4, 3, 2, 1, 0].map(i => renderPoint(i, true))}
                </div>
              </div>
              
              {/* Middle bar */}
              <div className="h-16 bg-amber-700 flex items-center justify-center gap-8">
                {/* Bar area */}
                <div className="text-center">
                  <div className="text-sm text-white">Bar</div>
                  <div className="flex gap-2">
                    {bar.player1 > 0 && (
                      <div 
                        onClick={() => currentPlayer === 1 && selectPoint(-1)}
                        className="cursor-pointer"
                      >
                        <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-800" />
                        <span className="text-xs text-white">×{bar.player1}</span>
                      </div>
                    )}
                    {bar.player2 > 0 && (
                      <div>
                        <div className="w-8 h-8 bg-black rounded-full border-2 border-gray-400" />
                        <span className="text-xs text-white">×{bar.player2}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dice */}
                <div className="flex gap-2">
                  {dice[0] > 0 && (
                    <>
                      {React.createElement(DiceIcons[dice[0] - 1], {
                        className: "w-10 h-10 text-white"
                      })}
                      {React.createElement(DiceIcons[dice[1] - 1], {
                        className: "w-10 h-10 text-white"
                      })}
                    </>
                  )}
                </div>
                
                {/* Doubling Cube */}
                <div className="text-center">
                  <div className="text-sm text-white">Cube</div>
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center font-bold">
                    {doublingCube}
                  </div>
                  {cubeOwner && (
                    <div className="text-xs text-white">P{cubeOwner}</div>
                  )}
                </div>
              </div>
              
              {/* Bottom half */}
              <div className="flex justify-between mt-4">
                <div className="flex gap-1">
                  {[12, 13, 14, 15, 16, 17].map(i => renderPoint(i, false))}
                </div>
                <div className="w-8 bg-amber-700" />
                <div className="flex gap-1">
                  {[18, 19, 20, 21, 22, 23].map(i => renderPoint(i, false))}
                </div>
              </div>
            </div>
            
            {/* Bear off area */}
            <div className="mt-4 flex justify-between">
              <div className="text-center">
                <div className="font-semibold">Player 1 Bear Off</div>
                <div className="text-2xl">{bearOff.player1}/15</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Player 2 Bear Off</div>
                <div className="text-2xl">{bearOff.player2}/15</div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="mt-4 flex justify-center gap-4">
              {gameState === 'rolling' && currentPlayer === 1 && (
                <Button onClick={rollDice} size="lg">
                  Roll Dice
                </Button>
              )}
              
              {gameState === 'moving' && currentPlayer === 1 && (
                <Button 
                  onClick={offerDouble} 
                  variant="outline"
                  disabled={doublingCube >= 64 || (cubeOwner !== null && cubeOwner !== 1)}
                >
                  Double ({doublingCube * 2})
                </Button>
              )}
            </div>
            
            {/* Message */}
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold">{message}</div>
              <div className="text-sm text-gray-600">
                Current Player: {currentPlayer} | Score: P1: {score.player1} - P2: {score.player2}
              </div>
            </div>
      </CardContent>
    </Card>
  )
}

export default BackgammonPro