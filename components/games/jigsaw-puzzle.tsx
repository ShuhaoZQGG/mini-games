'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shuffle, Trophy, Play } from 'lucide-react'

interface Piece {
  id: number
  currentPos: number
  correctPos: number
}

const GRID_SIZES = {
  easy: 3,
  medium: 4,
  hard: 5
}

export default function JigsawPuzzle() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [pieces, setPieces] = useState<Piece[]>([])
  const [moves, setMoves] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [image] = useState('/api/placeholder/400/400')

  const gridSize = GRID_SIZES[difficulty]
  const totalPieces = gridSize * gridSize

  const initializePuzzle = () => {
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
  }

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
    if (isComplete) return

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
    }
  }

  const getPieceStyle = (piece: Piece) => {
    const row = Math.floor(piece.currentPos / gridSize)
    const col = piece.currentPos % gridSize
    const correctRow = Math.floor(piece.correctPos / gridSize)
    const correctCol = piece.correctPos % gridSize
    
    const size = 400 / gridSize
    
    return {
      position: 'absolute' as const,
      left: `${col * size}px`,
      top: `${row * size}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `linear-gradient(135deg, hsl(${(piece.correctPos * 360) / totalPieces}, 70%, 60%), hsl(${(piece.correctPos * 360) / totalPieces + 30}, 70%, 50%))`,
      backgroundSize: `${400}px ${400}px`,
      backgroundPosition: `-${correctCol * size}px -${correctRow * size}px`,
      border: selectedPiece === piece.id ? '3px solid blue' : '1px solid rgba(255,255,255,0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Jigsaw Puzzle</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Click two pieces to swap them and solve the puzzle!
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={() => setDifficulty('easy')}
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              size="sm"
            >
              Easy (3x3)
            </Button>
            <Button
              onClick={() => setDifficulty('medium')}
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              size="sm"
            >
              Medium (4x4)
            </Button>
            <Button
              onClick={() => setDifficulty('hard')}
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              size="sm"
            >
              Hard (5x5)
            </Button>
          </div>

          {gameStarted && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">
                Moves: <span className="text-blue-600">{moves}</span>
              </div>
              {isComplete && (
                <div className="text-lg font-semibold text-green-600">
                  <Trophy className="inline w-5 h-5 mr-1" />
                  Completed!
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center mb-6">
            <div 
              className="relative bg-gray-200 dark:bg-gray-700 rounded-lg"
              style={{ width: '400px', height: '400px' }}
            >
              {gameStarted ? (
                pieces.map(piece => (
                  <div
                    key={piece.id}
                    style={getPieceStyle(piece)}
                    onClick={() => handlePieceClick(piece.id)}
                  >
                    {piece.correctPos + 1}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Choose difficulty and start the puzzle!
                    </p>
                  </div>
                </div>
              )}

              {isComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center text-white">
                    <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-400" />
                    <h3 className="text-2xl font-bold mb-2">Puzzle Complete!</h3>
                    <p className="mb-4">Solved in {moves} moves</p>
                    <Button onClick={initializePuzzle} variant="secondary">
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!gameStarted ? (
              <Button onClick={initializePuzzle} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Puzzle
              </Button>
            ) : (
              <>
                <Button onClick={initializePuzzle} variant="outline">
                  <Shuffle className="w-5 h-5 mr-2" />
                  New Puzzle
                </Button>
                {selectedPiece !== null && (
                  <Button onClick={() => setSelectedPiece(null)} variant="outline">
                    Cancel Selection
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Click a piece to select it (blue border), then click another to swap them.</p>
            <p>Arrange numbers 1 to {totalPieces} in order to complete the puzzle!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}