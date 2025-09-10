'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, TrendingUp, Coins, AlertCircle } from 'lucide-react';

const NUMBERS = [
  { value: 0, color: 'green' },
  { value: 32, color: 'red' }, { value: 15, color: 'black' }, { value: 19, color: 'red' },
  { value: 4, color: 'black' }, { value: 21, color: 'red' }, { value: 2, color: 'black' },
  { value: 25, color: 'red' }, { value: 17, color: 'black' }, { value: 34, color: 'red' },
  { value: 6, color: 'black' }, { value: 27, color: 'red' }, { value: 13, color: 'black' },
  { value: 36, color: 'red' }, { value: 11, color: 'black' }, { value: 30, color: 'red' },
  { value: 8, color: 'black' }, { value: 23, color: 'red' }, { value: 10, color: 'black' },
  { value: 5, color: 'red' }, { value: 24, color: 'black' }, { value: 16, color: 'red' },
  { value: 33, color: 'black' }, { value: 1, color: 'red' }, { value: 20, color: 'black' },
  { value: 14, color: 'red' }, { value: 31, color: 'black' }, { value: 9, color: 'red' },
  { value: 22, color: 'black' }, { value: 18, color: 'red' }, { value: 29, color: 'black' },
  { value: 7, color: 'red' }, { value: 28, color: 'black' }, { value: 12, color: 'red' },
  { value: 35, color: 'black' }, { value: 3, color: 'red' }, { value: 26, color: 'black' }
];

type BetType = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'column1' | 'column2' | 'column3' | number;

interface Bet {
  type: BetType;
  amount: number;
}

interface RouletteProps {
  onGameEnd?: (score: number) => void;
}

export default function Roulette({ onGameEnd }: RouletteProps) {
  const [level, setLevel] = useState(1);
  const [balance, setBalance] = useState(1000);
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentBet, setCurrentBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof NUMBERS[0] | null>(null);
  const [winnings, setWinnings] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Update betting limits based on level
    const newBetLimit = Math.min(10 * level, 500);
    setCurrentBet(Math.min(currentBet, newBetLimit));
  }, [level, currentBet]);

  const placeBet = (type: BetType) => {
    if (balance < currentBet || spinning) return;
    
    const existingBetIndex = bets.findIndex(b => b.type === type);
    if (existingBetIndex >= 0) {
      const newBets = [...bets];
      newBets[existingBetIndex].amount += currentBet;
      setBets(newBets);
    } else {
      setBets([...bets, { type, amount: currentBet }]);
    }
    
    setBalance(balance - currentBet);
  };

  const clearBets = () => {
    if (spinning) return;
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    setBalance(balance + totalBetAmount);
    setBets([]);
  };

  const calculateWinnings = (resultNumber: typeof NUMBERS[0], playerBets: Bet[]) => {
    let totalWin = 0;
    
    playerBets.forEach(bet => {
      let win = 0;
      
      if (typeof bet.type === 'number') {
        // Straight up bet (35:1)
        if (bet.type === resultNumber.value) {
          win = bet.amount * 36;
        }
      } else {
        switch (bet.type) {
          case 'red':
            if (resultNumber.color === 'red') win = bet.amount * 2;
            break;
          case 'black':
            if (resultNumber.color === 'black') win = bet.amount * 2;
            break;
          case 'odd':
            if (resultNumber.value > 0 && resultNumber.value % 2 === 1) win = bet.amount * 2;
            break;
          case 'even':
            if (resultNumber.value > 0 && resultNumber.value % 2 === 0) win = bet.amount * 2;
            break;
          case 'low':
            if (resultNumber.value >= 1 && resultNumber.value <= 18) win = bet.amount * 2;
            break;
          case 'high':
            if (resultNumber.value >= 19 && resultNumber.value <= 36) win = bet.amount * 2;
            break;
          case 'dozen1':
            if (resultNumber.value >= 1 && resultNumber.value <= 12) win = bet.amount * 3;
            break;
          case 'dozen2':
            if (resultNumber.value >= 13 && resultNumber.value <= 24) win = bet.amount * 3;
            break;
          case 'dozen3':
            if (resultNumber.value >= 25 && resultNumber.value <= 36) win = bet.amount * 3;
            break;
          case 'column1':
            if (resultNumber.value > 0 && resultNumber.value % 3 === 1) win = bet.amount * 3;
            break;
          case 'column2':
            if (resultNumber.value > 0 && resultNumber.value % 3 === 2) win = bet.amount * 3;
            break;
          case 'column3':
            if (resultNumber.value > 0 && resultNumber.value % 3 === 0) win = bet.amount * 3;
            break;
        }
      }
      
      totalWin += win;
    });
    
    return totalWin;
  };

  const spin = () => {
    if (bets.length === 0 || spinning) return;
    
    setSpinning(true);
    setShowResult(false);
    
    // Random result
    const randomIndex = Math.floor(Math.random() * NUMBERS.length);
    const spinResult = NUMBERS[randomIndex];
    
    // Calculate rotations
    const baseRotation = 720 + randomIndex * (360 / NUMBERS.length);
    const newRotation = rotation + baseRotation + Math.random() * 360;
    const newBallRotation = ballRotation - baseRotation - 360 - Math.random() * 360;
    
    setRotation(newRotation);
    setBallRotation(newBallRotation);
    
    // Show result after animation
    setTimeout(() => {
      setResult(spinResult);
      const won = calculateWinnings(spinResult, bets);
      setWinnings(won);
      setBalance(prev => prev + won);
      setTotalWinnings(prev => prev + won);
      setShowResult(true);
      setSpinning(false);
      setBets([]);
      
      // Level up logic
      if (balance >= 1000 * (level + 1)) {
        setLevel(level + 1);
      }
      
      // Game over check
      if (balance <= 0 && bets.length === 0) {
        onGameEnd?.(totalWinnings);
      }
    }, 3000);
  };

  const renderWheel = () => {
    return (
      <div className="relative w-64 h-64 mx-auto">
        <div
          className="absolute inset-0 rounded-full border-8 border-amber-700 bg-gradient-to-br from-amber-800 to-amber-900 shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.83, 0.67)' : 'none'
          }}
        >
          {NUMBERS.map((num, index) => {
            const angle = (index * 360) / NUMBERS.length;
            return (
              <div
                key={index}
                className={`absolute w-full h-full flex items-start justify-center ${
                  num.color === 'red' ? 'text-red-500' :
                  num.color === 'black' ? 'text-gray-900' :
                  'text-green-500'
                }`}
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div className={`mt-2 px-2 py-1 text-xs font-bold rounded ${
                  num.color === 'red' ? 'bg-red-500 text-white' :
                  num.color === 'black' ? 'bg-gray-900 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {num.value}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Ball */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            transform: `rotate(${ballRotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.83, 0.67)' : 'none'
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
        </div>
        
        {/* Center */}
        <div className="absolute inset-1/3 rounded-full bg-amber-700 shadow-inner flex items-center justify-center">
          <div className="text-amber-200 font-bold text-xl">SPIN</div>
        </div>
      </div>
    );
  };

  const renderBettingTable = () => {
    return (
      <div className="grid grid-cols-4 gap-2 text-sm">
        {/* Outside bets */}
        <button
          onClick={() => placeBet('red')}
          disabled={spinning || balance < currentBet}
          className="col-span-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Red
        </button>
        <button
          onClick={() => placeBet('black')}
          disabled={spinning || balance < currentBet}
          className="col-span-2 px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Black
        </button>
        
        <button
          onClick={() => placeBet('odd')}
          disabled={spinning || balance < currentBet}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Odd
        </button>
        <button
          onClick={() => placeBet('even')}
          disabled={spinning || balance < currentBet}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Even
        </button>
        <button
          onClick={() => placeBet('low')}
          disabled={spinning || balance < currentBet}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          1-18
        </button>
        <button
          onClick={() => placeBet('high')}
          disabled={spinning || balance < currentBet}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          19-36
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Roulette</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Level {level}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <Coins className="w-6 h-6 text-yellow-500 mx-auto" />
              <p className="text-sm font-bold">${balance}</p>
            </div>
            <div className="text-center">
              <Trophy className="w-6 h-6 text-purple-500 mx-auto" />
              <p className="text-sm font-bold">${totalWinnings}</p>
            </div>
          </div>
        </div>

        {/* Wheel */}
        <div className="mb-6">
          {renderWheel()}
        </div>

        {/* Result Display */}
        {showResult && result && (
          <div className="text-center mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-lg font-bold">
              Result: <span className={`${
                result.color === 'red' ? 'text-red-500' :
                result.color === 'black' ? 'text-gray-900 dark:text-white' :
                'text-green-500'
              }`}>{result.value}</span>
            </p>
            {winnings > 0 && (
              <p className="text-green-500 font-bold">Won: ${winnings}</p>
            )}
          </div>
        )}

        {/* Current Bets */}
        {bets.length > 0 && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-bold mb-2">Current Bets:</p>
            <div className="flex flex-wrap gap-2">
              {bets.map((bet, index) => (
                <span key={index} className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  {bet.type}: ${bet.amount}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Betting Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Bet Amount:</label>
            <input
              type="range"
              min="10"
              max={Math.min(balance, 500)}
              step="10"
              value={currentBet}
              onChange={(e) => setCurrentBet(Number(e.target.value))}
              disabled={spinning}
              className="flex-1"
            />
            <span className="font-bold w-16 text-right">${currentBet}</span>
          </div>

          {/* Betting Table */}
          {renderBettingTable()}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={spin}
              disabled={spinning || bets.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
              Spin
            </button>
            <button
              onClick={clearBets}
              disabled={spinning || bets.length === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Bets
            </button>
          </div>
        </div>

        {/* Game Over */}
        {balance <= 0 && !spinning && bets.length === 0 && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
            <p className="text-red-600 dark:text-red-400 font-bold">Game Over!</p>
            <p className="text-sm">Total Winnings: ${totalWinnings}</p>
            <button
              onClick={() => {
                setBalance(1000);
                setLevel(1);
                setTotalWinnings(0);
                setBets([]);
              }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}