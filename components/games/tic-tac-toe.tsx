'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid3x3, User, Bot, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameStats {
  playerWins: number;
  aiWins: number;
  draws: number;
}

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats>({ playerWins: 0, aiWins: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkWinner = useCallback((board: Board): { winner: Player | 'draw' | null; line: number[] } => {
    // Check for winner
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: combination };
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: [] };
    }
    
    return { winner: null, line: [] };
  }, []);

  const minimax = useCallback((board: Board, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
    const result = checkWinner(board);
    
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    if (result.winner === 'draw') return 0;
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const eval_ = minimax(board, depth + 1, false, alpha, beta);
          board[i] = null;
          maxEval = Math.max(maxEval, eval_);
          alpha = Math.max(alpha, eval_);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const eval_ = minimax(board, depth + 1, true, alpha, beta);
          board[i] = null;
          minEval = Math.min(minEval, eval_);
          beta = Math.min(beta, eval_);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }, [checkWinner]);

  const getAiMove = useCallback((board: Board, difficulty: Difficulty): number => {
    const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null) as number[];
    
    if (difficulty === 'easy') {
      // Random move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    if (difficulty === 'medium') {
      // 70% chance of best move, 30% random
      if (Math.random() < 0.7) {
        let bestMove = -1;
        let bestValue = -Infinity;
        
        for (const move of availableMoves) {
          board[move] = 'O';
          const value = minimax(board, 0, false, -Infinity, Infinity);
          board[move] = null;
          
          if (value > bestValue) {
            bestValue = value;
            bestMove = move;
          }
        }
        return bestMove;
      } else {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }
    
    // Hard difficulty - always best move
    let bestMove = -1;
    let bestValue = -Infinity;
    
    for (const move of availableMoves) {
      board[move] = 'O';
      const value = minimax(board, 0, false, -Infinity, Infinity);
      board[move] = null;
      
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
    
    return bestMove;
  }, [minimax]);

  const makeMove = useCallback((index: number) => {
    if (board[index] || winner || isAiThinking) return;
    
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    
    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      // Update stats
      if (result.winner === 'draw') {
        setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else if (gameMode === 'ai') {
        if (result.winner === 'X') {
          setStats(prev => ({ ...prev, playerWins: prev.playerWins + 1 }));
        } else {
          setStats(prev => ({ ...prev, aiWins: prev.aiWins + 1 }));
        }
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, winner, checkWinner, gameMode, isAiThinking]);

  // AI move
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && !isAiThinking) {
      setIsAiThinking(true);
      const timeout = setTimeout(() => {
        const aiMove = getAiMove([...board], difficulty);
        if (aiMove !== -1) {
          makeMove(aiMove);
        }
        setIsAiThinking(false);
      }, 500); // Add delay for better UX
      
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, gameMode, winner, board, getAiMove, difficulty, makeMove, isAiThinking]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setIsAiThinking(false);
  }, []);

  const changeGameMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    resetGame();
    setStats({ playerWins: 0, aiWins: 0, draws: 0 });
  }, [resetGame]);

  const renderCell = (index: number) => {
    const isWinningCell = winningLine.includes(index);
    const value = board[index];
    
    return (
      <button
        key={index}
        onClick={() => makeMove(index)}
        disabled={!!value || !!winner || isAiThinking}
        className={cn(
          "aspect-square border-2 rounded-lg flex items-center justify-center",
          "text-4xl font-bold transition-all duration-200",
          "hover:bg-muted disabled:cursor-default",
          isWinningCell && "bg-green-100 border-green-500",
          !value && !winner && !isAiThinking && "hover:scale-105"
        )}
      >
        <span className={cn(
          "transition-all duration-200",
          value === 'X' && "text-blue-600",
          value === 'O' && "text-red-600",
          isWinningCell && "scale-110"
        )}>
          {value}
        </span>
      </button>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-6 h-6" />
            Tic-Tac-Toe
          </CardTitle>
          <CardDescription>
            Classic game of X&apos;s and O&apos;s. Play against a friend or challenge the AI!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Mode Selection */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={gameMode === 'pvp' ? 'default' : 'outline'}
              onClick={() => changeGameMode('pvp')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Player vs Player
            </Button>
            <Button
              variant={gameMode === 'ai' ? 'default' : 'outline'}
              onClick={() => changeGameMode('ai')}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Player vs AI
            </Button>
          </div>

          {/* AI Difficulty */}
          {gameMode === 'ai' && (
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant={difficulty === 'easy' ? 'default' : 'outline'}
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </Button>
              <Button
                size="sm"
                variant={difficulty === 'medium' ? 'default' : 'outline'}
                onClick={() => setDifficulty('medium')}
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={difficulty === 'hard' ? 'default' : 'outline'}
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </Button>
            </div>
          )}

          {/* Stats */}
          {gameMode === 'ai' && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <div className="text-sm text-muted-foreground">You</div>
                <div className="text-xl font-bold">{stats.playerWins}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-sm text-muted-foreground">Draws</div>
                <div className="text-xl font-bold">{stats.draws}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-sm text-muted-foreground">AI</div>
                <div className="text-xl font-bold">{stats.aiWins}</div>
              </div>
            </div>
          )}

          {/* Game Board */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {board.map((_, index) => renderCell(index))}
            </div>
            
            {/* AI Thinking Indicator */}
            {isAiThinking && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <div className="text-lg font-semibold">AI is thinking...</div>
              </div>
            )}
          </div>

          {/* Game Status */}
          <div className="text-center space-y-4">
            {!winner && (
              <div className="text-lg">
                Current Player: <span className={cn(
                  "font-bold",
                  currentPlayer === 'X' ? "text-blue-600" : "text-red-600"
                )}>
                  {currentPlayer}
                  {gameMode === 'ai' && currentPlayer === 'O' && ' (AI)'}
                </span>
              </div>
            )}
            
            {winner && (
              <div className="space-y-2">
                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                  {winner === 'draw' ? (
                    "It's a Draw!"
                  ) : (
                    <>
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <span className={cn(
                        winner === 'X' ? "text-blue-600" : "text-red-600"
                      )}>
                        {winner}
                        {gameMode === 'ai' && winner === 'O' && ' (AI)'}
                      </span>
                      Wins!
                    </>
                  )}
                </div>
                <Button onClick={resetGame} className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How to Play:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Players take turns placing X&apos;s and O&apos;s on the grid</li>
              <li>• First player to get 3 in a row (horizontal, vertical, or diagonal) wins</li>
              <li>• If all squares are filled with no winner, it&apos;s a draw</li>
              {gameMode === 'ai' && <li>• You play as X, AI plays as O</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}