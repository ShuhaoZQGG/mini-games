'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WhackAMoleGame, HoleContent, PowerUp, GameState, Difficulty } from '@/lib/games/whack-a-mole'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import { scoreService } from '@/lib/services/scores'
import { Heart, Zap, Clock, Target, Bomb } from 'lucide-react'

export function WhackAMoleComponent() {
  const [game] = useState(() => new WhackAMoleGame())
  const [gameState, setGameState] = useState<GameState>(GameState.Ready)
  const [holes, setHoles] = useState(game.getHoles())
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [combo, setCombo] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Normal)
  const [activePowerUp, setActivePowerUp] = useState<PowerUp | null>(null)
  const [highScore, setHighScore] = useState(0)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [hitAnimation, setHitAnimation] = useState<number | null>(null)
  const [scorePopups, setScorePopups] = useState<{ id: number; points: number; x: number; y: number }[]>([])
  
  const updateInterval = useRef<NodeJS.Timeout | null>(null)
  const popupId = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const updateGameState = useCallback(() => {
    setGameState(game.getState())
    setHoles([...game.getHoles()])
    setScore(game.getScore())
    setLevel(game.getLevel())
    setLives(game.getLives())
    setCombo(game.getCombo())
    setTimeRemaining(game.getTimeRemaining())
    setActivePowerUp(game.getActivePowerUp())
    setHighScore(game.getHighScore())
  }, [game])

  useEffect(() => {
    if (gameState === GameState.Playing) {
      updateInterval.current = setInterval(updateGameState, 100)
    }
    
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
    }
  }, [gameState, updateGameState])

  const handleStart = () => {
    game.setDifficulty(difficulty)
    game.start()
    updateGameState()
  }

  const handleWhack = async (holeIndex: number, event?: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== GameState.Playing) return
    
    const result = game.whack(holeIndex)
    
    if (result.hit) {
      // Trigger hit animation
      setHitAnimation(holeIndex)
      setTimeout(() => setHitAnimation(null), 200)
      
      // Show score popup
      if (result.points !== 0 && event && gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        const x = 'clientX' in event ? event.clientX - rect.left : event.touches[0].clientX - rect.left
        const y = 'clientY' in event ? event.clientY - rect.top : event.touches[0].clientY - rect.top
        
        const popup = {
          id: popupId.current++,
          points: result.points,
          x,
          y
        }
        
        setScorePopups(prev => [...prev, popup])
        setTimeout(() => {
          setScorePopups(prev => prev.filter(p => p.id !== popup.id))
        }, 1000)
      }
      
      // Haptic feedback for mobile
      if ('vibrate' in navigator && result.content !== HoleContent.Empty) {
        const feedback = game.getHapticFeedback(result.content)
        navigator.vibrate(feedback.duration)
      }
    }
    
    updateGameState()
    
    if (game.getState() === GameState.GameOver) {
      await handleGameOver()
    }
  }

  const handleGameOver = async () => {
    const finalScore = game.calculateFinalScore()
    const stats = game.getStatistics()
    
    await scoreService.saveScore('whack-a-mole', finalScore, {
      level,
      difficulty,
      accuracy: stats.accuracy,
      highestCombo: stats.highestCombo,
      molesWhacked: stats.molesWhacked
    })
    
    if (!bestScore || finalScore > bestScore) {
      setBestScore(finalScore)
    }
  }

  const handleReset = () => {
    game.reset()
    updateGameState()
    setScorePopups([])
  }

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty)
    game.setDifficulty(newDifficulty)
  }

  const renderHole = (holeIndex: number) => {
    const hole = holes[holeIndex]
    const isHit = hitAnimation === holeIndex
    
    let content = null
    let holeStyle = 'bg-gray-700'
    
    if (hole.isActive) {
      switch (hole.content) {
        case HoleContent.Mole:
          content = (
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${isHit ? 'scale-0' : 'scale-100'}`}>
              <div className="w-16 h-16 bg-yellow-700 rounded-full flex items-center justify-center">
                <div className="text-2xl">🦫</div>
              </div>
            </div>
          )
          break
          
        case HoleContent.Bomb:
          content = (
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${isHit ? 'scale-0' : 'scale-100'}`}>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center animate-pulse">
                <Bomb className="w-10 h-10 text-red-500" />
              </div>
            </div>
          )
          break
          
        case HoleContent.PowerUp:
          const powerUpIcons = {
            [PowerUp.DoubleScore]: '2️⃣',
            [PowerUp.FreezeTime]: '⏰',
            [PowerUp.MultiHit]: '💥'
          }
          content = (
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${isHit ? 'scale-0' : 'scale-100'}`}>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                <div className="text-2xl">{hole.powerUp && powerUpIcons[hole.powerUp]}</div>
              </div>
            </div>
          )
          break
      }
    }
    
    return (
      <div
        key={holeIndex}
        className="relative"
        onClick={(e) => handleWhack(holeIndex, e)}
        onTouchStart={(e) => handleWhack(holeIndex, e)}
      >
        <div className={`w-24 h-20 ${holeStyle} rounded-t-full border-4 border-gray-800 relative overflow-visible cursor-crosshair`}>
          {content}
        </div>
        <div className="w-24 h-4 bg-green-700 rounded-b-lg" />
      </div>
    )
  }

  const renderPowerUpIndicator = () => {
    if (!activePowerUp) return null
    
    const powerUpNames = {
      [PowerUp.DoubleScore]: 'Double Score',
      [PowerUp.FreezeTime]: 'Time Frozen',
      [PowerUp.MultiHit]: 'Multi-Hit'
    }
    
    const powerUpColors = {
      [PowerUp.DoubleScore]: 'bg-yellow-500',
      [PowerUp.FreezeTime]: 'bg-blue-500',
      [PowerUp.MultiHit]: 'bg-red-500'
    }
    
    return (
      <div className={`${powerUpColors[activePowerUp]} text-white px-3 py-1 rounded-full text-sm animate-pulse`}>
        <Zap className="w-4 h-4 inline mr-1" />
        {powerUpNames[activePowerUp]}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <UICard>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Whack-a-Mole</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
              <p className="text-2xl font-bold">{level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lives</p>
              <div className="flex justify-center gap-1">
                {Array(3).fill(0).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Combo</p>
              <p className="text-2xl font-bold">{combo > 0 ? `x${combo}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
              <p className="text-2xl font-bold flex items-center justify-center">
                <Clock className="w-5 h-5 mr-1" />
                {timeRemaining}s
              </p>
            </div>
          </div>

          {activePowerUp && (
            <div className="flex justify-center">
              {renderPowerUpIndicator()}
            </div>
          )}

          {gameState === GameState.Ready && (
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2 flex-wrap">
                <Button
                  onClick={() => handleDifficultyChange(Difficulty.Easy)}
                  variant={difficulty === Difficulty.Easy ? 'default' : 'outline'}
                  size="sm"
                >
                  Easy
                </Button>
                <Button
                  onClick={() => handleDifficultyChange(Difficulty.Normal)}
                  variant={difficulty === Difficulty.Normal ? 'default' : 'outline'}
                  size="sm"
                >
                  Normal
                </Button>
                <Button
                  onClick={() => handleDifficultyChange(Difficulty.Hard)}
                  variant={difficulty === Difficulty.Hard ? 'default' : 'outline'}
                  size="sm"
                >
                  Hard
                </Button>
                <Button
                  onClick={() => handleDifficultyChange(Difficulty.Expert)}
                  variant={difficulty === Difficulty.Expert ? 'default' : 'outline'}
                  size="sm"
                >
                  <Target className="w-4 h-4 mr-1" />
                  Expert
                </Button>
              </div>
              
              <Button onClick={handleStart} size="lg">
                Start Game
              </Button>
              
              {highScore > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  High Score ({difficulty}): {highScore}
                </p>
              )}
            </div>
          )}

          {gameState === GameState.Playing && (
            <div ref={gameAreaRef} className="relative">
              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto bg-green-600 p-8 rounded-lg">
                {Array(9).fill(0).map((_, index) => renderHole(index))}
              </div>
              
              {scorePopups.map(popup => (
                <div
                  key={popup.id}
                  className={`absolute pointer-events-none animate-float-up ${
                    popup.points > 0 ? 'text-green-500' : 'text-red-500'
                  } font-bold text-2xl`}
                  style={{ left: popup.x, top: popup.y }}
                >
                  {popup.points > 0 ? '+' : ''}{popup.points}
                </div>
              ))}
            </div>
          )}

          {gameState === GameState.GameOver && (
            <div className="text-center space-y-4">
              <div className="bg-red-100 dark:bg-red-900 rounded-lg p-6">
                <p className="text-2xl mb-2">Game Over!</p>
                <p className="text-lg mb-2">You reached level {level}</p>
                <p className="text-3xl font-bold mb-1">Final Score: {game.calculateFinalScore()}</p>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <p>Accuracy: {game.getStatistics().accuracy}%</p>
                  <p>Highest Combo: x{game.getStatistics().highestCombo}</p>
                  <p>Moles Whacked: {game.getStatistics().molesWhacked}</p>
                </div>
              </div>
              
              <ShareCard
                gameTitle="Whack-a-Mole"
                gameSlug="whack-a-mole"
                score={game.calculateFinalScore()}
                metadata={{ level, difficulty }}
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
              <li>• Click or tap the moles when they appear to score points</li>
              <li>• Avoid clicking bombs - they reduce score and lives</li>
              <li>• Collect power-ups for special abilities:</li>
              <li className="ml-4">- 2️⃣ Double Score: 2x points for hits</li>
              <li className="ml-4">- ⏰ Freeze Time: Stops the timer temporarily</li>
              <li className="ml-4">- 💥 Multi-Hit: Hit multiple moles at once</li>
              <li>• Build combos for bonus points</li>
              <li>• Game ends when time runs out or you lose all lives</li>
            </ul>
          </div>
        </CardContent>
      </UICard>
      
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
        
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}