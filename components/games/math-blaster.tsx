'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Trophy, Calculator, Clock, Zap } from 'lucide-react'

interface Problem {
  num1: number
  num2: number
  operator: '+' | '-' | '×' | '÷'
  answer: number
  display: string
}

export default function MathBlaster() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [problemsAnswered, setProblemsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [stars, setStars] = useState(0)
  const [timer, setTimer] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const problemsPerLevel = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20
  const baseTime = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30

  useEffect(() => {
    const saved = localStorage.getItem('mathBlasterHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('mathBlasterHighScore', score.toString())
    }
  }, [score, highScore])

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else if (timer === 0 && isTimerActive) {
      endLevel()
    }
  }, [timer, isTimerActive])

  const generateProblem = (): Problem => {
    let num1: number, num2: number, operator: '+' | '-' | '×' | '÷', answer: number
    
    const operators: ('+' | '-' | '×' | '÷')[] = 
      difficulty === 'easy' ? ['+', '-'] : 
      difficulty === 'medium' ? ['+', '-', '×'] : 
      ['+', '-', '×', '÷']
    
    operator = operators[Math.floor(Math.random() * operators.length)]
    
    const maxNum = 
      difficulty === 'easy' ? 10 + level * 2 : 
      difficulty === 'medium' ? 20 + level * 3 : 
      30 + level * 5

    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * maxNum) + 1
        num2 = Math.floor(Math.random() * maxNum) + 1
        answer = num1 + num2
        break
      case '-':
        num1 = Math.floor(Math.random() * maxNum) + 1
        num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1
        answer = num1 - num2
        break
      case '×':
        const maxMult = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12
        num1 = Math.floor(Math.random() * maxMult) + 1
        num2 = Math.floor(Math.random() * maxMult) + 1
        answer = num1 * num2
        break
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 1
        answer = Math.floor(Math.random() * 10) + 1
        num1 = num2 * answer
        break
      default:
        num1 = 1
        num2 = 1
        answer = 2
    }

    return {
      num1,
      num2,
      operator,
      answer,
      display: `${num1} ${operator} ${num2}`
    }
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setProblemsAnswered(0)
    setCorrectAnswers(0)
    setStreak(0)
    setMaxStreak(0)
    setTimer(baseTime)
    setIsTimerActive(true)
    nextProblem()
  }

  const nextProblem = () => {
    setCurrentProblem(generateProblem())
    setUserAnswer('')
    setShowFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!currentProblem || userAnswer === '') return
    
    const userNum = parseInt(userAnswer)
    const isCorrect = userNum === currentProblem.answer
    
    setShowFeedback(isCorrect ? 'correct' : 'incorrect')
    setProblemsAnswered(prev => prev + 1)
    
    if (isCorrect) {
      const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      const streakBonus = streak * 5
      const timeBonus = Math.floor((timer / baseTime) * 10)
      setScore(prev => prev + basePoints + streakBonus + timeBonus)
      setCorrectAnswers(prev => prev + 1)
      setStreak(prev => prev + 1)
      if (streak + 1 > maxStreak) {
        setMaxStreak(streak + 1)
      }
    } else {
      setStreak(0)
    }
    
    setTimeout(() => {
      if (problemsAnswered + 1 >= problemsPerLevel) {
        endLevel()
      } else {
        nextProblem()
      }
    }, 1000)
  }

  const endLevel = () => {
    setIsTimerActive(false)
    checkLevelComplete()
  }

  const checkLevelComplete = () => {
    const percentage = (correctAnswers / problemsPerLevel) * 100
    const earnedStars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0
    
    setStars(earnedStars)
    
    if (earnedStars > 0) {
      setGameState('levelComplete')
    } else {
      setGameState('gameOver')
    }
  }

  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setProblemsAnswered(0)
    setCorrectAnswers(0)
    setStreak(0)
    setTimer(baseTime - level * 2) // Slightly less time each level
    setGameState('playing')
    setIsTimerActive(true)
    nextProblem()
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setProblemsAnswered(0)
    setCorrectAnswers(0)
    setUserAnswer('')
    setShowFeedback(null)
    setStreak(0)
    setMaxStreak(0)
    setIsTimerActive(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Math Blaster
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Speed Arithmetic Challenge!</h2>
              <p className="text-gray-600">
                Solve math problems as fast as you can before time runs out
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Select Difficulty</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => startGame('easy')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <span className="text-2xl">➕➖</span>
                  <span>Easy</span>
                  <span className="text-xs text-gray-500">Addition & Subtraction</span>
                </Button>
                <Button
                  onClick={() => startGame('medium')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <span className="text-2xl">✖️</span>
                  <span>Medium</span>
                  <span className="text-xs text-gray-500">+ Multiplication</span>
                </Button>
                <Button
                  onClick={() => startGame('hard')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <span className="text-2xl">➗</span>
                  <span>Hard</span>
                  <span className="text-xs text-gray-500">All Operations</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span>Problems: {problemsAnswered}/{problemsPerLevel}</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={`font-bold ${timer <= 10 ? 'text-red-500' : ''}`}>
                  Time: {timer}s
                </span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-yellow-600">Streak: {streak}</span>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-6">
              <div 
                data-testid="math-problem"
                className={`text-4xl font-bold transition-all ${
                  showFeedback === 'correct' ? 'text-green-600' : 
                  showFeedback === 'incorrect' ? 'text-red-600' : ''
                }`}
              >
                {currentProblem.display} = ?
              </div>
              
              {showFeedback === 'incorrect' && (
                <p className="text-red-600">
                  Correct answer: {currentProblem.answer}
                </p>
              )}
              
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs mx-auto">
                <Input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="text-center text-lg"
                  disabled={showFeedback !== null}
                />
                <Button 
                  type="submit" 
                  disabled={showFeedback !== null || userAnswer === ''}
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
        )}

        {gameState === 'levelComplete' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Level {level} Complete!</h2>
            
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-12 h-12 ${
                    star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <p>Correct Answers: {correctAnswers}/{problemsPerLevel}</p>
              <p>Max Streak: {maxStreak}</p>
              <p className="text-2xl font-bold">Score: {score}</p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button onClick={nextLevel}>Next Level</Button>
              <Button onClick={resetGame} variant="outline">Main Menu</Button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Game Over</h2>
            
            <div className="space-y-2">
              <p>You didn't pass Level {level}</p>
              <p>Correct Answers: {correctAnswers}/{problemsPerLevel}</p>
              <p>Max Streak: {maxStreak}</p>
              <p className="text-2xl font-bold">Final Score: {score}</p>
              {score > highScore && (
                <p className="text-green-600 font-bold">New High Score!</p>
              )}
            </div>
            
            <Button onClick={resetGame}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}