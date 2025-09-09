'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, RotateCcw, Trophy } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels';

interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number;
  faceUp: boolean;
  id: string;
}

interface CardStack {
  cards: PlayingCard[];
}

interface SolitaireLevelConfig {
  drawCount: 1 | 3;
  timeLimit: number | null;
  scoringMultiplier: number;
  undoAllowed: boolean;
  showHints: boolean;
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy',
    config: {
      drawCount: 1,
      timeLimit: null,
      scoringMultiplier: 1,
      undoAllowed: true,
      showHints: true
    } as SolitaireLevelConfig,
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Classic',
    difficulty: 'medium',
    config: {
      drawCount: 3,
      timeLimit: null,
      scoringMultiplier: 1.5,
      undoAllowed: true,
      showHints: false
    } as SolitaireLevelConfig,
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Timed Challenge',
    difficulty: 'hard',
    config: {
      drawCount: 3,
      timeLimit: 300,
      scoringMultiplier: 2,
      undoAllowed: false,
      showHints: false
    } as SolitaireLevelConfig,
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Speed Master',
    difficulty: 'expert',
    config: {
      drawCount: 3,
      timeLimit: 180,
      scoringMultiplier: 3,
      undoAllowed: false,
      showHints: false
    } as SolitaireLevelConfig,
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Vegas Mode',
    difficulty: 'master',
    config: {
      drawCount: 3,
      timeLimit: 120,
      scoringMultiplier: 5,
      undoAllowed: false,
      showHints: false
    } as SolitaireLevelConfig,
    requiredStars: 12
  }
];

function SolitaireGame({ config, onScore }: { config: SolitaireLevelConfig; onScore: (score: number) => void }) {
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [waste, setWaste] = useState<PlayingCard[]>([]);
  const [foundations, setFoundations] = useState<CardStack[]>([
    { cards: [] },
    { cards: [] },
    { cards: [] },
    { cards: [] },
  ]);
  const [tableau, setTableau] = useState<CardStack[]>([]);
  const [selectedCard, setSelectedCard] = useState<{
    card: PlayingCard;
    from: 'waste' | 'tableau' | 'foundation';
    index?: number;
  } | null>(null);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const { updateScore } = useGameStore();

  const createDeck = (): PlayingCard[] => {
    const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const newDeck: PlayingCard[] = [];
    
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        newDeck.push({
          suit,
          rank,
          faceUp: false,
          id: `${suit}-${rank}`
        });
      }
    }
    
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const initializeGame = () => {
    const newDeck = createDeck();
    const newTableau: CardStack[] = [];
    let deckIndex = 0;
    
    for (let i = 0; i < 7; i++) {
      const stack: PlayingCard[] = [];
      for (let j = 0; j <= i; j++) {
        const card = { ...newDeck[deckIndex] };
        if (j === i) {
          card.faceUp = true;
        }
        stack.push(card);
        deckIndex++;
      }
      newTableau.push({ cards: stack });
    }
    
    const remainingDeck = newDeck.slice(deckIndex);
    
    setTableau(newTableau);
    setDeck(remainingDeck);
    setWaste([]);
    setFoundations([{ cards: [] }, { cards: [] }, { cards: [] }, { cards: [] }]);
    setMoves(0);
    setTimer(0);
    setIsGameActive(true);
    setIsGameWon(false);
    setIsGameOver(false);
    setSelectedCard(null);
    setHistory([]);
  };

  const saveState = () => {
    if (config.undoAllowed) {
      setHistory([...history, {
        deck: [...deck],
        waste: [...waste],
        tableau: tableau.map(t => ({ cards: [...t.cards] })),
        foundations: foundations.map(f => ({ cards: [...f.cards] })),
        moves
      }]);
    }
  };

  const undo = () => {
    if (history.length > 0 && config.undoAllowed) {
      const lastState = history[history.length - 1];
      setDeck(lastState.deck);
      setWaste(lastState.waste);
      setTableau(lastState.tableau);
      setFoundations(lastState.foundations);
      setMoves(lastState.moves);
      setHistory(history.slice(0, -1));
    }
  };

  const drawCard = () => {
    saveState();
    
    if (deck.length === 0) {
      setDeck(waste.reverse().map(card => ({ ...card, faceUp: false })));
      setWaste([]);
    } else {
      const cardsToD = Math.min(config.drawCount, deck.length);
      const newCards = deck.slice(-cardsToD).map(card => ({ ...card, faceUp: true }));
      setDeck(deck.slice(0, -cardsToD));
      setWaste([...waste, ...newCards]);
    }
    setMoves(moves + 1);
  };

  const canPlaceOnTableau = (card: PlayingCard, targetCard: PlayingCard | null): boolean => {
    if (!targetCard) {
      return card.rank === 13;
    }
    
    const isRedCard = card.suit === 'hearts' || card.suit === 'diamonds';
    const isTargetRed = targetCard.suit === 'hearts' || targetCard.suit === 'diamonds';
    
    return (
      isRedCard !== isTargetRed &&
      card.rank === targetCard.rank - 1
    );
  };

  const canPlaceOnFoundation = (card: PlayingCard, foundation: CardStack): boolean => {
    if (foundation.cards.length === 0) {
      return card.rank === 1;
    }
    
    const topCard = foundation.cards[foundation.cards.length - 1];
    return (
      card.suit === topCard.suit &&
      card.rank === topCard.rank + 1
    );
  };

  const handleCardClick = (card: PlayingCard, from: 'waste' | 'tableau' | 'foundation', index?: number) => {
    if (!card.faceUp) {
      if (from === 'tableau' && index !== undefined) {
        const stack = tableau[index];
        if (stack.cards[stack.cards.length - 1].id === card.id) {
          saveState();
          const newTableau = [...tableau];
          newTableau[index].cards[newTableau[index].cards.length - 1].faceUp = true;
          setTableau(newTableau);
        }
      }
      return;
    }

    if (selectedCard) {
      if (from === 'tableau' && index !== undefined) {
        const targetStack = tableau[index];
        const targetCard = targetStack.cards.length > 0 ? targetStack.cards[targetStack.cards.length - 1] : null;
        
        if (canPlaceOnTableau(selectedCard.card, targetCard)) {
          moveCard(selectedCard, 'tableau', index);
        }
      } else if (from === 'foundation' && index !== undefined) {
        if (canPlaceOnFoundation(selectedCard.card, foundations[index])) {
          moveCard(selectedCard, 'foundation', index);
        }
      }
      setSelectedCard(null);
    } else {
      setSelectedCard({ card, from, index });
    }
  };

  const moveCard = (source: typeof selectedCard, targetType: 'tableau' | 'foundation', targetIndex: number) => {
    if (!source) return;

    saveState();
    
    let cardToMove: PlayingCard | null = null;
    let cardsToMove: PlayingCard[] = [];

    if (source.from === 'waste') {
      cardToMove = waste[waste.length - 1];
      if (cardToMove) {
        setWaste(waste.slice(0, -1));
        cardsToMove = [cardToMove];
      }
    } else if (source.from === 'tableau' && source.index !== undefined) {
      const sourceStack = tableau[source.index];
      const cardIndex = sourceStack.cards.findIndex(c => c.id === source.card.id);
      cardsToMove = sourceStack.cards.slice(cardIndex);
      
      const newTableau = [...tableau];
      newTableau[source.index].cards = sourceStack.cards.slice(0, cardIndex);
      setTableau(newTableau);
    }

    if (targetType === 'tableau') {
      const newTableau = [...tableau];
      newTableau[targetIndex].cards.push(...cardsToMove);
      setTableau(newTableau);
    } else if (targetType === 'foundation' && cardsToMove.length === 1) {
      const newFoundations = [...foundations];
      newFoundations[targetIndex].cards.push(cardsToMove[0]);
      setFoundations(newFoundations);
      checkWin(newFoundations);
    }

    setMoves(moves + 1);
  };

  const checkWin = (currentFoundations?: CardStack[]) => {
    const foundationsToCheck = currentFoundations || foundations;
    const isWon = foundationsToCheck.every(f => f.cards.length === 13);
    if (isWon) {
      setIsGameWon(true);
      setIsGameActive(false);
      
      const baseScore = Math.max(1000 - moves * 10 - timer, 100);
      const finalScore = Math.floor(baseScore * config.scoringMultiplier);
      
      updateScore('solitaire', finalScore);
      onScore(finalScore);
    }
  };

  const handleEmptyTableauClick = (index: number) => {
    if (selectedCard && selectedCard.card.rank === 13) {
      moveCard(selectedCard, 'tableau', index);
      setSelectedCard(null);
    }
  };

  const getRankSymbol = (rank: number): string => {
    switch (rank) {
      case 1: return 'A';
      case 11: return 'J';
      case 12: return 'Q';
      case 13: return 'K';
      default: return rank.toString();
    }
  };

  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getCardColor = (suit: string): string => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  const getHintHighlight = (): string => {
    if (!config.showHints || !selectedCard) return '';
    
    if (selectedCard.from === 'waste' || selectedCard.from === 'tableau') {
      for (let i = 0; i < foundations.length; i++) {
        if (canPlaceOnFoundation(selectedCard.card, foundations[i])) {
          return `foundation-${i}`;
        }
      }
      
      for (let i = 0; i < tableau.length; i++) {
        const targetCard = tableau[i].cards.length > 0 ? tableau[i].cards[tableau[i].cards.length - 1] : null;
        if (canPlaceOnTableau(selectedCard.card, targetCard)) {
          return `tableau-${i}`;
        }
      }
    }
    
    return '';
  };

  useEffect(() => {
    if (isGameActive) {
      const interval = setInterval(() => {
        setTimer(t => {
          const newTime = t + 1;
          if (config.timeLimit && newTime >= config.timeLimit) {
            setIsGameActive(false);
            setIsGameOver(true);
            onScore(0);
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameActive, config.timeLimit, onScore]);

  useEffect(() => {
    initializeGame();
  }, []);

  const hint = getHintHighlight();

  return (
    <Card className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="font-mono">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              {config.timeLimit && ` / ${Math.floor(config.timeLimit / 60)}:${(config.timeLimit % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
          <div>Moves: {moves}</div>
          {config.scoringMultiplier > 1 && (
            <div className="text-yellow-500">×{config.scoringMultiplier} Score</div>
          )}
        </div>
        <div className="flex gap-2">
          {config.undoAllowed && (
            <Button onClick={undo} size="sm" variant="outline" disabled={history.length === 0}>
              Undo
            </Button>
          )}
          <Button onClick={initializeGame} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            New Game
          </Button>
        </div>
      </div>

      {isGameWon && (
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600">
            You won in {moves} moves and {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}!
          </p>
          <p className="text-lg mt-2">
            Score: {Math.floor(Math.max(1000 - moves * 10 - timer, 100) * config.scoringMultiplier)}
          </p>
        </div>
      )}

      {isGameOver && !isGameWon && (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2 text-red-500">Time's Up!</h2>
          <p className="text-gray-600">Try again to complete within the time limit!</p>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 mb-4">
        <div className="space-y-2">
          <div
            className="w-full aspect-[2/3] bg-green-800 rounded cursor-pointer flex items-center justify-center"
            onClick={deck.length > 0 || waste.length > 0 ? drawCard : undefined}
          >
            {deck.length > 0 ? (
              <div className="text-white font-bold">
                Draw {config.drawCount > 1 ? `(${config.drawCount})` : ''}
              </div>
            ) : waste.length > 0 ? (
              <div className="text-white">↻</div>
            ) : (
              <div className="text-green-600">Empty</div>
            )}
          </div>
          
          {waste.length > 0 && (
            <div
              className={`w-full aspect-[2/3] bg-white border-2 rounded cursor-pointer flex flex-col items-center justify-center ${
                selectedCard?.from === 'waste' ? 'border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => waste.length > 0 && handleCardClick(waste[waste.length - 1], 'waste')}
            >
              <span className={`text-2xl ${getCardColor(waste[waste.length - 1].suit)}`}>
                {getRankSymbol(waste[waste.length - 1].rank)}
              </span>
              <span className={`text-xl ${getCardColor(waste[waste.length - 1].suit)}`}>
                {getSuitSymbol(waste[waste.length - 1].suit)}
              </span>
            </div>
          )}
        </div>

        <div className="col-span-2"></div>

        {foundations.map((foundation, index) => (
          <div
            key={index}
            className={`w-full aspect-[2/3] bg-gray-200 border-2 rounded flex items-center justify-center cursor-pointer ${
              hint === `foundation-${index}` ? 'border-green-500 animate-pulse' : 'border-gray-300'
            }`}
            onClick={() => selectedCard && handleCardClick(foundation.cards[foundation.cards.length - 1] || null as any, 'foundation', index)}
          >
            {foundation.cards.length > 0 ? (
              <div className="flex flex-col items-center">
                <span className={`text-2xl ${getCardColor(foundation.cards[foundation.cards.length - 1].suit)}`}>
                  {getRankSymbol(foundation.cards[foundation.cards.length - 1].rank)}
                </span>
                <span className={`text-xl ${getCardColor(foundation.cards[foundation.cards.length - 1].suit)}`}>
                  {getSuitSymbol(foundation.cards[foundation.cards.length - 1].suit)}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">Foundation</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {tableau.map((stack, stackIndex) => (
          <div key={stackIndex} className="space-y-[-3rem]">
            {stack.cards.length === 0 ? (
              <div
                className={`w-full aspect-[2/3] bg-gray-100 border-2 rounded cursor-pointer ${
                  hint === `tableau-${stackIndex}` ? 'border-green-500 animate-pulse' : 'border-gray-300'
                }`}
                onClick={() => handleEmptyTableauClick(stackIndex)}
              />
            ) : (
              stack.cards.map((card, cardIndex) => (
                <div
                  key={card.id}
                  className={`w-full aspect-[2/3] ${
                    card.faceUp ? 'bg-white' : 'bg-blue-800'
                  } border-2 ${
                    selectedCard?.card.id === card.id ? 'border-blue-500' : 
                    hint === `tableau-${stackIndex}` && cardIndex === stack.cards.length - 1 ? 'border-green-500 animate-pulse' : 
                    'border-gray-300'
                  } rounded cursor-pointer flex items-center justify-center relative`}
                  style={{ marginTop: cardIndex === 0 ? 0 : '-2.5rem' }}
                  onClick={() => handleCardClick(card, 'tableau', stackIndex)}
                >
                  {card.faceUp ? (
                    <div className="flex flex-col items-center">
                      <span className={`text-xl ${getCardColor(card.suit)}`}>
                        {getRankSymbol(card.rank)}
                      </span>
                      <span className={`text-lg ${getCardColor(card.suit)}`}>
                        {getSuitSymbol(card.suit)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-blue-600">●</div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SolitaireWithLevels() {
  const getStars = (score: number, config: SolitaireLevelConfig): 1 | 2 | 3 => {
    if (score >= 3000 * config.scoringMultiplier) return 3;
    if (score >= 2000 * config.scoringMultiplier) return 2;
    return 1;
  };

  return (
    <GameWithLevels
      gameId="solitaire"
      gameName="Solitaire"
      levels={levels}
      renderGame={(config, onScore) => <SolitaireGame config={config} onScore={onScore} />}
      getStars={getStars}
    />
  );
}