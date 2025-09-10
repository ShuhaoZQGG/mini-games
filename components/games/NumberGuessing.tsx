'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface NumberGuessingProps {
  onGameEnd?: (score: number) => void
  level?: number
}

export default function NumberGuessing({ onGameEnd, level = 1 }: NumberGuessingProps) {
  const [targetNumber, setTargetNumber] = useState(0)
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [history, setHistory] = useState<{ guess: number; feedback: string }[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)

  const maxRange = 100 * level
  const maxAttempts = Math.max(5, 10 - level)
  const basePoints = 1000 * level
  const attemptPenalty = 100 * level

  useEffect(() => {
    resetGame()
    const saved = localStorage.getItem('numberguess-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [level])

  const resetGame = () => {
    const newTarget = Math.floor(Math.random() * maxRange) + 1
    setTargetNumber(newTarget)
    setGuess('')
    setAttempts(0)
    setFeedback('')
    setHistory([])
    setGameOver(false)
  }

  const makeGuess = () => {
    const guessNum = parseInt(guess)
    
    if (isNaN(guessNum) || guessNum < 1 || guessNum > maxRange) {
      setFeedback(`Please enter a number between 1 and ${maxRange}`)
      return
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    let newFeedback = ''
    let hint = ''
    
    if (guessNum === targetNumber) {
      const finalScore = Math.max(0, basePoints - (attemptPenalty * (newAttempts - 1)))
      setScore(finalScore)
      newFeedback = '🎉 Correct!'
      setGameOver(true)
      
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('numberguess-highscore', finalScore.toString())
      }
      onGameEnd?.(finalScore)
    } else if (guessNum < targetNumber) {
      const diff = targetNumber - guessNum
      if (diff > 20) {
        newFeedback = '⬆️ Way too low!'
        hint = 'cold'
      } else if (diff > 10) {
        newFeedback = '⬆️ Too low'
        hint = 'warm'
      } else {
        newFeedback = '⬆️ A bit low'
        hint = 'hot'
      }
    } else {
      const diff = guessNum - targetNumber
      if (diff > 20) {
        newFeedback = '⬇️ Way too high!'
        hint = 'cold'
      } else if (diff > 10) {
        newFeedback = '⬇️ Too high'
        hint = 'warm'
      } else {
        newFeedback = '⬇️ A bit high'
        hint = 'hot'
      }
    }

    setFeedback(newFeedback)
    setHistory([...history, { guess: guessNum, feedback: newFeedback }])
    
    if (newAttempts >= maxAttempts && guessNum !== targetNumber) {
      setGameOver(true)
      setFeedback(`Game Over! The number was ${targetNumber}`)
      onGameEnd?.(0)
    }
    
    setGuess('')
  }

  const getTemperatureColor = (feedback: string) => {
    if (feedback.includes('Way')) return 'text-blue-500'
    if (feedback.includes('bit')) return 'text-red-500'
    if (feedback.includes('Correct')) return 'text-green-500'
    return 'text-yellow-500'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Number Guessing</h1>
        
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold">{level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Range</p>
            <p className="text-xl font-bold">1-{maxRange}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Attempts</p>
            <p className="text-xl font-bold">{attempts}/{maxAttempts}</p>
          </div>
        </div>

        {!gameOver && (
          <>
            <div className="mb-6">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && makeGuess()}
                placeholder={`Enter a number (1-${maxRange})`}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                min="1"
                max={maxRange}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={makeGuess}
              disabled={!guess || gameOver}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
            >
              Make Guess
            </motion.button>
          </>
        )}

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mt-4 text-xl font-bold ${getTemperatureColor(feedback)}`}
          >
            {feedback}
          </motion.div>
        )}

        {history.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Guess History:</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {history.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex justify-between p-2 rounded ${
                    index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium">#{index + 1}: {item.guess}</span>
                  <span className={getTemperatureColor(item.feedback)}>
                    {item.feedback.replace(/[⬆️⬇️🎉]/g, '').trim()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {gameOver && (
          <div className="mt-6 text-center">
            {score > 0 && (
              <>
                <p className="text-2xl font-bold text-green-600 mb-2">Score: {score}</p>
                <p className="text-sm text-gray-600 mb-4">High Score: {highScore}</p>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
            >
              Play Again
            </motion.button>
          </div>
        )}

        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-2">
            {[...Array(maxAttempts)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < attempts ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}