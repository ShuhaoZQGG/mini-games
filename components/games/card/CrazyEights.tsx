'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Shuffle, RotateCcw, Star, Trophy } from 'lucide-react';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type PlayingCard = {
  suit: Suit;
  rank: Rank;
  id: string;
};

export default function CrazyEights() {
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [computerHand, setComputerHand] = useState<PlayingCard[]>([]);
  const [discardPile, setDiscardPile] = useState<PlayingCard[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [mustDraw, setMustDraw] = useState(false);
  const [drawnCard, setDrawnCard] = useState(false);
  const [choosingSuit, setChoosingSuit] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createDeck = useCallback((): PlayingCard[] => {
    const newDeck: PlayingCard[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({
          suit,
          rank,
          id: `${suit}-${rank}-${Math.random()}`,
        });
      });
    });
    return shuffleDeck(newDeck);
  }, []);

  const shuffleDeck = (cards: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const dealCards = useCallback(() => {
    const newDeck = createDeck();
    const playerCards = newDeck.slice(0, 7);
    const computerCards = newDeck.slice(7, 14);
    const startCard = newDeck[14];
    const remainingDeck = newDeck.slice(15);

    setPlayerHand(playerCards);
    setComputerHand(computerCards);
    setDiscardPile([startCard]);
    setDeck(remainingDeck);
    setCurrentSuit(startCard.suit);
    setCurrentPlayer('player');
    setIsGameOver(false);
    setWinner(null);
    setMustDraw(false);
    setDrawnCard(false);
    setChoosingSuit(false);
    setSelectedCard(null);
  }, [createDeck]);

  const canPlayCard = (card: PlayingCard): boolean => {
    if (!discardPile.length) return true;
    
    const topCard = discardPile[discardPile.length - 1];
    
    // Eights are wild and can always be played
    if (card.rank === '8') return true;
    
    // Match rank or current suit
    return card.rank === topCard.rank || card.suit === currentSuit;
  };

  const getCardValue = (card: PlayingCard): number => {
    if (card.rank === '8') return 50;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 1;
    return parseInt(card.rank);
  };

  const calculateHandValue = (hand: PlayingCard[]): number => {
    return hand.reduce((sum, card) => sum + getCardValue(card), 0);
  };

  const drawCard = () => {
    if (deck.length === 0) {
      // Reshuffle discard pile except top card
      const topCard = discardPile[discardPile.length - 1];
      const newDeck = shuffleDeck(discardPile.slice(0, -1));
      setDeck(newDeck);
      setDiscardPile([topCard]);
    }

    if (deck.length > 0) {
      const drawnCard = deck[0];
      if (currentPlayer === 'player') {
        setPlayerHand([...playerHand, drawnCard]);
      } else {
        setComputerHand([...computerHand, drawnCard]);
      }
      setDeck(deck.slice(1));
      setDrawnCard(true);
      setMustDraw(true);
    }
  };

  const playCard = (card: PlayingCard, newSuit?: Suit) => {
    if (currentPlayer === 'player') {
      setPlayerHand(playerHand.filter(c => c.id !== card.id));
    } else {
      setComputerHand(computerHand.filter(c => c.id !== card.id));
    }
    
    setDiscardPile([...discardPile, card]);
    
    if (card.rank === '8' && newSuit) {
      setCurrentSuit(newSuit);
    } else {
      setCurrentSuit(card.suit);
    }
    
    setSelectedCard(null);
    setMustDraw(false);
    setDrawnCard(false);
    setChoosingSuit(false);
    
    // Check for win
    if (currentPlayer === 'player' && playerHand.length === 1) {
      endGame('player');
    } else if (currentPlayer === 'computer' && computerHand.length === 1) {
      endGame('computer');
    } else {
      setCurrentPlayer(currentPlayer === 'player' ? 'computer' : 'player');
    }
  };

  const handleCardClick = (card: PlayingCard) => {
    if (currentPlayer !== 'player' || isGameOver) return;
    
    if (canPlayCard(card)) {
      if (card.rank === '8') {
        setSelectedCard(card.id);
        setChoosingSuit(true);
      } else {
        playCard(card);
      }
    }
  };

  const handleSuitChoice = (suit: Suit) => {
    const card = playerHand.find(c => c.id === selectedCard);
    if (card) {
      playCard(card, suit);
    }
  };

  const handleDrawCard = () => {
    if (currentPlayer === 'player' && !drawnCard && !isGameOver) {
      drawCard();
    }
  };

  const handlePassTurn = () => {
    if (currentPlayer === 'player' && mustDraw) {
      setCurrentPlayer('computer');
      setMustDraw(false);
      setDrawnCard(false);
    }
  };

  const endGame = (gameWinner: 'player' | 'computer') => {
    setIsGameOver(true);
    setWinner(gameWinner);
    
    const loserHand = gameWinner === 'player' ? computerHand : playerHand;
    const points = calculateHandValue(loserHand);
    
    if (gameWinner === 'player') {
      setScore(prev => ({ ...prev, player: prev.player + points }));
      
      // Calculate stars
      let earnedStars = 1;
      if (points >= 100) earnedStars = 3;
      else if (points >= 50) earnedStars = 2;
      
      setStars(prev => Math.max(prev, earnedStars));
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1);
      }
      
      // Save progress
      localStorage.setItem('crazyEightsProgress', JSON.stringify({
        level,
        stars: Math.max(stars, earnedStars),
        highScore: Math.max(score.player + points, 
          parseInt(localStorage.getItem('crazyEightsHighScore') || '0')),
      }));
    } else {
      setScore(prev => ({ ...prev, computer: prev.computer + points }));
    }
  };

  // Computer AI
  useEffect(() => {
    if (currentPlayer === 'computer' && !isGameOver) {
      const timer = setTimeout(() => {
        const playableCards = computerHand.filter(canPlayCard);
        
        if (playableCards.length > 0) {
          let cardToPlay: PlayingCard;
          
          if (difficulty === 'easy') {
            // Random play
            cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
          } else if (difficulty === 'medium') {
            // Prefer non-8s first
            const non8s = playableCards.filter(c => c.rank !== '8');
            cardToPlay = non8s.length > 0 
              ? non8s[Math.floor(Math.random() * non8s.length)]
              : playableCards[0];
          } else {
            // Smart play - save 8s for when needed
            const non8s = playableCards.filter(c => c.rank !== '8');
            if (non8s.length > 0) {
              // Play highest value non-8
              cardToPlay = non8s.sort((a, b) => getCardValue(b) - getCardValue(a))[0];
            } else {
              cardToPlay = playableCards[0];
            }
          }
          
          if (cardToPlay.rank === '8') {
            // Choose suit with most cards
            const suitCounts = computerHand.reduce((acc, card) => {
              if (card.id !== cardToPlay.id) {
                acc[card.suit] = (acc[card.suit] || 0) + 1;
              }
              return acc;
            }, {} as Record<Suit, number>);
            
            const bestSuit = (Object.entries(suitCounts) as [Suit, number][])
              .sort((a, b) => b[1] - a[1])[0]?.[0] || '♠';
            
            playCard(cardToPlay, bestSuit);
          } else {
            playCard(cardToPlay);
          }
        } else {
          // Must draw
          drawCard();
          setTimeout(() => {
            const newPlayable = computerHand.filter(canPlayCard);
            if (newPlayable.length > 0 && drawnCard) {
              // Can play after drawing
              const cardToPlay = newPlayable[0];
              if (cardToPlay.rank === '8') {
                playCard(cardToPlay, cardToPlay.suit);
              } else {
                playCard(cardToPlay);
              }
            } else {
              // Pass turn
              setCurrentPlayer('player');
              setMustDraw(false);
              setDrawnCard(false);
            }
          }, 1000);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isGameOver, computerHand, difficulty]);

  // Initialize game
  useEffect(() => {
    dealCards();
    const saved = localStorage.getItem('crazyEightsProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      setLevel(parsed.level || 1);
      setStars(parsed.stars || 0);
    }
  }, [dealCards]);

  const getCardColor = (suit: Suit) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-black';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Crazy Eights</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">Level {level}</Badge>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game controls */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDifficulty('easy')}
              className={difficulty === 'easy' ? 'bg-primary text-primary-foreground' : ''}
            >
              Easy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDifficulty('medium')}
              className={difficulty === 'medium' ? 'bg-primary text-primary-foreground' : ''}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDifficulty('hard')}
              className={difficulty === 'hard' ? 'bg-primary text-primary-foreground' : ''}
            >
              Hard
            </Button>
          </div>
          <Button onClick={dealCards} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>

        {/* Score display */}
        <div className="flex justify-between items-center bg-secondary/50 rounded-lg p-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Player</p>
            <p className="text-xl font-bold">{score.player}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isGameOver ? `Game Over! ${winner === 'player' ? 'You win!' : 'Computer wins!'}` :
               `${currentPlayer === 'player' ? 'Your' : "Computer's"} turn`}
            </p>
            {currentSuit && (
              <p className={`text-2xl ${getCardColor(currentSuit)}`}>
                Current Suit: {currentSuit}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Computer</p>
            <p className="text-xl font-bold">{score.computer}</p>
          </div>
        </div>

        {/* Suit selection modal */}
        {choosingSuit && (
          <div className="bg-background/95 backdrop-blur rounded-lg p-4 border">
            <p className="text-center mb-3">Choose a suit for your 8:</p>
            <div className="flex justify-center gap-3">
              {suits.map(suit => (
                <Button
                  key={suit}
                  onClick={() => handleSuitChoice(suit)}
                  className={`text-3xl ${getCardColor(suit)}`}
                  variant="outline"
                >
                  {suit}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Computer hand (hidden) */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Computer's hand ({computerHand.length} cards)</p>
          <div className="flex gap-2 flex-wrap">
            {computerHand.map((_, index) => (
              <motion.div
                key={index}
                className="w-16 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-white shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
              />
            ))}
          </div>
        </div>

        {/* Play area */}
        <div className="flex justify-center items-center gap-8 py-4">
          {/* Draw pile */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Draw Pile ({deck.length})</p>
            <motion.div
              className="w-20 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-white shadow-lg cursor-pointer flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDrawCard}
            >
              <Shuffle className="w-8 h-8 text-white" />
            </motion.div>
            {currentPlayer === 'player' && !drawnCard && (
              <Button
                onClick={handleDrawCard}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                Draw Card
              </Button>
            )}
          </div>

          {/* Discard pile */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Discard Pile</p>
            <AnimatePresence mode="wait">
              {discardPile.length > 0 && (
                <motion.div
                  key={discardPile[discardPile.length - 1].id}
                  className={`w-20 h-28 bg-white rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center text-3xl font-bold ${
                    getCardColor(discardPile[discardPile.length - 1].suit)
                  }`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <div className="text-center">
                    <div>{discardPile[discardPile.length - 1].rank}</div>
                    <div>{discardPile[discardPile.length - 1].suit}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pass turn button */}
        {currentPlayer === 'player' && mustDraw && (
          <div className="flex justify-center">
            <Button onClick={handlePassTurn} variant="outline">
              Pass Turn
            </Button>
          </div>
        )}

        {/* Player hand */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Your hand</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {playerHand.map((card) => {
              const canPlay = canPlayCard(card);
              return (
                <motion.div
                  key={card.id}
                  className={`w-20 h-28 bg-white rounded-lg border-2 shadow-lg flex items-center justify-center text-2xl font-bold cursor-pointer
                    ${getCardColor(card.suit)}
                    ${canPlay && currentPlayer === 'player' ? 'border-green-500 hover:scale-105' : 'border-gray-800 opacity-60'}
                    ${selectedCard === card.id ? 'ring-4 ring-blue-500' : ''}
                  `}
                  whileHover={canPlay && currentPlayer === 'player' ? { scale: 1.1, y: -10 } : {}}
                  whileTap={canPlay && currentPlayer === 'player' ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(card)}
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring' }}
                >
                  <div className="text-center">
                    <div>{card.rank}</div>
                    <div>{card.suit}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Win message */}
        {isGameOver && (
          <motion.div
            className="text-center p-4 bg-primary/10 rounded-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
            <p className="text-xl font-bold">
              {winner === 'player' ? 'Congratulations! You won!' : 'Computer wins this round!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Points scored: {winner === 'player' ? calculateHandValue(computerHand) : calculateHandValue(playerHand)}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}