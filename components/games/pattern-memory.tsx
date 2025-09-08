'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Volume2, VolumeX, Zap, Clock } from 'lucide-react'

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

type GameMode = 'classic' | 'speed' | 'reverse' | 'blind'
type Difficulty = 'easy' | 'normal' | 'hard' | 'expert'

export default function PatternMemoryGame() {
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [gameMode, setGameMode] = useState<GameMode>('classic')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const sequenceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

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

  // Get speed based on difficulty
  const getSpeed = useCallback(() => {
    const speeds = {
      easy: 800,
      normal: 600,
      hard: 400,
      expert: 250
    }
    return gameMode === 'speed' ? speeds[difficulty] / 2 : speeds[difficulty]
  }, [difficulty, gameMode])

  // Generate next sequence
  const generateNextSequence = useCallback(() => {
    const newButton = Math.floor(Math.random() * 4)
    setSequence(prev => [...prev, newButton])
  }, [])

  // Show sequence to player
  const showSequence = useCallback(async () => {
    setIsShowingSequence(true)
    setPlayerSequence([])
    
    const speed = getSpeed()
    const sequenceToShow = gameMode === 'reverse' ? [...sequence].reverse() : sequence
    
    // Show each button in sequence
    for (let i = 0; i < sequenceToShow.length; i++) {
      await new Promise(resolve => {
        sequenceTimerRef.current = setTimeout(resolve, speed / 2)
      })
      
      if (gameMode !== 'blind' || i === sequenceToShow.length - 1) {
        setActiveButton(sequenceToShow[i])
        playSound(COLORS[sequenceToShow[i]].sound)
      }
      
      await new Promise(resolve => {
        sequenceTimerRef.current = setTimeout(resolve, speed)
      })
      
      setActiveButton(null)
    }
    
    setIsShowingSequence(false)
    
    // Start timer for speed mode
    if (gameMode === 'speed') {
      const timeLimit = 10 - Math.floor(level / 5)
      setTimeRemaining(timeLimit)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [sequence, gameMode, getSpeed, playSound, level])

  // Handle timeout in speed mode
  const handleTimeout = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setShowFeedback('wrong')
    setTimeout(() => {
      setGameState('gameOver')
      setShowFeedback(null)
    }, 1000)
  }, [])

  // Handle button click
  const handleButtonClick = useCallback((buttonId: number) => {
    if (isShowingSequence || gameState !== 'playing') return
    
    // Visual and audio feedback
    setActiveButton(buttonId)
    playSound(COLORS[buttonId].sound)
    setTimeout(() => setActiveButton(null), 200)
    
    const newPlayerSequence = [...playerSequence, buttonId]
    setPlayerSequence(newPlayerSequence)
    
    // Check if correct
    const expectedButton = gameMode === 'reverse' 
      ? sequence[sequence.length - newPlayerSequence.length]
      : sequence[newPlayerSequence.length - 1]
    
    if (buttonId !== expectedButton) {
      // Wrong button
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      setShowFeedback('wrong')
      playSound(200, 500) // Error sound
      
      setTimeout(() => {
        setGameState('gameOver')
        setShowFeedback(null)
      }, 1000)
      return
    }
    
    // Check if sequence complete
    if (newPlayerSequence.length === sequence.length) {
      // Correct sequence
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      setShowFeedback('correct')
      const points = sequence.length * (difficulty === 'easy' ? 5 : difficulty === 'normal' ? 10 : difficulty === 'hard' ? 15 : 20)
      setScore(prev => prev + points)
      setLevel(prev => prev + 1)
      
      setTimeout(() => {
        setShowFeedback(null)
        generateNextSequence()
        setTimeout(() => {
          showSequence()
        }, 1000)
      }, 1000)
    }
  }, [playerSequence, sequence, isShowingSequence, gameState, gameMode, difficulty, playSound, generateNextSequence, showSequence])

  // Start new sequence when game starts
  useEffect(() => {
    if (gameState === 'playing' && sequence.length > 0) {
      showSequence()
    }
  }, [sequence, gameState, showSequence])

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (sequenceTimerRef.current) {
        clearTimeout(sequenceTimerRef.current)
      }
    }
  }, [])

  const startGame = () => {
    setSequence([Math.floor(Math.random() * 4)])
    setPlayerSequence([])
    setScore(0)
    setLevel(1)
    setActiveButton(null)
    setIsShowingSequence(false)
    setShowFeedback(null)
    setGameState('playing')
  }

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    } else if (gameState === 'paused') {
      setGameState('playing')
      if (gameMode === 'speed' && !isShowingSequence) {
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              handleTimeout()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }
  }

  const resetGame = () => {
    setGameState('waiting')
    setSequence([])
    setPlayerSequence([])
    setActiveButton(null)
    setIsShowingSequence(false)
    setShowFeedback(null)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current)
    }
  }

  // Save high score
  useEffect(() => {
    if (gameState === 'gameOver') {
      const key = `pattern-memory-${gameMode}-${difficulty}-high-score`
      const highScore = localStorage.getItem(key)
      if (!highScore || score > parseInt(highScore)) {
        localStorage.setItem(key, score.toString())
      }
    }
  }, [gameState, score, gameMode, difficulty])

  const getHighScore = () => {
    if (typeof window !== 'undefined') {
      const key = `pattern-memory-${gameMode}-${difficulty}-high-score`
      return localStorage.getItem(key) || '0'
    }
    return '0'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <Card className="p-6 max-w-2xl w-full">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="text-lg font-semibold">
              Score: {score} | High Score: {getHighScore()}
            </div>
            <div className="text-lg font-semibold">
              Level: {level} | Pattern Length: {sequence.length}
            </div>
          </div>

          {/* Game mode and difficulty selectors */}
          {gameState === 'waiting' && (
            <div className="flex flex-col gap-4 w-full">
              <div>
                <label className="text-sm font-medium mb-2 block">Game Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    size="sm"
                    variant={gameMode === 'classic' ? 'default' : 'outline'}
                    onClick={() => setGameMode('classic')}
                  >
                    Classic
                  </Button>
                  <Button
                    size="sm"
                    variant={gameMode === 'speed' ? 'default' : 'outline'}
                    onClick={() => setGameMode('speed')}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Speed
                  </Button>
                  <Button
                    size="sm"
                    variant={gameMode === 'reverse' ? 'default' : 'outline'}
                    onClick={() => setGameMode('reverse')}
                  >
                    Reverse
                  </Button>
                  <Button
                    size="sm"
                    variant={gameMode === 'blind' ? 'default' : 'outline'}
                    onClick={() => setGameMode('blind')}
                  >
                    Blind
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    size="sm"
                    variant={difficulty === 'easy' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('easy')}
                  >
                    Easy
                  </Button>
                  <Button
                    size="sm"
                    variant={difficulty === 'normal' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('normal')}
                  >
                    Normal
                  </Button>
                  <Button
                    size="sm"
                    variant={difficulty === 'hard' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('hard')}
                  >
                    Hard
                  </Button>
                  <Button
                    size="sm"
                    variant={difficulty === 'expert' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('expert')}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Expert
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Game board */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 p-8 bg-gray-900 rounded-lg">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  className={`w-32 h-32 rounded-lg transition-all duration-200 ${
                    activeButton === color.id ? color.activeColor : color.color
                  } ${
                    isShowingSequence || gameState !== 'playing' 
                      ? 'cursor-not-allowed opacity-75' 
                      : 'cursor-pointer hover:opacity-90 active:scale-95'
                  } ${
                    gameMode === 'blind' && isShowingSequence && activeButton !== color.id
                      ? 'opacity-50'
                      : ''
                  }`}
                  onClick={() => handleButtonClick(color.id)}
                  disabled={isShowingSequence || gameState !== 'playing'}
                />
              ))}
            </div>

            {/* Status indicator */}
            {isShowingSequence && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg font-semibold">
                  Watch the pattern!
                </div>
              </div>
            )}

            {/* Feedback overlay */}
            {showFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`px-6 py-3 rounded-lg font-bold text-xl ${
                  showFeedback === 'correct' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {showFeedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
                </div>
              </div>
            )}

            {/* Timer for speed mode */}
            {gameMode === 'speed' && gameState === 'playing' && !isShowingSequence && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className={`text-lg font-bold ${
                  timeRemaining <= 3 ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Time: {timeRemaining}s
                </div>
              </div>
            )}
          </div>

          {/* Game state indicator */}
          {gameState === 'playing' && (
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isShowingSequence 
                  ? 'Memorize the pattern...' 
                  : gameMode === 'reverse'
                  ? 'Repeat the pattern in REVERSE order!'
                  : 'Repeat the pattern!'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Progress: {playerSequence.length} / {sequence.length}
              </div>
            </div>
          )}

          {/* Game over message */}
          {gameState === 'gameOver' && (
            <div className="text-center">
              <div className="text-xl font-bold text-red-500 mb-2">Game Over!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                You reached level {level} with a pattern of {sequence.length} buttons
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 mt-4">
            {gameState === 'waiting' && (
              <Button onClick={startGame} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
            )}
            {(gameState === 'playing' || gameState === 'paused') && (
              <>
                <Button onClick={togglePause} className="flex items-center gap-2">
                  {gameState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {gameState === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </>
            )}
            {gameState === 'gameOver' && (
              <>
                <Button onClick={startGame} className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  Menu
                </Button>
              </>
            )}
            
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="icon"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
            {gameMode === 'classic' && 'Watch and repeat the pattern in the same order'}
            {gameMode === 'speed' && 'Repeat the pattern quickly before time runs out!'}
            {gameMode === 'reverse' && 'Watch the pattern, then repeat it in reverse order'}
            {gameMode === 'blind' && 'Only the last button in the sequence is shown'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}