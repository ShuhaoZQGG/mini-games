'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DiceRollProps {
  onGameEnd?: (score: number) => void
  level?: number
}

export default function DiceRoll({ onGameEnd, level = 1 }: DiceRollProps) {
  const [dice1, setDice1] = useState(1)
  const [dice2, setDice2] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [score, setScore] = useState(0)
  const [rolls, setRolls] = useState(0)
  const [target, setTarget] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState('')
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Level-based configuration
  const maxRolls = Math.max(3, 10 - level)
  const targetMultiplier = 1 + (level * 0.2)
  const bonusPoints = level * 10

  useEffect(() => {
    // Set initial target based on level
    const baseTarget = Math.floor(Math.random() * 6 + 7) // 7-12
    setTarget(Math.floor(baseTarget * targetMultiplier))
    
    // Load high score
    const saved = localStorage.getItem('diceroll-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [level, targetMultiplier])

  const rollDice = () => {
    if (isRolling || gameOver) return

    setIsRolling(true)
    setMessage('')

    // Animate rolling
    const rollDuration = 1000
    const rollInterval = 100
    const rollTimes = rollDuration / rollInterval

    let rollCount = 0
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1)
      setDice2(Math.floor(Math.random() * 6) + 1)
      rollCount++

      if (rollCount >= rollTimes) {
        clearInterval(interval)
        
        // Final roll
        const final1 = Math.floor(Math.random() * 6) + 1
        const final2 = Math.floor(Math.random() * 6) + 1
        const total = final1 + final2
        
        setDice1(final1)
        setDice2(final2)
        setIsRolling(false)
        setRolls(rolls + 1)

        // Check result
        if (total === target) {
          const points = (maxRolls - rolls) * bonusPoints + 100
          setScore(score + points)
          setStreak(streak + 1)
          setMessage(`Perfect! +${points} points! Streak: ${streak + 1}`)
          
          // New target
          const baseTarget = Math.floor(Math.random() * 6 + 7)
          setTarget(Math.floor(baseTarget * targetMultiplier))
          setRolls(0)
        } else if (total === 7) {
          setScore(score + 50)
          setMessage('Lucky 7! +50 points')
        } else if (total === 2 || total === 12) {
          setScore(score + 75)
          setMessage('Snake eyes or boxcars! +75 points')
        } else if (final1 === final2) {
          setScore(score + 25)
          setMessage('Doubles! +25 points')
        } else {
          setMessage(`Rolled ${total}. Target is ${target}`)
        }

        // Check game over
        if (rolls + 1 >= maxRolls) {
          endGame()
        }
      }
    }, rollInterval)
  }

  const endGame = () => {
    setGameOver(true)
    const finalScore = score + (streak * 50)
    
    if (finalScore > highScore) {
      setHighScore(finalScore)
      localStorage.setItem('diceroll-highscore', finalScore.toString())
      setMessage(`New High Score! Final: ${finalScore}`)
    } else {
      setMessage(`Game Over! Final Score: ${finalScore}`)
    }
    
    if (onGameEnd) {
      onGameEnd(finalScore)
    }
  }

  const resetGame = () => {
    setDice1(1)
    setDice2(1)
    setScore(0)
    setRolls(0)
    setStreak(0)
    setGameOver(false)
    setMessage('')
    const baseTarget = Math.floor(Math.random() * 6 + 7)
    setTarget(Math.floor(baseTarget * targetMultiplier))
  }

  const getDiceFace = (value: number) => {
    const dots = {
      1: [[50, 50]],
      2: [[30, 30], [70, 70]],
      3: [[30, 30], [50, 50], [70, 70]],
      4: [[30, 30], [30, 70], [70, 30], [70, 70]],
      5: [[30, 30], [30, 70], [50, 50], [70, 30], [70, 70]],
      6: [[30, 30], [30, 50], [30, 70], [70, 30], [70, 50], [70, 70]]
    }

    return dots[value as keyof typeof dots] || []
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-4">Dice Roll</h1>
        
        <div className="text-center mb-4">
          <p className="text-lg">Level {level}</p>
          <p className="text-xl font-semibold">Target: {target}</p>
          <p className="text-sm text-gray-600">Rolls: {rolls}/{maxRolls}</p>
        </div>

        <div className="flex justify-center gap-8 mb-6">
          <motion.div
            animate={{ rotate: isRolling ? 360 : 0 }}
            transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
            className="relative w-24 h-24 bg-white border-4 border-gray-800 rounded-lg shadow-lg"
          >
            <svg width="96" height="96" viewBox="0 0 100 100">
              {getDiceFace(dice1).map((pos, i) => (
                <circle
                  key={i}
                  cx={pos[0]}
                  cy={pos[1]}
                  r="8"
                  fill="#000"
                />
              ))}
            </svg>
          </motion.div>

          <motion.div
            animate={{ rotate: isRolling ? -360 : 0 }}
            transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
            className="relative w-24 h-24 bg-white border-4 border-gray-800 rounded-lg shadow-lg"
          >
            <svg width="96" height="96" viewBox="0 0 100 100">
              {getDiceFace(dice2).map((pos, i) => (
                <circle
                  key={i}
                  cx={pos[0]}
                  cy={pos[1]}
                  r="8"
                  fill="#000"
                />
              ))}
            </svg>
          </motion.div>
        </div>

        <div className="text-center mb-4">
          <p className="text-2xl font-bold">Total: {dice1 + dice2}</p>
          {message && (
            <p className={`text-lg mt-2 ${message.includes('Perfect') || message.includes('Lucky') ? 'text-green-600' : 'text-gray-700'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="text-center mb-4">
          <p className="text-xl">Score: {score}</p>
          <p className="text-sm text-gray-600">Streak: {streak}</p>
          <p className="text-sm text-gray-600">High Score: {highScore}</p>
        </div>

        {!gameOver ? (
          <button
            onClick={rollDice}
            disabled={isRolling}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-semibold"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        ) : (
          <button
            onClick={resetGame}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
          >
            Play Again
          </button>
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Roll the target number to score big!</p>
          <p>Special bonuses for doubles, 7, and snake eyes!</p>
        </div>
      </div>
    </div>
  )
}