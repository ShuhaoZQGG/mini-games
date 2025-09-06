'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, RotateCcw, Trophy } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number;
  faceUp: boolean;
  id: string;
}

interface CardStack {
  cards: PlayingCard[];
}

export function Solitaire() {
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
    setSelectedCard(null);
  };

  const drawCard = () => {
    if (deck.length === 0) {
      setDeck(waste.reverse().map(card => ({ ...card, faceUp: false })));
      setWaste([]);
    } else {
      const newCard = { ...deck[deck.length - 1], faceUp: true };
      setDeck(deck.slice(0, -1));
      setWaste([...waste, newCard]);
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
      const score = Math.max(1000 - moves * 10 - timer, 100);
      updateScore('solitaire', score);
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

  useEffect(() => {
    if (isGameActive) {
      const interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameActive]);

  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <Card className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="font-mono">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
          </div>
          <div>Moves: {moves}</div>
        </div>
        <Button onClick={initializeGame} size="sm" variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>

      {isGameWon && (
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-gray-600">You won in {moves} moves and {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}!</p>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 mb-4">
        <div className="space-y-2">
          <div
            className="w-full aspect-[2/3] bg-green-800 rounded cursor-pointer flex items-center justify-center"
            onClick={deck.length > 0 || waste.length > 0 ? drawCard : undefined}
          >
            {deck.length > 0 ? (
              <div className="text-white font-bold">Draw</div>
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
            className="w-full aspect-[2/3] bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center cursor-pointer"
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
                className="w-full aspect-[2/3] bg-gray-100 border-2 border-gray-300 rounded cursor-pointer"
                onClick={() => handleEmptyTableauClick(stackIndex)}
              />
            ) : (
              stack.cards.map((card, cardIndex) => (
                <div
                  key={card.id}
                  className={`w-full aspect-[2/3] ${
                    card.faceUp ? 'bg-white' : 'bg-blue-800'
                  } border-2 ${
                    selectedCard?.card.id === card.id ? 'border-blue-500' : 'border-gray-300'
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