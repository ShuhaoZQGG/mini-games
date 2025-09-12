'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface RockPaperScissorsProps {
  onGameEnd?: (score: number) => void
  level?: number
}

type Choice = 'rock' | 'paper' | 'scissors'
type ChoiceOrNull = Choice | null

export default function RockPaperScissors({ onGameEnd, level = 1 }: RockPaperScissorsProps) {
  const [playerChoice, setPlayerChoice] = useState<ChoiceOrNull>(null)
  const [aiChoice, setAiChoice] = useState<ChoiceOrNull>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const maxRounds = 5 + level * 2
  const winPoints = 100 * level
  const drawPoints = 25 * level
  const streakBonus = 50 * level

  useEffect(() => {
    const saved = localStorage.getItem('rps-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const choices: Choice[] = ['rock', 'paper', 'scissors']
  
  const emojis = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
    null: '❓'
  }

  const getWinner = (player: Choice, ai: Choice): 'win' | 'lose' | 'draw' => {
    if (player === ai) return 'draw'
    if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) {
      return 'win'
    }
    return 'lose'
  }

  const makeChoice = (choice: Choice) => {
    if (gameOver || showResult) return

    setPlayerChoice(choice)
    
    // AI makes choice with some strategy based on level
    const aiStrategy = Math.random()
    let aiPick: Choice
    
    if (level > 3 && aiStrategy < 0.3) {
      // Higher levels: AI tries to counter common patterns
      const counters: Record<Choice, Choice> = { rock: 'paper', paper: 'scissors', scissors: 'rock' }
      aiPick = counters[choice]
    } else {
      aiPick = choices[Math.floor(Math.random() * 3)]
    }
    
    setAiChoice(aiPick)
    
    const gameResult = getWinner(choice, aiPick)
    setResult(gameResult)
    setShowResult(true)

    let points = 0
    if (gameResult === 'win') {
      points = winPoints + (streak * streakBonus)
      setStreak(streak + 1)
    } else if (gameResult === 'draw') {
      points = drawPoints
    } else {
      setStreak(0)
    }
    
    setScore(score + points)

    setTimeout(() => {
      if (round >= maxRounds) {
        const finalScore = score + points
        setGameOver(true)
        if (finalScore > highScore) {
          setHighScore(finalScore)
          localStorage.setItem('rps-highscore', finalScore.toString())
        }
        onGameEnd?.(finalScore)
      } else {
        setRound(round + 1)
        setPlayerChoice(null)
        setAiChoice(null)
        setResult(null)
        setShowResult(false)
      }
    }, 2000)
  }

  const resetGame = () => {
    setPlayerChoice(null)
    setAiChoice(null)
    setScore(0)
    setRound(1)
    setGameOver(false)
    setResult(null)
    setStreak(0)
    setShowResult(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Rock Paper Scissors</h1>
        
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-gray-600">Level: {level}</span>
          <span className="text-gray-600">Round: {round}/{maxRounds}</span>
          <span className="text-gray-600">Score: {score}</span>
        </div>

        {streak > 0 && (
          <div className="text-center mb-4">
            <span className="text-orange-500 font-bold">🔥 Streak: {streak}</span>
          </div>
        )}

        <div className="flex justify-around mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">You</p>
            <motion.div
              animate={showResult ? { scale: [1, 1.2, 1] } : {}}
              className="text-6xl"
            >
              {playerChoice ? emojis[playerChoice] : '❓'}
            </motion.div>
          </div>
          
          <div className="text-4xl self-center">VS</div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">AI</p>
            <motion.div
              animate={showResult ? { scale: [1, 1.2, 1] } : {}}
              className="text-6xl"
            >
              {aiChoice ? emojis[aiChoice] : '❓'}
            </motion.div>
          </div>
        </div>

        {result && showResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center mb-4 text-2xl font-bold ${
              result === 'win' ? 'text-green-500' : 
              result === 'lose' ? 'text-red-500' : 
              'text-yellow-500'
            }`}
          >
            {result === 'win' ? '🎉 You Win!' : 
             result === 'lose' ? '😢 You Lose!' : 
             '🤝 Draw!'}
          </motion.div>
        )}

        {!gameOver && !showResult && (
          <div className="flex justify-around">
            {choices.map((choice) => (
              <motion.button
                key={choice}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => makeChoice(choice)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg text-3xl transition-colors"
              >
                {emojis[choice]}
              </motion.button>
            ))}
          </div>
        )}

        {gameOver && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-lg mb-2">Final Score: {score}</p>
            <p className="text-sm text-gray-600 mb-4">High Score: {highScore}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Play Again
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}