'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Word list for the game
const WORD_LIST = [
  'REACT', 'GAMES', 'SCORE', 'LEVEL', 'POINT', 'MATCH', 'POWER', 'SPEED',
  'BONUS', 'COMBO', 'PRIZE', 'QUEST', 'SKILL', 'TIMER', 'ROUND', 'STAGE',
  'CROWN', 'BADGE', 'MEDAL', 'HEART', 'STARS', 'COINS', 'GEMS', 'CARDS',
  'MOVES', 'TURNS', 'CHESS', 'BOARD', 'PIECE', 'BLOCK', 'PIXEL', 'SPRITE'
]

type Letter = {
  value: string
  status: 'empty' | 'correct' | 'present' | 'absent'
}

export function Wordle() {
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState<Letter[][]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentRow, setCurrentRow] = useState(0)
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState('')
  const [keyboard, setKeyboard] = useState<Record<string, 'correct' | 'present' | 'absent' | 'unused'>>({})
  const [score, setScore] = useState(0)

  // Initialize game
  useEffect(() => {
    resetGame()
  }, [])

  const resetGame = () => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
    setTargetWord(randomWord)
    setGuesses(Array(6).fill(null).map(() => 
      Array(5).fill(null).map(() => ({ value: '', status: 'empty' as const }))
    ))
    setCurrentGuess('')
    setCurrentRow(0)
    setGameState('playing')
    setMessage('')
    const kb: Record<string, 'unused'> = {}
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      kb[letter] = 'unused'
    })
    setKeyboard(kb)
  }

  const handleKeyPress = useCallback((key: string) => {
    if (gameState !== 'playing') return

    if (key === 'ENTER') {
      submitGuess()
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key)
    }
  }, [currentGuess, gameState])

  const submitGuess = () => {
    if (currentGuess.length !== 5) {
      setMessage('Not enough letters')
      setTimeout(() => setMessage(''), 2000)
      return
    }

    // Check if word is valid (in this simple version, all 5-letter combinations are valid)
    const newGuesses = [...guesses]
    const newKeyboard = { ...keyboard }
    
    // Check each letter
    for (let i = 0; i < 5; i++) {
      const letter = currentGuess[i]
      let status: 'correct' | 'present' | 'absent' = 'absent'
      
      if (targetWord[i] === letter) {
        status = 'correct'
      } else if (targetWord.includes(letter)) {
        status = 'present'
      }
      
      newGuesses[currentRow][i] = { value: letter, status }
      
      // Update keyboard status
      if (newKeyboard[letter] !== 'correct') {
        if (status === 'correct' || 
            (status === 'present' && newKeyboard[letter] !== 'present')) {
          newKeyboard[letter] = status
        } else if (newKeyboard[letter] === 'unused') {
          newKeyboard[letter] = status
        }
      }
    }
    
    setGuesses(newGuesses)
    setKeyboard(newKeyboard)
    
    // Check win/lose
    if (currentGuess === targetWord) {
      setGameState('won')
      setMessage('Congratulations!')
      setScore(score + (7 - currentRow) * 100)
    } else if (currentRow === 5) {
      setGameState('lost')
      setMessage(`The word was ${targetWord}`)
    } else {
      setCurrentRow(currentRow + 1)
      setCurrentGuess('')
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER')
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE')
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase())
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wordle</h1>
          <p className="text-gray-600">Guess the 5-letter word in 6 tries</p>
          <div className="mt-4 text-2xl font-bold text-blue-600">Score: {score}</div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-rows-6 gap-2 mb-6">
          {guesses.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {row.map((letter, colIndex) => {
                const isCurrentRow = rowIndex === currentRow && gameState === 'playing'
                const currentLetter = isCurrentRow && currentGuess[colIndex]
                
                return (
                  <div
                    key={colIndex}
                    className={cn(
                      "w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold transition-all",
                      letter.status === 'correct' && "bg-green-500 text-white border-green-500",
                      letter.status === 'present' && "bg-yellow-500 text-white border-yellow-500",
                      letter.status === 'absent' && "bg-gray-500 text-white border-gray-500",
                      letter.status === 'empty' && "border-gray-300",
                      isCurrentRow && currentLetter && "border-gray-600 scale-105"
                    )}
                  >
                    {letter.value || currentLetter || ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className="text-center mb-4 text-lg font-semibold">
            {message}
          </div>
        )}

        {/* Virtual Keyboard */}
        <div className="space-y-2">
          <div className="flex justify-center gap-1">
            {'QWERTYUIOP'.split('').map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  "px-3 py-2 rounded font-semibold transition-colors",
                  keyboard[key] === 'correct' && "bg-green-500 text-white",
                  keyboard[key] === 'present' && "bg-yellow-500 text-white",
                  keyboard[key] === 'absent' && "bg-gray-500 text-white",
                  keyboard[key] === 'unused' && "bg-gray-200 hover:bg-gray-300"
                )}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1">
            {'ASDFGHJKL'.split('').map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  "px-3 py-2 rounded font-semibold transition-colors",
                  keyboard[key] === 'correct' && "bg-green-500 text-white",
                  keyboard[key] === 'present' && "bg-yellow-500 text-white",
                  keyboard[key] === 'absent' && "bg-gray-500 text-white",
                  keyboard[key] === 'unused' && "bg-gray-200 hover:bg-gray-300"
                )}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1">
            <button
              onClick={() => handleKeyPress('ENTER')}
              className="px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
            >
              Enter
            </button>
            {'ZXCVBNM'.split('').map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={cn(
                  "px-3 py-2 rounded font-semibold transition-colors",
                  keyboard[key] === 'correct' && "bg-green-500 text-white",
                  keyboard[key] === 'present' && "bg-yellow-500 text-white",
                  keyboard[key] === 'absent' && "bg-gray-500 text-white",
                  keyboard[key] === 'unused' && "bg-gray-200 hover:bg-gray-300"
                )}
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('BACKSPACE')}
              className="px-3 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              ←
            </button>
          </div>
        </div>

        {/* Game Over Controls */}
        {gameState !== 'playing' && (
          <div className="mt-6 text-center">
            <Button onClick={resetGame} className="px-6 py-3">
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}