'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Timer } from 'lucide-react'

interface MemoryGameProps {
  levelConfig: {
    gridSize: number
    timeLimit?: number
    targetMoves?: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Memory',
    difficulty: 'easy',
    config: { gridSize: 4, targetMoves: 20 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Medium Grid',
    difficulty: 'medium',
    config: { gridSize: 6, targetMoves: 35 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Large Grid',
    difficulty: 'hard',
    config: { gridSize: 8, targetMoves: 50 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Time Challenge',
    difficulty: 'expert',
    config: { gridSize: 6, timeLimit: 120, targetMoves: 30 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Memory',
    difficulty: 'master',
    config: { gridSize: 10, timeLimit: 180, targetMoves: 60 },
    requiredStars: 12
  }
]

const EMOJIS = ['🎮', '🎯', '🎲', '🎨', '🎪', '🎭', '🎧', '🎬', '🎤', '🎸', '🎹', '🎺', '🎷', '🎻', '🎪', '🎰', '🎳', '🎯', '🎱', '🎾', '🏀', '🏈', '⚽', '🏐', '🏓']

function MemoryMatchGame({ levelConfig, onScore }: MemoryGameProps) {
  const { gridSize, timeLimit, targetMoves } = levelConfig
  const [cards, setCards] = useState<string[]>([])
  const [flipped, setFlipped] = useState<boolean[]>([])
  const [matched, setMatched] = useState<boolean[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timer, setTimer] = useState(timeLimit || 0)
  const [matchedPairs, setMatchedPairs] = useState(0)

  // Initialize game
  useEffect(() => {
    const totalCards = gridSize * gridSize
    const pairCount = Math.floor(totalCards / 2)
    const selectedEmojis = EMOJIS.slice(0, pairCount)
    const gameCards = [...selectedEmojis, ...selectedEmojis]
    
    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]
    }
    
    // Handle odd number of cards
    if (totalCards % 2 === 1) {
      gameCards.push('⭐') // Add a special card for odd grids
    }
    
    setCards(gameCards)
    setFlipped(new Array(totalCards).fill(false))
    setMatched(new Array(totalCards).fill(false))
  }, [gridSize])

  // Timer effect
  useEffect(() => {
    if (gameStarted && !gameOver && timeLimit && timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            endGame()
            return 0
          }
          return t - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameStarted, gameOver, timeLimit, timer])

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setMoves(0)
    setMatchedPairs(0)
    setTimer(timeLimit || 0)
    setFlipped(new Array(cards.length).fill(false))
    setMatched(new Array(cards.length).fill(false))
    setSelectedIndices([])
  }

  const handleCardClick = (index: number) => {
    if (!gameStarted || gameOver || matched[index] || flipped[index]) return
    if (selectedIndices.length === 2) return

    const newFlipped = [...flipped]
    newFlipped[index] = true
    setFlipped(newFlipped)

    const newSelected = [...selectedIndices, index]
    setSelectedIndices(newSelected)

    if (newSelected.length === 2) {
      setMoves(moves + 1)
      
      if (cards[newSelected[0]] === cards[newSelected[1]]) {
        // Match found
        const newMatched = [...matched]
        newMatched[newSelected[0]] = true
        newMatched[newSelected[1]] = true
        setMatched(newMatched)
        setMatchedPairs(matchedPairs + 1)
        setSelectedIndices([])

        // Check if game is won
        const totalPairs = Math.floor(cards.length / 2)
        if (matchedPairs + 1 === totalPairs) {
          endGame()
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          const resetFlipped = [...flipped]
          resetFlipped[newSelected[0]] = false
          resetFlipped[newSelected[1]] = false
          setFlipped(resetFlipped)
          setSelectedIndices([])
        }, 1000)
      }
    }
  }

  const endGame = () => {
    setGameOver(true)
    
    // Calculate score based on moves and time
    const totalPairs = Math.floor(cards.length / 2)
    const baseScore = matchedPairs * 100
    const moveBonus = Math.max(0, (targetMoves || 100) - moves) * 10
    const timeBonus = timeLimit ? timer * 5 : 0
    const finalScore = baseScore + moveBonus + timeBonus
    
    onScore(finalScore)
  }

  const resetGame = () => {
    startGame()
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">
              Moves: {moves}
              {targetMoves && ` / ${targetMoves}`}
            </div>
            <div className="text-lg font-semibold">
              Matched: {matchedPairs} / {Math.floor(cards.length / 2)}
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {timeLimit && (
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Timer className="w-5 h-5" />
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
            )}
            
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="mr-2 h-4 w-4" /> Start Game
              </Button>
            ) : (
              <Button onClick={resetGame} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        </div>

        <div 
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: `${gridSize * 80}px`
          }}
        >
          {cards.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={!gameStarted || matched[index]}
              className={`
                aspect-square rounded-lg text-3xl font-bold transition-all duration-300
                ${matched[index] 
                  ? 'bg-green-500 text-white' 
                  : flipped[index]
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
                ${!gameStarted && 'cursor-not-allowed opacity-50'}
              `}
            >
              {(flipped[index] || matched[index]) ? emoji : '?'}
            </button>
          ))}
        </div>

        {gameOver && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">Game Over!</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Final Score: {matchedPairs * 100 + Math.max(0, (targetMoves || 100) - moves) * 10 + (timeLimit ? timer * 5 : 0)}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Completed in {moves} moves
              {timeLimit && ` with ${timer} seconds remaining`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MemoryMatchWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const { targetMoves, timeLimit } = levelConfig
    
    // Calculate star rating based on score thresholds
    if (targetMoves) {
      if (score >= targetMoves * 15) return 3
      if (score >= targetMoves * 10) return 2
      return 1
    } else if (timeLimit) {
      if (score >= timeLimit * 20) return 3
      if (score >= timeLimit * 15) return 2
      return 1
    }
    
    // Default scoring
    if (score >= 2000) return 3
    if (score >= 1000) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="memory-match"
      gameName="Memory Match"
      levels={levels}
      renderGame={(config, onScore) => (
        <MemoryMatchGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}