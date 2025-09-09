'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Shuffle } from 'lucide-react'

interface Piece {
  id: number
  currentPos: number
  correctPos: number
}

interface JigsawPuzzleGameProps {
  levelConfig: {
    gridSize: number
    timeLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Puzzle',
    difficulty: 'easy',
    config: { gridSize: 3, timeLimit: 600 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Growing Challenge',
    difficulty: 'medium',
    config: { gridSize: 4, timeLimit: 480 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Complex Pattern',
    difficulty: 'hard',
    config: { gridSize: 5, timeLimit: 360 },
    requiredStars: 4
  },
  {
    id: 4,
    name: 'Expert Assembly',
    difficulty: 'expert',
    config: { gridSize: 6, timeLimit: 300 },
    requiredStars: 6
  },
  {
    id: 5,
    name: 'Master Puzzle',
    difficulty: 'master',
    config: { gridSize: 7, timeLimit: 240 },
    requiredStars: 8
  }
]

function JigsawPuzzleGame({ levelConfig, onScore }: JigsawPuzzleGameProps) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [moves, setMoves] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit)
  const [image] = useState('/api/placeholder/400/400')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const gridSize = levelConfig.gridSize
  const totalPieces = gridSize * gridSize

  const initializePuzzle = useCallback(() => {
    const newPieces: Piece[] = []
    for (let i = 0; i < totalPieces; i++) {
      newPieces.push({
        id: i,
        currentPos: i,
        correctPos: i
      })
    }
    shufflePieces(newPieces)
    setPieces(newPieces)
    setMoves(0)
    setIsComplete(false)
    setGameStarted(true)
    setSelectedPiece(null)
    setTimeLeft(levelConfig.timeLimit)
  }, [totalPieces, levelConfig.timeLimit])

  const shufflePieces = (piecesArray: Piece[]) => {
    const positions = Array.from({ length: totalPieces }, (_, i) => i)
    
    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }
    
    piecesArray.forEach((piece, index) => {
      piece.currentPos = positions[index]
    })
  }

  const handlePieceClick = (pieceId: number) => {
    if (isComplete || !gameStarted) return

    if (selectedPiece === null) {
      setSelectedPiece(pieceId)
    } else {
      // Swap pieces
      const newPieces = [...pieces]
      const piece1 = newPieces.find(p => p.id === selectedPiece)
      const piece2 = newPieces.find(p => p.id === pieceId)
      
      if (piece1 && piece2) {
        const tempPos = piece1.currentPos
        piece1.currentPos = piece2.currentPos
        piece2.currentPos = tempPos
        
        setPieces(newPieces)
        setMoves(moves + 1)
        setSelectedPiece(null)
        
        // Check if puzzle is complete
        checkCompletion(newPieces)
      }
    }
  }

  const checkCompletion = (currentPieces: Piece[]) => {
    const complete = currentPieces.every(piece => piece.currentPos === piece.correctPos)
    if (complete) {
      setIsComplete(true)
      setGameStarted(false)
      
      // Calculate score based on time left and moves
      const timeBonus = Math.max(0, timeLeft * 10)
      const movesPenalty = moves * 5
      const baseScore = 1000
      const finalScore = Math.max(0, baseScore + timeBonus - movesPenalty)
      
      onScore(finalScore)
    }
  }

  const getPieceStyle = (piece: Piece) => {
    const row = Math.floor(piece.currentPos / gridSize)
    const col = piece.currentPos % gridSize
    const correctRow = Math.floor(piece.correctPos / gridSize)
    const correctCol = piece.correctPos % gridSize
    
    const isSelected = selectedPiece === piece.id
    const isCorrect = piece.currentPos === piece.correctPos
    
    return {
      gridRow: row + 1,
      gridColumn: col + 1,
      backgroundImage: `url(${image})`,
      backgroundSize: `${gridSize * 100}%`,
      backgroundPosition: `${(correctCol * 100) / (gridSize - 1)}% ${(correctRow * 100) / (gridSize - 1)}%`,
      cursor: isComplete ? 'default' : 'pointer',
      border: isSelected ? '3px solid #3b82f6' : isCorrect ? '2px solid #10b981' : '1px solid #e5e7eb',
      opacity: isSelected ? 0.8 : 1,
      transition: 'all 0.2s'
    }
  }

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !isComplete) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameStarted) {
      setGameStarted(false)
      onScore(0)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [gameStarted, timeLeft, isComplete, onScore])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">
              Moves: {moves}
            </div>
            <div className="text-lg font-semibold">
              Time: {formatTime(timeLeft)}
            </div>
          </div>
          <div className="flex gap-2">
            {!gameStarted && !isComplete && (
              <Button onClick={initializePuzzle} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {gameStarted && (
              <Button onClick={initializePuzzle} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {!gameStarted && !isComplete && (
          <div className="text-center py-12 text-gray-500">
            Click "Start" to begin the puzzle
          </div>
        )}

        {(gameStarted || isComplete) && (
          <div 
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              width: '400px',
              height: '400px'
            }}
          >
            {pieces
              .sort((a, b) => a.currentPos - b.currentPos)
              .map(piece => (
                <div
                  key={piece.id}
                  onClick={() => handlePieceClick(piece.id)}
                  className="rounded-sm overflow-hidden"
                  style={getPieceStyle(piece)}
                />
              ))}
          </div>
        )}

        {isComplete && (
          <div className="text-center mt-4 text-green-600 font-semibold">
            Puzzle Complete! 🎉
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function JigsawPuzzleWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    // Scoring based on time left and moves
    if (score >= 1500) return 3
    if (score >= 1000) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="jigsaw-puzzle"
      gameName="Jigsaw Puzzle"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <JigsawPuzzleGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}