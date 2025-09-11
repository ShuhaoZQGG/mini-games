'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Clock, Calendar, Trophy } from 'lucide-react'

interface HistoricalEvent {
  event: string
  year: number
  category: string
  description: string
}

const events: HistoricalEvent[] = [
  { event: 'World War II Begins', year: 1939, category: 'War', description: 'Germany invades Poland' },
  { event: 'American Independence', year: 1776, category: 'Politics', description: 'Declaration of Independence signed' },
  { event: 'Moon Landing', year: 1969, category: 'Space', description: 'Neil Armstrong walks on the moon' },
  { event: 'Fall of Berlin Wall', year: 1989, category: 'Politics', description: 'End of Cold War era' },
  { event: 'Christopher Columbus', year: 1492, category: 'Exploration', description: 'Discovers the Americas' },
  { event: 'French Revolution', year: 1789, category: 'Revolution', description: 'Storming of the Bastille' },
  { event: 'Industrial Revolution', year: 1760, category: 'Technology', description: 'Beginning in Britain' },
  { event: 'Renaissance Begins', year: 1300, category: 'Culture', description: 'Cultural rebirth in Europe' },
  { event: 'Black Death', year: 1347, category: 'Pandemic', description: 'Plague devastates Europe' },
  { event: 'Printing Press Invented', year: 1440, category: 'Technology', description: "Gutenberg's innovation" },
  { event: 'World War I Ends', year: 1918, category: 'War', description: 'Armistice signed' },
  { event: 'Russian Revolution', year: 1917, category: 'Revolution', description: 'Bolsheviks take power' },
  { event: 'American Civil War', year: 1861, category: 'War', description: 'North vs South begins' },
  { event: 'Einstein Theory', year: 1905, category: 'Science', description: 'Special Relativity published' },
  { event: 'Internet Created', year: 1969, category: 'Technology', description: 'ARPANET established' },
]

export default function HistoryTimeline() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentEvents, setCurrentEvents] = useState<HistoricalEvent[]>([])
  const [userOrder, setUserOrder] = useState<HistoricalEvent[]>([])
  const [correctOrder, setCorrectOrder] = useState<HistoricalEvent[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [stars, setStars] = useState(0)

  const eventsPerRound = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5
  const questionsPerLevel = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10

  useEffect(() => {
    const saved = localStorage.getItem('historyTimelineHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('historyTimelineHighScore', score.toString())
    }
  }, [score, highScore])

  const generateQuestion = () => {
    const shuffled = [...events].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, eventsPerRound)
    const sorted = [...selected].sort((a, b) => a.year - b.year)
    
    setCorrectOrder(sorted)
    setCurrentEvents([...selected].sort(() => Math.random() - 0.5))
    setUserOrder([])
    setShowFeedback(false)
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    generateQuestion()
  }

  const selectEvent = (event: HistoricalEvent) => {
    if (showFeedback) return
    
    if (userOrder.includes(event)) {
      setUserOrder(prev => prev.filter(e => e !== event))
    } else {
      setUserOrder(prev => [...prev, event])
    }
  }

  const submitOrder = () => {
    if (userOrder.length !== eventsPerRound) return
    
    const isCorrect = userOrder.every((event, index) => 
      event.year === correctOrder[index].year
    )
    
    setShowFeedback(true)
    setQuestionsAnswered(prev => prev + 1)
    
    if (isCorrect) {
      const points = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 30 : 40
      setScore(prev => prev + points)
      setCorrectAnswers(prev => prev + 1)
    }
    
    setTimeout(() => {
      if (questionsAnswered + 1 >= questionsPerLevel) {
        checkLevelComplete()
      } else {
        generateQuestion()
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
    generateQuestion()
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setUserOrder([])
    setShowFeedback(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            History Timeline
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Order Historical Events!</h2>
              <p className="text-gray-600">
                Put events in chronological order from earliest to latest
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
                  <Calendar className="w-8 h-8" />
                  <span>Easy</span>
                  <span className="text-xs text-gray-500">3 events</span>
                </Button>
                <Button
                  onClick={() => startGame('medium')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Clock className="w-8 h-8" />
                  <span>Medium</span>
                  <span className="text-xs text-gray-500">4 events</span>
                </Button>
                <Button
                  onClick={() => startGame('hard')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Trophy className="w-8 h-8" />
                  <span>Hard</span>
                  <span className="text-xs text-gray-500">5 events</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span>Question {questionsAnswered + 1}/{questionsPerLevel}</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">
                Order these events from earliest to latest:
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">Available Events:</p>
                <div className="grid gap-2">
                  {currentEvents.map((event, index) => (
                    <Button
                      key={index}
                      onClick={() => selectEvent(event)}
                      disabled={showFeedback || userOrder.includes(event)}
                      variant={userOrder.includes(event) ? 'secondary' : 'outline'}
                      className="h-auto py-2 px-3 text-left justify-start"
                    >
                      <div>
                        <div className="font-semibold">{event.event}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 text-center">Your Order (Earliest to Latest):</p>
                <div className="min-h-[100px] border-2 border-dashed rounded-lg p-2">
                  {userOrder.map((event, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded mb-1">
                      {index + 1}. {event.event} {showFeedback && `(${event.year})`}
                    </div>
                  ))}
                </div>
              </div>
              
              {showFeedback && (
                <div className="text-center">
                  <p className={userOrder.every((e, i) => e.year === correctOrder[i].year) ? 'text-green-600' : 'text-red-600'}>
                    {userOrder.every((e, i) => e.year === correctOrder[i].year) ? 'Correct!' : 'Incorrect!'}
                  </p>
                  {!userOrder.every((e, i) => e.year === correctOrder[i].year) && (
                    <div className="mt-2 text-sm">
                      Correct order: {correctOrder.map(e => `${e.event} (${e.year})`).join(' → ')}
                    </div>
                  )}
                </div>
              )}
              
              <Button
                onClick={submitOrder}
                disabled={showFeedback || userOrder.length !== eventsPerRound}
                className="w-full"
              >
                Submit Order
              </Button>
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