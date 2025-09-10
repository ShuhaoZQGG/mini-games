'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Heart, RotateCcw, Star, Trophy } from 'lucide-react';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type PlayingCard = {
  suit: Suit;
  rank: Rank;
  id: string;
  value: number;
};

type Player = {
  name: string;
  hand: PlayingCard[];
  tricks: PlayingCard[][];
  score: number;
  roundScore: number;
};

export default function Hearts() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTrick, setCurrentTrick] = useState<{ player: number; card: PlayingCard }[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [leadPlayer, setLeadPlayer] = useState(0);
  const [heartsBroken, setHeartsBroken] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<'passing' | 'playing' | 'scoring' | 'gameOver'>('passing');
  const [passDirection, setPassDirection] = useState<'left' | 'right' | 'across' | 'none'>('left');
  const [round, setRound] = useState(1);
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const rankValues: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  const createDeck = useCallback((): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}`,
          value: rankValues[rank],
        });
      });
    });
    return shuffleDeck(deck);
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
    const deck = createDeck();
    const newPlayers: Player[] = [
      { name: 'You', hand: [], tricks: [], score: 0, roundScore: 0 },
      { name: 'West', hand: [], tricks: [], score: 0, roundScore: 0 },
      { name: 'North', hand: [], tricks: [], score: 0, roundScore: 0 },
      { name: 'East', hand: [], tricks: [], score: 0, roundScore: 0 },
    ];

    // Deal 13 cards to each player
    for (let i = 0; i < 52; i++) {
      newPlayers[i % 4].hand.push(deck[i]);
    }

    // Sort hands
    newPlayers.forEach(player => {
      player.hand.sort((a, b) => {
        if (a.suit !== b.suit) {
          return suits.indexOf(a.suit) - suits.indexOf(b.suit);
        }
        return a.value - b.value;
      });
    });

    // Find player with 2 of clubs
    const startPlayerIndex = newPlayers.findIndex(player => 
      player.hand.some(card => card.suit === '♣' && card.rank === '2')
    );

    setPlayers(newPlayers);
    setLeadPlayer(startPlayerIndex);
    setCurrentPlayer(startPlayerIndex);
    setCurrentTrick([]);
    setHeartsBroken(false);
    setSelectedCards([]);
    setGamePhase(passDirection === 'none' ? 'playing' : 'passing');
  }, [createDeck, passDirection]);

  const canPlayCard = (card: PlayingCard, hand: PlayingCard[]): boolean => {
    // First card of the game must be 2 of clubs
    if (currentTrick.length === 0 && players.every(p => p.tricks.length === 0)) {
      return card.suit === '♣' && card.rank === '2';
    }

    // If leading
    if (currentTrick.length === 0) {
      // Can't lead hearts until broken (unless only hearts in hand)
      if (card.suit === '♥' && !heartsBroken) {
        const hasNonHearts = hand.some(c => c.suit !== '♥');
        return !hasNonHearts;
      }
      return true;
    }

    // Must follow suit if possible
    const leadSuit = currentTrick[0].card.suit;
    const hasSuit = hand.some(c => c.suit === leadSuit);
    
    if (hasSuit) {
      return card.suit === leadSuit;
    }

    // First trick: no points allowed
    if (players.every(p => p.tricks.length === 0)) {
      return card.suit !== '♥' && !(card.suit === '♠' && card.rank === 'Q');
    }

    return true;
  };

  const calculateTrickWinner = (trick: { player: number; card: PlayingCard }[]): number => {
    const leadSuit = trick[0].card.suit;
    const suitCards = trick.filter(t => t.card.suit === leadSuit);
    const highest = suitCards.reduce((max, t) => 
      t.card.value > max.card.value ? t : max
    );
    return highest.player;
  };

  const calculateTrickPoints = (cards: PlayingCard[]): number => {
    let points = 0;
    cards.forEach(card => {
      if (card.suit === '♥') points += 1;
      if (card.suit === '♠' && card.rank === 'Q') points += 13;
    });
    return points;
  };

  const handleCardClick = (card: PlayingCard) => {
    if (gamePhase === 'passing') {
      const isSelected = selectedCards.includes(card.id);
      if (isSelected) {
        setSelectedCards(selectedCards.filter(id => id !== card.id));
      } else if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, card.id]);
      }
    } else if (gamePhase === 'playing' && currentPlayer === 0) {
      if (canPlayCard(card, players[0].hand)) {
        playCard(0, card);
      }
    }
  };

  const playCard = (playerIndex: number, card: PlayingCard) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].hand = newPlayers[playerIndex].hand.filter(c => c.id !== card.id);
    
    const newTrick = [...currentTrick, { player: playerIndex, card }];
    setCurrentTrick(newTrick);
    
    // Check if hearts broken
    if (card.suit === '♥') {
      setHeartsBroken(true);
    }
    
    // If trick is complete
    if (newTrick.length === 4) {
      const winner = calculateTrickWinner(newTrick);
      const points = calculateTrickPoints(newTrick.map(t => t.card));
      
      newPlayers[winner].tricks.push(newTrick.map(t => t.card));
      newPlayers[winner].roundScore += points;
      
      setPlayers(newPlayers);
      
      // Check if round is over
      if (newPlayers[0].hand.length === 0) {
        endRound();
      } else {
        setTimeout(() => {
          setCurrentTrick([]);
          setLeadPlayer(winner);
          setCurrentPlayer(winner);
        }, 1500);
      }
    } else {
      setPlayers(newPlayers);
      setCurrentPlayer((currentPlayer + 1) % 4);
    }
  };

  const handlePass = () => {
    if (selectedCards.length === 3) {
      // Implement card passing logic
      const newPlayers = [...players];
      const passCards = selectedCards.map(id => 
        newPlayers[0].hand.find(c => c.id === id)!
      );
      
      // Remove from player's hand
      newPlayers[0].hand = newPlayers[0].hand.filter(c => !selectedCards.includes(c.id));
      
      // Add to target player (simplified - just give to next player)
      const targetPlayer = passDirection === 'left' ? 1 : passDirection === 'right' ? 3 : 2;
      newPlayers[targetPlayer].hand.push(...passCards);
      
      // Sort hands
      newPlayers.forEach(player => {
        player.hand.sort((a, b) => {
          if (a.suit !== b.suit) {
            return suits.indexOf(a.suit) - suits.indexOf(b.suit);
          }
          return a.value - b.value;
        });
      });
      
      setPlayers(newPlayers);
      setSelectedCards([]);
      setGamePhase('playing');
    }
  };

  const endRound = () => {
    const newPlayers = [...players];
    
    // Check for shooting the moon
    const moonShooter = newPlayers.find(p => p.roundScore === 26);
    if (moonShooter) {
      newPlayers.forEach(p => {
        if (p === moonShooter) {
          p.score += 0;
        } else {
          p.score += 26;
        }
      });
    } else {
      newPlayers.forEach(p => {
        p.score += p.roundScore;
      });
    }
    
    // Reset round scores
    newPlayers.forEach(p => {
      p.roundScore = 0;
      p.tricks = [];
    });
    
    setPlayers(newPlayers);
    setGamePhase('scoring');
    
    // Check for game over (100+ points)
    if (newPlayers.some(p => p.score >= 100)) {
      endGame();
    } else {
      // Next round
      setTimeout(() => {
        const directions: ('left' | 'right' | 'across' | 'none')[] = ['left', 'right', 'across', 'none'];
        setPassDirection(directions[(round) % 4]);
        setRound(round + 1);
        dealCards();
      }, 3000);
    }
  };

  const endGame = () => {
    setGamePhase('gameOver');
    
    const playerScore = players[0].score;
    const minScore = Math.min(...players.map(p => p.score));
    
    if (playerScore === minScore) {
      // Player won!
      let earnedStars = 1;
      if (playerScore === 0) earnedStars = 3;
      else if (playerScore < 50) earnedStars = 2;
      
      setStars(prev => Math.max(prev, earnedStars));
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1);
      }
      
      localStorage.setItem('heartsProgress', JSON.stringify({
        level,
        stars: Math.max(stars, earnedStars),
        bestScore: Math.min(playerScore, 
          parseInt(localStorage.getItem('heartsBestScore') || '999')),
      }));
    }
  };

  // Computer AI
  useEffect(() => {
    if (gamePhase === 'playing' && currentPlayer !== 0 && currentTrick.length < 4) {
      const timer = setTimeout(() => {
        const player = players[currentPlayer];
        const playableCards = player.hand.filter(c => canPlayCard(c, player.hand));
        
        let cardToPlay: PlayingCard;
        
        if (difficulty === 'easy') {
          // Random valid card
          cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)];
        } else {
          // Smarter play
          if (currentTrick.length === 0) {
            // Leading - play low card
            cardToPlay = playableCards.sort((a, b) => a.value - b.value)[0];
          } else {
            // Following - try to avoid taking trick with points
            const trickHasPoints = currentTrick.some(t => 
              t.card.suit === '♥' || (t.card.suit === '♠' && t.card.rank === 'Q')
            );
            
            if (trickHasPoints) {
              // Play lowest card
              cardToPlay = playableCards.sort((a, b) => a.value - b.value)[0];
            } else {
              // Safe to take trick - play highest card below current winner
              const leadSuit = currentTrick[0].card.suit;
              const currentHighest = Math.max(...currentTrick
                .filter(t => t.card.suit === leadSuit)
                .map(t => t.card.value)
              );
              
              const safeCards = playableCards.filter(c => 
                c.suit !== leadSuit || c.value < currentHighest
              );
              
              cardToPlay = safeCards.length > 0 
                ? safeCards.sort((a, b) => b.value - a.value)[0]
                : playableCards.sort((a, b) => a.value - b.value)[0];
            }
          }
        }
        
        playCard(currentPlayer, cardToPlay);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gamePhase, currentTrick, players, difficulty]);

  // Initialize game
  useEffect(() => {
    dealCards();
    const saved = localStorage.getItem('heartsProgress');
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
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Hearts</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">Level {level}</Badge>
            <Badge variant="outline">Round {round}</Badge>
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
        <div className="grid grid-cols-4 gap-2 bg-secondary/50 rounded-lg p-3">
          {players.map((player, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-muted-foreground">{player.name}</p>
              <p className="text-lg font-bold">{player.score}</p>
              {player.roundScore > 0 && (
                <p className="text-xs text-red-500">+{player.roundScore}</p>
              )}
            </div>
          ))}
        </div>

        {/* Game phase indicator */}
        <div className="text-center">
          <Badge variant={gamePhase === 'playing' ? 'default' : 'secondary'}>
            {gamePhase === 'passing' && `Pass 3 cards ${passDirection}`}
            {gamePhase === 'playing' && (currentPlayer === 0 ? 'Your turn' : `${players[currentPlayer]?.name}'s turn`)}
            {gamePhase === 'scoring' && 'Round complete!'}
            {gamePhase === 'gameOver' && 'Game Over!'}
          </Badge>
          {heartsBroken && (
            <Badge variant="destructive" className="ml-2">
              <Heart className="w-3 h-3 mr-1" />
              Hearts Broken
            </Badge>
          )}
        </div>

        {/* Play area */}
        <div className="relative h-64 bg-green-800/20 rounded-lg flex items-center justify-center">
          {currentTrick.map((play, index) => {
            const positions = [
              { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
              { left: '10px', top: '50%', transform: 'translateY(-50%)' },
              { top: '10px', left: '50%', transform: 'translateX(-50%)' },
              { right: '10px', top: '50%', transform: 'translateY(-50%)' },
            ];
            
            return (
              <motion.div
                key={index}
                className={`absolute w-16 h-24 bg-white rounded-lg border-2 border-gray-800 shadow-lg flex items-center justify-center text-xl font-bold ${
                  getCardColor(play.card.suit)
                }`}
                style={positions[play.player]}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
              >
                <div className="text-center">
                  <div>{play.card.rank}</div>
                  <div>{play.card.suit}</div>
                </div>
              </motion.div>
            );
          })}
          
          {currentTrick.length === 0 && (
            <p className="text-muted-foreground">
              {currentPlayer === 0 ? 'Play a card' : 'Waiting for play...'}
            </p>
          )}
        </div>

        {/* Pass cards button */}
        {gamePhase === 'passing' && (
          <div className="text-center">
            <Button
              onClick={handlePass}
              disabled={selectedCards.length !== 3}
              className="mb-2"
            >
              Pass {selectedCards.length}/3 Cards {passDirection}
            </Button>
          </div>
        )}

        {/* Player hand */}
        {players[0] && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your hand</p>
            <div className="flex gap-1 flex-wrap justify-center">
              {players[0].hand.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                const canPlay = gamePhase === 'playing' && currentPlayer === 0 && 
                               canPlayCard(card, players[0].hand);
                
                return (
                  <motion.div
                    key={card.id}
                    className={`w-14 h-20 bg-white rounded-lg border-2 shadow-lg flex items-center justify-center text-lg font-bold cursor-pointer
                      ${getCardColor(card.suit)}
                      ${isSelected ? 'border-blue-500 -translate-y-2' : 'border-gray-800'}
                      ${canPlay ? 'hover:scale-110' : gamePhase === 'passing' ? 'hover:scale-105' : 'opacity-60'}
                    `}
                    whileHover={canPlay || gamePhase === 'passing' ? { y: -5 } : {}}
                    whileTap={canPlay || gamePhase === 'passing' ? { scale: 0.95 } : {}}
                    onClick={() => handleCardClick(card)}
                  >
                    <div className="text-center text-sm">
                      <div>{card.rank}</div>
                      <div>{card.suit}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game over message */}
        {gamePhase === 'gameOver' && (
          <motion.div
            className="text-center p-4 bg-primary/10 rounded-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
            <p className="text-xl font-bold">
              Game Over! {players[0].score === Math.min(...players.map(p => p.score)) ? 'You won!' : `${players.find(p => p.score === Math.min(...players.map(p => p.score)))?.name} won!`}
            </p>
            <div className="mt-2">
              {players.sort((a, b) => a.score - b.score).map((player, index) => (
                <p key={index} className="text-sm">
                  {index + 1}. {player.name}: {player.score} points
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}