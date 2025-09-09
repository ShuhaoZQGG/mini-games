'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'

interface ColorButton {
  id: number
  color: string
  activeColor: string
  sound: number
}

const COLORS: ColorButton[] = [
  { id: 0, color: 'bg-red-500', activeColor: 'bg-red-300', sound: 261.63 },
  { id: 1, color: 'bg-blue-500', activeColor: 'bg-blue-300', sound: 329.63 },
  { id: 2, color: 'bg-yellow-500', activeColor: 'bg-yellow-300', sound: 392.00 },
  { id: 3, color: 'bg-green-500', activeColor: 'bg-green-300', sound: 523.25 },
]

interface PatternMemoryGameProps {
  levelConfig: {
    startLength: number
    increment: number
    speed: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Memory Warm-up',
    difficulty: 'easy',
    config: { startLength: 3, increment: 1, speed: 800 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Pattern Builder',
    difficulty: 'medium',
    config: { startLength: 4, increment: 2, speed: 600 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Quick Recall',
    difficulty: 'hard',
    config: { startLength: 5, increment: 2, speed: 400 },
    requiredStars: 4
  },
  {
    id: 4,
    name: 'Expert Memory',
    difficulty: 'expert',
    config: { startLength: 6, increment: 3, speed: 300 },
    requiredStars: 6
  },
  {
    id: 5,
    name: 'Master Mind',
    difficulty: 'master',
    config: { startLength: 7, increment: 3, speed: 200 },
    requiredStars: 8
  }
]

function PatternMemoryGame({ levelConfig, onScore }: PatternMemoryGameProps) {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver' | 'success'>('waiting')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [maxRounds] = useState(10) // Complete 10 rounds to win
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Play sound
  const playSound = useCallback((frequency: number, duration: number = 200) => {
    if (!soundEnabled || !audioContextRef.current) return
    
    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000)
    
    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000)
  }, [soundEnabled])

  // Generate initial sequence
  const generateInitialSequence = useCallback(() => {
    const initialSequence: number[] = []
    for (let i = 0; i < levelConfig.startLength; i++) {
      initialSequence.push(Math.floor(Math.random() * 4))
    }
    return initialSequence
  }, [levelConfig.startLength])

  // Add to sequence based on increment
  const addToSequence = useCallback(() => {
    const newButtons: number[] = []
    for (let i = 0; i < levelConfig.increment; i++) {
      newButtons.push(Math.floor(Math.random() * 4))
    }
    setSequence(prev => [...prev, ...newButtons])
  }, [levelConfig.increment])

  // Show sequence to player
  const showSequence = useCallback(async () => {
    setIsShowingSequence(true)
    setPlayerSequence([])
    
    const speed = levelConfig.speed
    
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => {
        sequenceTimerRef.current = setTimeout(() => {
          setActiveButton(sequence[i])
          playSound(COLORS[sequence[i]].sound)
          
          setTimeout(() => {
            setActiveButton(null)
            resolve(undefined)
          }, speed * 0.8)
        }, i === 0 ? 500 : speed * 0.2)
      })
    }
    
    setIsShowingSequence(false)
  }, [sequence, levelConfig.speed, playSound])

  // Handle button click
  const handleButtonClick = useCallback((buttonId: number) => {
    if (isShowingSequence || gameState !== 'playing') return
    
    const newPlayerSequence = [...playerSequence, buttonId]
    setPlayerSequence(newPlayerSequence)
    
    // Animate button
    setActiveButton(buttonId)
    playSound(COLORS[buttonId].sound)
    setTimeout(() => setActiveButton(null), 200)
    
    // Check if correct
    const currentIndex = newPlayerSequence.length - 1
    if (sequence[currentIndex] !== buttonId) {
      // Wrong button
      setShowFeedback('wrong')
      setTimeout(() => {
        setGameState('gameOver')
        onScore(score)
      }, 1000)
      return
    }
    
    // Check if sequence complete
    if (newPlayerSequence.length === sequence.length) {
      setShowFeedback('correct')
      const roundScore = sequence.length * 10 * round
      setScore(score + roundScore)
      
      setTimeout(() => {
        setShowFeedback(null)
        if (round >= maxRounds) {
          // Level complete!
          setGameState('success')
          onScore(score + roundScore + 1000) // Bonus for completing all rounds
        } else {
          // Next round
          setRound(round + 1)
          addToSequence()
          setTimeout(() => showSequence(), 1000)
        }
      }, 1000)
    }
  }, [isShowingSequence, gameState, playerSequence, sequence, playSound, score, round, maxRounds, onScore, addToSequence, showSequence])

  // Start game
  const startGame = useCallback(() => {
    const initialSeq = generateInitialSequence()
    setSequence(initialSeq)
    setPlayerSequence([])
    setScore(0)
    setRound(1)
    setGameState('playing')
    setShowFeedback(null)
    
    setTimeout(() => showSequence(), 500)
  }, [generateInitialSequence, showSequence])

  // Show sequence when it changes (but not on mount)
  useEffect(() => {
    if (gameState === 'playing' && sequence.length > 0 && playerSequence.length === 0 && !isShowingSequence) {
      showSequence()
    }
  }, [sequence, gameState, playerSequence.length, isShowingSequence, showSequence])

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-lg font-semibold">Round: {round}/{maxRounds}</div>
            <div className="text-lg font-semibold">Pattern: {sequence.length}</div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              size="sm"
              variant="outline"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {(gameState === 'gameOver' || gameState === 'success') && (
              <Button onClick={startGame} size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        {gameState === 'waiting' && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">Watch the pattern and repeat it!</p>
            <p className="text-sm">Complete {maxRounds} rounds to win</p>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'gameOver' || gameState === 'success') && (
          <>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleButtonClick(color.id)}
                  disabled={isShowingSequence || gameState !== 'playing'}
                  className={`
                    h-32 rounded-lg transition-all duration-200 transform
                    ${activeButton === color.id ? color.activeColor : color.color}
                    ${activeButton === color.id ? 'scale-95' : 'scale-100'}
                    ${isShowingSequence || gameState !== 'playing' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                  `}
                />
              ))}
            </div>

            {isShowingSequence && (
              <div className="text-center mt-6 text-gray-600">
                Watch carefully...
              </div>
            )}

            {!isShowingSequence && gameState === 'playing' && playerSequence.length === 0 && (
              <div className="text-center mt-6 text-gray-600">
                Your turn! Repeat the pattern
              </div>
            )}

            {showFeedback === 'correct' && (
              <div className="text-center mt-6 text-green-600 font-semibold">
                Correct! Well done! 🎉
              </div>
            )}

            {showFeedback === 'wrong' && (
              <div className="text-center mt-6 text-red-600 font-semibold">
                Wrong pattern! Try again
              </div>
            )}

            {gameState === 'gameOver' && !showFeedback && (
              <div className="text-center mt-6 text-red-600 font-semibold">
                Game Over! Final Score: {score}
              </div>
            )}

            {gameState === 'success' && (
              <div className="text-center mt-6 text-green-600 font-semibold">
                Level Complete! Amazing memory! 🏆
              </div>
            )}

            {gameState === 'playing' && !isShowingSequence && (
              <div className="mt-6 bg-gray-100 rounded-lg p-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress: {playerSequence.length}/{sequence.length}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function PatternMemoryWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    // Scoring based on pattern length and rounds
    if (score >= 3000) return 3
    if (score >= 1500) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="pattern-memory"
      gameName="Pattern Memory"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <PatternMemoryGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}