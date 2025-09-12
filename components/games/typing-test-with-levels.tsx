'use client'

import { useState, useEffect, useRef } from 'react'
import { TypingTestGame, TypingStats } from '@/lib/games/typing-test'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import GameWithLevels from '@/components/ui/game-with-levels'

const levels = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy' as const,
    config: {
      duration: 60000,
      minWPM: 25,
      wordDifficulty: 'easy'
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium' as const,
    config: {
      duration: 60000,
      minWPM: 40,
      wordDifficulty: 'medium'
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard' as const,
    config: {
      duration: 60000,
      minWPM: 55,
      wordDifficulty: 'hard'
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert' as const,
    config: {
      duration: 45000,
      minWPM: 70,
      wordDifficulty: 'hard'
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Typist',
    difficulty: 'master' as const,
    config: {
      duration: 30000,
      minWPM: 80,
      wordDifficulty: 'expert'
    },
    requiredStars: 12
  }
]

export function TypingTestWithLevels() {
  const getStars = (wpm: number, levelConfig: any): 1 | 2 | 3 => {
    const { minWPM } = levelConfig
    if (wpm >= minWPM * 1.5) return 3
    if (wpm >= minWPM * 1.2) return 2
    if (wpm >= minWPM) return 1
    return 1
  }

  const renderGame = (levelConfig: any, onScore: (score: number) => void) => {
    return <TypingTestLevel levelConfig={levelConfig} onScore={onScore} />
  }

  return (
    <GameWithLevels
      gameId="typing-test"
      gameName="Typing Test"
      levels={levels}
      renderGame={renderGame}
      getStars={getStars}
    />
  )
}

function TypingTestLevel({ 
  levelConfig, 
  onScore 
}: { 
  levelConfig: any
  onScore: (score: number) => void 
}) {
  const [game] = useState(() => new TypingTestGame(levelConfig.duration))
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
  })
  const [timeLeft, setTimeLeft] = useState(levelConfig.duration)
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
      onScore(stats.wpm)
      if (stats.wpm > highScore) {
        setHighScore(stats.wpm)
      }
    })
  }, [game, highScore, onScore])

  const handleStart = () => {
    game.start()
    setText(game.getText())
    setTypedText('')
    setTimeLeft(levelConfig.duration)
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
    setTimeLeft(levelConfig.duration)
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
        if (typedText[index] === text[index]) {
          className = 'text-green-600 dark:text-green-400'
        } else {
          className = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
        }
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      )
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Typing Test - Level {levelConfig.minWPM} WPM Target</span>
            <span className="text-2xl font-mono">{formatTime(timeLeft)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.wpm}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.accuracy}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.correctChars}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Characters</div>
            </div>
          </div>

          {!isPlaying && !isGameOver && (
            <div className="text-center">
              <Button onClick={handleStart} size="lg" className="px-8">
                Start Typing Test
              </Button>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Type the text as fast and accurately as you can. Target: {levelConfig.minWPM} WPM
              </p>
            </div>
          )}

          {(isPlaying || isGameOver) && (
            <div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-lg leading-relaxed select-none">
                {renderText()}
              </div>
              
              <input
                ref={inputRef}
                type="text"
                className="sr-only"
                onKeyDown={handleKeyDown}
                disabled={!isPlaying || isGameOver}
                autoFocus
              />
              
              {isPlaying && (
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Keep typing! Click on the text area if you lose focus.
                </p>
              )}
            </div>
          )}

          {isGameOver && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Test Complete!</h3>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.wpm}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Words Per Minute
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {stats.accuracy}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Accuracy
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {stats.correctChars}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Characters Typed
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {stats.wpm >= levelConfig.minWPM 
                        ? `Great job! You reached the target of ${levelConfig.minWPM} WPM!` 
                        : `Keep practicing! Target was ${levelConfig.minWPM} WPM.`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleReset} variant="outline">
                  Try Again
                </Button>
                <ShareCard
                  score={stats.wpm}
                  gameTitle="Typing Test"
                  gameSlug="typing-test"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}