'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy } from 'lucide-react'

const LETTER_VALUES: Record<string, number> = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8, K:5, L:1, M:3,
  N:1, O:1, P:3, Q:10, R:1, S:1, T:1, U:1, V:4, W:4, X:8, Y:4, Z:10
}

const Scrabble: React.FC = () => {
  const [board] = useState(Array(15).fill(null).map(() => Array(15).fill('')))
  const [rack, setRack] = useState(['A', 'E', 'I', 'O', 'U', 'R', 'S'])
  const [score, setScore] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  
  const playWord = (word: string) => {
    const wordScore = word.split('').reduce((sum, letter) => 
      sum + (LETTER_VALUES[letter] || 0), 0)
    setScore(score + wordScore)
    setCurrentWord('')
    
    // Refill rack
    const letters = 'AAEEIIOOURRSSTTLLNN'
    const newLetters = []
    for (let i = rack.length; i < 7; i++) {
      newLetters.push(letters[Math.floor(Math.random() * letters.length)])
    }
    setRack([...rack.filter(l => !word.includes(l)), ...newLetters])
  }
  
  const resetGame = () => {
    setScore(0)
    setCurrentWord('')
    setRack(['A', 'E', 'I', 'O', 'U', 'R', 'S'])
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Scrabble</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Score: {score}</span>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Simplified Board */}
          <div className="grid grid-cols-15 gap-1 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg max-w-lg mx-auto">
            {board.slice(6, 9).map((row, i) => 
              row.slice(6, 9).map((cell, j) => (
                <div key={`${i}-${j}`} className="w-10 h-10 border border-gray-400 bg-white dark:bg-gray-800 flex items-center justify-center font-bold">
                  {cell}
                </div>
              ))
            )}
          </div>
          
          {/* Current Word */}
          <div className="text-center">
            <p className="text-lg mb-2">Current Word: {currentWord}</p>
            <p>Value: {currentWord.split('').reduce((sum, l) => sum + (LETTER_VALUES[l] || 0), 0)}</p>
          </div>
          
          {/* Rack */}
          <div className="flex gap-2 justify-center">
            {rack.map((letter, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-12 h-12"
                onClick={() => {
                  setCurrentWord(currentWord + letter)
                  setRack(rack.filter((_, idx) => idx !== i))
                }}
              >
                {letter}
                <sub className="text-xs">{LETTER_VALUES[letter]}</sub>
              </Button>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => playWord(currentWord)}
              disabled={currentWord.length < 2}
            >
              Play Word
            </Button>
            <Button 
              onClick={() => {
                setRack([...rack, ...currentWord.split('')])
                setCurrentWord('')
              }}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Scrabble
