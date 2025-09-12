'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, FlaskConical, Atom, Beaker } from 'lucide-react'

interface Element {
  symbol: string
  name: string
  atomicNumber: number
  category: string
}

interface Compound {
  formula: string
  name: string
  elements: string[]
}

const elements: Element[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, category: 'nonmetal' },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, category: 'noble gas' },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, category: 'alkali metal' },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, category: 'nonmetal' },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, category: 'nonmetal' },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, category: 'nonmetal' },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9, category: 'halogen' },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, category: 'alkali metal' },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, category: 'alkaline earth metal' },
  { symbol: 'Al', name: 'Aluminum', atomicNumber: 13, category: 'post-transition metal' },
  { symbol: 'Si', name: 'Silicon', atomicNumber: 14, category: 'metalloid' },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15, category: 'nonmetal' },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16, category: 'nonmetal' },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, category: 'halogen' },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19, category: 'alkali metal' },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20, category: 'alkaline earth metal' },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, category: 'transition metal' },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, category: 'transition metal' },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30, category: 'transition metal' },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47, category: 'transition metal' },
  { symbol: 'Au', name: 'Gold', atomicNumber: 79, category: 'transition metal' },
]

const compounds: Compound[] = [
  { formula: 'H₂O', name: 'Water', elements: ['H', 'H', 'O'] },
  { formula: 'CO₂', name: 'Carbon Dioxide', elements: ['C', 'O', 'O'] },
  { formula: 'NaCl', name: 'Salt', elements: ['Na', 'Cl'] },
  { formula: 'HCl', name: 'Hydrochloric Acid', elements: ['H', 'Cl'] },
  { formula: 'H₂SO₄', name: 'Sulfuric Acid', elements: ['H', 'H', 'S', 'O', 'O', 'O', 'O'] },
  { formula: 'NH₃', name: 'Ammonia', elements: ['N', 'H', 'H', 'H'] },
  { formula: 'CH₄', name: 'Methane', elements: ['C', 'H', 'H', 'H', 'H'] },
  { formula: 'CaCO₃', name: 'Calcium Carbonate', elements: ['Ca', 'C', 'O', 'O', 'O'] },
  { formula: 'MgO', name: 'Magnesium Oxide', elements: ['Mg', 'O'] },
  { formula: 'Fe₂O₃', name: 'Iron(III) Oxide', elements: ['Fe', 'Fe', 'O', 'O', 'O'] },
]

type GameMode = 'elementMatch' | 'compoundBuild' | 'periodicTable'

export default function ChemistryLab() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [mode, setMode] = useState<GameMode>('elementMatch')
  const [currentElement, setCurrentElement] = useState<Element | null>(null)
  const [currentCompound, setCurrentCompound] = useState<Compound | null>(null)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [stars, setStars] = useState(0)

  const questionsPerLevel = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10

  useEffect(() => {
    const saved = localStorage.getItem('chemistryLabHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('chemistryLabHighScore', score.toString())
    }
  }, [score, highScore])

  const generateElementMatchQuestion = () => {
    const element = elements[Math.floor(Math.random() * elements.length)]
    setCurrentElement(element)
    
    const opts = [element.name]
    while (opts.length < 4) {
      const random = elements[Math.floor(Math.random() * elements.length)]
      if (!opts.includes(random.name)) {
        opts.push(random.name)
      }
    }
    setOptions(opts.sort(() => Math.random() - 0.5))
  }

  const generateCompoundQuestion = () => {
    const compound = compounds[Math.floor(Math.random() * compounds.length)]
    setCurrentCompound(compound)
    setSelectedElements([])
    
    // Create pool of elements including correct ones and distractors
    const elementPool = [...new Set(compound.elements)]
    while (elementPool.length < 6) {
      const random = elements[Math.floor(Math.random() * elements.length)]
      if (!elementPool.includes(random.symbol)) {
        elementPool.push(random.symbol)
      }
    }
    setOptions(elementPool.sort(() => Math.random() - 0.5))
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    
    // Set mode based on level
    if (diff === 'easy') {
      setMode('elementMatch')
    } else if (diff === 'medium') {
      setMode(Math.random() > 0.5 ? 'elementMatch' : 'compoundBuild')
    } else {
      setMode('compoundBuild')
    }
    
    nextQuestion()
  }

  const nextQuestion = () => {
    setShowFeedback(false)
    setSelectedElements([])
    
    if (mode === 'elementMatch') {
      generateElementMatchQuestion()
    } else {
      generateCompoundQuestion()
    }
  }

  const handleElementMatch = (answer: string) => {
    if (showFeedback) return
    
    const isCorrect = answer === currentElement?.name
    setShowFeedback(true)
    setQuestionsAnswered(prev => prev + 1)
    
    if (isCorrect) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      setScore(prev => prev + points)
      setCorrectAnswers(prev => prev + 1)
    }
    
    setTimeout(() => {
      if (questionsAnswered + 1 >= questionsPerLevel) {
        checkLevelComplete()
      } else {
        nextQuestion()
      }
    }, 1500)
  }

  const toggleElement = (element: string) => {
    if (showFeedback) return
    
    if (selectedElements.includes(element)) {
      setSelectedElements(prev => prev.filter(e => e !== element))
    } else {
      setSelectedElements(prev => [...prev, element])
    }
  }

  const submitCompound = () => {
    if (!currentCompound || showFeedback) return
    
    const requiredElements = [...currentCompound.elements]
    const selected = [...selectedElements]
    
    // Check if selected elements match required elements
    let isCorrect = selected.length === requiredElements.length
    if (isCorrect) {
      const sortedRequired = requiredElements.sort()
      const sortedSelected = selected.sort()
      isCorrect = sortedRequired.every((el, i) => el === sortedSelected[i])
    }
    
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
    
    // Increase difficulty with levels
    if (level >= 2) {
      setMode('compoundBuild')
    }
    
    setGameState('playing')
    nextQuestion()
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setQuestionsAnswered(0)
    setCorrectAnswers(0)
    setSelectedElements([])
    setShowFeedback(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6" />
            Chemistry Lab
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Element & Compound Challenge!</h2>
              <p className="text-gray-600">
                Match elements and build compounds in this chemistry puzzle
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
                  <Atom className="w-8 h-8" />
                  <span>Easy</span>
                  <span className="text-xs text-gray-500">Element Matching</span>
                </Button>
                <Button
                  onClick={() => startGame('medium')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Beaker className="w-8 h-8" />
                  <span>Medium</span>
                  <span className="text-xs text-gray-500">Mixed Challenges</span>
                </Button>
                <Button
                  onClick={() => startGame('hard')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <FlaskConical className="w-8 h-8" />
                  <span>Hard</span>
                  <span className="text-xs text-gray-500">Complex Compounds</span>
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
            
            {mode === 'elementMatch' && currentElement && (
              <div className="text-center space-y-6">
                <h3 className="text-xl font-semibold">Match the Element</h3>
                <div className="text-6xl font-bold text-blue-600">
                  {currentElement.symbol}
                </div>
                <p className="text-gray-600">Atomic Number: {currentElement.atomicNumber}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleElementMatch(option)}
                      disabled={showFeedback}
                      variant={
                        showFeedback
                          ? option === currentElement.name
                            ? 'default'
                            : 'outline'
                          : 'outline'
                      }
                      className="h-auto py-3"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'compoundBuild' && currentCompound && (
              <div className="text-center space-y-6">
                <h3 className="text-xl font-semibold">Build the Compound</h3>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {currentCompound.formula}
                  </div>
                  <p className="text-lg">{currentCompound.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Select elements needed:</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4 min-h-[40px]">
                    {selectedElements.map((el, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 rounded">
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => toggleElement(option)}
                      disabled={showFeedback}
                      variant={
                        selectedElements.includes(option) ? 'default' : 'outline'
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                
                <Button
                  onClick={submitCompound}
                  disabled={showFeedback || selectedElements.length === 0}
                  className="mt-4"
                >
                  Submit Compound
                </Button>
                
                {showFeedback && (
                  <p className={selectedElements.sort().join(',') === currentCompound.elements.sort().join(',') ? 'text-green-600' : 'text-red-600'}>
                    {selectedElements.sort().join(',') === currentCompound.elements.sort().join(',') 
                      ? 'Correct!' 
                      : `Needed: ${currentCompound.elements.join(', ')}`}
                  </p>
                )}
              </div>
            )}
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