'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlayCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface ColorButton {
  color: string
  sound: number
  active: boolean
}

interface SimonSaysGameProps {
  levelConfig: {
    buttonCount: number
    initialSpeed: number // milliseconds between sequences
    speedIncrease: number // speed increase per round
    targetLength: number // target sequence length to achieve
    showTimeLimit: number // time to show each button in sequence
    responseTimeLimit: number // time limit to respond (0 for unlimited)
    targetScore: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Memory Training',
    difficulty: 'easy',
    config: {
      buttonCount: 4,
      initialSpeed: 600,
      speedIncrease: 0,
      targetLength: 8,
      showTimeLimit: 400,
      responseTimeLimit: 0,
      targetScore: 800
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Pattern Master',
    difficulty: 'medium',
    config: {
      buttonCount: 4,
      initialSpeed: 500,
      speedIncrease: 10,
      targetLength: 12,
      showTimeLimit: 350,
      responseTimeLimit: 5000,
      targetScore: 1500
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Speed Challenge',
    difficulty: 'hard',
    config: {
      buttonCount: 6,
      initialSpeed: 400,
      speedIncrease: 15,
      targetLength: 15,
      showTimeLimit: 300,
      responseTimeLimit: 4000,
      targetScore: 2500
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Memory',
    difficulty: 'expert',
    config: {
      buttonCount: 8,
      initialSpeed: 350,
      speedIncrease: 20,
      targetLength: 18,
      showTimeLimit: 250,
      responseTimeLimit: 3000,
      targetScore: 3500
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Mind',
    difficulty: 'master',
    config: {
      buttonCount: 9,
      initialSpeed: 300,
      speedIncrease: 25,
      targetLength: 20,
      showTimeLimit: 200,
      responseTimeLimit: 2500,
      targetScore: 5000
    },
    requiredStars: 12
  }
]

function SimonSaysCore({ levelConfig, onScore }: SimonSaysGameProps) {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [level, setLevel] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [score, setScore] = useState(0)
  const [responseTimer, setResponseTimer] = useState<NodeJS.Timeout | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)

  // Generate buttons based on level config
  const generateButtons = (): ColorButton[] => {
    const colors = [
      { color: 'bg-red-500', sound: 261.63 },
      { color: 'bg-blue-500', sound: 329.63 },
      { color: 'bg-yellow-500', sound: 392.00 },
      { color: 'bg-green-500', sound: 523.25 },
      { color: 'bg-purple-500', sound: 440.00 },
      { color: 'bg-orange-500', sound: 493.88 },
      { color: 'bg-pink-500', sound: 554.37 },
      { color: 'bg-cyan-500', sound: 587.33 },
      { color: 'bg-indigo-500', sound: 659.25 }
    ]
    
    return colors.slice(0, levelConfig.buttonCount).map(c => ({
      ...c,
      active: false
    }))
  }

  const [buttons, setButtons] = useState<ColorButton[]>(generateButtons())

  useEffect(() => {
    setButtons(generateButtons())
  }, [levelConfig.buttonCount])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (responseTimer) {
        clearTimeout(responseTimer)
      }
    }
  }, [])

  const playSound = useCallback((frequency: number) => {
    if (!soundEnabled || !audioContextRef.current) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5)
    
    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + 0.5)
  }, [soundEnabled])

  const calculateScore = useCallback(() => {
    let baseScore = level * 100
    
    // Speed bonus
    const speedBonus = Math.floor((levelConfig.initialSpeed - (level * levelConfig.speedIncrease)) / 10)
    baseScore += speedBonus
    
    // Perfect game bonus
    if (level >= levelConfig.targetLength) {
      baseScore += 500
    }
    
    // Button complexity bonus
    baseScore += (levelConfig.buttonCount - 4) * 50
    
    return baseScore
  }, [level, levelConfig])

  const startGame = () => {
    setSequence([])
    setPlayerSequence([])
    setLevel(0)
    setScore(0)
    setIsPlaying(true)
    setTimeout(() => nextRound(), 1000)
  }

  const nextRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * levelConfig.buttonCount)]
    setSequence(newSequence)
    setLevel(newSequence.length)
    setPlayerSequence([])
    showSequence(newSequence)
  }

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true)
    
    if (responseTimer) {
      clearTimeout(responseTimer)
    }
    
    const speed = Math.max(100, levelConfig.initialSpeed - (seq.length * levelConfig.speedIncrease))
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speed))
      activateButton(seq[i])
    }
    
    setIsShowingSequence(false)
    
    // Start response timer if configured
    if (levelConfig.responseTimeLimit > 0) {
      setTimeRemaining(levelConfig.responseTimeLimit)
      const timer = setTimeout(() => {
        gameOver()
      }, levelConfig.responseTimeLimit)
      setResponseTimer(timer)
    }
  }

  const activateButton = (index: number) => {
    setButtons(prev => {
      const newButtons = [...prev]
      newButtons[index].active = true
      return newButtons
    })
    
    playSound(buttons[index].sound)
    
    setTimeout(() => {
      setButtons(prev => {
        const newButtons = [...prev]
        newButtons[index].active = false
        return newButtons
      })
    }, levelConfig.showTimeLimit)
  }

  const handleButtonClick = (index: number) => {
    if (!isPlaying || isShowingSequence) return
    
    activateButton(index)
    
    const newPlayerSequence = [...playerSequence, index]
    setPlayerSequence(newPlayerSequence)
    
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      gameOver()
      return
    }
    
    if (newPlayerSequence.length === sequence.length) {
      // Clear response timer
      if (responseTimer) {
        clearTimeout(responseTimer)
        setResponseTimer(null)
      }
      
      if (level > highScore) {
        setHighScore(level)
      }
      
      const currentScore = calculateScore()
      setScore(currentScore)
      
      // Check if target length reached
      if (level >= levelConfig.targetLength) {
        setIsPlaying(false)
        onScore(currentScore)
      } else {
        setTimeout(() => {
          setSequence([...sequence, Math.floor(Math.random() * levelConfig.buttonCount)])
          nextRound()
        }, 1000)
      }
    }
  }

  const gameOver = () => {
    setIsPlaying(false)
    
    // Clear response timer
    if (responseTimer) {
      clearTimeout(responseTimer)
      setResponseTimer(null)
    }
    
    const finalScore = calculateScore()
    setScore(finalScore)
    onScore(finalScore)
    
    if (soundEnabled && audioContextRef.current) {
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      oscillator.frequency.value = 100
      oscillator.type = 'sawtooth'
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 1)
      
      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + 1)
    }
  }

  // Update time remaining display
  useEffect(() => {
    if (responseTimer && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 100))
      }, 100)
      
      return () => clearInterval(interval)
    }
  }, [responseTimer, timeRemaining])

  const getGridCols = () => {
    if (levelConfig.buttonCount <= 4) return 'grid-cols-2'
    if (levelConfig.buttonCount <= 6) return 'grid-cols-3'
    return 'grid-cols-3'
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Simon Says</h2>
        <p className="text-gray-600 mb-4">
          Watch the pattern and repeat it! Target: {levelConfig.targetLength} steps
        </p>
        
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{level}</div>
            <div className="text-sm text-gray-600">Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{highScore}</div>
            <div className="text-sm text-gray-600">Best</div>
          </div>
        </div>

        {levelConfig.responseTimeLimit > 0 && isPlaying && !isShowingSequence && (
          <div className="mb-4">
            <div className="text-sm text-gray-600">Time Remaining</div>
            <div className={`text-2xl font-bold ${timeRemaining < 1000 ? 'text-red-500' : ''}`}>
              {(timeRemaining / 1000).toFixed(1)}s
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          {!isPlaying ? (
            <Button onClick={startGame} size="lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button onClick={() => setIsPlaying(false)} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            size="lg"
            variant="outline"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <div className={`grid ${getGridCols()} gap-4 max-w-md mx-auto`}>
        {buttons.map((button, index) => (
          <button
            key={index}
            className={`
              aspect-square rounded-lg transition-all duration-200
              ${button.color}
              ${button.active ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-80'}
              ${!isPlaying || isShowingSequence ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => handleButtonClick(index)}
            disabled={!isPlaying || isShowingSequence}
          />
        ))}
      </div>

      {!isPlaying && level > 0 && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold">
            {level >= levelConfig.targetLength 
              ? `Congratulations! You completed all ${levelConfig.targetLength} steps!`
              : `Game Over! You reached level ${level}`}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Final Score: {score}
          </p>
        </div>
      )}

      {isShowingSequence && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold animate-pulse">
            Watch carefully...
          </p>
        </div>
      )}

      {isPlaying && !isShowingSequence && (
        <div className="text-center mt-8">
          <p className="text-lg font-semibold">
            Your turn! Repeat the pattern
          </p>
        </div>
      )}
    </Card>
  )
}

export default function SimonSaysWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="simon-says"
      gameName="Simon Says"
      levels={levels}
      renderGame={(config, onScore) => <SimonSaysCore levelConfig={config} onScore={onScore} />}
      getStars={getStars}
    />
  )
}