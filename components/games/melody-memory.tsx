'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Music3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Note {
  id: number
  pitch: number
  duration: number
  color: string
}

interface MelodyMemoryGameProps {
  levelConfig: {
    sequenceLength: number
    noteSpeed: number
    maxPitches: number
    playbackSpeed: number
    targetScore: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Musical Novice',
    difficulty: 'easy',
    config: { 
      sequenceLength: 4,
      noteSpeed: 1000,
      maxPitches: 4,
      playbackSpeed: 1,
      targetScore: 5
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Melody Student',
    difficulty: 'medium',
    config: { 
      sequenceLength: 6,
      noteSpeed: 800,
      maxPitches: 5,
      playbackSpeed: 1.2,
      targetScore: 8
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Harmony Expert',
    difficulty: 'hard',
    config: { 
      sequenceLength: 8,
      noteSpeed: 600,
      maxPitches: 6,
      playbackSpeed: 1.5,
      targetScore: 10
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Composer',
    difficulty: 'expert',
    config: { 
      sequenceLength: 10,
      noteSpeed: 500,
      maxPitches: 7,
      playbackSpeed: 1.8,
      targetScore: 12
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Maestro',
    difficulty: 'master',
    config: { 
      sequenceLength: 12,
      noteSpeed: 400,
      maxPitches: 8,
      playbackSpeed: 2,
      targetScore: 15
    },
    requiredStars: 14
  }
]

const NOTE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#FFA07A'
]

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C+']

function MelodyMemoryGame({ levelConfig, onScore }: MelodyMemoryGameProps) {
  const [sequence, setSequence] = useState<Note[]>([])
  const [playerSequence, setPlayerSequence] = useState<Note[]>([])
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'showing' | 'listening' | 'paused' | 'gameOver'>('ready')
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1)
  const [isCorrect, setIsCorrect] = useState(true)
  const [streak, setStreak] = useState(0)
  
  const gridRef = useRef<HTMLDivElement>(null)
  const playbackTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const nextIdRef = useRef(0)

  const generateSequence = useCallback(() => {
    const newSequence: Note[] = []
    for (let i = 0; i < levelConfig.sequenceLength; i++) {
      newSequence.push({
        id: nextIdRef.current++,
        pitch: Math.floor(Math.random() * levelConfig.maxPitches),
        duration: levelConfig.noteSpeed,
        color: NOTE_COLORS[Math.floor(Math.random() * levelConfig.maxPitches)]
      })
    }
    return newSequence
  }, [levelConfig])

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setRound(1)
    setStreak(0)
    nextIdRef.current = 0
    startNewRound()
  }, [])

  const startNewRound = useCallback(() => {
    const newSequence = generateSequence()
    setSequence(newSequence)
    setPlayerSequence([])
    setCurrentNoteIndex(-1)
    setGameState('showing')
    playSequence(newSequence)
  }, [generateSequence])

  const playSequence = useCallback((seq: Note[]) => {
    let index = 0
    
    const playNext = () => {
      if (index < seq.length) {
        setCurrentNoteIndex(index)
        playbackTimerRef.current = setTimeout(() => {
          index++
          if (index < seq.length) {
            playNext()
          } else {
            setCurrentNoteIndex(-1)
            setGameState('listening')
          }
        }, seq[index].duration / levelConfig.playbackSpeed)
      }
    }
    
    playNext()
  }, [levelConfig.playbackSpeed])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
    setRound(1)
    setSequence([])
    setPlayerSequence([])
    setCurrentNoteIndex(-1)
    setStreak(0)
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
    }
  }, [])

  const togglePause = useCallback(() => {
    if (gameState === 'playing' || gameState === 'listening') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('listening')
    }
  }, [gameState])

  const handleNoteClick = useCallback((pitch: number) => {
    if (gameState !== 'listening') return

    const noteIndex = playerSequence.length
    const correctNote = sequence[noteIndex]

    if (!correctNote) return

    const isNoteCorrect = correctNote.pitch === pitch
    const newNote: Note = {
      id: nextIdRef.current++,
      pitch,
      duration: levelConfig.noteSpeed,
      color: NOTE_COLORS[pitch]
    }

    setPlayerSequence(prev => [...prev, newNote])
    setCurrentNoteIndex(pitch)
    setTimeout(() => setCurrentNoteIndex(-1), 200)

    if (isNoteCorrect) {
      if (noteIndex === sequence.length - 1) {
        // Completed sequence
        const points = 100 * round + streak * 10
        setScore(prev => prev + points)
        setStreak(prev => prev + 1)
        
        if (round >= levelConfig.targetScore) {
          setGameState('gameOver')
          onScore(score + points)
        } else {
          setRound(prev => prev + 1)
          setTimeout(() => startNewRound(), 1000)
        }
      }
    } else {
      // Wrong note
      setIsCorrect(false)
      setStreak(0)
      setTimeout(() => {
        setIsCorrect(true)
        setPlayerSequence([])
        setGameState('showing')
        playSequence(sequence)
      }, 1000)
    }
  }, [gameState, playerSequence, sequence, levelConfig, round, streak, score, onScore, startNewRound, playSequence])

  // Clean up timers
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current)
      }
    }
  }, [])

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
                Round: <span className="text-primary">{round}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Streak: <span className="text-primary font-bold">x{streak}</span>
              </div>
              <div className="text-sm">
                Status: <span className={`font-bold ${
                  gameState === 'showing' ? 'text-yellow-500' :
                  gameState === 'listening' ? 'text-green-500' :
                  'text-muted-foreground'
                }`}>
                  {gameState === 'showing' ? 'Watch' :
                   gameState === 'listening' ? 'Your Turn' :
                   gameState === 'playing' ? 'Playing' :
                   gameState}
                </span>
              </div>
            </div>
          </div>

          <div 
            ref={gridRef}
            className="relative bg-gradient-to-b from-background to-muted rounded-lg p-8"
            style={{ minHeight: '400px' }}
          >
            {/* Note grid */}
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {Array.from({ length: levelConfig.maxPitches }).map((_, i) => (
                <motion.button
                  key={i}
                  className={`relative h-24 rounded-lg border-2 transition-all ${
                    currentNoteIndex === i || (gameState === 'showing' && sequence[currentNoteIndex]?.pitch === i)
                      ? 'scale-110 shadow-lg border-primary'
                      : 'border-border hover:border-primary/50'
                  } ${!isCorrect && playerSequence[playerSequence.length - 1]?.pitch === i ? 'bg-red-500/20' : ''}`}
                  style={{
                    backgroundColor: currentNoteIndex === i || (gameState === 'showing' && sequence[currentNoteIndex]?.pitch === i)
                      ? NOTE_COLORS[i]
                      : undefined
                  }}
                  onClick={() => handleNoteClick(i)}
                  disabled={gameState !== 'listening'}
                  whileHover={{ scale: gameState === 'listening' ? 1.05 : 1 }}
                  whileTap={{ scale: gameState === 'listening' ? 0.95 : 1 }}
                >
                  <span className="text-2xl font-bold">{NOTE_NAMES[i]}</span>
                  {currentNoteIndex === i && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 0] }}
                      transition={{ duration: 0.5 }}
                      style={{ backgroundColor: NOTE_COLORS[i] }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Sequence progress */}
            <div className="mt-8 flex justify-center gap-2">
              {sequence.map((note, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < playerSequence.length
                      ? playerSequence[i].pitch === note.pitch
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            {gameState === 'ready' && (
              <Button onClick={startGame} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Game
              </Button>
            )}
            {(gameState === 'playing' || gameState === 'listening') && (
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
                Rounds Completed: {round - 1} | Best Streak: x{streak}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Music3 className="h-5 w-5" />
            How to Play
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>" Watch the sequence of notes being played</li>
            <li>" Repeat the sequence by clicking the notes</li>
            <li>" Each round adds more notes to remember</li>
            <li>" Build streaks for bonus points</li>
            <li>" Complete all rounds to win!</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MelodyMemory() {
  const getStars = (score: number, config: any) => {
    const { targetScore } = config
    const maxScore = targetScore * 100
    if (score >= maxScore * 0.9) return 3 as const
    if (score >= maxScore * 0.6) return 2 as const
    return 1 as const
  }

  return (
    <GameWithLevels
      gameId="melody-memory"
      gameName="Melody Memory"
      levels={levels}
      renderGame={(config, onScore) => (
        <MelodyMemoryGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}