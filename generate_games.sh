#!/bin/bash

# Generate remaining multiplayer games
echo "Generating remaining multiplayer games..."

# OnlineConnectFive
cat > /Users/shuhaozhang/Project/mini-games/components/games/multiplayer/OnlineConnectFive.tsx << 'GAME_EOF'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users } from 'lucide-react'

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  board: (0 | 1 | 2)[][]
  currentPlayer: 1 | 2
  winner: number | null
  moveCount: number
}

const BOARD_SIZE = 9
const WIN_LENGTH = 5

export default function OnlineConnectFive() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)),
    currentPlayer: 1,
    winner: null,
    moveCount: 0
  })

  const checkWin = (board: number[][], row: number, col: number, player: number): boolean => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
    
    for (const [dr, dc] of directions) {
      let count = 1
      
      // Check positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row + dr * i
        const c = col + dc * i
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
          count++
        } else break
      }
      
      // Check negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const r = row - dr * i
        const c = col - dc * i
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
          count++
        } else break
      }
      
      if (count >= WIN_LENGTH) return true
    }
    
    return false
  }

  const makeMove = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || gameState.board[row][col] !== 0) return

    setGameState(prev => {
      const board = prev.board.map(r => [...r])
      board[row][col] = prev.currentPlayer
      
      if (checkWin(board, row, col, prev.currentPlayer)) {
        return {
          ...prev,
          board,
          winner: prev.currentPlayer,
          gameStatus: prev.currentPlayer === 2 ? 'gameOver' : 'victory',
          score: prev.currentPlayer === 1 ? prev.score + 100 : prev.score
        }
      }
      
      const moveCount = prev.moveCount + 1
      if (moveCount === BOARD_SIZE * BOARD_SIZE) {
        return {
          ...prev,
          board,
          gameStatus: 'gameOver',
          moveCount
        }
      }
      
      return {
        ...prev,
        board,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        moveCount
      }
    })
  }

  const makeAIMove = () => {
    const emptySpots: [number, number][] = []
    
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (gameState.board[r][c] === 0) {
          emptySpots.push([r, c])
        }
      }
    }
    
    if (emptySpots.length > 0) {
      const [row, col] = emptySpots[Math.floor(Math.random() * emptySpots.length)]
      setTimeout(() => makeMove(row, col), 500)
    }
  }

  const startGame = () => {
    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)),
      currentPlayer: 1,
      winner: null,
      moveCount: 0
    })
  }

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer === 2) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineConnectFive_score', gameState.score.toString())
      localStorage.setItem('onlineConnectFive_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Connect Five
            </h1>
            <p className="text-muted-foreground">Extended Connect Four on 9x9 grid!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Place pieces on a 9x9 grid</li>
              <li>• Connect 5 in a row to win</li>
              <li>• Block opponent's connections</li>
              <li>• Think strategically!</li>
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
              gameState.winner ? 'Game Over!' : 'Draw!'
            )}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Score: {gameState.score}</p>
            <p className="text-lg text-muted-foreground">Level: {gameState.level}</p>
            <p className="text-lg text-muted-foreground">Moves: {gameState.moveCount}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
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

        <div className="text-center text-lg font-semibold">
          {gameState.currentPlayer === 1 ? "Your Turn" : "AI's Turn"}
        </div>

        <div className="grid grid-cols-9 gap-1 mx-auto w-fit bg-blue-200 p-2 rounded">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => makeMove(r, c)}
                disabled={gameState.currentPlayer !== 1 || cell !== 0}
                className={`
                  w-12 h-12 rounded-full transition-colors
                  ${cell === 0 ? 'bg-white hover:bg-gray-100' : ''}
                  ${cell === 1 ? 'bg-red-500' : ''}
                  ${cell === 2 ? 'bg-yellow-500' : ''}
                `}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
GAME_EOF

echo "Created OnlineConnectFive.tsx"

# OnlineOthello
cat > /Users/shuhaozhang/Project/mini-games/components/games/multiplayer/OnlineOthello.tsx << 'GAME_EOF'
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw, Volume2, VolumeX, Pause, Play, Trophy, Users } from 'lucide-react'

interface GameState {
  score: number
  level: number
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'
  soundEnabled: boolean
  board: (0 | 1 | 2)[][]
  currentPlayer: 1 | 2
  blackCount: number
  whiteCount: number
  validMoves: boolean[][]
}

const BOARD_SIZE = 8

export default function OnlineOthello() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameStatus: 'idle',
    soundEnabled: true,
    board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0)),
    currentPlayer: 1,
    blackCount: 2,
    whiteCount: 2,
    validMoves: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false))
  })

  const initializeBoard = (): (0 | 1 | 2)[][] => {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
    const mid = BOARD_SIZE / 2
    board[mid - 1][mid - 1] = 2
    board[mid - 1][mid] = 1
    board[mid][mid - 1] = 1
    board[mid][mid] = 2
    return board as (0 | 1 | 2)[][]
  }

  const getFlippedDiscs = (board: number[][], row: number, col: number, player: number): [number, number][] => {
    if (board[row][col] !== 0) return []
    
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
    const opponent = player === 1 ? 2 : 1
    const flipped: [number, number][] = []
    
    for (const [dr, dc] of directions) {
      const temp: [number, number][] = []
      let r = row + dr
      let c = col + dc
      
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
        temp.push([r, c])
        r += dr
        c += dc
      }
      
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player && temp.length > 0) {
        flipped.push(...temp)
      }
    }
    
    return flipped
  }

  const findValidMoves = (board: number[][], player: number): boolean[][] => {
    const valid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false))
    
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (getFlippedDiscs(board, r, c, player).length > 0) {
          valid[r][c] = true
        }
      }
    }
    
    return valid
  }

  const makeMove = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || !gameState.validMoves[row][col]) return

    setGameState(prev => {
      const board = prev.board.map(r => [...r])
      const flipped = getFlippedDiscs(board, row, col, prev.currentPlayer)
      
      board[row][col] = prev.currentPlayer
      flipped.forEach(([r, c]) => {
        board[r][c] = prev.currentPlayer
      })
      
      let blackCount = 0
      let whiteCount = 0
      board.forEach(row => {
        row.forEach(cell => {
          if (cell === 1) blackCount++
          else if (cell === 2) whiteCount++
        })
      })
      
      const nextPlayer = prev.currentPlayer === 1 ? 2 : 1
      const nextValidMoves = findValidMoves(board, nextPlayer)
      const hasValidMove = nextValidMoves.some(row => row.some(cell => cell))
      
      if (!hasValidMove) {
        const otherPlayer = nextPlayer === 1 ? 2 : 1
        const otherValidMoves = findValidMoves(board, otherPlayer)
        const otherHasValidMove = otherValidMoves.some(row => row.some(cell => cell))
        
        if (!otherHasValidMove) {
          // Game over
          return {
            ...prev,
            board,
            blackCount,
            whiteCount,
            gameStatus: blackCount > whiteCount ? 'victory' : 'gameOver',
            score: blackCount > whiteCount ? blackCount * 10 : prev.score,
            validMoves: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(false))
          }
        }
        
        return {
          ...prev,
          board,
          blackCount,
          whiteCount,
          validMoves: otherValidMoves,
          score: prev.currentPlayer === 1 ? blackCount * 10 : prev.score
        }
      }
      
      return {
        ...prev,
        board,
        blackCount,
        whiteCount,
        currentPlayer: nextPlayer,
        validMoves: nextValidMoves,
        score: prev.currentPlayer === 1 ? blackCount * 10 : prev.score
      }
    })
  }

  const makeAIMove = () => {
    const validSpots: [number, number][] = []
    
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (gameState.validMoves[r][c]) {
          validSpots.push([r, c])
        }
      }
    }
    
    if (validSpots.length > 0) {
      // Prefer corners
      const corners = validSpots.filter(([r, c]) => 
        (r === 0 || r === BOARD_SIZE - 1) && (c === 0 || c === BOARD_SIZE - 1)
      )
      
      const spot = corners.length > 0 ? 
        corners[Math.floor(Math.random() * corners.length)] :
        validSpots[Math.floor(Math.random() * validSpots.length)]
      
      setTimeout(() => makeMove(spot[0], spot[1]), 1000)
    }
  }

  const startGame = () => {
    const board = initializeBoard()
    const validMoves = findValidMoves(board, 1)
    
    setGameState({
      score: 0,
      level: 1,
      gameStatus: 'playing',
      soundEnabled: true,
      board,
      currentPlayer: 1,
      blackCount: 2,
      whiteCount: 2,
      validMoves
    })
  }

  const toggleSound = () => {
    setGameState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))
  }

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing'
    }))
  }

  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.currentPlayer === 2) {
      makeAIMove()
    }
  }, [gameState.currentPlayer, gameState.gameStatus])

  useEffect(() => {
    if (gameState.score > 0) {
      localStorage.setItem('onlineOthello_score', gameState.score.toString())
      localStorage.setItem('onlineOthello_level', gameState.level.toString())
    }
  }, [gameState.score, gameState.level])

  if (gameState.gameStatus === 'idle') {
    return (
      <Card className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Users className="w-8 h-8" />
              Othello (Reversi)
            </h1>
            <p className="text-muted-foreground">Flip discs to dominate the board!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Place discs to flip opponent's pieces</li>
              <li>• Must flip at least one disc per move</li>
              <li>• Corners are strategic positions</li>
              <li>• Player with most discs wins</li>
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
            <p className="text-lg">Black: {gameState.blackCount} | White: {gameState.whiteCount}</p>
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

  return (
    <Card className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <span className="text-lg font-semibold">Score: {gameState.score}</span>
            <span className="text-lg font-semibold">Level: {gameState.level}</span>
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

        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">
            {gameState.currentPlayer === 1 ? "Your Turn (Black)" : "AI's Turn (White)"}
          </div>
          <div className="flex justify-center gap-8">
            <span>Black: {gameState.blackCount}</span>
            <span>White: {gameState.whiteCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-0.5 mx-auto w-fit bg-green-800 p-2 rounded">
          {gameState.board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => makeMove(r, c)}
                disabled={gameState.currentPlayer !== 1 || !gameState.validMoves[r][c]}
                className={`
                  w-12 h-12 rounded-full transition-all
                  ${cell === 0 ? 'bg-green-600' : ''}
                  ${cell === 1 ? 'bg-black' : ''}
                  ${cell === 2 ? 'bg-white' : ''}
                  ${gameState.validMoves[r][c] && gameState.currentPlayer === 1 ? 'ring-2 ring-yellow-400' : ''}
                `}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
GAME_EOF

echo "Created OnlineOthello.tsx"

echo "Multiplayer games generation complete!"
