'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Brain, RotateCcw, Check, X } from 'lucide-react'

interface Problem {
  question: string
  answer: number
  operation: string
  difficulty: number
}

interface MentalMathGameProps {
  levelConfig: {
    operations: string[]
    minNum: number
    maxNum: number
    timeLimit: number
    includeDecimals: boolean
    includeNegatives: boolean
    targetProblems: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Basic Addition',
    difficulty: 'easy',
    config: { 
      operations: ['+', '-'],
      minNum: 1,
      maxNum: 20,
      timeLimit: 90,
      includeDecimals: false,
      includeNegatives: false,
      targetProblems: 15
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Mixed Operations',
    difficulty: 'medium',
    config: { 
      operations: ['+', '-', '×'],
      minNum: 1,
      maxNum: 50,
      timeLimit: 75,
      includeDecimals: false,
      includeNegatives: false,
      targetProblems: 20
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced Math',
    difficulty: 'hard',
    config: { 
      operations: ['+', '-', '×', '÷'],
      minNum: 1,
      maxNum: 100,
      timeLimit: 60,
      includeDecimals: false,
      includeNegatives: true,
      targetProblems: 20
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Calculations',
    difficulty: 'expert',
    config: { 
      operations: ['+', '-', '×', '÷'],
      minNum: -50,
      maxNum: 200,
      timeLimit: 45,
      includeDecimals: true,
      includeNegatives: true,
      targetProblems: 25
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Mathematician',
    difficulty: 'master',
    config: { 
      operations: ['+', '-', '×', '÷', '^'],
      minNum: -100,
      maxNum: 500,
      timeLimit: 30,
      includeDecimals: true,
      includeNegatives: true,
      targetProblems: 30
    },
    requiredStars: 12
  }
]

function MentalMathCore({ levelConfig, onScore }: MentalMathGameProps) {
  const { operations, minNum, maxNum, timeLimit, includeDecimals, includeNegatives, targetProblems } = levelConfig
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [problemsAttempted, setProblemsAttempted] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const generateNumber = useCallback(() => {
    let num = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
    if (includeDecimals && Math.random() < 0.3) {
      num = parseFloat((num + Math.random()).toFixed(1))
    }
    if (!includeNegatives && num < 0) {
      num = Math.abs(num)
    }
    return num
  }, [minNum, maxNum, includeDecimals, includeNegatives])

  const generateProblem = useCallback((): Problem => {
    const operation = operations[Math.floor(Math.random() * operations.length)]
    let a: number, b: number, answer: number
    let question: string
    
    switch (operation) {
      case '+':
        a = generateNumber()
        b = generateNumber()
        answer = parseFloat((a + b).toFixed(2))
        question = `${a} + ${b}`
        break
      case '-':
        a = generateNumber()
        b = generateNumber()
        answer = parseFloat((a - b).toFixed(2))
        question = `${a} - ${b}`
        break
      case '×':
        a = Math.floor(Math.random() * Math.min(20, maxNum)) + minNum
        b = Math.floor(Math.random() * Math.min(20, maxNum)) + minNum
        answer = a * b
        question = `${a} × ${b}`
        break
      case '÷':
        b = Math.floor(Math.random() * 10) + 2
        answer = Math.floor(Math.random() * 20) + 2
        a = b * answer
        question = `${a} ÷ ${b}`
        break
      case '^':
        a = Math.floor(Math.random() * 10) + 2
        b = Math.floor(Math.random() * 3) + 2
        answer = Math.pow(a, b)
        question = `${a}^${b}`
        break
      default:
        a = 1
        b = 1
        answer = 2
        question = '1 + 1'
    }
    
    return {
      question,
      answer,
      operation,
      difficulty: operations.length
    }
  }, [operations, generateNumber, minNum, maxNum])

  const checkAnswer = useCallback(() => {
    if (!currentProblem || userAnswer === '') return
    
    const userNum = parseFloat(userAnswer)
    const isCorrect = Math.abs(userNum - currentProblem.answer) < 0.01
    
    setProblemsAttempted(prev => prev + 1)
    
    if (isCorrect) {
      const points = Math.ceil(100 / targetProblems) * (1 + streak * 0.1)
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      setCorrectAnswers(prev => prev + 1)
      setFeedback('correct')
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
  }, [currentProblem, userAnswer, streak, generateProblem, targetProblems])

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
    setTimeLeft(timeLimit)
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
    
    // Calculate final score with bonuses
    const timeBonus = timeLeft * 2
    const accuracyBonus = Math.floor(accuracy * score / 100)
    const finalScore = score + timeBonus + accuracyBonus
    
    onScore(finalScore)
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
            <h3 className="font-semibold">Level Configuration:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Operations: {operations.join(', ')}</li>
              <li>• Number Range: {minNum} to {maxNum}</li>
              <li>• Time Limit: {timeLimit} seconds</li>
              <li>• Target Problems: {targetProblems}</li>
              {includeDecimals && <li>• Includes decimal numbers</li>}
              {includeNegatives && <li>• Includes negative numbers</li>}
            </ul>
            
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Solve problems as fast as you can</li>
              <li>• Type your answer and press Enter</li>
              <li>• Build streaks for bonus points</li>
              <li>• Complete before time runs out!</li>
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
    const timeBonus = timeLeft * 2
    const accuracyBonus = Math.floor(accuracy * score / 100)
    const finalScore = score + timeBonus + accuracyBonus

    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Game Over!</h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Base Score: {score}</p>
            <p className="text-lg">Time Bonus: +{timeBonus}</p>
            <p className="text-lg">Accuracy Bonus: +{accuracyBonus}</p>
            <p className="text-2xl font-bold text-primary">Final Score: {finalScore}</p>
            <div className="pt-2 border-t">
              <p className="text-lg text-muted-foreground">Problems Solved: {correctAnswers}/{problemsAttempted}</p>
              <p className="text-lg text-muted-foreground">Accuracy: {accuracy}%</p>
            </div>
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
              step="0.01"
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
              <div className="flex items-center gap-2">
                <X className="w-8 h-8 text-red-500" />
                <span className="text-red-500">Answer: {currentProblem?.answer}</span>
              </div>
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
            Progress: {correctAnswers}/{targetProblems} • Accuracy: {accuracy}%
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function MentalMathWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const { targetProblems, timeLimit } = levelConfig
    const perfectScore = targetProblems * 110 + timeLimit * 2 + 100
    
    if (score >= perfectScore * 0.8) return 3
    if (score >= perfectScore * 0.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="mental-math"
      gameName="Mental Math"
      levels={levels}
      renderGame={(config, onScore) => (
        <MentalMathCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}