'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Trophy, MapPin, Flag, Globe } from 'lucide-react'

interface Question {
  question: string
  options: string[]
  correct: number
  type: 'capital' | 'flag' | 'landmark'
}

const countryData = [
  { country: 'France', capital: 'Paris', flag: '🇫🇷', continent: 'Europe' },
  { country: 'Japan', capital: 'Tokyo', flag: '🇯🇵', continent: 'Asia' },
  { country: 'Brazil', capital: 'Brasília', flag: '🇧🇷', continent: 'South America' },
  { country: 'Egypt', capital: 'Cairo', flag: '🇪🇬', continent: 'Africa' },
  { country: 'Canada', capital: 'Ottawa', flag: '🇨🇦', continent: 'North America' },
  { country: 'Australia', capital: 'Canberra', flag: '🇦🇺', continent: 'Oceania' },
  { country: 'Germany', capital: 'Berlin', flag: '🇩🇪', continent: 'Europe' },
  { country: 'India', capital: 'New Delhi', flag: '🇮🇳', continent: 'Asia' },
  { country: 'Mexico', capital: 'Mexico City', flag: '🇲🇽', continent: 'North America' },
  { country: 'Italy', capital: 'Rome', flag: '🇮🇹', continent: 'Europe' },
  { country: 'China', capital: 'Beijing', flag: '🇨🇳', continent: 'Asia' },
  { country: 'Spain', capital: 'Madrid', flag: '🇪🇸', continent: 'Europe' },
  { country: 'Russia', capital: 'Moscow', flag: '🇷🇺', continent: 'Europe/Asia' },
  { country: 'United Kingdom', capital: 'London', flag: '🇬🇧', continent: 'Europe' },
  { country: 'Argentina', capital: 'Buenos Aires', flag: '🇦🇷', continent: 'South America' },
  { country: 'South Africa', capital: 'Pretoria', flag: '🇿🇦', continent: 'Africa' },
  { country: 'South Korea', capital: 'Seoul', flag: '🇰🇷', continent: 'Asia' },
  { country: 'Turkey', capital: 'Ankara', flag: '🇹🇷', continent: 'Asia/Europe' },
  { country: 'Saudi Arabia', capital: 'Riyadh', flag: '🇸🇦', continent: 'Asia' },
  { country: 'Sweden', capital: 'Stockholm', flag: '🇸🇪', continent: 'Europe' },
]

const landmarks = [
  { landmark: 'Eiffel Tower', country: 'France' },
  { landmark: 'Great Wall', country: 'China' },
  { landmark: 'Statue of Liberty', country: 'United States' },
  { landmark: 'Taj Mahal', country: 'India' },
  { landmark: 'Colosseum', country: 'Italy' },
  { landmark: 'Christ the Redeemer', country: 'Brazil' },
  { landmark: 'Machu Picchu', country: 'Peru' },
  { landmark: 'Sydney Opera House', country: 'Australia' },
  { landmark: 'Big Ben', country: 'United Kingdom' },
  { landmark: 'Pyramids of Giza', country: 'Egypt' },
]

export default function GeographyQuiz() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [stars, setStars] = useState(0)
  const [timer, setTimer] = useState(30)
  const [isTimerActive, setIsTimerActive] = useState(false)

  const questionsPerLevel = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10
  const timePerQuestion = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15

  useEffect(() => {
    const saved = localStorage.getItem('geographyQuizHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('geographyQuizHighScore', score.toString())
    }
  }, [score, highScore])

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else if (timer === 0 && isTimerActive) {
      handleAnswer(-1) // Time's up, wrong answer
    }
  }, [timer, isTimerActive])

  const generateQuestion = (): Question => {
    const types: ('capital' | 'flag' | 'landmark')[] = ['capital', 'flag']
    if (level > 2) types.push('landmark')
    
    const type = types[Math.floor(Math.random() * types.length)]
    
    if (type === 'capital') {
      const correct = Math.floor(Math.random() * countryData.length)
      const country = countryData[correct]
      const options: string[] = [country.capital]
      
      while (options.length < 4) {
        const random = countryData[Math.floor(Math.random() * countryData.length)]
        if (!options.includes(random.capital)) {
          options.push(random.capital)
        }
      }
      
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(country.capital)
      
      return {
        question: `What is the capital of ${country.country}?`,
        options,
        correct: correctIndex,
        type: 'capital'
      }
    } else if (type === 'flag') {
      const correct = Math.floor(Math.random() * countryData.length)
      const country = countryData[correct]
      const options: string[] = [country.country]
      
      while (options.length < 4) {
        const random = countryData[Math.floor(Math.random() * countryData.length)]
        if (!options.includes(random.country)) {
          options.push(random.country)
        }
      }
      
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(country.country)
      
      return {
        question: `Which country does this flag belong to? ${country.flag}`,
        options,
        correct: correctIndex,
        type: 'flag'
      }
    } else {
      const correct = Math.floor(Math.random() * landmarks.length)
      const landmark = landmarks[correct]
      const options: string[] = [landmark.country]
      
      const allCountries = [...countryData.map(c => c.country), 'United States', 'Peru']
      while (options.length < 4) {
        const random = allCountries[Math.floor(Math.random() * allCountries.length)]
        if (!options.includes(random)) {
          options.push(random)
        }
      }
      
      options.sort(() => Math.random() - 0.5)
      const correctIndex = options.indexOf(landmark.country)
      
      return {
        question: `Where is the ${landmark.landmark} located?`,
        options,
        correct: correctIndex,
        type: 'landmark'
      }
    }
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    nextQuestion()
  }

  const nextQuestion = () => {
    setCurrentQuestion(generateQuestion())
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimer(timePerQuestion)
    setIsTimerActive(true)
  }

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return
    
    setSelectedAnswer(index)
    setShowFeedback(true)
    setIsTimerActive(false)
    
    if (index === currentQuestion?.correct) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      const timeBonus = Math.floor(timer * 2)
      setScore(prev => prev + points + timeBonus)
      setCorrectAnswers(prev => prev + 1)
    }
    
    setQuestionsAnswered(prev => prev + 1)
    
    setTimeout(() => {
      if (questionsAnswered + 1 >= questionsPerLevel) {
        checkLevelComplete()
      } else {
        nextQuestion()
      }
    }, 2000)
  }

  const checkLevelComplete = () => {
    const percentage = (correctAnswers / questionsPerLevel) * 100
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
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setGameState('playing')
    nextQuestion()
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Geography Quiz
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Test Your Geography Knowledge!</h2>
              <p className="text-gray-600">
                Answer questions about capitals, flags, and famous landmarks
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
                  <MapPin className="w-8 h-8" />
                  <span>Easy</span>
                  <span className="text-xs text-gray-500">5 questions, 30s each</span>
                </Button>
                <Button
                  onClick={() => startGame('medium')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Flag className="w-8 h-8" />
                  <span>Medium</span>
                  <span className="text-xs text-gray-500">8 questions, 20s each</span>
                </Button>
                <Button
                  onClick={() => startGame('hard')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Trophy className="w-8 h-8" />
                  <span>Hard</span>
                  <span className="text-xs text-gray-500">10 questions, 15s each</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span>Question {questionsAnswered + 1}/{questionsPerLevel}</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex justify-center items-center gap-2">
                <div className={`text-2xl font-bold ${timer <= 5 ? 'text-red-500' : ''}`}>
                  {timer}s
                </div>
              </div>
              
              <h3 className="text-xl font-semibold">{currentQuestion.question}</h3>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    variant={
                      showFeedback
                        ? index === currentQuestion.correct
                          ? 'default'
                          : index === selectedAnswer
                          ? 'destructive'
                          : 'outline'
                        : 'outline'
                    }
                    className="h-auto py-3 px-4"
                  >
                    {option}
                  </Button>
                ))}
              </div>
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
              <p>Correct Answers: {correctAnswers}/{questionsPerLevel}</p>
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
              <p>Correct Answers: {correctAnswers}/{questionsPerLevel}</p>
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