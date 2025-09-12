'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameLevel } from '@/types/game'

interface WordleConfig {
  wordDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  maxAttempts: number
  hintsAllowed?: number
  timeLimit?: number
}

const levels: GameLevel[] = [
  { id: 1, name: 'Beginner Words', difficulty: 'easy', config: { wordDifficulty: 'easy', maxAttempts: 6 } as WordleConfig },
  { id: 2, name: 'Common Words', difficulty: 'medium', config: { wordDifficulty: 'medium', maxAttempts: 6 } as WordleConfig },
  { id: 3, name: 'Challenging Words', difficulty: 'hard', config: { wordDifficulty: 'hard', maxAttempts: 6 } as WordleConfig },
  { id: 4, name: 'Expert Mode', difficulty: 'expert', config: { wordDifficulty: 'expert', maxAttempts: 5, hintsAllowed: 1 } as WordleConfig },
  { id: 5, name: 'Time Challenge', difficulty: 'master', config: { wordDifficulty: 'expert', maxAttempts: 6, timeLimit: 180 } as WordleConfig }
]

const WORD_LISTS = {
  easy: ['ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG', 'AMONG', 'BEACH', 'BRAIN', 'BREAD', 'BREAK'],
  medium: ['BADGE', 'BENCH', 'BLAST', 'CABIN', 'CHAIN', 'CLAIM', 'DANCE', 'DEMON', 'DRAFT', 'DREAM'],
  hard: ['AXIOM', 'BUXOM', 'CYNIC', 'FJORD', 'GLYPH', 'JUMPY', 'NYMPH', 'QUARK', 'VIXEN', 'WALTZ'],
  expert: ['ABUZZ', 'AFFIX', 'ASKEW', 'AZURE', 'BAYOU', 'BLITZ', 'CRAZE', 'DWARF', 'EPOCH', 'FIZZY']
}

interface LetterState {
  letter: string
  state: 'correct' | 'present' | 'absent' | 'unused'
}

export default function Wordle() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [keyboardState, setKeyboardState] = useState<Map<string, 'correct' | 'present' | 'absent'>>(new Map())
  const [hintsUsed, setHintsUsed] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())

  const level = levels[currentLevel - 1]
  const config = level.config as WordleConfig
  const maxAttempts = config.maxAttempts

  const selectWord = useCallback(() => {
    const wordList = WORD_LISTS[config.wordDifficulty]
    const word = wordList[Math.floor(Math.random() * wordList.length)]
    setTargetWord(word)
  }, [config.wordDifficulty])

  useEffect(() => {
    startNewGame()
  }, [currentLevel])

  useEffect(() => {
    if (config.timeLimit && !gameOver) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = config.timeLimit! - elapsed
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
          setGameOver(true)
          setWon(false)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [config.timeLimit, startTime, gameOver])

  const startNewGame = () => {
    selectWord()
    setGuesses([])
    setCurrentGuess('')
    setGameOver(false)
    setWon(false)
    setKeyboardState(new Map())
    setHintsUsed(0)
    setStartTime(Date.now())
    if (config.timeLimit) {
      setTimeLeft(config.timeLimit)
    }
  }

  const evaluateGuess = (guess: string): LetterState[] => {
    const result: LetterState[] = []
    const targetLetters = targetWord.split('')
    const guessLetters = guess.split('')
    
    // First pass: mark correct letters
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        result[i] = { letter, state: 'correct' }
        targetLetters[i] = '*' // Mark as used
      } else {
        result[i] = { letter, state: 'absent' }
      }
    })
    
    // Second pass: mark present letters
    guessLetters.forEach((letter, i) => {
      if (result[i].state === 'absent') {
        const targetIndex = targetLetters.indexOf(letter)
        if (targetIndex !== -1) {
          result[i].state = 'present'
          targetLetters[targetIndex] = '*' // Mark as used
        }
      }
    })
    
    return result
  }

  const updateKeyboardState = (evaluation: LetterState[]) => {
    const newState = new Map(keyboardState)
    evaluation.forEach(({ letter, state }) => {
      if (state === 'unused') return // Skip unused state
      const currentState = newState.get(letter)
      if (state === 'correct' || !currentState || 
          (state === 'present' && currentState === 'absent')) {
        newState.set(letter, state as 'correct' | 'present' | 'absent')
      }
    })
    setKeyboardState(newState)
  }

  const handleKeyPress = (key: string) => {
    if (gameOver) return
    
    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        const evaluation = evaluateGuess(currentGuess)
        updateKeyboardState(evaluation)
        
        const newGuesses = [...guesses, currentGuess]
        setGuesses(newGuesses)
        
        if (currentGuess === targetWord) {
          const timeTaken = Math.floor((Date.now() - startTime) / 1000)
          const timeBonus = Math.max(0, 300 - timeTaken) * 10
          const attemptBonus = (maxAttempts - newGuesses.length) * 1000
          const levelBonus = currentLevel * 500
          const totalScore = 1000 + attemptBonus + timeBonus + levelBonus
          
          setScore(score + totalScore)
          setStreak(streak + 1)
          setWon(true)
          setGameOver(true)
        } else if (newGuesses.length >= maxAttempts) {
          setStreak(0)
          setGameOver(true)
        }
        
        setCurrentGuess('')
      }
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(currentGuess.slice(0, -1))
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(currentGuess + key)
    }
  }

  const useHint = () => {
    if (config.hintsAllowed && hintsUsed < config.hintsAllowed && !gameOver) {
      const unrevealed = targetWord.split('').map((letter, i) => {
        const isRevealed = guesses.some(guess => guess[i] === targetWord[i])
        return isRevealed ? null : { letter, index: i }
      }).filter(Boolean)
      
      if (unrevealed.length > 0) {
        const hint = unrevealed[Math.floor(Math.random() * unrevealed.length)]
        alert(`Letter at position ${hint!.index + 1} is: ${hint!.letter}`)
        setHintsUsed(hintsUsed + 1)
      }
    }
  }

  const nextLevel = () => {
    if (currentLevel < levels.length) {
      setCurrentLevel(currentLevel + 1)
    }
  }

  const keyboard = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ]

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Wordle</h2>
        <div className="flex justify-center gap-4 mb-4">
          <div>Level {currentLevel}: {level.name}</div>
          <div>Score: {score.toLocaleString()}</div>
          <div>Streak: {streak}</div>
          {timeLeft !== null && (
            <div className={timeLeft < 30 ? 'text-red-500' : ''}>
              Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-rows-6 gap-2 mb-6 max-w-xs mx-auto">
        {Array.from({ length: maxAttempts }).map((_, attemptIndex) => {
          const guess = guesses[attemptIndex] || ''
          const evaluation = guess ? evaluateGuess(guess) : []
          const isCurrentRow = attemptIndex === guesses.length && !gameOver
          
          return (
            <div key={attemptIndex} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, letterIndex) => {
                const letter = isCurrentRow ? currentGuess[letterIndex] || '' : guess[letterIndex] || ''
                const state = evaluation[letterIndex]?.state
                
                return (
                  <div
                    key={letterIndex}
                    className={`
                      w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold
                      ${state === 'correct' ? 'bg-green-500 text-white border-green-500' :
                        state === 'present' ? 'bg-yellow-500 text-white border-yellow-500' :
                        state === 'absent' ? 'bg-gray-500 text-white border-gray-500' :
                        letter ? 'border-gray-400' : 'border-gray-300'}
                    `}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="space-y-2 mb-4">
        {keyboard.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map(key => {
              const state = keyboardState.get(key)
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`
                    px-3 py-3 rounded font-semibold text-sm
                    ${key.length > 1 ? 'px-4' : ''}
                    ${state === 'correct' ? 'bg-green-500 text-white' :
                      state === 'present' ? 'bg-yellow-500 text-white' :
                      state === 'absent' ? 'bg-gray-500 text-white' :
                      'bg-gray-200 hover:bg-gray-300'}
                  `}
                  disabled={gameOver}
                >
                  {key === 'BACKSPACE' ? '←' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {config.hintsAllowed && (
        <div className="text-center mb-4">
          <Button
            onClick={useHint}
            disabled={gameOver || hintsUsed >= config.hintsAllowed}
          >
            Use Hint ({config.hintsAllowed - hintsUsed} left)
          </Button>
        </div>
      )}

      {gameOver && (
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">
            {won ? '🎉 Congratulations!' : `The word was: ${targetWord}`}
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={startNewGame}>Play Again</Button>
            {won && currentLevel < levels.length && (
              <Button onClick={nextLevel} variant="default">
                Next Level
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}