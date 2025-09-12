'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Clock, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type HexPiece = {
  id: number
  color: string
  rotation: number
}

const HexagonPuzzle: React.FC = () => {
  const [grid, setGrid] = useState<(HexPiece | null)[][]>(() => 
    Array(7).fill(null).map(() => Array(7).fill(null))
  )
  const [currentPiece, setCurrentPiece] = useState<HexPiece | null>(null)
  const [nextPieces, setNextPieces] = useState<HexPiece[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [stars, setStars] = useState(0)
  const [combo, setCombo] = useState(0)

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7']

  const generatePiece = useCallback((): HexPiece => ({
    id: Date.now() + Math.random(),
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: 0
  }), [])

  const initGame = useCallback(() => {
    setGrid(Array(7).fill(null).map(() => Array(7).fill(null)))
    setCurrentPiece(generatePiece())
    setNextPieces([generatePiece(), generatePiece(), generatePiece()])
    setScore(0)
    setLevel(1)
    setLines(0)
    setGameOver(false)
    setTimeLeft(300)
    setCombo(0)
  }, [generatePiece])

  const isValidHexPosition = (row: number, col: number): boolean => {
    const centerRow = 3
    const centerCol = 3
    const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol)
    return distance <= 3 && row >= 0 && row < 7 && col >= 0 && col < 7
  }

  const placePiece = useCallback((row: number, col: number) => {
    if (!currentPiece || !isValidHexPosition(row, col) || grid[row][col]) return false

    const newGrid = grid.map(r => [...r])
    newGrid[row][col] = currentPiece

    // Check for completed lines
    let linesCleared = 0
    const toRemove: [number, number][] = []

    // Check all hexagonal lines
    for (let r = 0; r < 7; r++) {
      let complete = true
      const linePositions: [number, number][] = []
      
      for (let c = 0; c < 7; c++) {
        if (isValidHexPosition(r, c)) {
          linePositions.push([r, c])
          if (!newGrid[r][c]) {
            complete = false
            break
          }
        }
      }
      
      if (complete && linePositions.length > 0) {
        toRemove.push(...linePositions)
        linesCleared++
      }
    }

    // Clear completed lines
    if (linesCleared > 0) {
      toRemove.forEach(([r, c]) => {
        newGrid[r][c] = null
      })
      
      setLines(prev => prev + linesCleared)
      setScore(prev => prev + linesCleared * 100 * (1 + combo * 0.5))
      setCombo(prev => prev + 1)
    } else {
      setCombo(0)
    }

    setGrid(newGrid)
    
    // Get next piece
    const [next, ...rest] = nextPieces
    setCurrentPiece(next)
    setNextPieces([...rest, generatePiece()])

    // Check game over
    let hasValidMove = false
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (isValidHexPosition(r, c) && !newGrid[r][c]) {
          hasValidMove = true
          break
        }
      }
      if (hasValidMove) break
    }

    if (!hasValidMove) {
      setGameOver(true)
    }

    return true
  }, [currentPiece, grid, nextPieces, generatePiece, combo])

  const rotatePiece = () => {
    if (currentPiece) {
      setCurrentPiece(prev => prev ? { ...prev, rotation: (prev.rotation + 60) % 360 } : null)
    }
  }

  // Timer
  useEffect(() => {
    if (!gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameOver])

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(Math.min(3, Math.floor(score / 5000)))
    }
  }, [lines, score, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Hexagon Puzzle - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/3</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Lines: {lines}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <Button onClick={initGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="relative mx-auto" style={{ width: '350px', height: '350px' }}>
              {grid.map((row, rowIndex) => 
                row.map((cell, colIndex) => {
                  if (!isValidHexPosition(rowIndex, colIndex)) return null
                  
                  const x = colIndex * 45 + (rowIndex - 3) * 22.5 + 175
                  const y = rowIndex * 40 + 50
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => placePiece(rowIndex, colIndex)}
                    >
                      <div
                        className="w-10 h-10 border-2 border-gray-400"
                        style={{
                          backgroundColor: cell?.color || 'transparent',
                          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                        }}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
          
          <div className="w-48 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current</h3>
              {currentPiece && (
                <div 
                  className="w-12 h-12 mx-auto cursor-pointer"
                  style={{
                    backgroundColor: currentPiece.color,
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                    transform: `rotate(${currentPiece.rotation}deg)`
                  }}
                  onClick={rotatePiece}
                />
              )}
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Next</h3>
              <div className="space-y-2">
                {nextPieces.map((piece, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 mx-auto"
                    style={{
                      backgroundColor: piece.color,
                      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {combo > 1 && (
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded text-center">
                <span className="font-bold text-purple-600 dark:text-purple-300">
                  {combo}x Combo!
                </span>
              </div>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl mb-2">Final Score: {score}</p>
                <p className="text-lg mb-4">Lines Cleared: {lines}</p>
                <Button onClick={initGame} size="lg">Play Again</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default HexagonPuzzle
