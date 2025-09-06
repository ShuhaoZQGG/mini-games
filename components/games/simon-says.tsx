'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SimonSaysGame, Color, GameSpeed, GameState } from '@/lib/games/simon-says'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import { scoreService } from '@/lib/services/scores'
import { Volume2, VolumeX, Zap } from 'lucide-react'

export function SimonSaysComponent() {
  const [game] = useState(() => new SimonSaysGame())
  const [gameState, setGameState] = useState<GameState>(GameState.Ready)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState<GameSpeed>(GameSpeed.Normal)
  const [activeColor, setActiveColor] = useState<Color | null>(null)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [bestScore, setBestScore] = useState<number | null>(null)
  
  const audioContext = useRef<AudioContext | null>(null)
  const oscillator = useRef<OscillatorNode | null>(null)

  const colorTones: Record<Color, number> = {
    [Color.Red]: 329.63,    // E4
    [Color.Blue]: 392.00,   // G4
    [Color.Green]: 261.63,  // C4
    [Color.Yellow]: 493.88  // B4
  }

  const colorStyles: Record<Color, string> = {
    [Color.Red]: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    [Color.Blue]: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    [Color.Green]: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    [Color.Yellow]: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700'
  }

  const activeColorStyles: Record<Color, string> = {
    [Color.Red]: 'bg-red-300 ring-4 ring-red-400 scale-105',
    [Color.Blue]: 'bg-blue-300 ring-4 ring-blue-400 scale-105',
    [Color.Green]: 'bg-green-300 ring-4 ring-green-400 scale-105',
    [Color.Yellow]: 'bg-yellow-300 ring-4 ring-yellow-400 scale-105'
  }

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined' && soundEnabled) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [soundEnabled])

  const playSound = useCallback((frequency: number, duration: number = 200) => {
    if (!soundEnabled || !audioContext.current) return
    
    try {
      const osc = audioContext.current.createOscillator()
      const gain = audioContext.current.createGainNode()
      
      osc.connect(gain)
      gain.connect(audioContext.current.destination)
      
      osc.frequency.value = frequency
      osc.type = 'sine'
      
      gain.gain.setValueAtTime(0.3, audioContext.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration / 1000)
      
      osc.start(audioContext.current.currentTime)
      osc.stop(audioContext.current.currentTime + duration / 1000)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [soundEnabled])

  const playErrorSound = useCallback(() => {
    if (!soundEnabled || !audioContext.current) return
    
    try {
      const osc = audioContext.current.createOscillator()
      const gain = audioContext.current.createGainNode()
      
      osc.connect(gain)
      gain.connect(audioContext.current.destination)
      
      osc.frequency.value = 150
      osc.type = 'sawtooth'
      
      gain.gain.setValueAtTime(0.3, audioContext.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5)
      
      osc.start(audioContext.current.currentTime)
      osc.stop(audioContext.current.currentTime + 0.5)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [soundEnabled])

  useEffect(() => {
    game.setSequenceCallback((color, isActive) => {
      if (isActive && color) {
        setActiveColor(color)
        setIsShowingSequence(true)
        playSound(colorTones[color], game.getDisplayTime())
      } else {
        setActiveColor(null)
        if (!color) {
          setIsShowingSequence(false)
        }
      }
    })

    game.setGameOverCallback(async (finalScore, finalLevel) => {
      await scoreService.saveScore('simon-says', finalScore, {
        level: finalLevel,
        speed: game.getSpeed()
      })
      
      if (!bestScore || finalScore > bestScore) {
        setBestScore(finalScore)
      }
      
      playErrorSound()
    })

    game.setSoundCallback((color, isCorrect) => {
      if (isCorrect) {
        playSound(colorTones[color], 200)
      } else {
        playErrorSound()
      }
    })
  }, [game, playSound, playErrorSound, bestScore])

  const handleStart = () => {
    game.setSpeed(speed)
    game.start()
    updateState()
  }

  const handleColorClick = (color: Color) => {
    if (gameState !== GameState.PlayerInput) return
    
    setActiveColor(color)
    setTimeout(() => setActiveColor(null), 200)
    
    const correct = game.handleInput(color)
    updateState()
    
    if (!correct) {
      // Flash all colors red briefly on error
      setTimeout(() => {
        setActiveColor(null)
      }, 500)
    }
  }

  const handleReset = () => {
    game.reset()
    updateState()
  }

  const handleSpeedChange = (newSpeed: GameSpeed) => {
    setSpeed(newSpeed)
    game.setSpeed(newSpeed)
  }

  const updateState = () => {
    setGameState(game.getState())
    setScore(game.getScore())
    setLevel(game.getLevel())
    setHighScore(game.getHighScore())
  }

  const renderColorButton = (color: Color) => {
    const isActive = activeColor === color
    const isDisabled = gameState === GameState.ShowingSequence || gameState === GameState.GameOver
    
    return (
      <button
        key={color}
        onClick={() => handleColorClick(color)}
        disabled={isDisabled}
        className={`
          w-32 h-32 md:w-40 md:h-40 rounded-2xl transition-all duration-200 transform
          ${isActive ? activeColorStyles[color] : colorStyles[color]}
          ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          shadow-lg
        `}
        aria-label={`${color} button`}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <UICard>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Simon Says</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-2xl font-bold">{level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Score</p>
              <p className="text-2xl font-bold">{highScore}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best</p>
              <p className="text-2xl font-bold">{bestScore ?? '-'}</p>
            </div>
          </div>

          {gameState === GameState.Ready && (
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleSpeedChange(GameSpeed.Slow)}
                  variant={speed === GameSpeed.Slow ? 'default' : 'outline'}
                  size="sm"
                >
                  Slow
                </Button>
                <Button
                  onClick={() => handleSpeedChange(GameSpeed.Normal)}
                  variant={speed === GameSpeed.Normal ? 'default' : 'outline'}
                  size="sm"
                >
                  Normal
                </Button>
                <Button
                  onClick={() => handleSpeedChange(GameSpeed.Fast)}
                  variant={speed === GameSpeed.Fast ? 'default' : 'outline'}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Fast
                </Button>
                <Button
                  onClick={() => handleSpeedChange(GameSpeed.Expert)}
                  variant={speed === GameSpeed.Expert ? 'default' : 'outline'}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  <Zap className="w-4 h-4 -ml-2" />
                  Expert
                </Button>
              </div>
              
              <Button onClick={handleStart} size="lg">
                Start Game
              </Button>
              
              <div>
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="ghost"
                  size="sm"
                >
                  {soundEnabled ? (
                    <><Volume2 className="w-4 h-4 mr-1" /> Sound On</>
                  ) : (
                    <><VolumeX className="w-4 h-4 mr-1" /> Sound Off</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {(gameState === GameState.ShowingSequence || gameState === GameState.PlayerInput || gameState === GameState.LevelComplete) && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {gameState === GameState.ShowingSequence ? 'Watch the sequence!' : 
                   gameState === GameState.LevelComplete ? 'Level Complete!' : 
                   'Your turn!'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                {renderColorButton(Color.Red)}
                {renderColorButton(Color.Blue)}
                {renderColorButton(Color.Green)}
                {renderColorButton(Color.Yellow)}
              </div>
            </div>
          )}

          {gameState === GameState.GameOver && (
            <div className="text-center space-y-4">
              <div className="bg-red-100 dark:bg-red-900 rounded-lg p-6">
                <p className="text-2xl mb-2">Game Over!</p>
                <p className="text-lg mb-2">You reached level {level}</p>
                <p className="text-3xl font-bold mb-1">Score: {score}</p>
                {score === highScore && score > 0 && (
                  <p className="text-lg text-green-600 dark:text-green-400">New High Score!</p>
                )}
              </div>
              
              <ShareCard
                gameTitle="Simon Says"
                gameSlug="simon-says"
                score={score}
                metadata={{ level }}
              />
              
              <div className="space-x-4">
                <Button onClick={handleStart} size="lg">
                  Play Again
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
              <li>• Watch the sequence of colors carefully</li>
              <li>• Repeat the sequence by clicking the colored buttons</li>
              <li>• Each level adds one more color to the sequence</li>
              <li>• Choose your speed before starting (faster = more points)</li>
              <li>• See how many levels you can complete!</li>
              <li>• Test your memory and reaction time</li>
            </ul>
          </div>
        </CardContent>
      </UICard>
    </div>
  )
}