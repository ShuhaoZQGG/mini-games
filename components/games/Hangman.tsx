'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, Target, Heart } from 'lucide-react';

const WORD_LISTS = {
  easy: ['CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'BOOK', 'BALL', 'STAR', 'MOON', 'SUN'],
  medium: ['CASTLE', 'DRAGON', 'WIZARD', 'KINGDOM', 'BRIDGE', 'PLANET', 'GARDEN', 'PUZZLE', 'ROCKET', 'FOREST'],
  hard: ['ADVENTURE', 'MYSTERIOUS', 'CHALLENGE', 'TREASURE', 'KNOWLEDGE', 'UNIVERSE', 'DISCOVERY', 'IMAGINATION', 'TECHNOLOGY', 'PHILOSOPHY'],
  expert: ['EXTRAORDINARY', 'PHENOMENAL', 'CRYPTOCURRENCY', 'METAMORPHOSIS', 'CONSTELLATION', 'PHOTOSYNTHESIS', 'REVOLUTIONARY', 'MEDITERRANEAN', 'ARCHAEOLOGICAL', 'TRANSCENDENTAL'],
  master: ['DEOXYRIBONUCLEIC', 'INCOMPREHENSIBILITY', 'COUNTERREVOLUTIONARY', 'UNCHARACTERISTICALLY', 'ANTIDISESTABLISHMENTARIANISM', 'PNEUMONOULTRAMICROSCOPICSILICOVOLCANOCONIOSIS', 'HIPPOPOTOMONSTROSESQUIPPEDALIOPHOBIA', 'SUPERCALIFRAGILISTICEXPIALIDOCIOUS', 'FLOCCINAUCINIHILIPILIFICATION', 'DICHLORODIFLUOROMETHANE']
};

const CATEGORIES = {
  easy: 'Simple Words',
  medium: 'Common Words',
  hard: 'Challenging Words',
  expert: 'Expert Level',
  master: 'Master Challenge'
};

interface HangmanProps {
  onGameEnd?: (score: number) => void;
}

export default function Hangman({ onGameEnd }: HangmanProps) {
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<keyof typeof WORD_LISTS>('easy');
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hint, setHint] = useState('');
  const maxWrongGuesses = 6;

  const getNewWord = useCallback(() => {
    const wordList = WORD_LISTS[difficulty];
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    return randomWord;
  }, [difficulty]);

  const resetGame = useCallback(() => {
    const newWord = getNewWord();
    setWord(newWord);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState('playing');
    setHint(`${newWord.length} letters - ${CATEGORIES[difficulty]}`);
  }, [difficulty, getNewWord]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    // Update difficulty based on level
    if (level <= 5) setDifficulty('easy');
    else if (level <= 10) setDifficulty('medium');
    else if (level <= 15) setDifficulty('hard');
    else if (level <= 20) setDifficulty('expert');
    else setDifficulty('master');
  }, [level]);

  const handleGuess = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.has(letter)) return;

    const newGuessedLetters = new Set(guessedLetters);
    newGuessedLetters.add(letter);
    setGuessedLetters(newGuessedLetters);

    if (!word.includes(letter)) {
      setWrongGuesses(wrongGuesses + 1);
      
      if (wrongGuesses + 1 >= maxWrongGuesses) {
        setGameState('lost');
        setStreak(0);
        onGameEnd?.(score);
      }
    } else {
      // Check if won
      const isComplete = word.split('').every(l => newGuessedLetters.has(l));
      if (isComplete) {
        const points = (word.length * 10) * (level) * (maxWrongGuesses - wrongGuesses);
        setScore(score + points);
        setStreak(streak + 1);
        setGameState('won');
        
        // Auto advance after a delay
        setTimeout(() => {
          setLevel(level + 1);
          resetGame();
        }, 2000);
      }
    }
  };

  const renderHangman = () => {
    const parts = [
      wrongGuesses >= 1 && <circle key="head" cx="50" cy="25" r="10" stroke="currentColor" strokeWidth="2" fill="none" />,
      wrongGuesses >= 2 && <line key="body" x1="50" y1="35" x2="50" y2="60" stroke="currentColor" strokeWidth="2" />,
      wrongGuesses >= 3 && <line key="leftArm" x1="50" y1="45" x2="30" y2="55" stroke="currentColor" strokeWidth="2" />,
      wrongGuesses >= 4 && <line key="rightArm" x1="50" y1="45" x2="70" y2="55" stroke="currentColor" strokeWidth="2" />,
      wrongGuesses >= 5 && <line key="leftLeg" x1="50" y1="60" x2="30" y2="80" stroke="currentColor" strokeWidth="2" />,
      wrongGuesses >= 6 && <line key="rightLeg" x1="50" y1="60" x2="70" y2="80" stroke="currentColor" strokeWidth="2" />
    ];

    return (
      <svg width="100" height="120" className="text-gray-700 dark:text-gray-300">
        {/* Gallows */}
        <line x1="10" y1="110" x2="40" y2="110" stroke="currentColor" strokeWidth="2" />
        <line x1="25" y1="110" x2="25" y2="10" stroke="currentColor" strokeWidth="2" />
        <line x1="25" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        <line x1="50" y1="10" x2="50" y2="15" stroke="currentColor" strokeWidth="2" />
        {parts}
      </svg>
    );
  };

  const renderWord = () => {
    return word.split('').map((letter, index) => (
      <span
        key={index}
        className="inline-block mx-1 text-2xl font-bold w-8 text-center border-b-2 border-gray-400 dark:border-gray-600"
      >
        {guessedLetters.has(letter) ? letter : ''}
      </span>
    ));
  };

  const renderKeyboard = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {alphabet.map(letter => {
          const isGuessed = guessedLetters.has(letter);
          const isCorrect = isGuessed && word.includes(letter);
          const isWrong = isGuessed && !word.includes(letter);
          
          return (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={isGuessed || gameState !== 'playing'}
              className={`
                px-3 py-2 rounded font-bold transition-all
                ${isCorrect ? 'bg-green-500 text-white' : ''}
                ${isWrong ? 'bg-red-500 text-white' : ''}
                ${!isGuessed && gameState === 'playing' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                ${!isGuessed && gameState !== 'playing' ? 'bg-gray-300 dark:bg-gray-700 text-gray-500' : ''}
                disabled:cursor-not-allowed
              `}
            >
              {letter}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hangman</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Level {level} - {CATEGORIES[difficulty]}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
              <p className="text-sm font-bold">{score}</p>
            </div>
            <div className="text-center">
              <Target className="w-6 h-6 text-blue-500 mx-auto" />
              <p className="text-sm font-bold">{streak}</p>
            </div>
            <div className="text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto" />
              <p className="text-sm font-bold">{maxWrongGuesses - wrongGuesses}</p>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex flex-col items-center space-y-6">
          {/* Hangman Drawing */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            {renderHangman()}
          </div>

          {/* Hint */}
          <p className="text-sm text-gray-600 dark:text-gray-400">{hint}</p>

          {/* Word Display */}
          <div className="py-4">
            {renderWord()}
          </div>

          {/* Game State Message */}
          {gameState === 'won' && (
            <div className="text-green-500 font-bold text-xl animate-pulse">
              Excellent! Word was: {word}
            </div>
          )}
          {gameState === 'lost' && (
            <div className="text-red-500 font-bold text-xl">
              Game Over! The word was: {word}
            </div>
          )}

          {/* Keyboard */}
          <div className="w-full">
            {renderKeyboard()}
          </div>

          {/* Controls */}
          {gameState === 'lost' && (
            <button
              onClick={() => {
                setLevel(1);
                setScore(0);
                setStreak(0);
                resetGame();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Game
            </button>
          )}
        </div>

        {/* Level Progress */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((level / 25) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}