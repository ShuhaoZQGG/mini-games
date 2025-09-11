'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, DollarSign } from 'lucide-react'

const FortuneWheel: React.FC = () => {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [coins, setCoins] = useState(100)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [lastWin, setLastWin] = useState(0)
  const [totalSpins, setTotalSpins] = useState(0)
  const [jackpots, setJackpots] = useState(0)

  const segments = [
    { value: 10, color: '#FF6B6B', label: '10' },
    { value: 50, color: '#4ECDC4', label: '50' },
    { value: 20, color: '#45B7D1', label: '20' },
    { value: 100, color: '#FFA07A', label: '100' },
    { value: 30, color: '#98D8C8', label: '30' },
    { value: 500, color: '#FFD700', label: 'JACKPOT' },
    { value: 40, color: '#6C5CE7', label: '40' },
    { value: 0, color: '#95A5A6', label: 'LOSE' }
  ]

  const spinWheel = () => {
    if (isSpinning || coins < 10) return
    
    setCoins(prev => prev - 10)
    setIsSpinning(true)
    setTotalSpins(prev => prev + 1)
    
    const spins = 5 + Math.random() * 5
    const finalRotation = rotation + spins * 360
    const segmentAngle = 360 / segments.length
    const winningIndex = Math.floor(((finalRotation % 360) / segmentAngle)) % segments.length
    const prize = segments[segments.length - 1 - winningIndex]
    
    setRotation(finalRotation)
    
    setTimeout(() => {
      setIsSpinning(false)
      setLastWin(prize.value)
      setCoins(prev => prev + prize.value)
      
      if (prize.value === 500) {
        setJackpots(prev => prev + 1)
        setStars(prev => Math.min(prev + 3, 12))
      }
    }, 3000)
  }

  const resetGame = () => {
    setRotation(0)
    setCoins(100)
    setLastWin(0)
    setTotalSpins(0)
    setJackpots(0)
  }

  useEffect(() => {
    const newLevel = Math.floor(totalSpins / 20) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      setStars(prev => Math.min(prev + 1, 12))
    }
  }, [totalSpins, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Fortune Wheel - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="font-semibold">{coins} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/12</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Jackpots: {jackpots}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="relative w-80 h-80 mx-auto">
            {/* Wheel */}
            <svg
              className="w-full h-full transition-transform duration-[3000ms] ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
              viewBox="0 0 200 200"
            >
              {segments.map((segment, i) => {
                const angle = (360 / segments.length)
                const startAngle = i * angle - 90
                const endAngle = (i + 1) * angle - 90
                const largeArc = angle > 180 ? 1 : 0
                
                const x1 = 100 + 90 * Math.cos(startAngle * Math.PI / 180)
                const y1 = 100 + 90 * Math.sin(startAngle * Math.PI / 180)
                const x2 = 100 + 90 * Math.cos(endAngle * Math.PI / 180)
                const y2 = 100 + 90 * Math.sin(endAngle * Math.PI / 180)
                
                return (
                  <g key={i}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={100 + 60 * Math.cos((startAngle + angle/2) * Math.PI / 180)}
                      y={100 + 60 * Math.sin((startAngle + angle/2) * Math.PI / 180)}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {segment.label}
                    </text>
                  </g>
                )
              })}
            </svg>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-red-600" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <Button 
              onClick={spinWheel} 
              disabled={isSpinning || coins < 10}
              size="lg"
              className="px-8"
            >
              {isSpinning ? 'Spinning...' : 'Spin (10 coins)'}
            </Button>
            
            {lastWin > 0 && !isSpinning && (
              <div className={`text-2xl font-bold ${lastWin === 500 ? 'text-yellow-500 animate-pulse' : 'text-green-500'}`}>
                {lastWin === 500 ? '🎉 JACKPOT! 🎉' : `Won ${lastWin} coins!`}
              </div>
            )}
            
            {lastWin === 0 && !isSpinning && totalSpins > 0 && (
              <div className="text-xl text-gray-500">
                Better luck next time!
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              Total Spins: {totalSpins}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FortuneWheel
