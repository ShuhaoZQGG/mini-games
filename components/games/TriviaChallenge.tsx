'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Timer, Brain, CheckCircle, XCircle, RotateCcw, ChevronRight } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const questions: Question[] = [
  // Easy Questions
  { id: 1, question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: 2, category: "Geography", difficulty: "easy" },
  { id: 2, question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctAnswer: 1, category: "Math", difficulty: "easy" },
  { id: 3, question: "What color is the sky on a clear day?", options: ["Red", "Green", "Blue", "Yellow"], correctAnswer: 2, category: "Science", difficulty: "easy" },
  { id: 4, question: "How many days are in a week?", options: ["5", "6", "7", "8"], correctAnswer: 2, category: "General", difficulty: "easy" },
  { id: 5, question: "What is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctAnswer: 2, category: "Science", difficulty: "easy" },
  
  // Medium Questions
  { id: 6, question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"], correctAnswer: 1, category: "Art", difficulty: "medium" },
  { id: 7, question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctAnswer: 2, category: "History", difficulty: "medium" },
  { id: 8, question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctAnswer: 2, category: "Science", difficulty: "medium" },
  { id: 9, question: "How many continents are there?", options: ["5", "6", "7", "8"], correctAnswer: 2, category: "Geography", difficulty: "medium" },
  { id: 10, question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctAnswer: 2, category: "Math", difficulty: "medium" },
  
  // Hard Questions
  { id: 11, question: "What is the speed of light in meters per second?", options: ["299,792,458", "186,282", "300,000,000", "150,000,000"], correctAnswer: 0, category: "Science", difficulty: "hard" },
  { id: 12, question: "Who wrote 'One Hundred Years of Solitude'?", options: ["Borges", "García Márquez", "Neruda", "Allende"], correctAnswer: 1, category: "Literature", difficulty: "hard" },
  { id: 13, question: "What is the capital of Burkina Faso?", options: ["Ouagadougou", "Bamako", "Niamey", "Accra"], correctAnswer: 0, category: "Geography", difficulty: "hard" },
  { id: 14, question: "In what year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], correctAnswer: 2, category: "Technology", difficulty: "hard" },
  { id: 15, question: "What is the atomic number of Carbon?", options: ["4", "5", "6", "7"], correctAnswer: 2, category: "Science", difficulty: "hard" },
];

export default function TriviaChallenge() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);

  // Filter questions based on difficulty
  const getQuestions = useCallback(() => {
    let filtered = [...questions];
    if (difficulty !== 'mixed') {
      filtered = questions.filter(q => q.difficulty === difficulty);
    }
    // Shuffle questions
    return filtered.sort(() => Math.random() - 0.5);
  }, [difficulty]);

  // Start new game
  const startGame = () => {
    const newQuestions = getQuestions();
    setGameQuestions(newQuestions);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(30);
    setSelectedAnswer(null);
    setShowResult(false);
    setStreak(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && !showResult && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeout();
    }
  }, [timeLeft, gameState, showResult]);

  // Handle timeout
  const handleTimeout = () => {
    setShowResult(true);
    setStreak(0);
    setQuestionsAnswered(questionsAnswered + 1);
    setTimeout(() => nextQuestion(), 2000);
  };

  // Handle answer selection
  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    setQuestionsAnswered(questionsAnswered + 1);
    
    const currentQuestion = gameQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const points = calculatePoints(currentQuestion.difficulty, timeLeft);
      setScore(score + points);
      setStreak(streak + 1);
      setCorrectAnswers(correctAnswers + 1);
      setExperience(experience + points);
      
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
      
      // Level up every 500 experience points
      if (experience + points >= level * 500) {
        setLevel(level + 1);
      }
    } else {
      setStreak(0);
    }
    
    setTimeout(() => nextQuestion(), 2000);
  };

  // Calculate points based on difficulty and time
  const calculatePoints = (diff: string, time: number) => {
    const basePoints = { easy: 10, medium: 20, hard: 30 }[diff] || 10;
    const timeBonus = Math.floor(time / 3);
    const streakBonus = streak * 5;
    return basePoints + timeBonus + streakBonus;
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < gameQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(30);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      endGame();
    }
  };

  // End game
  const endGame = () => {
    setGameState('gameOver');
    
    // Save high score
    const highScore = localStorage.getItem('triviaHighScore');
    if (!highScore || score > parseInt(highScore)) {
      localStorage.setItem('triviaHighScore', score.toString());
    }
  };

  // Get answer button style
  const getAnswerStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? 'ring-2 ring-blue-500' : '';
    }
    
    const currentQuestion = gameQuestions[currentQuestionIndex];
    if (index === currentQuestion.correctAnswer) {
      return 'bg-green-100 dark:bg-green-900 border-green-500';
    }
    if (selectedAnswer === index && index !== currentQuestion.correctAnswer) {
      return 'bg-red-100 dark:bg-red-900 border-red-500';
    }
    return 'opacity-50';
  };

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Trivia Challenge
        </CardTitle>
        <CardDescription>Test your knowledge across various categories!</CardDescription>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Brain className="w-24 h-24 mx-auto mb-4 text-purple-500" />
              <h2 className="text-2xl font-bold mb-2">Ready to Test Your Knowledge?</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Answer questions, build streaks, and climb the leaderboard!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Difficulty</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['easy', 'medium', 'hard', 'mixed'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff as any)}
                      className={`px-4 py-2 rounded-lg border capitalize transition-colors ${
                        difficulty === diff
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Your Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Level:</span>
                    <span className="ml-2 font-medium">{level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                    <span className="ml-2 font-medium">{experience} XP</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Best Streak:</span>
                    <span className="ml-2 font-medium">{bestStreak}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">High Score:</span>
                    <span className="ml-2 font-medium">
                      {localStorage.getItem('triviaHighScore') || 0}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={startGame} className="w-full" size="lg">
                Start Game
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="space-y-6">
            {/* Game Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  Question {currentQuestionIndex + 1}/{gameQuestions.length}
                </div>
                <div className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                  {currentQuestion.category}
                </div>
                <div className={`text-sm px-2 py-1 rounded capitalize ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900' :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  'bg-red-100 dark:bg-red-900'
                }`}>
                  {currentQuestion.difficulty}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">{score}</span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <span className="text-sm">🔥</span>
                    <span className="font-semibold">{streak}</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  <Timer className="w-4 h-4" />
                  <span className="font-semibold">{timeLeft}s</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / gameQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <div className="py-8">
              <h2 className="text-xl md:text-2xl font-semibold text-center mb-8">
                {currentQuestion.question}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={showResult}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 disabled:hover:scale-100 ${
                      getAnswerStyle(index)
                    } ${!showResult ? 'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            {showResult && (
              <div className={`text-center py-4 rounded-lg ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">Correct! +{calculatePoints(currentQuestion.difficulty, timeLeft)} points</p>
                  </div>
                ) : (
                  <div>
                    <XCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">
                      {timeLeft === 0 ? 'Time\'s up!' : 'Incorrect!'} The answer was: {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                Final Score: {score}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Game Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Questions Answered</p>
                  <p className="text-xl font-semibold">{questionsAnswered}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</p>
                  <p className="text-xl font-semibold">{correctAnswers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                  <p className="text-xl font-semibold">{accuracy}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best Streak</p>
                  <p className="text-xl font-semibold">{bestStreak}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={startGame} className="flex-1">
                Play Again
                <RotateCcw className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => setGameState('menu')} variant="outline" className="flex-1">
                Main Menu
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}