'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RotateCcw, Clock, Trophy, Check, X } from 'lucide-react'

const DICE = [
  'AAEEGN', 'ELRTTY', 'AOOTTW', 'ABBJOO',
  'EHRTVW', 'CIMOTU', 'DISTTY', 'EIOSST',
  'DELRVY', 'ACHOPS', 'HIMNQU', 'EEINSU',
  'EEGHNW', 'AFFKPS', 'HLNNRZ', 'DEILRX'
]

const Boggle: React.FC = () => {
  const [grid, setGrid] = useState<string[][]>([])
  const [timeLeft, setTimeLeft] = useState(180)
  const [currentWord, setCurrentWord] = useState('')
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [selectedPath, setSelectedPath] = useState<{row: number, col: number}[]>([])
  
  const generateGrid = useCallback(() => {
    const shuffledDice = [...DICE].sort(() => Math.random() - 0.5)
    const newGrid: string[][] = []
    
    for (let i = 0; i < 4; i++) {
      newGrid[i] = []
      for (let j = 0; j < 4; j++) {
        const die = shuffledDice[i * 4 + j]
        newGrid[i][j] = die[Math.floor(Math.random() * 6)]
      }
    }
    
    setGrid(newGrid)
  }, [])
  
  const isValidWord = (word: string): boolean => {
    // In a real game, check against dictionary
    return word.length >= 3
  }
  
  const calculateScore = (word: string): number => {
    const len = word.length
    if (len <= 2) return 0
    if (len <= 4) return 1
    if (len === 5) return 2
    if (len === 6) return 3
    if (len === 7) return 5
    return 11
  }
  
  const selectLetter = (row: number, col: number) => {
    const isAdjacent = selectedPath.length === 0 || 
      (Math.abs(selectedPath[selectedPath.length - 1].row - row) <= 1 &&
       Math.abs(selectedPath[selectedPath.length - 1].col - col) <= 1)
    
    const alreadySelected = selectedPath.some(p => p.row === row && p.col === col)
    
    if (isAdjacent && !alreadySelected) {
      setSelectedPath([...selectedPath, {row, col}])
      setCurrentWord(currentWord + grid[row][col])
    }
  }
  
  const submitWord = () => {
    if (currentWord.length >= 3 && !foundWords.includes(currentWord) && isValidWord(currentWord)) {
      setFoundWords([...foundWords, currentWord])
      setScore(score + calculateScore(currentWord))
    }
    setCurrentWord('')
    setSelectedPath([])
  }
  
  const resetGame = () => {
    generateGrid()
    setTimeLeft(180)
    setCurrentWord('')
    setFoundWords([])
    setScore(0)
    setGameOver(false)
    setSelectedPath([])
  }
  
  useEffect(() => {
    generateGrid()
  }, [generateGrid])
  
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameOver])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Boggle</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <span>Words: {foundWords.length}</span>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Grid */}
          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
            {grid.map((row, i) =>
              row.map((letter, j) => (
                <Button
                  key={`${i}-${j}`}
                  variant={selectedPath.some(p => p.row === i && p.col === j) ? "default" : "outline"}
                  className="w-16 h-16 text-xl font-bold"
                  onClick={() => selectLetter(i, j)}
                  disabled={gameOver}
                >
                  {letter === 'Q' ? 'Qu' : letter}
                </Button>
              ))
            )}
          </div>
          
          {/* Current Word */}
          <div className="flex gap-2">
            <Input
              value={currentWord}
              readOnly
              placeholder="Select letters..."
              className="text-center text-lg"
            />
            <Button onClick={submitWord} disabled={currentWord.length < 3}>
              <Check className="w-4 h-4" />
            </Button>
            <Button onClick={() => {setCurrentWord(''); setSelectedPath([])}} variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Found Words */}
          <div className="max-h-32 overflow-y-auto">
            <h3 className="font-semibold mb-2">Found Words:</h3>
            <div className="flex flex-wrap gap-2">
              {foundWords.map((word, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                  {word} (+{calculateScore(word)})
                </span>
              ))}
            </div>
          </div>
          
          {gameOver && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
              <p className="mb-4">Final Score: {score}</p>
              <p className="mb-4">Words Found: {foundWords.length}</p>
              <Button onClick={resetGame}>Play Again</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Boggle
