'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TowerOfHanoiProps {
  onGameEnd?: (score: number) => void
  level?: number
}

type Tower = number[]

export default function TowerOfHanoi({ onGameEnd, level = 1 }: TowerOfHanoiProps) {
  const numDisks = Math.min(3 + level, 8)
  const [towers, setTowers] = useState<[Tower, Tower, Tower]>([[], [], []])
  const [selectedTower, setSelectedTower] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const minMoves = Math.pow(2, numDisks) - 1

  useEffect(() => {
    initializeTowers()
    const saved = localStorage.getItem('hanoi-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [level])

  useEffect(() => {
    if (!gameWon) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameWon])

  const initializeTowers = () => {
    const initialDisks = Array.from({ length: numDisks }, (_, i) => numDisks - i)
    setTowers([initialDisks, [], []])
    setMoves(0)
    setTimeElapsed(0)
    setGameWon(false)
    setSelectedTower(null)
  }

  const handleTowerClick = (towerIndex: number) => {
    if (gameWon) return

    if (selectedTower === null) {
      // Select a tower if it has disks
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex)
      }
    } else {
      // Try to move disk to this tower
      if (selectedTower === towerIndex) {
        // Deselect if clicking same tower
        setSelectedTower(null)
      } else {
        // Attempt move
        const sourceTower = [...towers[selectedTower]]
        const targetTower = [...towers[towerIndex]]
        
        if (sourceTower.length > 0) {
          const disk = sourceTower[sourceTower.length - 1]
          
          // Check if move is valid
          if (targetTower.length === 0 || disk < targetTower[targetTower.length - 1]) {
            // Make the move
            sourceTower.pop()
            targetTower.push(disk)
            
            const newTowers: [Tower, Tower, Tower] = [...towers]
            newTowers[selectedTower] = sourceTower
            newTowers[towerIndex] = targetTower
            
            setTowers(newTowers)
            setMoves(moves + 1)
            setSelectedTower(null)
            
            // Check for win
            if (newTowers[2].length === numDisks) {
              const baseScore = 10000 * level
              const moveEfficiency = minMoves / moves
              const timePenalty = timeElapsed * 5
              const efficiencyBonus = Math.floor(moveEfficiency * 5000)
              const finalScore = Math.max(0, baseScore + efficiencyBonus - timePenalty)
              
              setScore(finalScore)
              setGameWon(true)
              
              if (finalScore > highScore) {
                setHighScore(finalScore)
                localStorage.setItem('hanoi-highscore', finalScore.toString())
              }
              onGameEnd?.(finalScore)
            }
          } else {
            // Invalid move - shake animation could go here
            setSelectedTower(null)
          }
        }
      }
    }
  }

  const getDiskColor = (disk: number) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500'
    ]
    return colors[disk - 1] || 'bg-gray-500'
  }

  const getDiskWidth = (disk: number) => {
    return 40 + (disk * 30)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Tower of Hanoi</h1>
        
        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold">{level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Disks</p>
            <p className="text-xl font-bold">{numDisks}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Moves</p>
            <p className="text-xl font-bold">{moves}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Min Moves</p>
            <p className="text-xl font-bold text-green-600">{minMoves}</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
        </div>

        {showHint && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm text-blue-800">
            Move all disks from the left tower to the right tower. Only smaller disks can go on top of larger ones.
          </div>
        )}

        <div className="flex justify-around items-end mb-8" style={{ minHeight: '300px' }}>
          {towers.map((tower, towerIndex) => (
            <div
              key={towerIndex}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleTowerClick(towerIndex)}
            >
              <div className="relative" style={{ minHeight: '250px', width: '300px' }}>
                {/* Tower pole */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 bg-gray-700" 
                     style={{ height: '250px' }} />
                
                {/* Tower base */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-2 bg-gray-800" />
                
                {/* Disks */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                  {tower.map((disk, diskIndex) => (
                    <motion.div
                      key={disk}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: 1,
                        y: diskIndex === tower.length - 1 && selectedTower === towerIndex ? -10 : 0
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`${getDiskColor(disk)} rounded-lg shadow-lg ${
                        diskIndex === tower.length - 1 && selectedTower === towerIndex
                          ? 'ring-4 ring-yellow-400'
                          : ''
                      }`}
                      style={{
                        width: `${getDiskWidth(disk)}px`,
                        height: '30px',
                        marginTop: diskIndex > 0 ? '-5px' : '0'
                      }}
                    >
                      <div className="flex items-center justify-center h-full text-white font-bold">
                        {disk}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className={`mt-2 px-4 py-2 rounded ${
                selectedTower === towerIndex
                  ? 'bg-yellow-200 border-2 border-yellow-400'
                  : 'bg-gray-100 border-2 border-gray-300'
              }`}>
                Tower {towerIndex + 1}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600 mb-4">
          Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              🎉 Puzzle Solved!
            </h2>
            <p className="text-lg mb-1">Score: {score}</p>
            <p className="text-sm text-gray-600 mb-1">
              Efficiency: {moves === minMoves ? 'Perfect!' : `${moves - minMoves} extra moves`}
            </p>
            <p className="text-sm text-gray-600 mb-4">High Score: {highScore}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeTowers}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Play Again
            </motion.button>
          </motion.div>
        )}

        {!gameWon && (
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeTowers}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reset
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}