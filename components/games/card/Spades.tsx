'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Spade, RotateCcw, Star, Trophy, Target } from 'lucide-react';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
type PlayingCard = {
  suit: Suit;
  rank: Rank;
  id: string;
  value: number;
};

type Team = {
  players: number[];
  bid: number;
  tricks: number;
  score: number;
  bags: number;
};

type Player = {
  name: string;
  hand: PlayingCard[];
  bid: number;
};

export default function Spades() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([
    { players: [0, 2], bid: 0, tricks: 0, score: 0, bags: 0 },
    { players: [1, 3], bid: 0, tricks: 0, score: 0, bags: 0 },
  ]);
  const [currentTrick, setCurrentTrick] = useState<{ player: number; card: PlayingCard }[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [leadPlayer, setLeadPlayer] = useState(0);
  const [spadesBroken, setSpadesBroken] = useState(false);
  const [gamePhase, setGamePhase] = useState<'bidding' | 'playing' | 'scoring' | 'gameOver'>('bidding');
  const [selectedBid, setSelectedBid] = useState(0);
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [round, setRound] = useState(1);

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
      { name: 'You', hand: [], bid: 0 },
      { name: 'West', hand: [], bid: 0 },
      { name: 'Partner', hand: [], bid: 0 },
      { name: 'East', hand: [], bid: 0 },
    ];

    // Deal 13 cards to each player
    for (let i = 0; i < 52; i++) {
      newPlayers[i % 4].hand.push(deck[i]);
    }

    // Sort hands
    newPlayers.forEach(player => {
      player.hand.sort((a, b) => {
        if (a.suit !== b.suit) {
          // Spades first
          if (a.suit === '♠') return -1;
          if (b.suit === '♠') return 1;
          return suits.indexOf(a.suit) - suits.indexOf(b.suit);
        }
        return b.value - a.value;
      });
    });

    setPlayers(newPlayers);
    setCurrentPlayer(0);
    setLeadPlayer(0);
    setCurrentTrick([]);
    setSpadesBroken(false);
    setSelectedBid(0);
    setGamePhase('bidding');
    
    // Reset team tricks for new hand
    setTeams(prev => prev.map(team => ({ ...team, bid: 0, tricks: 0 })));
  }, [createDeck]);

  const canPlayCard = (card: PlayingCard, hand: PlayingCard[]): boolean => {
    // If leading
    if (currentTrick.length === 0) {
      // Can't lead spades until broken (unless only spades in hand)
      if (card.suit === '♠' && !spadesBroken) {
        const hasNonSpades = hand.some(c => c.suit !== '♠');
        return !hasNonSpades;
      }
      return true;
    }

    // Must follow suit if possible
    const leadSuit = currentTrick[0].card.suit;
    const hasSuit = hand.some(c => c.suit === leadSuit);
    
    if (hasSuit) {
      return card.suit === leadSuit;
    }

    return true;
  };

  const calculateTrickWinner = (trick: { player: number; card: PlayingCard }[]): number => {
    // Spades trump all other suits
    const spades = trick.filter(t => t.card.suit === '♠');
    if (spades.length > 0) {
      return spades.reduce((max, t) => 
        t.card.value > max.card.value ? t : max
      ).player;
    }

    // Otherwise highest card of lead suit wins
    const leadSuit = trick[0].card.suit;
    const suitCards = trick.filter(t => t.card.suit === leadSuit);
    return suitCards.reduce((max, t) => 
      t.card.value > max.card.value ? t : max
    ).player;
  };

  const estimateBid = (hand: PlayingCard[]): number => {
    let bid = 0;
    
    // Count spades (trumps)
    const spades = hand.filter(c => c.suit === '♠');
    spades.forEach(card => {
      if (card.value >= 11) bid += 1; // Face cards and aces
      else if (card.value >= 9) bid += 0.5; // 9, 10
    });
    
    // Count high cards in other suits
    suits.filter(s => s !== '♠').forEach(suit => {
      const suitCards = hand.filter(c => c.suit === suit);
      const highCards = suitCards.filter(c => c.value >= 13); // K, A
      bid += highCards.length * 0.5;
    });
    
    return Math.max(1, Math.round(bid));
  };

  const handleBidSubmit = () => {
    const newPlayers = [...players];
    newPlayers[0].bid = selectedBid;
    
    // AI bids for other players
    for (let i = 1; i < 4; i++) {
      const bid = estimateBid(newPlayers[i].hand);
      newPlayers[i].bid = difficulty === 'easy' 
        ? Math.max(1, Math.min(4, bid + Math.floor(Math.random() * 3) - 1))
        : bid;
    }
    
    setPlayers(newPlayers);
    
    // Update team bids
    const newTeams = [...teams];
    newTeams[0].bid = newPlayers[0].bid + newPlayers[2].bid;
    newTeams[1].bid = newPlayers[1].bid + newPlayers[3].bid;
    setTeams(newTeams);
    
    setGamePhase('playing');
  };

  const playCard = (playerIndex: number, card: PlayingCard) => {
    const newPlayers = [...players];
    newPlayers[playerIndex].hand = newPlayers[playerIndex].hand.filter(c => c.id !== card.id);
    
    const newTrick = [...currentTrick, { player: playerIndex, card }];
    setCurrentTrick(newTrick);
    
    // Check if spades broken
    if (card.suit === '♠') {
      setSpadesBroken(true);
    }
    
    // If trick is complete
    if (newTrick.length === 4) {
      const winner = calculateTrickWinner(newTrick);
      const teamIndex = teams.findIndex(team => team.players.includes(winner));
      
      const newTeams = [...teams];
      newTeams[teamIndex].tricks += 1;
      setTeams(newTeams);
      
      setPlayers(newPlayers);
      
      // Check if hand is over (all cards played)
      if (newPlayers[0].hand.length === 0) {
        endHand();
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

  const handleCardClick = (card: PlayingCard) => {
    if (gamePhase === 'playing' && currentPlayer === 0) {
      if (canPlayCard(card, players[0].hand)) {
        playCard(0, card);
      }
    }
  };

  const endHand = () => {
    const newTeams = [...teams];
    
    newTeams.forEach(team => {
      if (team.bid === 0) {
        // Nil bid
        if (team.tricks === 0) {
          team.score += 100;
        } else {
          team.score -= 100;
        }
      } else if (team.tricks >= team.bid) {
        // Made bid
        const overtricks = team.tricks - team.bid;
        team.score += team.bid * 10 + overtricks;
        team.bags += overtricks;
        
        // Bag penalty
        if (team.bags >= 10) {
          team.score -= 100;
          team.bags -= 10;
        }
      } else {
        // Failed bid
        team.score -= team.bid * 10;
      }
    });
    
    setTeams(newTeams);
    setGamePhase('scoring');
    
    // Check for game over (500 points)
    if (newTeams.some(team => team.score >= 500)) {
      endGame();
    } else {
      // Next hand
      setTimeout(() => {
        setRound(round + 1);
        dealCards();
      }, 3000);
    }
  };

  const endGame = () => {
    setGamePhase('gameOver');
    
    const playerTeamScore = teams[0].score;
    const opponentTeamScore = teams[1].score;
    
    if (playerTeamScore > opponentTeamScore) {
      // Player's team won!
      let earnedStars = 1;
      if (playerTeamScore >= 700) earnedStars = 3;
      else if (playerTeamScore >= 600) earnedStars = 2;
      
      setStars(prev => Math.max(prev, earnedStars));
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1);
      }
      
      localStorage.setItem('spadesProgress', JSON.stringify({
        level,
        stars: Math.max(stars, earnedStars),
        highScore: Math.max(playerTeamScore, 
          parseInt(localStorage.getItem('spadesHighScore') || '0')),
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
          const teamIndex = teams.findIndex(team => team.players.includes(currentPlayer));
          const team = teams[teamIndex];
          const needTricks = team.bid - team.tricks;
          
          if (currentTrick.length === 0) {
            // Leading
            if (needTricks > 0) {
              // Try to win tricks - lead high
              cardToPlay = playableCards.sort((a, b) => {
                if (a.suit === '♠' && b.suit !== '♠') return -1;
                if (b.suit === '♠' && a.suit !== '♠') return 1;
                return b.value - a.value;
              })[0];
            } else {
              // Avoid overtricks - lead low
              cardToPlay = playableCards.sort((a, b) => a.value - b.value)[0];
            }
          } else {
            // Following
            const leadSuit = currentTrick[0].card.suit;
            const currentWinner = calculateTrickWinner(currentTrick);
            const partnerPlayed = currentTrick.some(t => 
              teams[teamIndex].players.includes(t.player) && t.player !== currentPlayer
            );
            
            if (needTricks > 0 || (partnerPlayed && teams[teamIndex].players.includes(currentWinner))) {
              // Try to win or support partner
              const winningCards = playableCards.filter(card => {
                const testTrick = [...currentTrick, { player: currentPlayer, card }];
                return calculateTrickWinner(testTrick) === currentPlayer;
              });
              
              cardToPlay = winningCards.length > 0
                ? winningCards.sort((a, b) => a.value - b.value)[0]
                : playableCards.sort((a, b) => a.value - b.value)[0];
            } else {
              // Avoid winning - play low
              cardToPlay = playableCards.sort((a, b) => a.value - b.value)[0];
            }
          }
        }
        
        playCard(currentPlayer, cardToPlay);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gamePhase, currentTrick, players, teams, difficulty]);

  // Initialize game
  useEffect(() => {
    dealCards();
    const saved = localStorage.getItem('spadesProgress');
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
          <CardTitle className="text-2xl font-bold">Spades</CardTitle>
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

        {/* Team scores and bids */}
        <div className="grid grid-cols-2 gap-4 bg-secondary/50 rounded-lg p-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Your Team (You & Partner)</p>
            <p className="text-xl font-bold">{teams[0].score}</p>
            <div className="flex justify-center gap-4 text-sm">
              <span>Bid: {teams[0].bid}</span>
              <span>Tricks: {teams[0].tricks}</span>
              <span>Bags: {teams[0].bags}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Opponents (West & East)</p>
            <p className="text-xl font-bold">{teams[1].score}</p>
            <div className="flex justify-center gap-4 text-sm">
              <span>Bid: {teams[1].bid}</span>
              <span>Tricks: {teams[1].tricks}</span>
              <span>Bags: {teams[1].bags}</span>
            </div>
          </div>
        </div>

        {/* Game phase and status */}
        <div className="text-center">
          <Badge variant={gamePhase === 'playing' ? 'default' : 'secondary'}>
            {gamePhase === 'bidding' && 'Bidding Phase'}
            {gamePhase === 'playing' && (currentPlayer === 0 ? 'Your turn' : `${players[currentPlayer]?.name}'s turn`)}
            {gamePhase === 'scoring' && 'Hand complete!'}
            {gamePhase === 'gameOver' && 'Game Over!'}
          </Badge>
          {spadesBroken && (
            <Badge variant="outline" className="ml-2">
              <Spade className="w-3 h-3 mr-1" />
              Spades Broken
            </Badge>
          )}
        </div>

        {/* Bidding interface */}
        {gamePhase === 'bidding' && (
          <div className="bg-background/95 backdrop-blur rounded-lg p-4 border">
            <p className="text-center mb-3">Select your bid:</p>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(bid => (
                <Button
                  key={bid}
                  size="sm"
                  variant={selectedBid === bid ? 'default' : 'outline'}
                  onClick={() => setSelectedBid(bid)}
                >
                  {bid}
                </Button>
              ))}
            </div>
            <div className="text-center">
              <Button onClick={handleBidSubmit} disabled={selectedBid === null}>
                <Target className="w-4 h-4 mr-1" />
                Submit Bid
              </Button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              {players.slice(1).map((player, index) => (
                <p key={index}>
                  {player.name}: {player.bid > 0 ? `Bid ${player.bid}` : 'Thinking...'}
                </p>
              ))}
            </div>
          </div>
        )}

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
          
          {currentTrick.length === 0 && gamePhase === 'playing' && (
            <p className="text-muted-foreground">
              {currentPlayer === 0 ? 'Play a card' : 'Waiting for play...'}
            </p>
          )}
        </div>

        {/* Player hand */}
        {players[0] && gamePhase !== 'bidding' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Your hand</p>
              <p className="text-sm text-muted-foreground">Your bid: {players[0].bid}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-center">
              {players[0].hand.map((card) => {
                const canPlay = gamePhase === 'playing' && currentPlayer === 0 && 
                               canPlayCard(card, players[0].hand);
                
                return (
                  <motion.div
                    key={card.id}
                    className={`w-14 h-20 bg-white rounded-lg border-2 shadow-lg flex items-center justify-center text-lg font-bold cursor-pointer
                      ${getCardColor(card.suit)}
                      ${canPlay ? 'border-green-500 hover:scale-110' : 'border-gray-800 opacity-60'}
                    `}
                    whileHover={canPlay ? { y: -5 } : {}}
                    whileTap={canPlay ? { scale: 0.95 } : {}}
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
              Game Over! {teams[0].score > teams[1].score ? 'Your team won!' : 'Opponents won!'}
            </p>
            <div className="mt-2">
              <p className="text-sm">Final Scores:</p>
              <p>Your Team: {teams[0].score}</p>
              <p>Opponents: {teams[1].score}</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}