'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spade, RotateCcw, Undo, Trophy, ChevronDown } from 'lucide-react';

interface PlayingCard {
  suit: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  rank: number; // 1-13 (A-K)
  faceUp: boolean;
  id: string;
}

interface Column {
  cards: PlayingCard[];
}

export default function SpiderSolitaire() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');
  const [difficulty, setDifficulty] = useState<'1suit' | '2suit' | '4suit'>('1suit');
  const [columns, setColumns] = useState<Column[]>([]);
  const [stock, setStock] = useState<PlayingCard[]>([]);
  const [completedSets, setCompletedSets] = useState(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(500);
  const [selectedCards, setSelectedCards] = useState<{col: number, cards: PlayingCard[]} | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [hints, setHints] = useState(3);

  const suits = ['spades', 'hearts', 'clubs', 'diamonds'] as const;
  const rankSymbols = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = () => {
    const deck: PlayingCard[] = [];
    const suitsToUse = difficulty === '1suit' ? ['spades'] : 
                      difficulty === '2suit' ? ['spades', 'hearts'] :
                      suits;
    
    // Create 8 decks for spider solitaire
    for (let d = 0; d < 8; d++) {
      for (const suit of suitsToUse) {
        for (let rank = 1; rank <= 13; rank++) {
          deck.push({
            suit: suit as any,
            rank,
            faceUp: false,
            id: `${suit}-${rank}-${d}`
          });
        }
      }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  };

  const dealCards = () => {
    const deck = createDeck();
    const newColumns: Column[] = [];
    
    // Deal initial tableau (10 columns)
    for (let col = 0; col < 10; col++) {
      const column: Column = { cards: [] };
      const cardCount = col < 4 ? 6 : 5;
      
      for (let i = 0; i < cardCount; i++) {
        const card = deck.pop()!;
        card.faceUp = i === cardCount - 1; // Only last card face up
        column.cards.push(card);
      }
      
      newColumns.push(column);
    }
    
    setColumns(newColumns);
    setStock(deck);
  };

  const startGame = () => {
    setGameState('playing');
    setCompletedSets(0);
    setMoves(0);
    setScore(500);
    setHistory([]);
    setHints(3);
    dealCards();
  };

  const canMoveCards = (cards: PlayingCard[]): boolean => {
    if (cards.length === 0) return false;
    
    // Check if all cards are face up and in descending sequence
    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].faceUp) return false;
      if (i > 0 && cards[i].rank !== cards[i-1].rank - 1) return false;
      if (difficulty !== '1suit' && i > 0 && cards[i].suit !== cards[i-1].suit) return false;
    }
    
    return true;
  };

  const handleCardClick = (colIndex: number, cardIndex: number) => {
    if (gameState !== 'playing') return;
    
    const column = columns[colIndex];
    const cardsToMove = column.cards.slice(cardIndex);
    
    if (!canMoveCards(cardsToMove)) return;
    
    if (selectedCards && selectedCards.col === colIndex) {
      setSelectedCards(null);
    } else {
      setSelectedCards({ col: colIndex, cards: cardsToMove });
    }
  };

  const handleColumnClick = (targetCol: number) => {
    if (!selectedCards || targetCol === selectedCards.col) return;
    
    const targetColumn = columns[targetCol];
    const movingCards = selectedCards.cards;
    
    // Check if move is valid
    if (targetColumn.cards.length === 0 || 
        targetColumn.cards[targetColumn.cards.length - 1].rank === movingCards[0].rank + 1) {
      
      // Save state for undo
      setHistory([...history, { columns: JSON.parse(JSON.stringify(columns)), moves, score }]);
      
      // Move cards
      const newColumns = [...columns];
      newColumns[selectedCards.col].cards = newColumns[selectedCards.col].cards.slice(0, -movingCards.length);
      newColumns[targetCol].cards = [...newColumns[targetCol].cards, ...movingCards];
      
      // Flip card if needed
      if (newColumns[selectedCards.col].cards.length > 0) {
        const lastCard = newColumns[selectedCards.col].cards[newColumns[selectedCards.col].cards.length - 1];
        if (!lastCard.faceUp) {
          lastCard.faceUp = true;
          setScore(score + 5);
        }
      }
      
      setColumns(newColumns);
      setMoves(moves + 1);
      setScore(Math.max(0, score - 1));
      setSelectedCards(null);
      
      // Check for completed sequence
      checkForCompleteSequence(targetCol);
    }
  };

  const checkForCompleteSequence = (colIndex: number) => {
    const column = columns[colIndex];
    if (column.cards.length < 13) return;
    
    // Check if last 13 cards form a complete sequence (K to A)
    const last13 = column.cards.slice(-13);
    let isComplete = true;
    
    for (let i = 0; i < 13; i++) {
      if (!last13[i].faceUp || last13[i].rank !== 13 - i) {
        isComplete = false;
        break;
      }
      if (difficulty !== '1suit' && i > 0 && last13[i].suit !== last13[0].suit) {
        isComplete = false;
        break;
      }
    }
    
    if (isComplete) {
      const newColumns = [...columns];
      newColumns[colIndex].cards = newColumns[colIndex].cards.slice(0, -13);
      
      // Flip next card if exists
      if (newColumns[colIndex].cards.length > 0) {
        const lastCard = newColumns[colIndex].cards[newColumns[colIndex].cards.length - 1];
        if (!lastCard.faceUp) lastCard.faceUp = true;
      }
      
      setColumns(newColumns);
      setCompletedSets(completedSets + 1);
      setScore(score + 100);
      
      // Check win condition
      if (completedSets + 1 === 8) {
        setGameState('won');
      }
    }
  };

  const dealFromStock = () => {
    if (stock.length === 0) return;
    
    // Check if all columns have at least one card
    if (columns.some(col => col.cards.length === 0)) return;
    
    setHistory([...history, { columns: JSON.parse(JSON.stringify(columns)), moves, score }]);
    
    const newColumns = [...columns];
    const newStock = [...stock];
    
    // Deal one card to each column
    for (let i = 0; i < 10 && newStock.length > 0; i++) {
      const card = newStock.pop()!;
      card.faceUp = true;
      newColumns[i].cards.push(card);
    }
    
    setColumns(newColumns);
    setStock(newStock);
    setMoves(moves + 1);
  };

  const undo = () => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setColumns(lastState.columns);
    setMoves(lastState.moves);
    setScore(lastState.score);
    setHistory(history.slice(0, -1));
    setSelectedCards(null);
  };

  const useHint = () => {
    if (hints <= 0) return;
    // Find a valid move and highlight it
    setHints(hints - 1);
  };

  const getSuitSymbol = (suit: string) => {
    switch(suit) {
      case 'spades': return '♠';
      case 'hearts': return '♥';
      case 'clubs': return '♣';
      case 'diamonds': return '♦';
      default: return '';
    }
  };

  const getCardColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Spade className="w-6 h-6" />
          Spider Solitaire
        </CardTitle>
        <CardDescription>Build 8 sequences from King to Ace!</CardDescription>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🕷️</div>
            <h2 className="text-2xl font-bold mb-4">Spider Solitaire</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Build complete sequences from King to Ace to clear the board!
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Difficulty</label>
              <div className="flex gap-2 justify-center">
                <Button
                  variant={difficulty === '1suit' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('1suit')}
                >
                  1 Suit (Easy)
                </Button>
                <Button
                  variant={difficulty === '2suit' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('2suit')}
                >
                  2 Suits (Medium)
                </Button>
                <Button
                  variant={difficulty === '4suit' ? 'default' : 'outline'}
                  onClick={() => setDifficulty('4suit')}
                >
                  4 Suits (Hard)
                </Button>
              </div>
            </div>
            <Button onClick={startGame} size="lg">Start Game</Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div className="flex justify-between mb-4">
              <div className="flex gap-4">
                <span>Moves: {moves}</span>
                <span>Score: {score}</span>
                <span>Sets: {completedSets}/8</span>
                <span>Stock: {Math.floor(stock.length / 10)} deals</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={useHint} size="sm" variant="outline" disabled={hints === 0}>
                  Hint ({hints})
                </Button>
                <Button onClick={undo} size="sm" variant="outline" disabled={history.length === 0}>
                  <Undo className="w-4 h-4" />
                </Button>
                <Button onClick={dealFromStock} size="sm" disabled={stock.length === 0}>
                  Deal Cards
                </Button>
              </div>
            </div>

            {/* Game tableau */}
            <div className="grid grid-cols-10 gap-2">
              {columns.map((column, colIndex) => (
                <div
                  key={colIndex}
                  className="min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded p-1"
                  onClick={() => handleColumnClick(colIndex)}
                >
                  {column.cards.length === 0 ? (
                    <div className="h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded" />
                  ) : (
                    <div className="relative">
                      {column.cards.map((card, cardIndex) => (
                        <div
                          key={card.id}
                          className={`
                            absolute bg-white dark:bg-gray-700 border-2 rounded p-1 cursor-pointer
                            ${selectedCards?.col === colIndex && cardIndex >= column.cards.length - selectedCards.cards.length 
                              ? 'ring-2 ring-blue-500' : 'border-gray-400'}
                          `}
                          style={{ top: `${cardIndex * 25}px`, width: '60px', height: '80px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (card.faceUp) handleCardClick(colIndex, cardIndex);
                          }}
                        >
                          {card.faceUp ? (
                            <div className={`text-center ${getCardColor(card.suit)}`}>
                              <div className="font-bold">{rankSymbols[card.rank - 1]}</div>
                              <div className="text-xl">{getSuitSymbol(card.suit)}</div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-blue-800 rounded" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="text-center py-8">
            <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
            <p className="text-xl mb-2">You won in {moves} moves!</p>
            <p className="text-lg mb-6">Final Score: {score}</p>
            <Button onClick={() => setGameState('menu')} size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}