'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Brain, RotateCcw, Check, X } from 'lucide-react'
import { submitScore } from '@/lib/services/scores'

interface Problem {
  question: string
  answer: number
  operation: '+' | '-' | '×' | '÷'
  difficulty: number
}

export default function MentalMath() {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [problemsAttempted, setProblemsAttempted] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const generateProblem = useCallback((): Problem => {
    const operations: Array<'+' | '-' | '×' | '÷'> = ['+', '-', '×', '÷']
    let operation: '+' | '-' | '×' | '÷'
    let a: number, b: number, answer: number
    
    // Difficulty based on level
    const maxNum = 10 + level * 5
    const minNum = level > 3 ? level * 2 : 1
    
    // Choose operation based on level
    if (level === 1) {
      operation = Math.random() < 0.5 ? '+' : '-'
    } else if (level === 2) {
      operation = operations[Math.floor(Math.random() * 3)] // +, -, ×
    } else {
      operation = operations[Math.floor(Math.random() * 4)] // All operations
    }
    
    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * maxNum) + minNum
        b = Math.floor(Math.random() * maxNum) + minNum
        answer = a + b
        break
      case '-':
        a = Math.floor(Math.random() * maxNum) + minNum + 10
        b = Math.floor(Math.random() * maxNum) + minNum
        answer = a - b
        break
      case '×':
        a = Math.floor(Math.random() * Math.min(12, maxNum / 2)) + 2
        b = Math.floor(Math.random() * Math.min(12, maxNum / 2)) + 2
        answer = a * b
        break
      case '÷':
        b = Math.floor(Math.random() * 10) + 2
        answer = Math.floor(Math.random() * 10) + 2
        a = b * answer // Ensure clean division
        break
      default:
        a = 1
        b = 1
        answer = 2
        operation = '+'
    }
    
    return {
      question: `${a} ${operation} ${b}`,
      answer,
      operation,
      difficulty: level
    }
  }, [level])

  const checkAnswer = useCallback(() => {
    if (!currentProblem || userAnswer === '') return
    
    const userNum = parseInt(userAnswer)
    const isCorrect = userNum === currentProblem.answer
    
    setProblemsAttempted(prev => prev + 1)
    
    if (isCorrect) {
      setScore(prev => prev + level)
      setStreak(prev => prev + 1)
      setCorrectAnswers(prev => prev + 1)
      setFeedback('correct')
      
      // Level up every 5 correct answers in a row
      if ((streak + 1) % 5 === 0) {
        setLevel(prev => Math.min(prev + 1, 10))
      }
    } else {
      setStreak(0)
      setFeedback('incorrect')
    }
    
    // Show feedback briefly then move to next problem
    setTimeout(() => {
      setFeedback(null)
      setUserAnswer('')
      setCurrentProblem(generateProblem())
      inputRef.current?.focus()
    }, 500)
  }, [currentProblem, userAnswer, level, streak, generateProblem])

  const skipProblem = () => {
    setStreak(0)
    setProblemsAttempted(prev => prev + 1)
    setUserAnswer('')
    setCurrentProblem(generateProblem())
    inputRef.current?.focus()
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setStreak(0)
    setLevel(1)
    setTimeLeft(60)
    setProblemsAttempted(0)
    setCorrectAnswers(0)
    setCurrentProblem(generateProblem())
    setUserAnswer('')
    setFeedback(null)
    
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const endGame = async () => {
    setGameState('ended')
    const accuracy = problemsAttempted > 0 
      ? Math.round((correctAnswers / problemsAttempted) * 100) 
      : 0
    
    await submitScore({
      gameId: 'mental-math',
      score,
      metadata: {
        level,
        problemsAttempted,
        correctAnswers,
        accuracy
      }
    })
  }

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer()
    }
  }

  const accuracy = problemsAttempted > 0 
    ? Math.round((correctAnswers / problemsAttempted) * 100) 
    : 0

  if (gameState === 'waiting') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Brain className="w-8 h-8" />
              Mental Math
            </h1>
            <p className="text-muted-foreground">Solve math problems quickly!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Solve math problems as fast as you can</li>
              <li>• Type your answer and press Enter</li>
              <li>• Difficulty increases as you progress</li>
              <li>• Build streaks for bonus points</li>
              <li>• You have 60 seconds to solve as many as possible</li>
            </ul>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState === 'ended') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Game Over!</h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {score}</p>
            <p className="text-lg text-muted-foreground">Level Reached: {level}</p>
            <p className="text-lg text-muted-foreground">Problems Solved: {correctAnswers}/{problemsAttempted}</p>
            <p className="text-lg text-muted-foreground">Accuracy: {accuracy}%</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <span className="text-lg font-semibold">Score: {score}</span>
            <span className="text-lg">Level: {level}</span>
            <span className="text-lg">Streak: {streak}</span>
          </div>
          <span className="text-lg font-semibold">Time: {timeLeft}s</span>
        </div>
        
        <div className="text-center space-y-6">
          <div className="text-5xl font-bold" data-testid="math-problem">
            {currentProblem?.question}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Input
              ref={inputRef}
              data-testid="answer-input"
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Your answer"
              className={`text-2xl text-center w-48 h-16 ${
                feedback === 'correct' ? 'border-green-500' : 
                feedback === 'incorrect' ? 'border-red-500' : ''
              }`}
              disabled={feedback !== null}
            />
            
            {feedback === 'correct' && (
              <Check className="w-8 h-8 text-green-500" />
            )}
            {feedback === 'incorrect' && (
              <X className="w-8 h-8 text-red-500" />
            )}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={checkAnswer}
              disabled={userAnswer === '' || feedback !== null}
              size="lg"
            >
              Submit
            </Button>
            
            <Button 
              onClick={skipProblem}
              variant="outline"
              disabled={feedback !== null}
              size="lg"
            >
              Skip
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Accuracy: {accuracy}% ({correctAnswers}/{problemsAttempted})
          </div>
        </div>
      </div>
    </Card>
  )
}