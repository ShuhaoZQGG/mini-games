'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dices, RotateCcw, Trophy } from 'lucide-react'

const Yahtzee: React.FC = () => {
  const [dice, setDice] = useState([1, 1, 1, 1, 1])
  const [kept, setKept] = useState([false, false, false, false, false])
  const [rollsLeft, setRollsLeft] = useState(3)
  const [scores, setScores] = useState<Record<string, number | null>>({
    ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
    threeOfKind: null, fourOfKind: null, fullHouse: null,
    smallStraight: null, largeStraight: null, yahtzee: null, chance: null
  })
  const [round, setRound] = useState(1)
  
  const rollDice = useCallback(() => {
    if (rollsLeft === 0) return
    
    setDice(prev => prev.map((d, i) => kept[i] ? d : Math.floor(Math.random() * 6) + 1))
    setRollsLeft(prev => prev - 1)
  }, [kept, rollsLeft])
  
  const toggleKeep = (index: number) => {
    if (rollsLeft === 3) return
    setKept(prev => prev.map((k, i) => i === index ? !k : k))
  }
  
  const calculateScore = (category: string): number => {
    const counts = dice.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    const sum = dice.reduce((a, b) => a + b, 0)
    const values = Object.values(counts)
    const sorted = [...dice].sort()
    
    switch(category) {
      case 'ones': return dice.filter(d => d === 1).length * 1
      case 'twos': return dice.filter(d => d === 2).length * 2
      case 'threes': return dice.filter(d => d === 3).length * 3
      case 'fours': return dice.filter(d => d === 4).length * 4
      case 'fives': return dice.filter(d => d === 5).length * 5
      case 'sixes': return dice.filter(d => d === 6).length * 6
      case 'threeOfKind': return values.some(v => v >= 3) ? sum : 0
      case 'fourOfKind': return values.some(v => v >= 4) ? sum : 0
      case 'fullHouse': return values.includes(3) && values.includes(2) ? 25 : 0
      case 'smallStraight': 
        const small = [[1,2,3,4], [2,3,4,5], [3,4,5,6]]
        return small.some(s => s.every(n => sorted.includes(n))) ? 30 : 0
      case 'largeStraight':
        return (sorted.join('') === '12345' || sorted.join('') === '23456') ? 40 : 0
      case 'yahtzee': return values.includes(5) ? 50 : 0
      case 'chance': return sum
      default: return 0
    }
  }
  
  const selectScore = (category: string) => {
    if (scores[category] !== null || rollsLeft === 3) return
    
    setScores(prev => ({...prev, [category]: calculateScore(category)}))
    setRollsLeft(3)
    setKept([false, false, false, false, false])
    setRound(prev => prev + 1)
    
    if (round === 13) {
      // Game over
    }
  }
  
  const getTotalScore = () => {
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']
    const upperTotal = upperCategories
      .reduce((sum, cat) => sum + (scores[cat] || 0), 0)
    const bonus = upperTotal >= 63 ? 35 : 0
    const lower = Object.entries(scores)
      .filter(([key]) => !upperCategories.includes(key))
      .reduce((sum, [_, val]) => sum + (val || 0), 0)
    return upperTotal + bonus + lower
  }
  
  const resetGame = () => {
    setDice([1, 1, 1, 1, 1])
    setKept([false, false, false, false, false])
    setRollsLeft(3)
    setScores({
      ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
      threeOfKind: null, fourOfKind: null, fullHouse: null,
      smallStraight: null, largeStraight: null, yahtzee: null, chance: null
    })
    setRound(1)
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Yahtzee</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>{getTotalScore()}</span>
            </div>
            <span>Round {round}/13</span>
            <span>Rolls: {rollsLeft}</span>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dice */}
          <div className="flex gap-2 justify-center">
            {dice.map((d, i) => (
              <Button
                key={i}
                variant={kept[i] ? "default" : "outline"}
                onClick={() => toggleKeep(i)}
                className="w-16 h-16 text-2xl"
                disabled={rollsLeft === 3}
              >
                {d}
              </Button>
            ))}
          </div>
          
          <Button onClick={rollDice} disabled={rollsLeft === 0} className="w-full">
            <Dices className="w-4 h-4 mr-2" />
            Roll Dice ({rollsLeft} left)
          </Button>
          
          {/* Scorecard */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <h3 className="font-bold">Upper Section</h3>
              {['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].map(cat => (
                <Button
                  key={cat}
                  variant={scores[cat] !== null ? "secondary" : "outline"}
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => selectScore(cat)}
                  disabled={scores[cat] !== null || rollsLeft === 3}
                >
                  <span className="capitalize">{cat}</span>
                  <span>{scores[cat] ?? (rollsLeft < 3 ? calculateScore(cat) : '-')}</span>
                </Button>
              ))}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold">Lower Section</h3>
              {['threeOfKind', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'].map(cat => (
                <Button
                  key={cat}
                  variant={scores[cat] !== null ? "secondary" : "outline"}
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => selectScore(cat)}
                  disabled={scores[cat] !== null || rollsLeft === 3}
                >
                  <span>{cat.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span>{scores[cat] ?? (rollsLeft < 3 ? calculateScore(cat) : '-')}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {round > 13 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold">Game Over!</h2>
              <p className="text-xl">Final Score: {getTotalScore()}</p>
              <Button onClick={resetGame} className="mt-4">Play Again</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Yahtzee
