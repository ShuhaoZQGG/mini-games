'use client'

import { useState, useEffect, useRef } from 'react'
import { TypingTestGame, TypingStats } from '@/lib/games/typing-test'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'

export function TypingTestComponent() {
  const [game] = useState(() => new TypingTestGame(60000))
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
  })
  const [timeLeft, setTimeLeft] = useState(60000)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [text, setText] = useState('')
  const [typedText, setTypedText] = useState('')
  const [highScore, setHighScore] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    game.setUpdateCallback((stats, timeLeft) => {
      setStats(stats)
      setTimeLeft(timeLeft)
      setTypedText(game.getTypedText())
    })

    game.setCompleteCallback((stats) => {
      setStats(stats)
      setIsGameOver(true)
      setIsPlaying(false)
      if (stats.wpm > highScore) {
        setHighScore(stats.wpm)
      }
    })
  }, [game, highScore])

  const handleStart = () => {
    game.start()
    setText(game.getText())
    setTypedText('')
    setTimeLeft(60000)
    setIsPlaying(true)
    setIsGameOver(false)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
    })
    
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPlaying || isGameOver) return
    
    e.preventDefault()
    
    if (e.key === 'Backspace') {
      game.handleInput('Backspace')
    } else if (e.key.length === 1) {
      game.handleInput(e.key)
    }
  }

  const handleReset = () => {
    game.reset()
    setText('')
    setTypedText('')
    setTimeLeft(60000)
    setIsPlaying(false)
    setIsGameOver(false)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
    })
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const renderText = () => {
    return text.split('').map((char, index) => {
      let className = 'text-gray-600 dark:text-gray-400'
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className = 'text-green-600 dark:text-green-400'
        } else {
          className = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
        }
      } else if (index === typedText.length) {
        className = 'bg-primary text-white px-1 animate-pulse'
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      )
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Typing Speed Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">WPM</p>
              <p className="text-2xl font-bold">{stats.wpm}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
              <p className="text-2xl font-bold">{stats.accuracy}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
              <p className="text-2xl font-bold">{formatTime(timeLeft)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best WPM</p>
              <p className="text-2xl font-bold">{highScore}</p>
            </div>
          </div>

          {!isPlaying && !isGameOver && (
            <div className="text-center">
              <Button onClick={handleStart} size="lg">
                Start Test
              </Button>
            </div>
          )}

          {(isPlaying || isGameOver) && (
            <div className="space-y-4">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-lg leading-relaxed">
                {renderText()}
              </div>
              
              <input
                ref={inputRef}
                type="text"
                className="sr-only"
                onKeyDown={handleKeyDown}
                value=""
                onChange={() => {}}
                disabled={!isPlaying || isGameOver}
              />
              
              {isPlaying && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Start typing to begin. Press Backspace to correct mistakes.
                </p>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="text-center space-y-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-6">
                <p className="text-2xl mb-2">Test Complete!</p>
                <div className="grid grid-cols-2 gap-4 text-left max-w-xs mx-auto">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Speed:</p>
                    <p className="text-xl font-bold">{stats.wpm} WPM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy:</p>
                    <p className="text-xl font-bold">{stats.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Correct:</p>
                    <p className="text-xl font-bold">{stats.correctChars}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Errors:</p>
                    <p className="text-xl font-bold">{stats.incorrectChars}</p>
                  </div>
                </div>
              </div>
              <ShareCard
                gameTitle="Typing Test"
                gameSlug="typing-test"
                score={stats.wpm}
                accuracy={stats.accuracy}
              />
              <div className="space-x-4">
                <Button onClick={handleStart} size="lg">
                  Try Again
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  Reset
                </Button>
              </div>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">How to Play:</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Click Start Test to begin</li>
              <li>• Type the displayed text as accurately as possible</li>
              <li>• Press Backspace to correct mistakes</li>
              <li>• Your WPM (Words Per Minute) and accuracy are calculated</li>
              <li>• Try to beat your high score!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}