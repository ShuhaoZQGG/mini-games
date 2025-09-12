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
