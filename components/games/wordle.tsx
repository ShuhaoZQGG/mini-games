'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// Common 5-letter words for the game
const WORD_LIST = [
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
  'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIVE', 'ALLOW',
  'ALONE', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
  'ARGUE', 'ARISE', 'ARRAY', 'ARROW', 'ASIDE', 'ASSET', 'AVOID', 'AWARD', 'AWARE', 'BADLY',
  'BASIC', 'BEACH', 'BEGAN', 'BEING', 'BELOW', 'BENCH', 'BILLY', 'BIRTH', 'BLACK', 'BLAME',
  'BLANK', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND',
  'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BUILD',
  'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAOS',
  'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE',
  'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD',
  'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM',
  'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED',
  'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DELTA', 'DENSE', 'DEPOT', 'DEPTH', 'DERBY', 'DIGIT',
  'DIRTY', 'DOZEN', 'DRAFT', 'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK',
  'DRIVE', 'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'EITHER', 'ELECT', 'ELITE',
  'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT',
  'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT',
  'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET', 'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH',
  'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT', 'FRUIT', 'FULLY',
  'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT',
  'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST',
  'GUIDE', 'HAPPY', 'HARRY', 'HEART', 'HEAVY', 'HELLO', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE',
  'HUMAN', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX', 'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY',
  'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER',
  'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEMON', 'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT',
  'LINKS', 'LIVES', 'LOCAL', 'LOGIC', 'LOOSE', 'LOWER', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC',
  'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL',
  'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT',
  'MOUSE', 'MOUTH', 'MOVED', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE',
  'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER',
  'OUGHT', 'OUTER', 'OWNED', 'OWNER', 'PAINT', 'PANEL', 'PAPER', 'PARIS', 'PARTY', 'PEACE',
  'PENNY', 'PETER', 'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PLACE',
  'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'PLAZA', 'POINT', 'POUND', 'POWER', 'PRESS', 'PRICE',
  'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD', 'PROVE', 'QUEEN', 'QUICK',
  'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATIO', 'REACH', 'READY', 'REALM',
  'REFER', 'RELAX', 'REPLY', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT', 'RIGID', 'RIVER', 'ROBIN',
  'ROCKY', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL', 'SCALE', 'SCENE',
  'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE', 'SHARE', 'SHARP', 'SHEET',
  'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT', 'SHORT', 'SHOWN', 'SIGHT',
  'SILLY', 'SIMON', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SLEEP', 'SLIDE', 'SMALL',
  'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH', 'SPACE',
  'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT', 'STAFF', 'STAGE',
  'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STICK', 'STILL', 'STOCK',
  'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE',
  'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TAXES', 'TEACH',
  'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE', 'THESE', 'THICK',
  'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'TIGHT', 'TIMES', 'TITLE',
  'TODAY', 'TOMMY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN',
  'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIED', 'TRIES', 'TROOP', 'TRUCK', 'TRULY', 'TRUMP',
  'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET',
  'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL',
  'VOICE', 'VOTER', 'WASTE', 'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
  'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD',
  'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG', 'YOURS', 'YOUTH'
];

interface Letter {
  value: string;
  status: 'correct' | 'present' | 'absent' | 'empty';
}

interface KeyboardKey {
  key: string;
  status: 'correct' | 'present' | 'absent' | 'unused';
}

export function WordleGame() {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<Letter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyboard, setKeyboard] = useState<Map<string, 'correct' | 'present' | 'absent' | 'unused'>>(new Map());
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');

  const keyboardLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];

  useEffect(() => {
    initializeGame();
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGuess, currentRow, gameOver]);

  const initializeGame = () => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(word);
    setGuesses(Array(MAX_GUESSES).fill(null).map(() => 
      Array(WORD_LENGTH).fill(null).map(() => ({ value: '', status: 'empty' }))
    ));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameOver(false);
    setWon(false);
    setMessage('');
    
    const newKeyboard = new Map<string, 'correct' | 'present' | 'absent' | 'unused'>();
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
      newKeyboard.set(letter, 'unused');
    });
    setKeyboard(newKeyboard);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;

    if (e.key === 'Enter') {
      submitGuess();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      handleLetter(e.key.toUpperCase());
    }
  }, [currentGuess, currentRow, gameOver]);

  const handleLetter = (letter: string) => {
    if (currentGuess.length < WORD_LENGTH && !gameOver) {
      setCurrentGuess(currentGuess + letter);
      updateDisplayGuess(currentGuess + letter);
    }
  };

  const handleBackspace = () => {
    if (currentGuess.length > 0 && !gameOver) {
      const newGuess = currentGuess.slice(0, -1);
      setCurrentGuess(newGuess);
      updateDisplayGuess(newGuess);
    }
  };

  const updateDisplayGuess = (guess: string) => {
    const newGuesses = [...guesses];
    for (let i = 0; i < WORD_LENGTH; i++) {
      newGuesses[currentRow][i] = {
        value: guess[i] || '',
        status: 'empty'
      };
    }
    setGuesses(newGuesses);
  };

  const submitGuess = () => {
    if (currentGuess.length !== WORD_LENGTH) {
      setShake(true);
      setMessage('Not enough letters');
      setTimeout(() => {
        setShake(false);
        setMessage('');
      }, 500);
      return;
    }

    if (!WORD_LIST.includes(currentGuess)) {
      setShake(true);
      setMessage('Not in word list');
      setTimeout(() => {
        setShake(false);
        setMessage('');
      }, 500);
      return;
    }

    const newGuesses = [...guesses];
    const newKeyboard = new Map(keyboard);
    const targetLetters = targetWord.split('');
    const guessLetters = currentGuess.split('');
    
    // First pass: mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        newGuesses[currentRow][i] = {
          value: guessLetters[i],
          status: 'correct'
        };
        newKeyboard.set(guessLetters[i], 'correct');
        targetLetters[i] = '*';
        guessLetters[i] = '*';
      }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] !== '*') {
        const targetIndex = targetLetters.indexOf(guessLetters[i]);
        if (targetIndex !== -1) {
          newGuesses[currentRow][i] = {
            value: guessLetters[i],
            status: 'present'
          };
          if (newKeyboard.get(guessLetters[i]) !== 'correct') {
            newKeyboard.set(guessLetters[i], 'present');
          }
          targetLetters[targetIndex] = '*';
        } else {
          newGuesses[currentRow][i] = {
            value: guessLetters[i],
            status: 'absent'
          };
          if (newKeyboard.get(guessLetters[i]) === 'unused') {
            newKeyboard.set(guessLetters[i], 'absent');
          }
        }
      }
    }
    
    setGuesses(newGuesses);
    setKeyboard(newKeyboard);
    
    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
      setMessage('Genius!');
      return;
    }
    
    if (currentRow === MAX_GUESSES - 1) {
      setGameOver(true);
      setMessage(`The word was ${targetWord}`);
      return;
    }
    
    setCurrentRow(currentRow + 1);
    setCurrentGuess('');
  };

  const handleKeyboardClick = (key: string) => {
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      handleBackspace();
    } else {
      handleLetter(key);
    }
  };

  const getKeyColor = (key: string) => {
    const status = keyboard.get(key) || 'unused';
    switch (status) {
      case 'correct': return 'bg-green-500 text-white';
      case 'present': return 'bg-yellow-500 text-white';
      case 'absent': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getCellColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-green-500 text-white border-green-500';
      case 'present': return 'bg-yellow-500 text-white border-yellow-500';
      case 'absent': return 'bg-gray-500 text-white border-gray-500';
      default: return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Wordle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="text-center font-semibold text-lg">
            {message}
          </div>
        )}
        
        <div className="space-y-2">
          {guesses.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className={cn("flex gap-2 justify-center", shake && rowIndex === currentRow && "animate-shake")}
            >
              {row.map((letter, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ rotateX: 0 }}
                  animate={{ rotateX: letter.status !== 'empty' && rowIndex < currentRow ? 360 : 0 }}
                  transition={{ delay: colIndex * 0.1, duration: 0.5 }}
                  className={cn(
                    "w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold transition-all",
                    getCellColor(letter.status)
                  )}
                >
                  {letter.value}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        <div className="space-y-2 mt-6">
          {keyboardLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKeyboardClick(key)}
                  className={cn(
                    "px-3 py-4 rounded text-sm font-semibold transition-colors",
                    key.length > 1 ? 'px-4' : '',
                    getKeyColor(key)
                  )}
                  disabled={gameOver}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              ))}
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="text-center space-y-2">
            <Button onClick={initializeGame} size="lg">
              New Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}