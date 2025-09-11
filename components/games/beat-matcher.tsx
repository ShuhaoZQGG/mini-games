'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Music2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Beat {
  id: number
  angle: number
  targetTime: number
  hit: boolean
  perfect: boolean
}

interface BeatMatcherGameProps {
  levelConfig: {
    bpm: number
    targetBeats: number
    patternLength: number
    tolerance: number
    gameTime: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Rhythm Beginner',
    difficulty: 'easy',
    config: { 
      bpm: 60,
      targetBeats: 20,
      patternLength: 4,
      tolerance: 200,
      gameTime: 60
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Beat Keeper',
    difficulty: 'medium',
    config: { 
      bpm: 90,
      targetBeats: 30,
      patternLength: 8,
      tolerance: 150,
      gameTime: 60
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Rhythm Expert',
    difficulty: 'hard',
    config: { 
      bpm: 120,
      targetBeats: 40,
      patternLength: 12,
      tolerance: 100,
      gameTime: 60
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Beat Master',
    difficulty: 'expert',
    config: { 
      bpm: 140,
      targetBeats: 50,
      patternLength: 16,
      tolerance: 75,
      gameTime: 60
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Rhythm Legend',
    difficulty: 'master',
    config: { 
      bpm: 160,
      targetBeats: 60,
      patternLength: 20,
      tolerance: 50,
      gameTime: 60
    },
    requiredStars: 14
  }
]

function BeatMatcherGame({ levelConfig, onScore }: BeatMatcherGameProps) {
  const [beats, setBeats] = useState<Beat[]>([])
  const [score, setScore] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [timeLeft, setTimeLeft] = useState(levelConfig.gameTime)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameOver'>('ready')
  const [streak, setStreak] = useState(0)
  const [perfectHits, setPerfectHits] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [showFeedback, setShowFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null)
  
  const wheelRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const beatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const countdownTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const nextIdRef = useRef(0)
  const beatTimestampRef = useRef(0)

  const beatInterval = 60000 / levelConfig.bpm // milliseconds per beat

  const generatePattern = useCallback(() => {
    const pattern: Beat[] = []
    const angleStep = 360 / levelConfig.patternLength
    
    for (let i = 0; i < levelConfig.patternLength; i++) {
      if (Math.random() > 0.3) { // 70% chance of having a beat
        pattern.push({
          id: nextIdRef.current++,
          angle: i * angleStep,
          targetTime: i * beatInterval,
          hit: false,
          perfect: false
        })
      }
    }
    return pattern
  }, [levelConfig.patternLength, beatInterval])

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(levelConfig.gameTime)
    setCurrentBeat(0)
    setStreak(0)
    setPerfectHits(0)
    setRotation(0)
    beatTimestampRef.current = Date.now()
    
    const pattern = generatePattern()
    setBeats(pattern)
  }, [levelConfig.gameTime, generatePattern])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
    setTimeLeft(levelConfig.gameTime)
    setBeats([])
    setCurrentBeat(0)
    setStreak(0)
    setPerfectHits(0)
    setRotation(0)
  }, [levelConfig.gameTime])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
      beatTimestampRef.current = Date.now()
    }
  }, [gameState])

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return

    const now = Date.now()
    const timeSinceStart = now - beatTimestampRef.current
    const currentRotation = (timeSinceStart / beatInterval * 360) % 360

    let hitBeat = false
    let isPerfect = false

    setBeats(prevBeats => {
      return prevBeats.map(beat => {
        if (beat.hit) return beat

        const angleDiff = Math.abs(currentRotation - beat.angle)
        const normalizedDiff = Math.min(angleDiff, 360 - angleDiff)

        if (normalizedDiff < 30) { // Within hit window
          hitBeat = true
          
          if (normalizedDiff < 10) { // Perfect hit
            isPerfect = true
            setPerfectHits(prev => prev + 1)
            setScore(prev => prev + 100 + streak * 10)
            setShowFeedback('perfect')
          } else {
            setScore(prev => prev + 50 + streak * 5)
            setShowFeedback('good')
          }
          
          setStreak(prev => prev + 1)
          
          setTimeout(() => setShowFeedback(null), 500)
          
          return { ...beat, hit: true, perfect: isPerfect }
        }
        return beat
      })
    })

    if (!hitBeat) {
      setStreak(0)
      setShowFeedback('miss')
      setTimeout(() => setShowFeedback(null), 500)
    }
  }, [gameState, beatInterval, streak])

  // Rotation animation
  useEffect(() => {
    if (gameState !== 'playing') return

    const animate = () => {
      const now = Date.now()
      const timeSinceStart = now - beatTimestampRef.current
      const newRotation = (timeSinceStart / beatInterval * 360) % 360
      setRotation(newRotation)

      // Check if pattern should repeat
      if (timeSinceStart > levelConfig.patternLength * beatInterval) {
        beatTimestampRef.current = now
        const newPattern = generatePattern()
        setBeats(newPattern)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, beatInterval, levelConfig.patternLength, generatePattern])

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing') {
      countdownTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver')
            onScore(score)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [gameState, score, onScore])

  // Check for win condition
  useEffect(() => {
    const hitBeats = beats.filter(b => b.hit).length
    if (hitBeats >= levelConfig.targetBeats) {
      setGameState('gameOver')
      onScore(score)
    }
  }, [beats, levelConfig.targetBeats, score, onScore])

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">
                Score: <span className="text-primary">{score}</span>
              </div>
              <div className="text-lg">
                Time: <span className="text-primary">{timeLeft}s</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Streak: <span className="text-primary font-bold">x{streak}</span>
              </div>
              <div className="text-sm">
                Perfect: <span className="text-yellow-500 font-bold">{perfectHits}</span>
              </div>
            </div>
          </div>

          <div 
            ref={wheelRef}
            className="relative bg-gradient-to-b from-background to-muted rounded-full"
            style={{ width: '400px', height: '400px', margin: '0 auto' }}
          >
            {/* Rhythm wheel */}
            <div className="absolute inset-4 rounded-full border-4 border-primary/20">
              {/* Beat markers */}
              {beats.map(beat => (
                <div
                  key={beat.id}
                  className={`absolute w-4 h-4 rounded-full transition-all duration-200 ${
                    beat.hit 
                      ? beat.perfect ? 'bg-yellow-500' : 'bg-green-500'
                      : 'bg-primary'
                  }`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `
                      translate(-50%, -50%) 
                      rotate(${beat.angle}deg) 
                      translateY(-150px)
                    `,
                    boxShadow: beat.hit ? '0 0 20px currentColor' : 'none'
                  }}
                />
              ))}

              {/* Rotating indicator */}
              <motion.div
                className="absolute inset-0"
                style={{
                  transform: `rotate(${rotation}deg)`
                }}
              >
                <div className="absolute w-1 bg-primary"
                  style={{
                    left: '50%',
                    top: '50%',
                    height: '150px',
                    transform: 'translate(-50%, -100%)'
                  }}
                />
                <div className="absolute w-8 h-8 bg-primary rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </motion.div>
            </div>

            {/* Center tap button */}
            <button
              className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-primary/10 hover:bg-primary/20 border-2 border-primary transition-all active:scale-95"
              onClick={handleTap}
              disabled={gameState !== 'playing'}
            >
              <span className="text-2xl font-bold">TAP</span>
            </button>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className={`absolute inset-0 m-auto w-32 h-32 rounded-full flex items-center justify-center pointer-events-none ${
                    showFeedback === 'perfect' ? 'text-yellow-500' :
                    showFeedback === 'good' ? 'text-green-500' :
                    'text-red-500'
                  }`}
                >
                  <span className="text-3xl font-bold uppercase">
                    {showFeedback}!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-4">
            <div className="text-sm text-muted-foreground">
              Beats Hit: {beats.filter(b => b.hit).length}/{levelConfig.targetBeats}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            {gameState === 'ready' && (
              <Button onClick={startGame} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Game
              </Button>
            )}
            {gameState === 'playing' && (
              <Button onClick={togglePause} variant="outline" size="lg">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {gameState === 'paused' && (
              <Button onClick={togglePause} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {(gameState === 'gameOver' || gameState === 'paused') && (
              <Button onClick={resetGame} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Game
              </Button>
            )}
          </div>

          {gameState === 'gameOver' && (
            <div className="text-center mt-4">
              <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
              <p className="text-lg">
                Final Score: <span className="text-primary font-bold">{score}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Perfect Hits: {perfectHits} | Best Streak: x{streak}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            How to Play
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tap when the rotating line reaches a beat marker</li>
            <li>• Perfect timing gives bonus points</li>
            <li>• Build streaks for score multipliers</li>
            <li>• Hit the target number of beats to win</li>
            <li>• BPM increases with each level</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BeatMatcher() {
  const getStars = (score: number, config: any) => {
    const { targetBeats } = config
    const targetScore = targetBeats * 100
    if (score >= targetScore * 0.9) return 3 as const
    if (score >= targetScore * 0.6) return 2 as const
    return 1 as const
  }

  return (
    <GameWithLevels
      gameId="beat-matcher"
      gameName="Beat Matcher"
      levels={levels}
      renderGame={(config, onScore) => (
        <BeatMatcherGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}