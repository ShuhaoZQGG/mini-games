'use client'

import { useState, useEffect } from 'react'
import { MemoryMatchGame, Card } from '@/lib/games/memory-match'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'

export function MemoryMatchComponent() {
  const [game] = useState(() => new MemoryMatchGame(4))
  const [cards, setCards] = useState<Card[]>([])
  const [moves, setMoves] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameTime, setGameTime] = useState(0)
  const [bestScore, setBestScore] = useState<number | null>(null)

  useEffect(() => {
    game.setUpdateCallback((cards, moves) => {
      setCards([...cards])
      setMoves(moves)
    })

    game.setCompleteCallback((moves, time) => {
      setGameTime(time)
      setIsGameOver(true)
      setIsPlaying(false)
      
      if (bestScore === null || moves < bestScore) {
        setBestScore(moves)
      }
    })
  }, [game, bestScore])

  const handleStart = () => {
    setIsPlaying(true)
    setIsGameOver(false)
    setMoves(0)
    setGameTime(0)
    game.start()
    setCards([...game.getCards()])
  }

  const handleCardClick = (cardId: number) => {
    if (isPlaying && !isGameOver) {
      game.handleInput(cardId)
    }
  }

  const handleReset = () => {
    game.reset()
    setCards([])
    setMoves(0)
    setIsPlaying(false)
    setIsGameOver(false)
    setGameTime(0)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <UICard>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Memory Match</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center max-w-sm mx-auto">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Moves</p>
              <p className="text-2xl font-bold">{moves}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Best Score</p>
              <p className="text-2xl font-bold">{bestScore ?? '-'}</p>
            </div>
          </div>

          {!isPlaying && !isGameOver && (
            <div className="text-center">
              <Button onClick={handleStart} size="lg">
                Start Game
              </Button>
            </div>
          )}

          {isPlaying && (
            <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md mx-auto">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    aspect-square rounded-lg text-3xl md:text-4xl font-bold
                    transition-all duration-300 transform
                    ${card.isFlipped || card.isMatched
                      ? 'bg-white dark:bg-gray-700 rotate-0'
                      : 'bg-primary hover:bg-indigo-700 rotate-y-180 cursor-pointer'
                    }
                    ${card.isMatched ? 'opacity-60' : ''}
                    hover:scale-105 active:scale-95
                  `}
                  disabled={card.isFlipped || card.isMatched}
                >
                  {(card.isFlipped || card.isMatched) ? card.value : '?'}
                </button>
              ))}
            </div>
          )}

          {isGameOver && (
            <div className="text-center space-y-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-lg p-6">
                <p className="text-2xl mb-2">🎉 Congratulations!</p>
                <p className="text-lg mb-2">You completed the game in:</p>
                <p className="text-3xl font-bold mb-1">{moves} moves</p>
                <p className="text-lg text-gray-600 dark:text-gray-400">Time: {gameTime} seconds</p>
              </div>
              <ShareCard
                gameTitle="Memory Match"
                gameSlug="memory-match"
                score={moves}
                time={gameTime}
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
              <li>• Click on cards to flip them over</li>
              <li>• Find matching pairs of emojis</li>
              <li>• Match all pairs to win the game</li>
              <li>• Try to complete it in fewer moves</li>
              <li>• Challenge yourself to beat your best score!</li>
            </ul>
          </div>
        </CardContent>
      </UICard>
    </div>
  )
}