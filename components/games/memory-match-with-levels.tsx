'use client';

import { useState, useEffect } from 'react';
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchConfig {
  gridSize: number;
  timeLimit?: number;
  theme?: string;
}

function MemoryMatchGame({ config, onScore }: { config: MemoryMatchConfig; onScore: (score: number) => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit || 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎯', '🎰', '🎱', '🏀', '⚽', '🏈', '🎾', '🏐', '🏓'];

  useEffect(() => {
    initializeGame();
  }, [config]);

  useEffect(() => {
    if (gameStarted && config.timeLimit && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && config.timeLimit) {
      endGame();
    }
  }, [timeLeft, gameStarted, gameOver]);

  const initializeGame = () => {
    const pairCount = (config.gridSize * config.gridSize) / 2;
    const selectedEmojis = emojis.slice(0, pairCount);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    
    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setTimeLeft(config.timeLimit || 0);
    setGameStarted(false);
    setGameOver(false);
  };

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (gameOver || selectedCards.length === 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(moves + 1);
      checkForMatch(newSelected);
    }
  };

  const checkForMatch = (selected: number[]) => {
    const [first, second] = selected;
    const firstCard = cards.find(c => c.id === first);
    const secondCard = cards.find(c => c.id === second);

    if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        const newMatched = matchedPairs + 1;
        setMatchedPairs(newMatched);
        setSelectedCards([]);
        
        if (newMatched === (config.gridSize * config.gridSize) / 2) {
          endGame();
        }
      }, 500);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, isFlipped: false } : c
        ));
        setSelectedCards([]);
      }, 1000);
    }
  };

  const endGame = () => {
    setGameOver(true);
    const score = calculateScore();
    onScore(score);
  };

  const calculateScore = () => {
    const baseScore = matchedPairs * 100;
    const movePenalty = Math.max(0, moves - (config.gridSize * config.gridSize / 2)) * 10;
    const timeBonus = config.timeLimit ? timeLeft * 5 : 0;
    return Math.max(0, baseScore - movePenalty + timeBonus);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>Moves: {moves}</div>
        <div>Matched: {matchedPairs}/{(config.gridSize * config.gridSize) / 2}</div>
        {config.timeLimit && <div>Time: {timeLeft}s</div>}
      </div>

      <div 
        className="grid gap-2 max-w-2xl mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${config.gridSize}, 1fr)`,
          aspectRatio: '1'
        }}
      >
        {cards.map(card => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={`h-full cursor-pointer ${
                card.isMatched ? 'bg-green-500/20' : ''
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              <CardContent className="flex items-center justify-center h-full p-2">
                <span className="text-3xl">
                  {card.isFlipped || card.isMatched ? card.emoji : '?'}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {gameOver && (
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Game Over!</h3>
          <p>Score: {calculateScore()}</p>
          <Button onClick={initializeGame}>Play Again</Button>
        </div>
      )}
    </div>
  );
}

export default function MemoryMatchWithLevels() {
  const levels: GameLevel[] = [
    {
      id: 1,
      name: 'Beginner',
      difficulty: 'easy',
      config: { gridSize: 4 },
      requiredStars: 0
    },
    {
      id: 2,
      name: 'Casual',
      difficulty: 'easy',
      config: { gridSize: 4, timeLimit: 60 },
      requiredStars: 1
    },
    {
      id: 3,
      name: 'Intermediate',
      difficulty: 'medium',
      config: { gridSize: 6 },
      requiredStars: 3
    },
    {
      id: 4,
      name: 'Timed Challenge',
      difficulty: 'medium',
      config: { gridSize: 6, timeLimit: 90 },
      requiredStars: 5
    },
    {
      id: 5,
      name: 'Advanced',
      difficulty: 'hard',
      config: { gridSize: 8 },
      requiredStars: 8
    },
    {
      id: 6,
      name: 'Expert',
      difficulty: 'hard',
      config: { gridSize: 8, timeLimit: 120 },
      requiredStars: 12
    },
    {
      id: 7,
      name: 'Master',
      difficulty: 'expert',
      config: { gridSize: 10 },
      requiredStars: 15
    },
    {
      id: 8,
      name: 'Grand Master',
      difficulty: 'master',
      config: { gridSize: 10, timeLimit: 150 },
      requiredStars: 20
    }
  ];

  const getStars = (score: number, config: MemoryMatchConfig): 1 | 2 | 3 => {
    const maxScore = (config.gridSize * config.gridSize / 2) * 100 + (config.timeLimit || 0) * 5;
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) return 3;
    if (percentage >= 60) return 2;
    return 1;
  };

  return (
    <GameWithLevels
      gameId="memory-match"
      gameName="Memory Match"
      levels={levels}
      renderGame={(config, onScore) => (
        <MemoryMatchGame config={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  );
}