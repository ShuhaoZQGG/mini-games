'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SolitaireGame, Card, Suit, Rank, MoveType, Pile, CardPile } from '@/lib/games/solitaire'
import { Button } from '@/components/ui/button'
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import { scoreService } from '@/lib/services/scores'
import { Undo2, Lightbulb, RotateCcw, Trophy } from 'lucide-react'

export function SolitaireComponent() {
  const [game] = useState(() => new SolitaireGame())
  const [gameState, setGameState] = useState(game.getGameState())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGameWon, setIsGameWon] = useState(false)
  const [draggedCards, setDraggedCards] = useState<Card[] | null>(null)
  const [dragSource, setDragSource] = useState<{ pile: Pile; index: number } | null>(null)
  const [highlightedPile, setHighlightedPile] = useState<{ pile: Pile; index: number } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [bestScore, setBestScore] = useState<number | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updateGameState = useCallback(() => {
    setGameState(game.getGameState())
    if (game.isGameWon()) {
      setIsGameWon(true)
      setIsPlaying(false)
      handleGameWon()
    }
  }, [game])

  const handleGameWon = async () => {
    const stats = game.getStatistics()
    const finalScore = stats.score + Math.max(0, 1000 - stats.movesCount * 5 - stats.timeElapsed)
    
    await scoreService.saveScore('solitaire', finalScore, {
      moves: stats.movesCount,
      time: stats.timeElapsed,
      cardsInFoundations: stats.cardsInFoundations
    })
    
    if (!bestScore || finalScore > bestScore) {
      setBestScore(finalScore)
    }
  }

  useEffect(() => {
    if (isPlaying && !isGameWon) {
      timerRef.current = setInterval(() => {
        setElapsedTime(game.getElapsedTime())
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, isGameWon, game])

  const handleStart = () => {
    game.start()
    setIsPlaying(true)
    setIsGameWon(false)
    setElapsedTime(0)
    updateGameState()
  }

  const handleDrawFromStock = () => {
    if (isPlaying && !isGameWon) {
      game.drawFromStock()
      updateGameState()
    }
  }

  const handleUndo = () => {
    if (isPlaying && !isGameWon) {
      game.undo()
      updateGameState()
    }
  }

  const handleHint = () => {
    const hint = game.getHint()
    if (hint) {
      setShowHint(true)
      setHighlightedPile({ pile: Pile.Tableau, index: hint.from })
      setTimeout(() => {
        setShowHint(false)
        setHighlightedPile(null)
      }, 2000)
    }
  }

  const handleAutoComplete = () => {
    if (game.canAutoComplete()) {
      game.autoComplete()
      updateGameState()
    }
  }

  const handleCardDragStart = (pile: Pile, pileIndex: number, cardIndex: number) => (e: React.DragEvent) => {
    const dragData = game.startDrag(pile, pileIndex, cardIndex)
    if (dragData) {
      setDraggedCards(dragData.cards)
      setDragSource(dragData.source)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleCardTouchStart = (pile: Pile, pileIndex: number, cardIndex: number) => (e: React.TouchEvent) => {
    const dragData = game.startDrag(pile, pileIndex, cardIndex)
    if (dragData) {
      setDraggedCards(dragData.cards)
      setDragSource(dragData.source)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetPile: Pile, targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    
    if (dragSource && draggedCards) {
      let success = false
      
      if (dragSource.pile === Pile.Waste && targetPile === Pile.Tableau) {
        success = game.moveCard(MoveType.WasteToTableau, 0, targetIndex)
      } else if (dragSource.pile === Pile.Waste && targetPile === Pile.Foundation) {
        success = game.moveCard(MoveType.WasteToFoundation, 0, targetIndex)
      } else if (dragSource.pile === Pile.Tableau && targetPile === Pile.Tableau) {
        success = game.moveCard(MoveType.TableauToTableau, dragSource.index, targetIndex)
      } else if (dragSource.pile === Pile.Tableau && targetPile === Pile.Foundation) {
        success = game.moveCard(MoveType.TableauToFoundation, dragSource.index, targetIndex)
      } else if (dragSource.pile === Pile.Foundation && targetPile === Pile.Tableau) {
        success = game.moveCard(MoveType.FoundationToTableau, dragSource.index, targetIndex)
      }
      
      if (success) {
        updateGameState()
      }
    }
    
    setDraggedCards(null)
    setDragSource(null)
  }

  const handleCardClick = (pile: Pile, pileIndex: number, cardIndex?: number) => {
    if (!isPlaying || isGameWon) return
    
    // Double-click to auto-move to foundation
    if (pile === Pile.Tableau) {
      for (let i = 0; i < 4; i++) {
        if (game.moveCard(MoveType.TableauToFoundation, pileIndex, i)) {
          updateGameState()
          return
        }
      }
    } else if (pile === Pile.Waste) {
      for (let i = 0; i < 4; i++) {
        if (game.moveCard(MoveType.WasteToFoundation, 0, i)) {
          updateGameState()
          return
        }
      }
    }
  }

  const renderCard = (card: Card | null, index: number = 0, isDraggable: boolean = false) => {
    if (!card) {
      return (
        <div className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-gray-400 rounded-lg" />
      )
    }

    const suitSymbols: Record<Suit, string> = {
      [Suit.Hearts]: '♥',
      [Suit.Diamonds]: '♦',
      [Suit.Clubs]: '♣',
      [Suit.Spades]: '♠'
    }

    const suitColors: Record<Suit, string> = {
      [Suit.Hearts]: 'text-red-500',
      [Suit.Diamonds]: 'text-red-500',
      [Suit.Clubs]: 'text-black',
      [Suit.Spades]: 'text-black'
    }

    if (!card.faceUp) {
      return (
        <div className="w-16 h-24 md:w-20 md:h-28 bg-blue-600 rounded-lg border border-blue-800 flex items-center justify-center">
          <div className="text-white text-2xl">🂠</div>
        </div>
      )
    }

    return (
      <div
        className={`w-16 h-24 md:w-20 md:h-28 bg-white rounded-lg border border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow ${suitColors[card.suit]} ${isDraggable ? 'cursor-move' : ''}`}
        draggable={isDraggable}
      >
        <div className="text-xl md:text-2xl font-bold">{card.rankName}</div>
        <div className="text-2xl md:text-3xl">{suitSymbols[card.suit]}</div>
      </div>
    )
  }

  const renderPile = (pile: CardPile, pileIndex: number, type: Pile, isDropTarget: boolean = true) => {
    const isHighlighted = highlightedPile?.pile === type && highlightedPile?.index === pileIndex

    return (
      <div
        className={`relative ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
        onDragOver={isDropTarget ? handleDragOver : undefined}
        onDrop={isDropTarget ? handleDrop(type, pileIndex) : undefined}
      >
        {pile.cards.length === 0 ? (
          renderCard(null)
        ) : type === Pile.Tableau ? (
          <div className="space-y-[-4.5rem] md:space-y-[-5.5rem]">
            {pile.cards.map((card, cardIndex) => (
              <div
                key={`${card.suit}-${card.rank}-${cardIndex}`}
                onDragStart={card.faceUp ? handleCardDragStart(type, pileIndex, cardIndex) : undefined}
                onTouchStart={card.faceUp ? handleCardTouchStart(type, pileIndex, cardIndex) : undefined}
                onDoubleClick={() => handleCardClick(type, pileIndex, cardIndex)}
                className="relative"
              >
                {renderCard(card, cardIndex, card.faceUp)}
              </div>
            ))}
          </div>
        ) : (
          <div
            onDragStart={handleCardDragStart(type, pileIndex, pile.cards.length - 1)}
            onTouchStart={handleCardTouchStart(type, pileIndex, pile.cards.length - 1)}
            onDoubleClick={() => handleCardClick(type, pileIndex)}
          >
            {renderCard(pile.cards[pile.cards.length - 1], 0, true)}
          </div>
        )}
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <UICard>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Solitaire (Klondike)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isPlaying && !isGameWon && (
            <div className="text-center">
              <Button onClick={handleStart} size="lg">
                Start Game
              </Button>
            </div>
          )}

          {isPlaying && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={handleUndo} variant="outline" size="sm">
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button onClick={handleHint} variant="outline" size="sm">
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Hint
                  </Button>
                  {game.canAutoComplete() && (
                    <Button onClick={handleAutoComplete} variant="outline" size="sm">
                      <Trophy className="w-4 h-4 mr-1" />
                      Auto Complete
                    </Button>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <div>Score: {gameState.score}</div>
                  <div>Moves: {gameState.moveCount}</div>
                  <div>Time: {formatTime(elapsedTime)}</div>
                  {bestScore && <div>Best: {bestScore}</div>}
                </div>
              </div>

              <div className="bg-green-800 p-4 rounded-lg">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  <div className="col-span-3 flex gap-2">
                    <div onClick={handleDrawFromStock} className="cursor-pointer">
                      {gameState.stock.cards.length > 0 ? (
                        renderCard(new Card(Suit.Spades, Rank.Ace, false))
                      ) : (
                        <div 
                          className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700"
                        >
                          <RotateCcw className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {renderPile(gameState.waste, 0, Pile.Waste, false)}
                  </div>
                  <div />
                  <div className="col-span-3 flex gap-2">
                    {gameState.foundations.map((foundation, index) => (
                      <div key={index}>
                        {renderPile(foundation, index, Pile.Foundation)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {gameState.tableau.map((pile, index) => (
                    <div key={index}>
                      {renderPile(pile, index, Pile.Tableau)}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isGameWon && (
            <div className="text-center space-y-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-lg p-6">
                <p className="text-2xl mb-2">🎉 Congratulations!</p>
                <p className="text-lg mb-2">You won the game!</p>
                <p className="text-3xl font-bold mb-1">Score: {gameState.score}</p>
                <p className="text-lg">Moves: {gameState.moveCount}</p>
                <p className="text-lg text-gray-600 dark:text-gray-400">Time: {formatTime(elapsedTime)}</p>
              </div>
              <ShareCard
                gameTitle="Solitaire"
                gameSlug="solitaire"
                score={gameState.score}
                time={elapsedTime}
              />
              <Button onClick={handleStart} size="lg">
                Play Again
              </Button>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">How to Play:</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Build foundation piles from Ace to King by suit</li>
              <li>• Build tableau columns in descending order with alternating colors</li>
              <li>• Click stock to draw 3 cards to waste</li>
              <li>• Drag cards or double-click to auto-move to foundations</li>
              <li>• Use hints when stuck or auto-complete when available</li>
              <li>• Complete the game with the fewest moves for the best score!</li>
            </ul>
          </div>
        </CardContent>
      </UICard>
    </div>
  )
}