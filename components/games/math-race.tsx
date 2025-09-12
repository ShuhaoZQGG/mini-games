'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlayCircle, RotateCcw, Trophy, Brain, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useGameStore } from '@/lib/store/game-store';

type Operation = '+' | '-' | '×' | '÷';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
  displayText: string;
}

export default function MathRace() {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const { updateScore } = useGameStore();

  const generateProblem = useCallback((): Problem => {
    let num1: number, num2: number, operation: Operation, answer: number;
    
    const operations: Operation[] = 
      difficulty === 'easy' ? ['+', '-'] :
      difficulty === 'medium' ? ['+', '-', '×'] :
      ['+', '-', '×', '÷'];
    
    operation = operations[Math.floor(Math.random() * operations.length)];
    
    const maxNum = 
      difficulty === 'easy' ? 20 :
      difficulty === 'medium' ? 50 :
      100;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * Math.min(num1, maxNum)) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * (difficulty === 'easy' ? 10 : 12)) + 1;
        num2 = Math.floor(Math.random() * (difficulty === 'easy' ? 10 : 12)) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    const displayText = `${num1} ${operation} ${num2}`;
    
    return { num1, num2, operation, answer, displayText };
  }, [difficulty]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setIsPlaying(true);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setUserAnswer('');
    setShowFeedback(null);
    setCurrentProblem(generateProblem());
  };

  const endGame = () => {
    setIsPlaying(false);
    if (score > highScore) {
      setHighScore(score);
      updateScore('math-race', score);
    }
  };

  const checkAnswer = () => {
    if (!currentProblem || userAnswer === '') return;
    
    const userNum = parseInt(userAnswer);
    
    if (userNum === currentProblem.answer) {
      // Correct answer
      const points = 10 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3) + (streak * 2);
      setScore(prev => prev + points);
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
      setShowFeedback('correct');
      
      // Level up every 10 correct answers
      if ((correctCount + 1) % 10 === 0) {
        setLevel(prev => prev + 1);
        setTimeLeft(prev => Math.min(prev + 10, 90));
      }
      
      // Bonus time for streaks
      if (streak > 0 && streak % 5 === 0) {
        setTimeLeft(prev => Math.min(prev + 5, 90));
      }
      
      setTimeout(() => {
        setShowFeedback(null);
        setCurrentProblem(generateProblem());
        setUserAnswer('');
      }, 500);
    } else {
      // Wrong answer
      setWrongCount(prev => prev + 1);
      setStreak(0);
      setShowFeedback('wrong');
      setTimeLeft(prev => Math.max(prev - 3, 0));
      
      setTimeout(() => {
        setShowFeedback(null);
        setUserAnswer('');
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
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
    const saved = localStorage.getItem('mathRaceHighScore');
    if (saved) setHighScore(Number(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem('mathRaceHighScore', highScore.toString());
    }
  }, [highScore]);

  return (
    <Card className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Math Race
        </h1>
        <p className="text-muted-foreground">
          Solve math problems as quickly as you can!
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
          <div className="text-sm text-muted-foreground">Correct</div>
          <div className="text-xl font-bold">{correctCount}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">Streak</div>
          <div className="text-xl font-bold text-orange-500">{streak}</div>
        </div>
        <div className="text-center p-3 bg-secondary rounded-lg">
          <div className="text-sm text-muted-foreground">High Score</div>
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
                Correct: {correctCount} | Wrong: {wrongCount} | Accuracy: {
                  correctCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0
                }%
              </p>
              {score > highScore && (
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
        <div className="space-y-8">
          {/* Math Problem */}
          {currentProblem && (
            <div className="text-center">
              <div className="text-6xl font-bold mb-8 p-8 bg-secondary rounded-xl">
                {currentProblem.displayText} = ?
              </div>
              
              <div className="max-w-xs mx-auto space-y-4">
                <Input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your answer"
                  className="text-center text-2xl h-14"
                  autoFocus
                />
                <Button
                  onClick={checkAnswer}
                  className="w-full"
                  size="lg"
                  disabled={userAnswer === ''}
                >
                  Submit Answer
                </Button>
              </div>
              
              {/* Feedback */}
              {showFeedback && (
                <div className={`mt-6 text-2xl font-bold flex items-center justify-center gap-2 ${
                  showFeedback === 'correct' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {showFeedback === 'correct' ? (
                    <>
                      <CheckCircle className="w-8 h-8" />
                      Correct! +{10 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3) + ((streak - 1) * 2)}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8" />
                      Wrong! The answer was {currentProblem.answer}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}