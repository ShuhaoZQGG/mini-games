'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bomb, Flag, Timer, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { ShareCard } from '@/components/social/share-card'

type CellState = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

type GameState = 'idle' | 'playing' | 'won' | 'lost'

interface MinesweeperConfig {
  rows: number
  cols: number
  mines: number
  timeLimit?: number // in seconds
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy',
    config: { rows: 8, cols: 8, mines: 10, timeLimit: 300 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium',
    config: { rows: 12, cols: 12, mines: 25, timeLimit: 400 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard',
    config: { rows: 16, cols: 16, mines: 50, timeLimit: 500 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert',
    config: { rows: 16, cols: 24, mines: 80, timeLimit: 600 },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master',
    difficulty: 'master',
    config: { rows: 20, cols: 30, mines: 120, timeLimit: 700 },
    requiredStars: 12
  }
]

function MinesweeperCore({ config, onScore }: { config: MinesweeperConfig; onScore: (score: number) => void }) {
  const [board, setBoard] = useState<CellState[][]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [minesRemaining, setMinesRemaining] = useState(config.mines)
  const [startTime, setStartTime] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [pendingReveal, setPendingReveal] = useState<{ row: number; col: number } | null>(null)

  const initializeBoard = useCallback((firstClickRow?: number, firstClickCol?: number) => {
    const newBoard: CellState[][] = []
    const { rows, cols, mines } = config
    
    // Initialize empty board
    for (let r = 0; r < rows; r++) {
      newBoard[r] = []
      for (let c = 0; c < cols; c++) {
        newBoard[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }
      }
    }
    
    // Place mines randomly (avoiding first click if provided)
    let minesPlaced = 0
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows)
      const c = Math.floor(Math.random() * cols)
      
      // Skip if mine already placed or if it's the first click position
      if (newBoard[r][c].isMine || 
          (firstClickRow !== undefined && firstClickCol !== undefined &&
           Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1)) {
        continue
      }
      
      newBoard[r][c].isMine = true
      minesPlaced++
    }
    
    // Calculate adjacent mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const nr = r + dr
              const nc = c + dc
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++
              }
            }
          }
          newBoard[r][c].adjacentMines = count
        }
      }
    }
    
    setBoard(newBoard)
    setMinesRemaining(mines)
    setFirstClick(false)
  }, [config])

  const revealCell = useCallback((row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return
    if (board[row][col].isRevealed || board[row][col].isFlagged) return
    
    if (firstClick) {
      initializeBoard(row, col)
      setGameState('playing')
      setStartTime(Date.now())
      setFirstClick(false)
      // The board will be initialized, so we need to set a flag to reveal after initialization
      setPendingReveal({ row, col })
      return
    }
    
    const newBoard = [...board.map(row => [...row])]
    newBoard[row][col].isRevealed = true
    
    if (newBoard[row][col].isMine) {
      // Game over - reveal all mines
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true
          }
        }
      }
      setBoard(newBoard)
      setGameState('lost')
      onScore(0)
      return
    }
    
    // Auto-reveal adjacent cells if no adjacent mines
    if (newBoard[row][col].adjacentMines === 0) {
      const toReveal: [number, number][] = [[row, col]]
      const revealed = new Set<string>()
      
      while (toReveal.length > 0) {
        const [r, c] = toReveal.pop()!
        const key = `${r},${c}`
        
        if (revealed.has(key)) continue
        revealed.add(key)
        
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr
            const nc = c + dc
            
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols &&
                !newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged &&
                !newBoard[nr][nc].isMine) {
              newBoard[nr][nc].isRevealed = true
              if (newBoard[nr][nc].adjacentMines === 0) {
                toReveal.push([nr, nc])
              }
            }
          }
        }
      }
    }
    
    setBoard(newBoard)
    
    // Check for win
    let cellsToReveal = 0
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newBoard[r][c].isMine && !newBoard[r][c].isRevealed) {
          cellsToReveal++
        }
      }
    }
    
    if (cellsToReveal === 0) {
      setGameState('won')
      const timeBonus = config.timeLimit ? Math.max(0, config.timeLimit - elapsedTime) * 10 : 0
      const baseScore = 1000 * (config.mines / (config.rows * config.cols))
      const finalScore = Math.round(baseScore + timeBonus)
      onScore(finalScore)
    }
  }, [board, gameState, firstClick, config, elapsedTime, initializeBoard, onScore])

  const toggleFlag = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    
    if (gameState === 'won' || gameState === 'lost') return
    if (board[row][col].isRevealed) return
    
    if (gameState === 'idle') {
      setGameState('playing')
      setStartTime(Date.now())
    }
    
    const newBoard = [...board.map(row => [...row])]
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged
    setBoard(newBoard)
    setMinesRemaining(minesRemaining + (newBoard[row][col].isFlagged ? -1 : 1))
  }, [board, gameState, minesRemaining])

  const resetGame = () => {
    setGameState('idle')
    setElapsedTime(0)
    setFirstClick(true)
    initializeBoard()
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setElapsedTime(elapsed)
        
        if (config.timeLimit && elapsed >= config.timeLimit) {
          setGameState('lost')
          onScore(0)
        }
      }, 100)
    }
    
    return () => clearInterval(interval)
  }, [gameState, startTime, config.timeLimit, onScore])

  // Handle pending reveal after board initialization
  useEffect(() => {
    if (pendingReveal && !firstClick) {
      const { row, col } = pendingReveal
      setPendingReveal(null)
      revealCell(row, col)
    }
  }, [pendingReveal, firstClick, revealCell])

  // Initialize board on mount
  useEffect(() => {
    initializeBoard()
  }, [initializeBoard])

  const getCellContent = (cell: CellState) => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) return <Flag className="w-4 h-4" />
      return null
    }
    
    if (cell.isMine) return <Bomb className="w-4 h-4" />
    if (cell.adjacentMines > 0) return cell.adjacentMines
    return null
  }

  const getCellClassName = (cell: CellState) => {
    return cn(
      'w-8 h-8 border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer select-none',
      {
        'bg-gray-200 dark:bg-gray-700': !cell.isRevealed,
        'bg-white dark:bg-gray-800': cell.isRevealed && !cell.isMine,
        'bg-red-500': cell.isRevealed && cell.isMine,
        'hover:bg-gray-300 dark:hover:bg-gray-600': !cell.isRevealed && gameState === 'playing',
        'text-blue-600': cell.adjacentMines === 1,
        'text-green-600': cell.adjacentMines === 2,
        'text-red-600': cell.adjacentMines === 3,
        'text-purple-600': cell.adjacentMines === 4,
        'text-orange-600': cell.adjacentMines === 5,
        'text-cyan-600': cell.adjacentMines === 6,
        'text-black': cell.adjacentMines === 7,
        'text-gray-600': cell.adjacentMines === 8,
      }
    )
  }

  return (
    <Card className="w-full max-w-fit mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Minesweeper</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bomb className="w-5 h-5" />
              <span className="font-mono">{minesRemaining}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              <span className="font-mono">
                {elapsedTime}
                {config.timeLimit && `/${config.timeLimit}`}s
              </span>
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          Left click to reveal, right click to flag
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          <Button onClick={resetGame} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
        
        <div 
          className="inline-block border-2 border-gray-600"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${config.cols}, 32px)`,
            gap: 0 
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={getCellClassName(cell)}
                onClick={() => revealCell(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
              >
                {getCellContent(cell)}
              </div>
            ))
          )}
        </div>
        
        {gameState === 'won' && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold text-green-600">You Won! 🎉</div>
            <ShareCard
              gameTitle="Minesweeper"
              gameSlug="minesweeper"
              score={Math.round(1000 * (config.mines / (config.rows * config.cols)) + 
                (config.timeLimit ? Math.max(0, config.timeLimit - elapsedTime) * 10 : 0))}
              time={elapsedTime}
            />
          </div>
        )}
        
        {gameState === 'lost' && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">Game Over! 💣</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const getStars = (score: number, config: MinesweeperConfig): 1 | 2 | 3 => {
  const perfectScore = 1000 * (config.mines / (config.rows * config.cols)) + (config.timeLimit || 0) * 10
  const percentage = (score / perfectScore) * 100
  
  if (percentage >= 80) return 3
  if (percentage >= 50) return 2
  return 1
}

export default function MinesweeperWithLevels() {
  return (
    <GameWithLevels
      gameId="minesweeper"
      gameName="Minesweeper"
      levels={levels}
      renderGame={(config, onScore) => (
        <MinesweeperCore config={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}