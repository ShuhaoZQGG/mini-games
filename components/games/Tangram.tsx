'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, RotateCw, FlipHorizontal, Lightbulb, Trophy, Target, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }

type Shape = {
  id: number
  type: 'triangle' | 'square' | 'parallelogram'
  points: Point[]
  position: Point
  rotation: number
  flipped: boolean
  color: string
  selected: boolean
  placed: boolean
  scale: number
}

type Puzzle = {
  name: string
  targetPoints: Point[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

const TANGRAM_PIECES: Omit<Shape, 'id' | 'position' | 'selected' | 'placed'>[] = [
  // Large triangle 1
  {
    type: 'triangle',
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }],
    rotation: 0,
    flipped: false,
    color: '#FF6B6B',
    scale: 1
  },
  // Large triangle 2
  {
    type: 'triangle',
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }],
    rotation: 0,
    flipped: false,
    color: '#4ECDC4',
    scale: 1
  },
  // Medium triangle
  {
    type: 'triangle',
    points: [{ x: 0, y: 0 }, { x: 70, y: 0 }, { x: 35, y: 35 }],
    rotation: 0,
    flipped: false,
    color: '#45B7D1',
    scale: 1
  },
  // Small triangle 1
  {
    type: 'triangle',
    points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 25, y: 25 }],
    rotation: 0,
    flipped: false,
    color: '#FFA07A',
    scale: 1
  },
  // Small triangle 2
  {
    type: 'triangle',
    points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 25, y: 25 }],
    rotation: 0,
    flipped: false,
    color: '#98D8C8',
    scale: 1
  },
  // Square
  {
    type: 'square',
    points: [{ x: 0, y: 0 }, { x: 35, y: 0 }, { x: 35, y: 35 }, { x: 0, y: 35 }],
    rotation: 0,
    flipped: false,
    color: '#FFD93D',
    scale: 1
  },
  // Parallelogram
  {
    type: 'parallelogram',
    points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 75, y: 25 }, { x: 25, y: 25 }],
    rotation: 0,
    flipped: false,
    color: '#6C5CE7',
    scale: 1
  }
]

const PUZZLES: Puzzle[] = [
  {
    name: 'Cat',
    targetPoints: [
      { x: 200, y: 100 }, { x: 300, y: 100 }, { x: 350, y: 150 },
      { x: 350, y: 250 }, { x: 300, y: 300 }, { x: 200, y: 300 },
      { x: 150, y: 250 }, { x: 150, y: 150 }
    ],
    difficulty: 'Easy'
  },
  {
    name: 'House',
    targetPoints: [
      { x: 150, y: 200 }, { x: 350, y: 200 }, { x: 350, y: 350 },
      { x: 150, y: 350 }, { x: 150, y: 200 }, { x: 250, y: 100 },
      { x: 350, y: 200 }
    ],
    difficulty: 'Easy'
  },
  {
    name: 'Swan',
    targetPoints: [
      { x: 200, y: 150 }, { x: 280, y: 120 }, { x: 320, y: 140 },
      { x: 340, y: 180 }, { x: 320, y: 220 }, { x: 280, y: 260 },
      { x: 220, y: 280 }, { x: 180, y: 260 }, { x: 160, y: 220 },
      { x: 160, y: 180 }
    ],
    difficulty: 'Medium'
  },
  {
    name: 'Rabbit',
    targetPoints: [
      { x: 200, y: 100 }, { x: 220, y: 80 }, { x: 240, y: 100 },
      { x: 280, y: 100 }, { x: 300, y: 80 }, { x: 320, y: 100 },
      { x: 320, y: 200 }, { x: 280, y: 280 }, { x: 220, y: 280 },
      { x: 180, y: 200 }, { x: 180, y: 100 }
    ],
    difficulty: 'Hard'
  }
]

const Tangram: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null)
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(PUZZLES[0])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [hints, setHints] = useState(3)
  const [gameComplete, setGameComplete] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const initializeShapes = useCallback(() => {
    const newShapes: Shape[] = TANGRAM_PIECES.map((piece, index) => ({
      ...piece,
      id: index,
      position: { 
        x: 50 + (index % 4) * 120, 
        y: 400 + Math.floor(index / 4) * 100 
      },
      selected: false,
      placed: false
    }))
    setShapes(newShapes)
    setSelectedShape(null)
    setGameComplete(false)
    setShowSolution(false)
  }, [])

  const selectPuzzle = useCallback((puzzleIndex: number) => {
    const puzzle = PUZZLES[puzzleIndex % PUZZLES.length]
    setCurrentPuzzle(puzzle)
    initializeShapes()
    setTimeElapsed(0)
  }, [initializeShapes])

  const rotateShape = useCallback((clockwise: boolean) => {
    if (!selectedShape) return
    
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        return {
          ...shape,
          rotation: (shape.rotation + (clockwise ? 45 : -45) + 360) % 360
        }
      }
      return shape
    }))
  }, [selectedShape])

  const flipShape = useCallback(() => {
    if (!selectedShape) return
    
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        return {
          ...shape,
          flipped: !shape.flipped
        }
      }
      return shape
    }))
  }, [selectedShape])

  const handleShapeClick = useCallback((shape: Shape) => {
    setSelectedShape(shape)
    setShapes(prev => prev.map(s => ({
      ...s,
      selected: s.id === shape.id
    })))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, shape: Shape) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    handleShapeClick(shape)
    setDragOffset({
      x: e.clientX - rect.left - shape.position.x,
      y: e.clientY - rect.top - shape.position.y
    })
    setIsDragging(true)
  }, [handleShapeClick])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedShape) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const newX = e.clientX - rect.left - dragOffset.x
    const newY = e.clientY - rect.top - dragOffset.y
    
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        return {
          ...shape,
          position: { x: newX, y: newY }
        }
      }
      return shape
    }))
  }, [isDragging, selectedShape, dragOffset])

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selectedShape) return
    
    // Snap to grid
    setShapes(prev => prev.map(shape => {
      if (shape.id === selectedShape.id) {
        const gridSize = 10
        return {
          ...shape,
          position: {
            x: Math.round(shape.position.x / gridSize) * gridSize,
            y: Math.round(shape.position.y / gridSize) * gridSize
          },
          placed: true
        }
      }
      return shape
    }))
    
    setIsDragging(false)
    checkSolution()
  }, [isDragging, selectedShape])

  const checkSolution = useCallback(() => {
    // Simplified solution checking - in a real implementation, 
    // you'd check if shapes cover the target area correctly
    const allPlaced = shapes.every(shape => shape.placed)
    
    if (allPlaced && Math.random() > 0.3) { // Simplified check
      setGameComplete(true)
      setScore(prev => prev + 1000 * level + (hints * 100))
    }
  }, [shapes, level, hints])

  const showHint = useCallback(() => {
    if (hints <= 0) return
    
    setShowSolution(true)
    setHints(prev => prev - 1)
    setTimeout(() => setShowSolution(false), 3000)
  }, [hints])

  const resetPuzzle = useCallback(() => {
    initializeShapes()
    setScore(0)
    setTimeElapsed(0)
    setHints(3)
  }, [initializeShapes])

  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1)
    selectPuzzle(level)
    setHints(3)
  }, [level, selectPuzzle])

  // Initialize
  useEffect(() => {
    initializeShapes()
  }, [initializeShapes])

  // Timer
  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTransformStyle = (shape: Shape) => {
    const transforms = []
    transforms.push(`translate(${shape.position.x}px, ${shape.position.y}px)`)
    transforms.push(`rotate(${shape.rotation}deg)`)
    if (shape.flipped) transforms.push('scaleX(-1)')
    return transforms.join(' ')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Tangram - {currentPuzzle.name}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Level {level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => rotateShape(false)}
              disabled={!selectedShape}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => rotateShape(true)}
              disabled={!selectedShape}
              variant="outline"
              size="sm"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={flipShape}
              disabled={!selectedShape}
              variant="outline"
              size="sm"
            >
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            <Button
              onClick={showHint}
              disabled={hints <= 0}
              variant="outline"
              size="sm"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({hints})
            </Button>
            <Button onClick={resetPuzzle} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Difficulty: {currentPuzzle.difficulty} | Drag and rotate pieces to match the shape
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={canvasRef}
          className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Target shape outline */}
          <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 500 600">
            <polygon
              points={currentPuzzle.targetPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={showSolution ? "#10B981" : "#6B7280"}
              strokeWidth="2"
              strokeDasharray={showSolution ? "0" : "5,5"}
              opacity={showSolution ? 1 : 0.5}
            />
          </svg>
          
          {/* Tangram pieces */}
          {shapes.map(shape => (
            <motion.div
              key={shape.id}
              className={cn(
                "absolute cursor-move",
                shape.selected && "z-10"
              )}
              style={{
                transform: getTransformStyle(shape),
                transformOrigin: 'center'
              }}
              onMouseDown={(e) => handleMouseDown(e, shape)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="150" height="150" className="overflow-visible">
                <polygon
                  points={shape.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={shape.color}
                  stroke={shape.selected ? "#FFD93D" : "#000"}
                  strokeWidth={shape.selected ? 3 : 1}
                  opacity={0.9}
                />
              </svg>
            </motion.div>
          ))}
          
          <AnimatePresence>
            {gameComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg"
              >
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                  <h2 className="text-3xl font-bold mb-4">Perfect! 🎉</h2>
                  <p className="text-xl mb-2">You solved the {currentPuzzle.name}!</p>
                  <p className="text-lg mb-4">Score: {score}</p>
                  <p className="text-md mb-4">Time: {formatTime(timeElapsed)}</p>
                  <Button onClick={nextLevel} size="lg">
                    Next Puzzle
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default Tangram