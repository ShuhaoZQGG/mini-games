'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Languages, BookOpen, Trophy } from 'lucide-react'

interface WordPair {
  word: string
  translation: string
  language: string
  category: string
}

const wordPairs: WordPair[] = [
  // Spanish
  { word: 'Hello', translation: 'Hola', language: 'Spanish', category: 'Greetings' },
  { word: 'Thank you', translation: 'Gracias', language: 'Spanish', category: 'Greetings' },
  { word: 'Water', translation: 'Agua', language: 'Spanish', category: 'Basics' },
  { word: 'Friend', translation: 'Amigo', language: 'Spanish', category: 'People' },
  { word: 'Book', translation: 'Libro', language: 'Spanish', category: 'Objects' },
  // French
  { word: 'Hello', translation: 'Bonjour', language: 'French', category: 'Greetings' },
  { word: 'Thank you', translation: 'Merci', language: 'French', category: 'Greetings' },
  { word: 'Water', translation: 'Eau', language: 'French', category: 'Basics' },
  { word: 'Friend', translation: 'Ami', language: 'French', category: 'People' },
  { word: 'Book', translation: 'Livre', language: 'French', category: 'Objects' },
  // German
  { word: 'Hello', translation: 'Hallo', language: 'German', category: 'Greetings' },
  { word: 'Thank you', translation: 'Danke', language: 'German', category: 'Greetings' },
  { word: 'Water', translation: 'Wasser', language: 'German', category: 'Basics' },
  { word: 'Friend', translation: 'Freund', language: 'German', category: 'People' },
  { word: 'Book', translation: 'Buch', language: 'German', category: 'Objects' },
  // Italian
  { word: 'Hello', translation: 'Ciao', language: 'Italian', category: 'Greetings' },
  { word: 'Thank you', translation: 'Grazie', language: 'Italian', category: 'Greetings' },
  { word: 'Water', translation: 'Acqua', language: 'Italian', category: 'Basics' },
  { word: 'Friend', translation: 'Amico', language: 'Italian', category: 'People' },
  { word: 'Book', translation: 'Libro', language: 'Italian', category: 'Objects' },
  // Japanese
  { word: 'Hello', translation: 'こんにちは', language: 'Japanese', category: 'Greetings' },
  { word: 'Thank you', translation: 'ありがとう', language: 'Japanese', category: 'Greetings' },
  { word: 'Water', translation: '水', language: 'Japanese', category: 'Basics' },
  { word: 'Friend', translation: '友達', language: 'Japanese', category: 'People' },
  { word: 'Book', translation: '本', language: 'Japanese', category: 'Objects' },
]

export default function LanguageMatch() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver'>('menu')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish')
  const [currentPairs, setCurrentPairs] = useState<WordPair[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [stars, setStars] = useState(0)
  const [timer, setTimer] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)

  const pairsPerLevel = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8

  useEffect(() => {
    const saved = localStorage.getItem('languageMatchHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('languageMatchHighScore', score.toString())
    }
  }, [score, highScore])

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else if (timer === 0 && isTimerActive) {
      checkLevelComplete()
    }
  }, [timer, isTimerActive])

  const generatePairs = () => {
    const langPairs = wordPairs.filter(p => p.language === selectedLanguage)
    const shuffled = [...langPairs].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, pairsPerLevel)
    setCurrentPairs(selected)
    setMatchedPairs([])
    setSelectedWords([])
    setSelectedTranslations([])
    setAttempts(0)
  }

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff)
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setTimer(diff === 'easy' ? 90 : diff === 'medium' ? 60 : 45)
    setIsTimerActive(true)
    generatePairs()
  }

  const selectWord = (word: string) => {
    if (matchedPairs.includes(word)) return
    
    if (selectedWords.includes(word)) {
      setSelectedWords([])
    } else {
      setSelectedWords([word])
    }
  }

  const selectTranslation = (translation: string) => {
    if (matchedPairs.includes(translation)) return
    
    if (selectedTranslations.includes(translation)) {
      setSelectedTranslations([])
    } else {
      setSelectedTranslations([translation])
    }
    
    if (selectedWords.length === 1) {
      checkMatch(selectedWords[0], translation)
    }
  }

  const checkMatch = (word: string, translation: string) => {
    setAttempts(prev => prev + 1)
    
    const pair = currentPairs.find(p => p.word === word && p.translation === translation)
    
    if (pair) {
      setMatchedPairs(prev => [...prev, word, translation])
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30
      const timeBonus = Math.floor(timer / 10)
      setScore(prev => prev + points + timeBonus)
      
      if (matchedPairs.length + 2 >= pairsPerLevel * 2) {
        setTimeout(() => checkLevelComplete(), 500)
      }
    }
    
    setTimeout(() => {
      setSelectedWords([])
      setSelectedTranslations([])
    }, 500)
  }

  const checkLevelComplete = () => {
    setIsTimerActive(false)
    const matchPercentage = (matchedPairs.length / (pairsPerLevel * 2)) * 100
    const accuracyBonus = attempts > 0 ? Math.max(0, 100 - (attempts - pairsPerLevel) * 10) : 0
    const finalScore = (matchPercentage + accuracyBonus) / 2
    
    const earnedStars = finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore >= 50 ? 1 : 0
    
    setStars(earnedStars)
    
    if (earnedStars > 0) {
      setGameState('levelComplete')
    } else {
      setGameState('gameOver')
    }
  }

  const nextLevel = () => {
    setLevel(prev => prev + 1)
    setTimer(difficulty === 'easy' ? 90 : difficulty === 'medium' ? 60 : 45)
    setIsTimerActive(true)
    
    // Change language every 2 levels
    if (level % 2 === 0) {
      const languages = ['Spanish', 'French', 'German', 'Italian', 'Japanese']
      const currentIndex = languages.indexOf(selectedLanguage)
      setSelectedLanguage(languages[(currentIndex + 1) % languages.length])
    }
    
    setGameState('playing')
    generatePairs()
  }

  const resetGame = () => {
    setGameState('menu')
    setLevel(1)
    setScore(0)
    setSelectedLanguage('Spanish')
    setMatchedPairs([])
    setSelectedWords([])
    setSelectedTranslations([])
    setIsTimerActive(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Languages className="w-6 h-6" />
            Language Match
          </span>
          <span className="text-sm font-normal">High Score: {highScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Match Words & Translations!</h2>
              <p className="text-gray-600">
                Learn vocabulary by matching words with their translations
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
                  <BookOpen className="w-8 h-8" />
                  <span>Easy</span>
                  <span className="text-xs text-gray-500">4 pairs, 90s</span>
                </Button>
                <Button
                  onClick={() => startGame('medium')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Languages className="w-8 h-8" />
                  <span>Medium</span>
                  <span className="text-xs text-gray-500">6 pairs, 60s</span>
                </Button>
                <Button
                  onClick={() => startGame('hard')}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Trophy className="w-8 h-8" />
                  <span>Hard</span>
                  <span className="text-xs text-gray-500">8 pairs, 45s</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span>Level: {level}</span>
              <span className="font-bold">{selectedLanguage}</span>
              <span className={`${timer <= 10 ? 'text-red-500' : ''}`}>Time: {timer}s</span>
              <span>Score: {score}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-center font-semibold mb-3">English Words</h3>
                <div className="space-y-2">
                  {currentPairs.map((pair, index) => (
                    <Button
                      key={index}
                      onClick={() => selectWord(pair.word)}
                      disabled={matchedPairs.includes(pair.word)}
                      variant={
                        matchedPairs.includes(pair.word) ? 'secondary' :
                        selectedWords.includes(pair.word) ? 'default' : 'outline'
                      }
                      className="w-full"
                    >
                      {pair.word}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-center font-semibold mb-3">Translations</h3>
                <div className="space-y-2">
                  {[...currentPairs].sort(() => Math.random() - 0.5).map((pair, index) => (
                    <Button
                      key={index}
                      onClick={() => selectTranslation(pair.translation)}
                      disabled={matchedPairs.includes(pair.translation)}
                      variant={
                        matchedPairs.includes(pair.translation) ? 'secondary' :
                        selectedTranslations.includes(pair.translation) ? 'default' : 'outline'
                      }
                      className="w-full"
                    >
                      {pair.translation}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              Matched: {matchedPairs.length / 2} / {pairsPerLevel} | Attempts: {attempts}
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
              <p>Pairs Matched: {matchedPairs.length / 2}/{pairsPerLevel}</p>
              <p>Accuracy: {Math.round((pairsPerLevel / attempts) * 100)}%</p>
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
              <p>Pairs Matched: {matchedPairs.length / 2}/{pairsPerLevel}</p>
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