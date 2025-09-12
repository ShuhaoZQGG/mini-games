'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Trophy, Target, Zap, Volume2, VolumeX } from 'lucide-react';

interface BingoCell {
  value: number;
  marked: boolean;
}

interface BingoProps {
  onGameEnd?: (score: number) => void;
}

export default function Bingo({ onGameEnd }: BingoProps) {
  const [level, setLevel] = useState(1);
  const [card, setCard] = useState<BingoCell[][]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won'>('playing');
  const [patterns, setPatterns] = useState<string[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [callSpeed, setCallSpeed] = useState(3000);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a new bingo card
  const generateCard = useCallback(() => {
    const newCard: BingoCell[][] = [];
    const usedNumbers = new Set<number>();
    
    // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
    const ranges = [
      { min: 1, max: 15 },   // B
      { min: 16, max: 30 },  // I
      { min: 31, max: 45 },  // N
      { min: 46, max: 60 },  // G
      { min: 61, max: 75 }   // O
    ];
    
    for (let col = 0; col < 5; col++) {
      const column: BingoCell[] = [];
      const { min, max } = ranges[col];
      
      for (let row = 0; row < 5; row++) {
        // Center cell is FREE
        if (col === 2 && row === 2) {
          column.push({ value: 0, marked: true });
        } else {
          let num;
          do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
          } while (usedNumbers.has(num));
          
          usedNumbers.add(num);
          column.push({ value: num, marked: false });
        }
      }
      
      newCard.push(column);
    }
    
    return newCard;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    setCard(generateCard());
    setCalledNumbers([]);
    setCurrentNumber(null);
    setGameState('playing');
    setPatterns([]);
    
    // Update call speed based on level
    const speed = Math.max(1000, 3000 - (level - 1) * 100);
    setCallSpeed(speed);
  }, [level, generateCard]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Call a new number
  const callNumber = useCallback(() => {
    if (gameState !== 'playing') return;
    
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
      .filter(n => !calledNumbers.includes(n));
    
    if (availableNumbers.length === 0) {
      // All numbers called, check for win
      checkWin();
      return;
    }
    
    const newNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    setCurrentNumber(newNumber);
    setCalledNumbers(prev => [...prev, newNumber]);
    
    // Auto-mark in auto mode
    if (autoMode) {
      markNumber(newNumber);
    }
    
    // Play sound
    if (soundEnabled) {
      // Simulate sound with console (in real app, use Audio API)
      console.log(`Called: ${getLetter(newNumber)}-${newNumber}`);
    }
  }, [calledNumbers, gameState, autoMode, soundEnabled]);

  // Auto-call numbers
  useEffect(() => {
    if (autoMode && gameState === 'playing') {
      intervalRef.current = setInterval(callNumber, callSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoMode, gameState, callNumber, callSpeed]);

  // Get letter for number
  const getLetter = (num: number): string => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  };

  // Mark a number on the card
  const markNumber = (num: number) => {
    const newCard = card.map(col => 
      col.map(cell => 
        cell.value === num ? { ...cell, marked: true } : cell
      )
    );
    setCard(newCard);
    
    // Check for win after marking
    setTimeout(() => checkWin(), 100);
  };

  // Check for winning patterns
  const checkWin = useCallback(() => {
    const wins: string[] = [];
    
    // Check rows
    for (let row = 0; row < 5; row++) {
      if (card.every(col => col[row].marked)) {
        wins.push(`Row ${row + 1}`);
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card[col].every(cell => cell.marked)) {
        wins.push(`Column ${getLetter((col * 15) + 8)}`);
      }
    }
    
    // Check diagonals
    if (card.every((col, i) => col[i].marked)) {
      wins.push('Diagonal ↘');
    }
    if (card.every((col, i) => col[4 - i].marked)) {
      wins.push('Diagonal ↙');
    }
    
    // Check four corners
    if (card[0][0].marked && card[0][4].marked && 
        card[4][0].marked && card[4][4].marked) {
      wins.push('Four Corners');
    }
    
    // Check full card (blackout)
    if (card.every(col => col.every(cell => cell.marked))) {
      wins.push('BLACKOUT!');
    }
    
    if (wins.length > 0) {
      setPatterns(wins);
      const points = wins.length * 100 * level * (76 - calledNumbers.length);
      setScore(prev => prev + points);
      setGameState('won');
      
      // Auto advance after delay
      setTimeout(() => {
        setLevel(prev => prev + 1);
        initGame();
      }, 3000);
      
      onGameEnd?.(score + points);
    }
  }, [card, level, calledNumbers.length, score, initGame, onGameEnd]);

  // Manual click on cell
  const handleCellClick = (col: number, row: number) => {
    if (gameState !== 'playing' || autoMode) return;
    
    const cell = card[col][row];
    if (cell.value === 0) return; // FREE space
    
    if (calledNumbers.includes(cell.value)) {
      const newCard = [...card];
      newCard[col][row] = { ...cell, marked: !cell.marked };
      setCard(newCard);
      
      // Check for win after marking
      setTimeout(() => checkWin(), 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">BINGO</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Level {level}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
              <p className="text-sm font-bold">{score}</p>
            </div>
            <div className="text-center">
              <Target className="w-6 h-6 text-blue-500 mx-auto" />
              <p className="text-sm font-bold">{calledNumbers.length}/75</p>
            </div>
          </div>
        </div>

        {/* Current Number Display */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <div className="text-6xl font-bold text-blue-500 mb-2">
              {currentNumber ? `${getLetter(currentNumber)}-${currentNumber}` : 'Ready!'}
            </div>
            {gameState === 'won' && (
              <div className="text-green-500 font-bold text-xl animate-pulse">
                BINGO! {patterns.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Bingo Card */}
        <div className="mb-6">
          <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
            {/* Headers */}
            {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
              <div key={letter} className="bg-blue-500 text-white text-center font-bold py-2 text-lg">
                {letter}
              </div>
            ))}
            
            {/* Card cells */}
            {[0, 1, 2, 3, 4].map(row => (
              card.map((col, colIndex) => {
                const cell = col[row];
                const isCalled = calledNumbers.includes(cell.value);
                
                return (
                  <button
                    key={`${colIndex}-${row}`}
                    onClick={() => handleCellClick(colIndex, row)}
                    disabled={autoMode || gameState !== 'playing'}
                    className={`
                      aspect-square flex items-center justify-center font-bold text-lg
                      border-2 transition-all cursor-pointer
                      ${cell.value === 0 ? 'bg-yellow-400 text-gray-800' : ''}
                      ${cell.marked && cell.value !== 0 ? 'bg-green-500 text-white' : ''}
                      ${!cell.marked && isCalled ? 'bg-yellow-100 dark:bg-yellow-900/30 animate-pulse' : ''}
                      ${!cell.marked && !isCalled && cell.value !== 0 ? 'bg-white dark:bg-gray-700' : ''}
                      hover:scale-105 disabled:cursor-default
                    `}
                  >
                    {cell.value === 0 ? 'FREE' : cell.value}
                  </button>
                );
              })
            ))}
          </div>
        </div>

        {/* Called Numbers */}
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-bold mb-2">Called Numbers:</p>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {calledNumbers.map(num => (
              <span
                key={num}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                {getLetter(num)}-{num}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={callNumber}
            disabled={autoMode || gameState !== 'playing'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Call Number
          </button>
          
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              autoMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
            } text-white`}
          >
            <RefreshCw className={`w-4 h-4 ${autoMode ? 'animate-spin' : ''}`} />
            Auto: {autoMode ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={initGame}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            <RefreshCw className="w-4 h-4" />
            New Card
          </button>
        </div>

        {/* Speed Control */}
        {autoMode && (
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm">Speed:</label>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={5500 - callSpeed}
              onChange={(e) => setCallSpeed(5500 - Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm w-16">{(callSpeed / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}