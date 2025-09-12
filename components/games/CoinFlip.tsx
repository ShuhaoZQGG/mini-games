'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface CoinFlipProps {
  onGameEnd?: (score: number) => void
  level?: number
}

export default function CoinFlip({ onGameEnd, level = 1 }: CoinFlipProps) {
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null)
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [score, setScore] = useState(1000) // Starting coins
  const [bet, setBet] = useState(100)
  const [streak, setStreak] = useState(0)
  const [flips, setFlips] = useState(0)
  const [wins, setWins] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const minBet = 50 * level
  const maxBet = Math.min(500 * level, score)
  const winMultiplier = 2 + (level * 0.1)
  const streakBonus = 50 * level

  useEffect(() => {
    const saved = localStorage.getItem('coinflip-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score <= 0) {
      setGameOver(true)
      onGameEnd?.(flips)
    }
  }, [score, flips, onGameEnd])

  const flipCoin = () => {
    if (isFlipping || !choice || gameOver || bet > score || bet < minBet) return

    setIsFlipping(true)
    setFlips(flips + 1)

    // Animate coin flip
    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? 'heads' : 'tails'
      setResult(outcome)
      
      if (outcome === choice) {
        const winnings = Math.floor(bet * winMultiplier) + (streak * streakBonus)
        setScore(score + winnings)
        setWins(wins + 1)
        setStreak(streak + 1)
        
        if (score + winnings > highScore) {
          setHighScore(score + winnings)
          localStorage.setItem('coinflip-highscore', (score + winnings).toString())
        }
      } else {
        setScore(score - bet)
        setStreak(0)
      }
      
      setTimeout(() => {
        setIsFlipping(false)
        setResult(null)
        setChoice(null)
      }, 2000)
    }, 1000)
  }

  const resetGame = () => {
    setChoice(null)
    setResult(null)
    setScore(1000)
    setBet(100)
    setStreak(0)
    setFlips(0)
    setWins(0)
    setGameOver(false)
  }

  const winRate = flips > 0 ? Math.round((wins / flips) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Coin Flip</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Coins</p>
            <p className="text-2xl font-bold text-yellow-600">🪙 {score}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Level</p>
            <p className="text-2xl font-bold text-blue-600">{level}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Win Rate</p>
            <p className="text-xl font-bold text-green-600">{winRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Streak</p>
            <p className="text-xl font-bold text-orange-600">{streak} 🔥</p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <motion.div
            animate={isFlipping ? {
              rotateY: [0, 360, 720, 1080, 1440, 1800],
            } : {}}
            transition={{ duration: 1, ease: "linear" }}
            className="w-32 h-32 relative preserve-3d"
          >
            <div className={`absolute inset-0 rounded-full flex items-center justify-center text-6xl shadow-lg ${
              !result || result === 'heads' ? 'bg-yellow-400' : 'bg-yellow-500'
            }`}>
              {!result || result === 'heads' ? '👑' : '🦅'}
            </div>
          </motion.div>
        </div>

        {result && !isFlipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-4"
          >
            <p className="text-2xl font-bold mb-2">
              {result === 'heads' ? '👑 Heads!' : '🦅 Tails!'}
            </p>
            <p className={`text-xl ${result === choice ? 'text-green-500' : 'text-red-500'}`}>
              {result === choice ? `You won ${Math.floor(bet * winMultiplier) + (streak > 1 ? (streak - 1) * streakBonus : 0)} coins!` : `You lost ${bet} coins!`}
            </p>
          </motion.div>
        )}

        {!gameOver && !isFlipping && !result && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Amount: {bet} coins
              </label>
              <input
                type="range"
                min={minBet}
                max={maxBet}
                step={50}
                value={bet}
                onChange={(e) => setBet(parseInt(e.target.value))}
                className="w-full"
                disabled={score < minBet}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{minBet}</span>
                <span>{maxBet}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 text-center mb-2">Choose your side:</p>
              <div className="flex justify-around">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChoice('heads')}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                    choice === 'heads' 
                      ? 'bg-yellow-400 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  👑 Heads
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChoice('tails')}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                    choice === 'tails' 
                      ? 'bg-yellow-400 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🦅 Tails
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={flipCoin}
              disabled={!choice || score < minBet}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${
                choice && score >= minBet
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Flip Coin!
            </motion.button>
          </>
        )}

        {gameOver && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Game Over!</h2>
            <p className="text-lg mb-2">Total Flips: {flips}</p>
            <p className="text-lg mb-2">Total Wins: {wins}</p>
            <p className="text-sm text-gray-600 mb-4">High Score: {highScore} coins</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Play Again
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}