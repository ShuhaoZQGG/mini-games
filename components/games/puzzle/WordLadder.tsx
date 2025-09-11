'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RotateCcw, Trophy, Star, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type WordPair = {
  start: string
  end: string
  minSteps: number
}

const WORD_PAIRS: WordPair[] = [
  { start: 'COLD', end: 'WARM', minSteps: 4 },
  { start: 'HEAD', end: 'TAIL', minSteps: 5 },
  { start: 'FLOUR', end: 'BREAD', minSteps: 6 },
  { start: 'WITCH', end: 'FAIRY', minSteps: 7 },
  { start: 'STONE', end: 'MONEY', minSteps: 6 },
  { start: 'ANGEL', end: 'DEVIL', minSteps: 8 },
  { start: 'BLACK', end: 'WHITE', minSteps: 7 },
  { start: 'RIVER', end: 'SHORE', minSteps: 6 }
]

const WordLadder: React.FC = () => {
  const [currentPair, setCurrentPair] = useState<WordPair>(WORD_PAIRS[0])
  const [wordChain, setWordChain] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState('')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [hints, setHints] = useState(3)
  const [timeLeft, setTimeLeft] = useState(180)
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'timeout'>('playing')
  const [validWords] = useState(new Set([
    'COLD', 'CORD', 'WORD', 'WORM', 'WARM',
    'HEAD', 'HEAL', 'TEAL', 'TELL', 'TALL', 'TAIL',
    'FLOUR', 'FLOOR', 'FLOOD', 'BLOOD', 'BROOD', 'BROAD', 'BREAD',
    'WITCH', 'WATCH', 'MATCH', 'MARCH', 'PARCH', 'PATCH', 'PITCH', 'PINCH', 'FINCH', 'FAIRY',
    'STONE', 'STOLE', 'STALE', 'SCALE', 'SCARE', 'SCORE', 'SHORE', 'CHORE', 'CHOSE', 'CLOSE', 'CLONE', 'ALONE', 'ATONE', 'MONEY',
    'ANGEL', 'ANGER', 'AMBER', 'EMBER', 'EMBERS', 'DEVIL',
    'BLACK', 'BLANK', 'BLINK', 'BRINK', 'DRINK', 'DRANK', 'FRANK', 'FLANK', 'FLASK', 'FLASH', 'CLASH', 'CLASS', 'GRASS', 'BRASS', 'BRASH', 'BRUSH', 'CRUSH', 'CRUST', 'TRUST', 'TRYST', 'TWIST', 'TWIT', 'WHIT', 'WHITE',
    'RIVER', 'ROVER', 'COVER', 'COVES', 'CORES', 'SORES', 'SHORE'
  ]))

  const initGame = useCallback(() => {
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)]
    setCurrentPair(pair)
    setWordChain([pair.start])
    setCurrentWord('')
    setGameStatus('playing')
    setTimeLeft(180)
    setHints(3)
  }, [])

  const isValidTransition = (from: string, to: string): boolean => {
    if (from.length !== to.length) return false
    let differences = 0
    
    for (let i = 0; i < from.length; i++) {
      if (from[i] !== to[i]) differences++
    }
    
    return differences === 1
  }

  const submitWord = useCallback(() => {
    const word = currentWord.toUpperCase()
    
    if (word.length === 0) return
    
    // Check if word is valid
    if (!validWords.has(word)) {
      setCurrentWord('')
      return
    }
    
    // Check if it's a valid transition
    const lastWord = wordChain[wordChain.length - 1]
    if (!isValidTransition(lastWord, word)) {
      setCurrentWord('')
      return
    }
    
    // Check if word was already used
    if (wordChain.includes(word)) {
      setCurrentWord('')
      return
    }
    
    // Add word to chain
    const newChain = [...wordChain, word]
    setWordChain(newChain)
    setCurrentWord('')
    
    // Check if reached target
    if (word === currentPair.end) {
      const steps = newChain.length - 1
      const efficiency = currentPair.minSteps / steps
      const points = Math.floor(1000 * efficiency + timeLeft * 10)
      
      setScore(prev => prev + points)
      setGameStatus('won')
      
      // Update stars based on efficiency
      if (steps === currentPair.minSteps) {
        setStars(prev => Math.min(prev + 3, 9))
      } else if (steps <= currentPair.minSteps + 1) {
        setStars(prev => Math.min(prev + 2, 9))
      } else {
        setStars(prev => Math.min(prev + 1, 9))
      }
    }
  }, [currentWord, wordChain, currentPair, validWords, timeLeft])

  const getHint = () => {
    if (hints <= 0) return
    
    setHints(prev => prev - 1)
    
    // Simple hint: show one possible next word
    const lastWord = wordChain[wordChain.length - 1]
    const possibleWords = Array.from(validWords).filter(word => 
      isValidTransition(lastWord, word) && !wordChain.includes(word)
    )
    
    if (possibleWords.length > 0) {
      const hint = possibleWords[0]
      // Show first and last letter
      const hintText = hint[0] + '...' + hint[hint.length - 1]
      alert(`Hint: Try ${hintText}`)
    }
  }

  const undoLastWord = () => {
    if (wordChain.length > 1) {
      setWordChain(prev => prev.slice(0, -1))
    }
  }

  // Timer
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameStatus('timeout')
    }
  }, [timeLeft, gameStatus])

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(score / 5000) + 1
    if (newLevel > level) {
      setLevel(newLevel)
    }
  }, [score, level])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Word Ladder - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/9</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <Button onClick={initGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Puzzle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Goal Display */}
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-4">
              <div className="text-2xl font-bold">{currentPair.start}</div>
              <ArrowRight className="w-6 h-6" />
              <div className="text-2xl font-bold">{currentPair.end}</div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              Minimum steps: {currentPair.minSteps}
            </div>
          </div>

          {/* Word Chain */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Your Word Chain</h3>
            <div className="flex flex-wrap gap-2">
              {wordChain.map((word, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    px-3 py-2 rounded-lg font-mono text-lg
                    ${index === 0 ? 'bg-blue-500 text-white' : 
                      word === currentPair.end ? 'bg-green-500 text-white' :
                      'bg-white dark:bg-gray-700 border-2 border-gray-300'}
                  `}
                >
                  {word}
                  {index < wordChain.length - 1 && index > 0 && (
                    <span className="ml-2 text-gray-400">→</span>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Steps: {wordChain.length - 1}
            </div>
          </div>

          {/* Input Section */}
          {gameStatus === 'playing' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && submitWord()}
                  placeholder="Enter next word..."
                  className="flex-1 text-lg font-mono"
                  maxLength={currentPair.start.length}
                />
                <Button onClick={submitWord} className="px-6">
                  Submit
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={getHint} 
                  variant="outline"
                  disabled={hints === 0}
                >
                  Hint ({hints} left)
                </Button>
                <Button 
                  onClick={undoLastWord}
                  variant="outline"
                  disabled={wordChain.length <= 1}
                >
                  Undo Last
                </Button>
              </div>
            </div>
          )}

          {/* Game Status */}
          <AnimatePresence>
            {gameStatus === 'won' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-100 dark:bg-green-900 p-6 rounded-lg text-center"
              >
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold mb-2">Excellent!</h3>
                <p className="text-lg mb-1">
                  Completed in {wordChain.length - 1} steps
                  {wordChain.length - 1 === currentPair.minSteps && ' (Perfect!)'}
                </p>
                <p className="text-lg mb-4">Points earned: {Math.floor(1000 * (currentPair.minSteps / (wordChain.length - 1)) + timeLeft * 10)}</p>
                <Button onClick={initGame} size="lg">Next Puzzle</Button>
              </motion.div>
            )}
            
            {gameStatus === 'timeout' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 dark:bg-red-900 p-6 rounded-lg text-center"
              >
                <h3 className="text-2xl font-bold mb-4">Time's Up!</h3>
                <Button onClick={initGame} size="lg">Try Again</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default WordLadder