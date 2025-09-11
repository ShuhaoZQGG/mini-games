'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Grid3x3 } from 'lucide-react'

const PatternQuest: React.FC = () => {
  const [pattern, setPattern] = useState<boolean[][]>(Array(5).fill(null).map(() => Array(5).fill(false)))
  const [targetPattern, setTargetPattern] = useState<boolean[][]>(Array(5).fill(null).map(() => Array(5).fill(false)))
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [solved, setSolved] = useState(false)

  const generatePattern = () => {
    const newTarget = Array(5).fill(null).map(() => 
      Array(5).fill(false).map(() => Math.random() > 0.5)
    )
    setTargetPattern(newTarget)
    setPattern(Array(5).fill(null).map(() => Array(5).fill(false)))
    setMoves(0)
    setSolved(false)
  }

  const toggleCell = (row: number, col: number) => {
    if (solved) return
    const newPattern = pattern.map(r => [...r])
    
    // Toggle the cell and adjacent cells
    const positions = [
      [row, col],
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1]
    ]
    
    positions.forEach(([r, c]) => {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        newPattern[r][c] = !newPattern[r][c]
      }
    })
    
    setPattern(newPattern)
    setMoves(moves + 1)
    
    // Check if solved
    const isSolved = newPattern.every((row, i) => 
      row.every((cell, j) => cell === targetPattern[i][j])
    )
    
    if (isSolved) {
      setSolved(true)
      const points = Math.max(1000 - moves * 20, 100) * level
      setScore(score + points)
      setStars(Math.min(stars + 1, 12))
    }
  }

  useEffect(() => {
    generatePattern()
  }, [])

  useEffect(() => {
    if (score > level * 3000) {
      setLevel(level + 1)
    }
  }, [score, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Grid3x3 className="w-6 h-6" />
          Pattern Quest - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/12</span>
            </div>
          </div>
          <Button onClick={generatePattern} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Pattern
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-center font-semibold mb-2">Target Pattern</h3>
            <div className="grid grid-cols-5 gap-1">
              {targetPattern.map((row, i) => 
                row.map((cell, j) => (
                  <div
                    key={`target-${i}-${j}`}
                    className={`w-10 h-10 border ${cell ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                  />
                ))
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-center font-semibold mb-2">Your Pattern (Moves: {moves})</h3>
            <div className="grid grid-cols-5 gap-1">
              {pattern.map((row, i) => 
                row.map((cell, j) => (
                  <button
                    key={`pattern-${i}-${j}`}
                    className={`w-10 h-10 border transition-colors ${
                      cell ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    } hover:opacity-80`}
                    onClick={() => toggleCell(i, j)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        {solved && (
          <div className="mt-6 bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">Pattern Matched!</h3>
            <p>Completed in {moves} moves!</p>
            <Button onClick={generatePattern} className="mt-2">Next Pattern</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PatternQuest
