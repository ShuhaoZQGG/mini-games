'use client'

import { useState, useEffect, useRef } from 'react'
import { CPSTestGame } from '@/lib/games/cps-test'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CPSTestComponent() {
  const [game] = useState(() => new CPSTestGame(10000))
  const [clicks, setClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10000)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [finalCPS, setFinalCPS] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const clickAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    game.setUpdateCallback((clicks, timeLeft) => {
      setClicks(clicks)
      setTimeLeft(timeLeft)
    })

    game.setCompleteCallback((cps) => {
      setFinalCPS(cps)
      setIsGameOver(true)
      setIsPlaying(false)
      if (cps > highScore) {
        setHighScore(cps)
      }
    })
  }, [game, highScore])

  const handleStart = () => {
    setClicks(0)
    setTimeLeft(10000)
    setIsGameOver(false)
    setIsPlaying(true)
    setFinalCPS(0)
    game.start()
  }

  const handleClick = () => {
    if (isPlaying && !isGameOver) {
      game.handleInput('click')
    }
  }

  const handleReset = () => {
    game.reset()
    setClicks(0)
    setTimeLeft(10000)
    setIsPlaying(false)
    setIsGameOver(false)
    setFinalCPS(0)
  }

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1)
  }

  const currentCPS = isPlaying ? game.getCPS() : finalCPS

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-center">CPS Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clicks</p>
              <p className="text-2xl font-bold">{clicks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Left</p>
              <p className="text-2xl font-bold">{formatTime(timeLeft)}s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">CPS</p>
              <p className="text-2xl font-bold">{currentCPS}</p>
            </div>
          </div>

          <div
            ref={clickAreaRef}
            className={`
              relative h-64 md:h-96 rounded-lg flex items-center justify-center cursor-pointer
              transition-all duration-200 select-none
              ${isPlaying && !isGameOver 
                ? 'bg-primary hover:bg-indigo-700 active:scale-95' 
                : 'bg-gray-200 dark:bg-gray-700'
              }
            `}
            onClick={handleClick}
            onMouseDown={(e) => e.preventDefault()}
          >
            {!isPlaying && !isGameOver && (
              <div className="text-center">
                <p className="text-xl mb-4">Click Start to begin</p>
                <Button onClick={handleStart} size="lg">
                  Start Test
                </Button>
              </div>
            )}
            
            {isPlaying && !isGameOver && (
              <div className="text-white text-center">
                <p className="text-4xl font-bold mb-2">Click here!</p>
                <p className="text-xl">As fast as you can</p>
              </div>
            )}
            
            {isGameOver && (
              <div className="text-center">
                <p className="text-2xl mb-2">Game Over!</p>
                <p className="text-4xl font-bold mb-4">{finalCPS} CPS</p>
                <p className="text-lg mb-4">High Score: {highScore} CPS</p>
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
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">How to Play:</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Click the Start button to begin the test</li>
              <li>• Click as fast as you can in the blue area</li>
              <li>• The test lasts for 10 seconds</li>
              <li>• Your CPS (Clicks Per Second) will be calculated</li>
              <li>• Try to beat your high score!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}