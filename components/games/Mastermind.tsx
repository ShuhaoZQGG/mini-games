'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MastermindProps {
  onGameEnd?: (score: number) => void
  level?: number
}

type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan'
type Guess = (Color | null)[]
type Feedback = { exact: number; partial: number }

export default function Mastermind({ onGameEnd, level = 1 }: MastermindProps) {
  const codeLength = Math.min(4 + Math.floor(level / 3), 6)
  const maxAttempts = Math.max(6, 12 - level)
  const numColors = Math.min(6 + Math.floor(level / 2), 8)
  
  const allColors: Color[] = (['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'] as Color[]).slice(0, numColors)
  
  const [secretCode, setSecretCode] = useState<Color[]>([])
  const [currentGuess, setCurrentGuess] = useState<Guess>(Array(codeLength).fill(null))
  const [guessHistory, setGuessHistory] = useState<{ guess: Color[]; feedback: Feedback }[]>([])
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    generateSecretCode()
    const saved = localStorage.getItem('mastermind-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [level])

  const generateSecretCode = () => {
    const code: Color[] = []
    for (let i = 0; i < codeLength; i++) {
      code.push(allColors[Math.floor(Math.random() * allColors.length)])
    }
    setSecretCode(code)
    setCurrentGuess(Array(codeLength).fill(null))
    setGuessHistory([])
    setGameWon(false)
    setGameLost(false)
    setSelectedColor(null)
  }

  const getColorClass = (color: Color | null) => {
    const colorMap = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-400',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      cyan: 'bg-cyan-500',
      null: 'bg-gray-300'
    }
    return colorMap[color || 'null']
  }

  const placeColor = (position: number) => {
    if (gameWon || gameLost || !selectedColor) return
    
    const newGuess = [...currentGuess]
    newGuess[position] = selectedColor
    setCurrentGuess(newGuess)
  }

  const removeColor = (position: number) => {
    if (gameWon || gameLost) return
    
    const newGuess = [...currentGuess]
    newGuess[position] = null
    setCurrentGuess(newGuess)
  }

  const calculateFeedback = (guess: Color[]): Feedback => {
    let exact = 0
    let partial = 0
    const secretCopy = [...secretCode]
    const guessCopy = [...guess]
    
    // Check for exact matches
    for (let i = 0; i < codeLength; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        exact++
        secretCopy[i] = null as any
        guessCopy[i] = null as any
      }
    }
    
    // Check for partial matches
    for (let i = 0; i < codeLength; i++) {
      if (guessCopy[i] !== null) {
        const index = secretCopy.indexOf(guessCopy[i])
        if (index !== -1) {
          partial++
          secretCopy[index] = null as any
        }
      }
    }
    
    return { exact, partial }
  }

  const submitGuess = () => {
    if (currentGuess.includes(null)) return
    
    const guess = currentGuess as Color[]
    const feedback = calculateFeedback(guess)
    
    setGuessHistory([...guessHistory, { guess, feedback }])
    
    if (feedback.exact === codeLength) {
      const baseScore = 10000 * level
      const attemptBonus = (maxAttempts - guessHistory.length) * 500
      const finalScore = baseScore + attemptBonus
      
      setScore(finalScore)
      setGameWon(true)
      
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('mastermind-highscore', finalScore.toString())
      }
      onGameEnd?.(finalScore)
    } else if (guessHistory.length + 1 >= maxAttempts) {
      setGameLost(true)
      onGameEnd?.(0)
    } else {
      setCurrentGuess(Array(codeLength).fill(null))
    }
  }

  const getHint = () => {
    if (secretCode.length === 0) return null
    const colorCounts: Record<Color, number> = {} as any
    secretCode.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1
    })
    const uniqueColors = Object.keys(colorCounts).length
    return `The code contains ${uniqueColors} different color${uniqueColors > 1 ? 's' : ''}`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-pink-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Mastermind</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold">{level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Code Length</p>
            <p className="text-xl font-bold">{codeLength}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Attempts</p>
            <p className="text-xl font-bold">{guessHistory.length}/{maxAttempts}</p>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center mb-2">Select a color:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {allColors.map(color => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color)}
                className={`w-12 h-12 rounded-full ${getColorClass(color)} ${
                  selectedColor === color ? 'ring-4 ring-gray-800 ring-offset-2' : ''
                } shadow-lg`}
              />
            ))}
          </div>
        </div>

        {/* Current Guess */}
        {!gameWon && !gameLost && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">Your guess:</p>
            <div className="flex justify-center gap-2">
              {currentGuess.map((color, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => color ? removeColor(index) : placeColor(index)}
                  className={`w-14 h-14 rounded-full ${getColorClass(color)} border-2 border-gray-400 shadow-md cursor-pointer`}
                >
                  {color && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-full h-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="text-center mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitGuess}
                disabled={currentGuess.includes(null)}
                className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                  currentGuess.includes(null)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                Submit Guess
              </motion.button>
            </div>
          </div>
        )}

        {/* Guess History */}
        {guessHistory.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">Previous guesses:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {guessHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                  <div className="flex gap-1">
                    {item.guess.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className={`w-10 h-10 rounded-full ${getColorClass(color)} shadow`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[...Array(item.feedback.exact)].map((_, i) => (
                      <div key={`exact-${i}`} className="w-6 h-6 rounded-full bg-black" />
                    ))}
                    {[...Array(item.feedback.partial)].map((_, i) => (
                      <div key={`partial-${i}`} className="w-6 h-6 rounded-full bg-gray-500" />
                    ))}
                    {[...Array(codeLength - item.feedback.exact - item.feedback.partial)].map((_, i) => (
                      <div key={`empty-${i}`} className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        <div className="text-center mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
          {showHint && (
            <p className="text-sm text-gray-600 mt-2">{getHint()}</p>
          )}
        </div>

        {/* Game Result */}
        {(gameWon || gameLost) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {gameWon ? (
              <>
                <h2 className="text-2xl font-bold text-green-600 mb-2">🎉 Code Cracked!</h2>
                <p className="text-lg mb-2">Score: {score}</p>
                <p className="text-sm text-gray-600 mb-4">High Score: {highScore}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-red-600 mb-2">Game Over!</h2>
                <p className="text-sm text-gray-600 mb-2">The code was:</p>
                <div className="flex justify-center gap-1 mb-4">
                  {secretCode.map((color, index) => (
                    <div
                      key={index}
                      className={`w-12 h-12 rounded-full ${getColorClass(color)} shadow-lg`}
                    />
                  ))}
                </div>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateSecretCode}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              New Game
            </motion.button>
          </motion.div>
        )}

        {/* Legend */}
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>⚫ = Correct color & position | ⚪ = Correct color, wrong position</p>
        </div>
      </div>
    </div>
  )
}