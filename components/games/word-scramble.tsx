'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlayCircle, RotateCcw, Trophy, Brain, Clock, Shuffle, CheckCircle } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

const WORD_LISTS = {
  easy: ['cat', 'dog', 'sun', 'moon', 'star', 'tree', 'book', 'fish', 'bird', 'home'],
  medium: ['puzzle', 'garden', 'castle', 'dragon', 'forest', 'planet', 'window', 'bridge', 'camera', 'flower'],
  hard: ['elephant', 'mountain', 'adventure', 'chocolate', 'butterfly', 'dinosaur', 'telescope', 'hurricane', 'parachute', 'orchestra']
};

type Difficulty = 'easy' | 'medium' | 'hard';

export default function WordScramble() {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [correctWords, setCorrectWords] = useState(0);
  const [hints, setHints] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  const { updateScore } = useGameStore();

  const scrambleWord = (word: string): string => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Make sure it's actually scrambled
    return letters.join('') === word ? scrambleWord(word) : letters.join('');
  };

  const getNewWord = useCallback(() => {
    const wordList = WORD_LISTS[difficulty];
    const availableWords = wordList.filter(word => !usedWords.has(word));
    
    if (availableWords.length === 0) {
      // Reset used words if we've gone through all
      setUsedWords(new Set());
      return wordList[Math.floor(Math.random() * wordList.length)];
    }
    
    const word = availableWords[Math.floor(Math.random() * availableWords.length)];
    setUsedWords(prev => new Set(prev).add(word));
    return word;
  }, [difficulty, usedWords]);

  const generateNewWord = useCallback(() => {
    const word = getNewWord();
    setCurrentWord(word);
    setScrambledWord(scrambleWord(word));
    setUserGuess('');
    setShowHint(false);
    setShowFeedback(null);
  }, [getNewWord]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setIsPlaying(true);
    setCorrectWords(0);
    setHints(3);
    setUsedWords(new Set());
    generateNewWord();
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
      updateScore('word-scramble', score);
    }
  };

  const checkAnswer = () => {
    if (userGuess.toLowerCase() === currentWord.toLowerCase()) {
      // Correct!
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      const timeBonus = Math.floor(timeLeft / 10);
      const totalPoints = points + timeBonus;
      
      setScore(prev => prev + totalPoints);
      setCorrectWords(prev => prev + 1);
      setShowFeedback('correct');
      
      // Level up every 5 correct words
      if ((correctWords + 1) % 5 === 0) {
        setLevel(prev => prev + 1);
        setTimeLeft(prev => Math.min(prev + 15, 90));
      }
      
      setTimeout(() => {
        generateNewWord();
      }, 1000);
    } else {
      // Wrong!
      setShowFeedback('wrong');
      setTimeLeft(prev => Math.max(prev - 5, 0));
      setTimeout(() => {
        setShowFeedback(null);
      }, 1000);
    }
  };

  const useHint = () => {
    if (hints > 0 && !showHint) {
      setHints(prev => prev - 1);
      setShowHint(true);
    }
  };

  const reshuffleWord = () => {
    setScrambledWord(scrambleWord(currentWord));
  };

  // Timer effect
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
  }, [isPlaying, timeLeft]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('wordScrambleHighScore');
    if (saved) setHighScore(Number(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('wordScrambleHighScore', highScore.toString());
    }
  }, [highScore]);

  return (
    <Card className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Word Scramble
        </h1>
        <p className="text-muted-foreground">
          Unscramble the letters to form words!
        </p>
      </div>

      {/* Difficulty Selection */}
      {!isPlaying && (
        <div className="flex justify-center gap-2 mb-6">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              variant={difficulty === diff ? 'default' : 'outline'}
              onClick={() => setDifficulty(diff)}
              className="capitalize"
            >
              {diff}
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Brain className="w-5 h-5 mx-auto mb-1 text-purple-500" />
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <div className="text-sm text-muted-foreground">Time</div>
          <div className="text-xl font-bold">{timeLeft}s</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
          <div className="text-sm text-muted-foreground">Words</div>
          <div className="text-xl font-bold">{correctWords}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">Hints</div>
          <div className="text-xl font-bold text-orange-500">{hints}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">Best</div>
          <div className="text-xl font-bold text-purple-500">{highScore}</div>
        </div>
      </div>

      {!isPlaying ? (
        <div className="text-center py-12">
          {score > 0 && (
            <div className="mb-8 p-6 bg-secondary rounded-lg">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-lg mb-2">Final Score: {score}</p>
              <p className="text-sm text-muted-foreground">
                Words Solved: {correctWords} | Level: {level}
              </p>
              {score === highScore && score > 0 && (
                <p className="text-green-500 font-bold mt-2">New High Score!</p>
              )}
            </div>
          )}
          <Button
            size="lg"
            onClick={startGame}
            className="gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            {score > 0 ? 'Play Again' : 'Start Game'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scrambled Word */}
          <div className="text-center">
            <div className="text-5xl font-bold mb-2 p-6 bg-secondary rounded-xl tracking-wider">
              {scrambledWord.toUpperCase()}
            </div>
            
            {showHint && (
              <div className="mt-2 text-sm text-muted-foreground">
                Hint: The word has {currentWord.length} letters and starts with "{currentWord[0].toUpperCase()}"
              </div>
            )}
          </div>

          {/* Input and Controls */}
          <div className="max-w-md mx-auto space-y-4">
            <Input
              type="text"
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Type your answer..."
              className="text-center text-xl"
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button
                onClick={checkAnswer}
                className="flex-1"
                disabled={!userGuess}
              >
                Submit
              </Button>
              <Button
                onClick={reshuffleWord}
                variant="outline"
                className="gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Reshuffle
              </Button>
              <Button
                onClick={useHint}
                variant="outline"
                disabled={hints === 0 || showHint}
              >
                Hint ({hints})
              </Button>
            </div>
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`text-center text-2xl font-bold ${
              showFeedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}>
              {showFeedback === 'correct' ? 'Correct! Well done!' : `Wrong! Try again!`}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}