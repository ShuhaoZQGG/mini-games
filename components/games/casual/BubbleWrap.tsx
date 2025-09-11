'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Zap } from 'lucide-react'

const BubbleWrap: React.FC = () => {
  const [bubbles, setBubbles] = useState<boolean[][]>(
    Array(10).fill(null).map(() => Array(10).fill(false))
  )
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [combo, setCombo] = useState(0)
  const [satisfaction, setSatisfaction] = useState(0)
  const [popsInRow, setPopsInRow] = useState(0)

  const popBubble = (row: number, col: number) => {
    if (bubbles[row][col]) return
    
    const newBubbles = bubbles.map(r => [...r])
    newBubbles[row][col] = true
    setBubbles(newBubbles)
    
    setPopsInRow(prev => prev + 1)
    setScore(prev => prev + 10 * (1 + combo * 0.1))
    setSatisfaction(prev => Math.min(100, prev + 1))
    
    // Check if all popped
    const allPopped = newBubbles.every(row => row.every(b => b))
    if (allPopped) {
      setTimeout(resetBubbles, 500)
      setLevel(prev => prev + 1)
      setStars(prev => Math.min(prev + 1, 15))
    }
  }

  const resetBubbles = () => {
    setBubbles(Array(10).fill(null).map(() => Array(10).fill(false)))
    setPopsInRow(0)
  }

  const resetGame = () => {
    resetBubbles()
    setScore(0)
    setLevel(1)
    setCombo(0)
    setSatisfaction(0)
  }

  useEffect(() => {
    if (popsInRow >= 5) {
      setCombo(prev => prev + 1)
      setPopsInRow(0)
      setTimeout(() => setCombo(0), 3000)
    }
  }, [popsInRow])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Bubble Wrap Pop - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/15</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Satisfaction: {satisfaction}%</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Sheet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {combo > 0 && (
            <div className="text-center text-lg font-bold text-purple-600">
              {combo}x Combo!
            </div>
          )}
          
          <div className="grid grid-cols-10 gap-1 max-w-md mx-auto">
            {bubbles.map((row, i) => 
              row.map((popped, j) => (
                <button
                  key={`${i}-${j}`}
                  className={`
                    w-10 h-10 rounded-full transition-all
                    ${popped 
                      ? 'bg-gray-200 dark:bg-gray-700 scale-75' 
                      : 'bg-gradient-to-br from-blue-300 to-blue-500 hover:scale-110 active:scale-95 shadow-md'}
                  `}
                  onClick={() => popBubble(i, j)}
                  disabled={popped}
                >
                  {!popped && <span className="text-xs opacity-50">○</span>}
                </button>
              ))
            )}
          </div>
          
          <div className="text-center text-sm text-gray-600">
            So satisfying! Pop all the bubbles!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BubbleWrap
