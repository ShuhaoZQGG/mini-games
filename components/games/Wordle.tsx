'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw, Trophy } from 'lucide-react'

// Word lists for different difficulty levels
const WORD_LISTS = {
  easy: [
    'ABOUT', 'BEACH', 'CHAIR', 'DREAM', 'EARTH', 'FANCY', 'GIANT', 'HAPPY', 'IDEAL', 'JOINT',
    'KNIFE', 'LEMON', 'MOUSE', 'NIGHT', 'OCEAN', 'PARTY', 'QUIET', 'RADIO', 'SMART', 'THANK',
    'UNDER', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'APPLE', 'BRAVE', 'CLEAN', 'DANCE', 'EAGLE'
  ],
  medium: [
    'ABUSE', 'BADGE', 'CACHE', 'DAIRY', 'EAGER', 'FAINT', 'GAUGE', 'HAIRY', 'IMAGE', 'JELLY',
    'KNACK', 'LASER', 'MAGIC', 'NAIVE', 'OASIS', 'PANIC', 'QUILT', 'RAPID', 'SAUCE', 'TEASE',
    'ULTRA', 'VAGUE', 'WALTZ', 'YACHT', 'ZESTY', 'BINGE', 'CRISP', 'DWARF', 'EXACT', 'FLASK'
  ],
  hard: [
    'ABYSS', 'BLITZ', 'CRYPT', 'DOUBT', 'EPOXY', 'FJORD', 'GLYPH', 'HYPER', 'IVORY', 'JAZZY',
    'KAYAK', 'LYMPH', 'MYRRH', 'NYMPH', 'OXIDE', 'PSALM', 'QUARK', 'RHYME', 'SPHINX', 'TRYST',
    'UNZIP', 'VIXEN', 'WALTZ', 'YACHT', 'ZILCH', 'QUIRK', 'JUMPY', 'GLITZ', 'WAXED', 'FIZZY'
  ],
  expert: [
    'AXIOM', 'BUZZY', 'CYNIC', 'DIZZY', 'ENZYME', 'FUZZY', 'GIZMO', 'HUSKY', 'JIFFY', 'JUMBO',
    'KHAKI', 'LYMPH', 'MIXER', 'NIXED', 'PROXY', 'QUAFF', 'REMIX', 'SAVVY', 'TOPAZ', 'UNBOX',
    'VODKA', 'WOOZY', 'XEROX', 'YUMMY', 'ZIPPY', 'FIZZY', 'JAZZY', 'QUICK', 'JOKER', 'PLAZA'
  ]
}

interface WordleGameProps {
  levelConfig: {
    wordDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
    maxAttempts: number
    timeLimit?: number
    hintsAllowed?: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Words',
    difficulty: 'easy',
    config: { wordDifficulty: 'easy', maxAttempts: 6 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Common Words',
    difficulty: 'medium',
    config: { wordDifficulty: 'medium', maxAttempts: 6 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Challenging Words',
    difficulty: 'hard',
    config: { wordDifficulty: 'hard', maxAttempts: 6 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Mode',
    difficulty: 'expert',
    config: { wordDifficulty: 'expert', maxAttempts: 5, hintsAllowed: 1 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Time Challenge',
    difficulty: 'master',
    config: { wordDifficulty: 'expert', maxAttempts: 6, timeLimit: 180 },
    requiredStars: 12
  }
]

type LetterState = 'empty' | 'pending' | 'correct' | 'present' | 'absent'

interface Letter {
  value: string
  state: LetterState
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
]

function WordleGame({ levelConfig, onScore }: WordleGameProps) {
  const { wordDifficulty, maxAttempts, timeLimit, hintsAllowed = 0 } = levelConfig
  
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState<Letter[][]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState('')
  const [keyboardState, setKeyboardState] = useState<Record<string, LetterState>>({})
  const [timer, setTimer] = useState(timeLimit || 0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [score, setScore] = useState(0)

  // Initialize game
  useEffect(() => {
    startNewGame()
  }, [wordDifficulty])

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLimit && timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            endGame(false)
            return 0
          }
          return t - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState, timeLimit, timer])

  // Keyboard event listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      const key = e.key.toUpperCase()
      
      if (key === 'ENTER') {
        submitGuess()
      } else if (key === 'BACKSPACE') {
        setCurrentGuess(prev => prev.slice(0, -1))
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentGuess, gameState])

  const startNewGame = () => {
    const words = WORD_LISTS[wordDifficulty]
    const word = words[Math.floor(Math.random() * words.length)]
    setTargetWord(word)
    
    // Initialize empty guesses grid
    const emptyGuesses: Letter[][] = []
    for (let i = 0; i < maxAttempts; i++) {
      emptyGuesses.push(Array(5).fill(null).map(() => ({ value: '', state: 'empty' })))
    }
    setGuesses(emptyGuesses)
    
    setCurrentGuess('')
    setCurrentAttempt(0)
    setGameState('playing')
    setMessage('')
    setKeyboardState({})
    setTimer(timeLimit || 0)
    setHintsUsed(0)
    setScore(0)
  }

  const handleVirtualKeyPress = (key: string) => {
    if (gameState !== 'playing') return
    
    if (key === 'ENTER') {
      submitGuess()
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key)
    }
  }

  const submitGuess = () => {
    if (currentGuess.length !== 5) {
      setMessage('Not enough letters')
      setTimeout(() => setMessage(''), 2000)
      return
    }

    // Check if word is valid (for now, accept any 5-letter combination)
    const newGuesses = [...guesses]
    const newKeyboardState = { ...keyboardState }
    
    // Evaluate the guess
    const guessLetters: Letter[] = []
    const targetArray = targetWord.split('')
    const guessArray = currentGuess.split('')
    
    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
      if (guessArray[i] === targetArray[i]) {
        guessLetters.push({ value: guessArray[i], state: 'correct' })
        newKeyboardState[guessArray[i]] = 'correct'
        targetArray[i] = '*' // Mark as used
        guessArray[i] = '#' // Mark as processed
      } else {
        guessLetters.push({ value: guessArray[i], state: 'pending' })
      }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
      if (guessArray[i] !== '#') {
        const targetIndex = targetArray.indexOf(guessArray[i])
        if (targetIndex !== -1) {
          guessLetters[i].state = 'present'
          if (newKeyboardState[guessArray[i]] !== 'correct') {
            newKeyboardState[guessArray[i]] = 'present'
          }
          targetArray[targetIndex] = '*' // Mark as used
        } else {
          guessLetters[i].state = 'absent'
          if (!newKeyboardState[guessArray[i]]) {
            newKeyboardState[guessArray[i]] = 'absent'
          }
        }
      }
    }
    
    newGuesses[currentAttempt] = guessLetters
    setGuesses(newGuesses)
    setKeyboardState(newKeyboardState)
    
    // Check win condition
    if (currentGuess === targetWord) {
      const baseScore = 1000
      const attemptBonus = (maxAttempts - currentAttempt) * 100
      const timeBonus = timeLimit ? Math.floor(timer * 2) : 0
      const finalScore = baseScore + attemptBonus + timeBonus
      setScore(finalScore)
      onScore(finalScore)
      endGame(true)
    } else if (currentAttempt >= maxAttempts - 1) {
      endGame(false)
    } else {
      setCurrentAttempt(currentAttempt + 1)
      setCurrentGuess('')
    }
  }

  const endGame = (won: boolean) => {
    setGameState(won ? 'won' : 'lost')
    if (won) {
      setMessage('🎉 Congratulations!')
    } else {
      setMessage(`Game Over! The word was ${targetWord}`)
    }
  }

  const useHint = () => {
    if (hintsUsed >= hintsAllowed || gameState !== 'playing') return
    
    // Reveal a random correct letter
    const unrevealedIndices: number[] = []
    for (let i = 0; i < 5; i++) {
      let isRevealed = false
      for (let j = 0; j <= currentAttempt; j++) {
        if (guesses[j][i]?.state === 'correct') {
          isRevealed = true
          break
        }
      }
      if (!isRevealed) unrevealedIndices.push(i)
    }
    
    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)]
      setMessage(`Hint: Position ${randomIndex + 1} is "${targetWord[randomIndex]}"`)
      setTimeout(() => setMessage(''), 3000)
      setHintsUsed(hintsUsed + 1)
    }
  }

  // Render current guess in the grid
  const renderGrid = () => {
    const grid = []
    for (let row = 0; row < maxAttempts; row++) {
      const rowLetters = []
      for (let col = 0; col < 5; col++) {
        let letter = ''
        let state: LetterState = 'empty'
        
        if (row < currentAttempt) {
          // Previous guesses
          letter = guesses[row][col]?.value || ''
          state = guesses[row][col]?.state || 'empty'
        } else if (row === currentAttempt) {
          // Current guess
          letter = currentGuess[col] || ''
          state = letter ? 'pending' : 'empty'
        }
        
        rowLetters.push(
          <div
            key={`${row}-${col}`}
            data-testid={`letter-${row}-${col}`}
            className={`
              w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold
              transition-all duration-300
              ${state === 'correct' ? 'bg-green-500 text-white border-green-500' : ''}
              ${state === 'present' ? 'bg-yellow-500 text-white border-yellow-500' : ''}
              ${state === 'absent' ? 'bg-gray-500 text-white border-gray-500' : ''}
              ${state === 'pending' ? 'border-gray-400 scale-110' : ''}
              ${state === 'empty' ? 'border-gray-300' : ''}
            `}
          >
            {letter}
          </div>
        )
      }
      grid.push(
        <div key={row} data-testid={`guess-row-${row}`} className="flex gap-2 justify-center">
          {rowLetters}
        </div>
      )
    }
    return grid
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="wordle-game">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Wordle</h2>
          <p className="text-gray-600">Guess the 5-letter word in {maxAttempts} attempts!</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            <span className="font-semibold">Attempt:</span> {currentAttempt + 1}/{maxAttempts}
          </div>
          <div className="text-lg">
            <span className="font-semibold">Score:</span> {score}
          </div>
          {timeLimit && (
            <div className="text-lg">
              <span className="font-semibold">Time:</span> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className="text-center mb-4 text-lg font-semibold text-blue-600">
            {message}
          </div>
        )}

        {/* Game Grid */}
        <div className="space-y-2 mb-6">
          {renderGrid()}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            onClick={startNewGame}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            New Game
          </Button>
          {hintsAllowed > 0 && hintsUsed < hintsAllowed && gameState === 'playing' && (
            <Button
              onClick={useHint}
              variant="outline"
            >
              Use Hint ({hintsAllowed - hintsUsed} left)
            </Button>
          )}
        </div>

        {/* Virtual Keyboard */}
        <div className="space-y-2">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map(key => {
                const state = keyboardState[key] || 'default'
                return (
                  <button
                    key={key}
                    role="button"
                    aria-label={key}
                    onClick={() => handleVirtualKeyPress(key)}
                    className={`
                      px-3 py-3 rounded font-semibold transition-colors
                      ${key.length > 1 ? 'px-4 text-sm' : 'text-lg'}
                      ${state === 'correct' ? 'bg-green-500 text-white' : ''}
                      ${state === 'present' ? 'bg-yellow-500 text-white' : ''}
                      ${state === 'absent' ? 'bg-gray-400 text-white' : ''}
                      ${state === 'default' ? 'bg-gray-200 hover:bg-gray-300' : ''}
                    `}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Win/Loss State */}
        {gameState !== 'playing' && (
          <div className="mt-6 text-center">
            {gameState === 'won' && (
              <div className="flex justify-center mb-4">
                <Trophy className="text-yellow-500" size={48} />
              </div>
            )}
            <Button
              onClick={startNewGame}
              size="lg"
              className="px-8"
            >
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function WordleWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    if (score >= 1200) return 3
    if (score >= 800) return 2
    return 1
  }

  const renderGame = (levelConfig: any, onScore: (score: number) => void) => {
    return <WordleGame levelConfig={levelConfig} onScore={onScore} />
  }

  return (
    <GameWithLevels
      gameId="wordle"
      gameName="Wordle"
      levels={levels}
      getStars={getStars}
      renderGame={renderGame}
    />
  )
}