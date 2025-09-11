'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Timer } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type GemType = '💎' | '💚' | '💛' | '💜' | '❤️' | '💙' | '⭐'

interface Gem {
  type: GemType
  id: string
}

interface MatchThreeGameProps {
  levelConfig: {
    targetScore: number
    timeLimit: number
    boardSize: number
    gemTypes: number
    cascadeBonus: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Gem Starter',
    difficulty: 'easy',
    config: { 
      targetScore: 1000, 
      timeLimit: 120,
      boardSize: 8,
      gemTypes: 5,
      cascadeBonus: 50
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Gem Matcher',
    difficulty: 'medium',
    config: { 
      targetScore: 2500, 
      timeLimit: 120,
      boardSize: 8,
      gemTypes: 6,
      cascadeBonus: 75
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Gem Expert',
    difficulty: 'hard',
    config: { 
      targetScore: 5000, 
      timeLimit: 120,
      boardSize: 8,
      gemTypes: 7,
      cascadeBonus: 100
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Gem Master',
    difficulty: 'expert',
    config: { 
      targetScore: 8000, 
      timeLimit: 120,
      boardSize: 9,
      gemTypes: 7,
      cascadeBonus: 125
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Gem Legend',
    difficulty: 'master',
    config: { 
      targetScore: 12000, 
      timeLimit: 120,
      boardSize: 9,
      gemTypes: 7,
      cascadeBonus: 150
    },
    requiredStars: 14
  }
]

function MatchThreeGame({ levelConfig, onScore }: MatchThreeGameProps) {
  const allGemTypes: GemType[] = ['💎', '💚', '💛', '💜', '❤️', '💙', '⭐']
  const gemTypes = allGemTypes.slice(0, levelConfig.gemTypes)
  
  const [board, setBoard] = useState<Gem[][]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready')
  const [selectedGem, setSelectedGem] = useState<{row: number, col: number} | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [combo, setCombo] = useState(0)
  const [animatingGems, setAnimatingGems] = useState<Set<string>>(new Set())

  const createGem = (): Gem => ({
    type: gemTypes[Math.floor(Math.random() * gemTypes.length)],
    id: Math.random().toString(36).substr(2, 9)
  })

  const initializeBoard = useCallback(() => {
    const newBoard: Gem[][] = []
    for (let i = 0; i < levelConfig.boardSize; i++) {
      newBoard[i] = []
      for (let j = 0; j < levelConfig.boardSize; j++) {
        newBoard[i][j] = createGem()
      }
    }
    // Ensure no initial matches
    removeInitialMatches(newBoard)
    return newBoard
  }, [levelConfig.boardSize, gemTypes])

  const removeInitialMatches = (board: Gem[][]) => {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        while (
          (i >= 2 && board[i][j].type === board[i-1][j].type && board[i][j].type === board[i-2][j].type) ||
          (j >= 2 && board[i][j].type === board[i][j-1].type && board[i][j].type === board[i][j-2].type)
        ) {
          board[i][j] = createGem()
        }
      }
    }
  }

  const findMatches = (board: Gem[][]): Set<string> => {
    const matches = new Set<string>()
    
    // Check horizontal matches
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length - 2; j++) {
        if (board[i][j].type === board[i][j+1].type && board[i][j].type === board[i][j+2].type) {
          matches.add(`${i},${j}`)
          matches.add(`${i},${j+1}`)
          matches.add(`${i},${j+2}`)
          
          // Check for longer matches
          let k = j + 3
          while (k < board[i].length && board[i][k].type === board[i][j].type) {
            matches.add(`${i},${k}`)
            k++
          }
        }
      }
    }
    
    // Check vertical matches
    for (let j = 0; j < board[0].length; j++) {
      for (let i = 0; i < board.length - 2; i++) {
        if (board[i][j].type === board[i+1][j].type && board[i][j].type === board[i+2][j].type) {
          matches.add(`${i},${j}`)
          matches.add(`${i+1},${j}`)
          matches.add(`${i+2},${j}`)
          
          // Check for longer matches
          let k = i + 3
          while (k < board.length && board[k][j].type === board[i][j].type) {
            matches.add(`${k},${j}`)
            k++
          }
        }
      }
    }
    
    return matches
  }

  const dropGems = (board: Gem[][]) => {
    const newBoard = board.map(row => [...row])
    
    for (let j = 0; j < newBoard[0].length; j++) {
      let writePosition = newBoard.length - 1
      
      for (let i = newBoard.length - 1; i >= 0; i--) {
        if (newBoard[i][j] !== null) {
          if (i !== writePosition) {
            newBoard[writePosition][j] = newBoard[i][j]
            newBoard[i][j] = null as any
          }
          writePosition--
        }
      }
      
      // Fill empty spaces with new gems
      for (let i = writePosition; i >= 0; i--) {
        newBoard[i][j] = createGem()
      }
    }
    
    return newBoard
  }

  const processMatches = useCallback(async () => {
    setIsProcessing(true)
    let currentBoard = [...board]
    let totalScore = 0
    let cascadeCount = 0
    
    while (true) {
      const matches = findMatches(currentBoard)
      
      if (matches.size === 0) break
      
      // Animate matched gems
      setAnimatingGems(matches)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Calculate score
      const matchScore = matches.size * 10 * (1 + cascadeCount * 0.5)
      totalScore += matchScore
      
      // Remove matched gems
      matches.forEach(pos => {
        const [row, col] = pos.split(',').map(Number)
        currentBoard[row][col] = null as any
      })
      
      // Drop gems and add new ones
      currentBoard = dropGems(currentBoard)
      cascadeCount++
      
      setBoard(currentBoard)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    if (cascadeCount > 1) {
      totalScore += levelConfig.cascadeBonus * (cascadeCount - 1)
      setCombo(cascadeCount)
    } else {
      setCombo(0)
    }
    
    setScore(prev => prev + totalScore)
    setAnimatingGems(new Set())
    setIsProcessing(false)
  }, [board, levelConfig.cascadeBonus])

  const swapGems = useCallback(async (row1: number, col1: number, row2: number, col2: number) => {
    if (isProcessing) return
    
    // Check if gems are adjacent
    const isAdjacent = 
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    
    if (!isAdjacent) return
    
    const newBoard = board.map(row => [...row])
    const temp = newBoard[row1][col1]
    newBoard[row1][col1] = newBoard[row2][col2]
    newBoard[row2][col2] = temp
    
    // Check if swap creates matches
    const matches = findMatches(newBoard)
    
    if (matches.size > 0) {
      setBoard(newBoard)
      await processMatches()
    } else {
      // Swap back if no matches
      const temp = newBoard[row1][col1]
      newBoard[row1][col1] = newBoard[row2][col2]
      newBoard[row2][col2] = temp
      setBoard(newBoard)
    }
    
    setSelectedGem(null)
  }, [board, isProcessing, processMatches])

  const handleGemClick = (row: number, col: number) => {
    if (gameState !== 'playing' || isProcessing) return
    
    if (!selectedGem) {
      setSelectedGem({ row, col })
    } else {
      if (selectedGem.row === row && selectedGem.col === col) {
        setSelectedGem(null)
      } else {
        swapGems(selectedGem.row, selectedGem.col, row, col)
      }
    }
  }

  const startGame = () => {
    setBoard(initializeBoard())
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setGameState('playing')
    setSelectedGem(null)
    setCombo(0)
  }

  const resetGame = () => {
    setGameState('ready')
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setSelectedGem(null)
    setCombo(0)
  }

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameOver')
          onScore(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, score, onScore])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold">Score: {score}</div>
            <div className="text-sm text-muted-foreground">
              Target: {levelConfig.targetScore}
            </div>
            {combo > 1 && (
              <div className="text-sm text-yellow-500 font-semibold">
                {combo}x Cascade Combo!
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-xl font-semibold flex items-center gap-2">
              <Timer className="w-5 h-5" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="relative">
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
              <div className="text-center space-y-4 bg-white p-6 rounded-lg">
                <div className="text-2xl font-bold">Game Over!</div>
                <div className="text-xl">Final Score: {score}</div>
                <div className="text-lg">
                  {score >= levelConfig.targetScore ? '⭐ Level Complete!' : 'Try Again!'}
                </div>
                <Button onClick={resetGame} size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}

          <div 
            className="grid gap-1 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${levelConfig.boardSize}, 1fr)`,
              pointerEvents: isProcessing ? 'none' : 'auto'
            }}
          >
            <AnimatePresence mode="popLayout">
              {board.map((row, rowIndex) =>
                row.map((gem, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}-${gem?.id}`}
                    className={`
                      aspect-square text-3xl flex items-center justify-center rounded-lg
                      ${selectedGem?.row === rowIndex && selectedGem?.col === colIndex 
                        ? 'ring-4 ring-yellow-400 bg-yellow-50' 
                        : 'bg-white hover:bg-gray-50'}
                      ${animatingGems.has(`${rowIndex},${colIndex}`) ? 'scale-125' : ''}
                      transition-all duration-200
                    `}
                    onClick={() => handleGemClick(rowIndex, colIndex)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: animatingGems.has(`${rowIndex},${colIndex}`) ? 1.2 : 1,
                      opacity: 1
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {gem?.type}
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={resetGame} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Game
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MatchThree() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 150) return 3
    if (percentage >= 100) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="match-three"
      gameName="Match Three"
      levels={levels}
      renderGame={(config, onScore) => (
        <MatchThreeGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}