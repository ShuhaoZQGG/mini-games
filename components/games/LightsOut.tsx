'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LightsOutProps {
  onGameEnd?: (score: number) => void
  level?: number
}

export default function LightsOut({ onGameEnd, level = 1 }: LightsOutProps) {
  const gridSize = Math.min(3 + Math.floor(level / 2), 7)
  const [grid, setGrid] = useState<boolean[][]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    initializeGrid()
    const saved = localStorage.getItem('lightsout-highscore')
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

  const initializeGrid = () => {
    // Create a solvable puzzle
    const newGrid: boolean[][] = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(false)
    )
    
    // Generate a random solvable pattern
    const numClicks = 5 + level * 2
    const clickPositions = new Set<string>()
    
    while (clickPositions.size < numClicks) {
      const row = Math.floor(Math.random() * gridSize)
      const col = Math.floor(Math.random() * gridSize)
      const key = `${row}-${col}`
      
      if (!clickPositions.has(key)) {
        clickPositions.add(key)
        toggleLight(newGrid, row, col)
      }
    }
    
    setGrid(newGrid)
    setMoves(0)
    setGameWon(false)
    setTimeElapsed(0)
  }

  const toggleLight = (currentGrid: boolean[][], row: number, col: number) => {
    // Toggle the clicked cell
    currentGrid[row][col] = !currentGrid[row][col]
    
    // Toggle adjacent cells
    if (row > 0) currentGrid[row - 1][col] = !currentGrid[row - 1][col]
    if (row < gridSize - 1) currentGrid[row + 1][col] = !currentGrid[row + 1][col]
    if (col > 0) currentGrid[row][col - 1] = !currentGrid[row][col - 1]
    if (col < gridSize - 1) currentGrid[row][col + 1] = !currentGrid[row][col + 1]
  }

  const handleCellClick = (row: number, col: number) => {
    if (gameWon) return
    
    const newGrid = grid.map(row => [...row])
    toggleLight(newGrid, row, col)
    
    setGrid(newGrid)
    setMoves(moves + 1)
    
    // Check if all lights are out
    const allOff = newGrid.every(row => row.every(cell => !cell))
    
    if (allOff) {
      const baseScore = 10000 * level
      const movePenalty = moves * 50
      const timePenalty = timeElapsed * 10
      const finalScore = Math.max(0, baseScore - movePenalty - timePenalty)
      
      setScore(finalScore)
      setGameWon(true)
      
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('lightsout-highscore', finalScore.toString())
      }
      onGameEnd?.(finalScore)
    }
  }

  const getHint = () => {
    // Simple hint: show a cell that has lights on
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col]) {
          return { row, col }
        }
      }
    }
    return null
  }

  const hint = showHint ? getHint() : null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-black p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Lights Out</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6 text-center text-white">
          <div>
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-xl font-bold">{level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Moves</p>
            <p className="text-xl font-bold">{moves}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Time</p>
            <p className="text-xl font-bold">{timeElapsed}s</p>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
        </div>

        {showHint && hint && (
          <div className="bg-blue-900 border border-blue-700 rounded p-3 mb-4 text-sm text-blue-200">
            Try clicking on position ({hint.row + 1}, {hint.col + 1})
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div 
            className="grid gap-2 p-4 bg-gray-800 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((isOn, colIndex) => (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  whileHover={{ scale: 0.95 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`relative rounded-lg transition-all duration-200 ${
                    isOn 
                      ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                      : 'bg-gray-700'
                  } ${
                    hint && hint.row === rowIndex && hint.col === colIndex
                      ? 'ring-2 ring-blue-400'
                      : ''
                  }`}
                  style={{
                    width: '60px',
                    height: '60px'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isOn ? (
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-3xl"
                      >
                        💡
                      </motion.div>
                    ) : (
                      <div className="text-2xl opacity-30">⚫</div>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm mb-4">
          Click a light to toggle it and its neighbors
        </div>

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              🎉 All Lights Out!
            </h2>
            <p className="text-lg text-white mb-1">Score: {score}</p>
            <p className="text-sm text-gray-400 mb-1">
              Completed in {moves} moves
            </p>
            <p className="text-sm text-gray-400 mb-4">High Score: {highScore}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeGrid}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              New Puzzle
            </motion.button>
          </motion.div>
        )}

        {!gameWon && (
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initializeGrid}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reset
            </motion.button>
            <div className="text-white text-sm flex items-center">
              Lights On: {grid.flat().filter(Boolean).length}/{gridSize * gridSize}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}