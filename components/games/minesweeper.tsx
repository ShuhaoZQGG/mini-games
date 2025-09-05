'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bomb, Flag, Timer, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'idle' | 'playing' | 'won' | 'lost';

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [minesRemaining, setMinesRemaining] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number | null>>({
    easy: null,
    medium: null,
    hard: null,
  });

  const config = DIFFICULTY_CONFIGS[difficulty];

  const initializeBoard = useCallback((firstClickRow?: number, firstClickCol?: number) => {
    const newBoard: CellState[][] = [];
    const { rows, cols, mines } = config;
    
    // Initialize empty board
    for (let r = 0; r < rows; r++) {
      newBoard[r] = [];
      for (let c = 0; c < cols; c++) {
        newBoard[r][c] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        };
      }
    }
    
    // Place mines randomly (avoiding first click if provided)
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      
      // Skip if mine already placed or if it's the first click position
      if (newBoard[r][c].isMine || 
          (firstClickRow !== undefined && firstClickCol !== undefined &&
           Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1)) {
        continue;
      }
      
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
    
    // Calculate adjacent mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].adjacentMines = count;
        }
      }
    }
    
    setBoard(newBoard);
    setMinesRemaining(mines);
  }, [config]);

  const revealCell = useCallback((row: number, col: number, currentBoard?: CellState[][]) => {
    const workingBoard = currentBoard || board;
    const { rows, cols } = config;
    
    if (row < 0 || row >= rows || col < 0 || col >= cols ||
        workingBoard[row][col].isRevealed || workingBoard[row][col].isFlagged) {
      return workingBoard;
    }
    
    const newBoard = workingBoard.map(row => row.map(cell => ({ ...cell })));
    newBoard[row][col].isRevealed = true;
    
    // If cell has no adjacent mines, reveal adjacent cells
    if (newBoard[row][col].adjacentMines === 0 && !newBoard[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCell(row + dr, col + dc, newBoard);
        }
      }
    }
    
    return newBoard;
  }, [board, config]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    
    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;
    
    // First click - initialize board and start timer
    if (gameState === 'idle') {
      initializeBoard(row, col);
      setGameState('playing');
      setStartTime(Date.now());
      return;
    }
    
    // Reveal cell
    let newBoard = revealCell(row, col);
    
    // Check if mine was clicked
    if (cell.isMine) {
      // Reveal all mines
      newBoard = newBoard.map(row => 
        row.map(cell => ({
          ...cell,
          isRevealed: cell.isMine ? true : cell.isRevealed
        }))
      );
      setGameState('lost');
    } else {
      // Check for win condition
      const nonMineCount = config.rows * config.cols - config.mines;
      const revealedCount = newBoard.flat().filter(cell => cell.isRevealed && !cell.isMine).length;
      
      if (revealedCount === nonMineCount) {
        setGameState('won');
        // Save best time
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        if (!bestTimes[difficulty] || finalTime < bestTimes[difficulty]!) {
          setBestTimes(prev => ({ ...prev, [difficulty]: finalTime }));
        }
      }
    }
    
    setBoard(newBoard);
  }, [board, gameState, initializeBoard, revealCell, config, startTime, bestTimes, difficulty]);

  const handleRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    if (gameState !== 'playing' || board[row][col].isRevealed) return;
    
    const newBoard = board.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          const newFlagged = !c.isFlagged;
          setMinesRemaining(prev => prev + (newFlagged ? -1 : 1));
          return { ...c, isFlagged: newFlagged };
        }
        return c;
      })
    );
    
    setBoard(newBoard);
  }, [board, gameState]);

  const resetGame = useCallback(() => {
    initializeBoard();
    setGameState('idle');
    setElapsedTime(0);
    setStartTime(0);
  }, [initializeBoard]);

  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setGameState('idle');
    setElapsedTime(0);
    setStartTime(0);
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameState, startTime]);

  // Initialize board on mount or difficulty change
  useEffect(() => {
    initializeBoard();
  }, [difficulty, initializeBoard]);

  const getCellContent = (cell: CellState) => {
    if (!cell.isRevealed && cell.isFlagged) {
      return <Flag className="w-4 h-4 text-red-500" />;
    }
    if (!cell.isRevealed) return null;
    if (cell.isMine) {
      return <Bomb className="w-4 h-4" />;
    }
    if (cell.adjacentMines > 0) {
      return (
        <span className={cn(
          "font-bold text-sm",
          cell.adjacentMines === 1 && "text-blue-600",
          cell.adjacentMines === 2 && "text-green-600",
          cell.adjacentMines === 3 && "text-red-600",
          cell.adjacentMines === 4 && "text-purple-600",
          cell.adjacentMines === 5 && "text-orange-600",
          cell.adjacentMines === 6 && "text-cyan-600",
          cell.adjacentMines === 7 && "text-black",
          cell.adjacentMines === 8 && "text-gray-600"
        )}>
          {cell.adjacentMines}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bomb className="w-6 h-6" />
            Minesweeper
          </CardTitle>
          <CardDescription>
            Classic mine-finding puzzle game. Click to reveal, right-click to flag!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Difficulty Selection */}
          <div className="flex gap-2 justify-center">
            <Button
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => changeDifficulty('easy')}
              size="sm"
            >
              Easy (9×9)
            </Button>
            <Button
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => changeDifficulty('medium')}
              size="sm"
            >
              Medium (16×16)
            </Button>
            <Button
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => changeDifficulty('hard')}
              size="sm"
            >
              Hard (16×30)
            </Button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center p-2 bg-muted rounded">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Bomb className="w-4 h-4" />
                Mines
              </div>
              <div className="text-xl font-bold">{minesRemaining}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                Time
              </div>
              <div className="text-xl font-bold">{elapsedTime}s</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4" />
                Best
              </div>
              <div className="text-xl font-bold">
                {bestTimes[difficulty] !== null ? `${bestTimes[difficulty]}s` : '--'}
              </div>
            </div>
          </div>

          {/* Game Board */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-min">
              <div 
                className="grid gap-0.5 p-2 bg-muted rounded"
                style={{
                  gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                }}
              >
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                      disabled={gameState === 'won' || gameState === 'lost'}
                      className={cn(
                        "w-7 h-7 border flex items-center justify-center text-xs",
                        "transition-all duration-100",
                        !cell.isRevealed && "bg-gray-200 hover:bg-gray-300 border-gray-400",
                        cell.isRevealed && !cell.isMine && "bg-white border-gray-200",
                        cell.isRevealed && cell.isMine && gameState === 'lost' && "bg-red-200",
                        cell.isRevealed && cell.isMine && gameState !== 'lost' && "bg-gray-100"
                      )}
                    >
                      {getCellContent(cell)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Game Status */}
          {(gameState === 'won' || gameState === 'lost') && (
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                {gameState === 'won' ? (
                  <>
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    You Won in {elapsedTime} seconds!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    Game Over!
                  </>
                )}
              </div>
              <Button onClick={resetGame} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                New Game
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How to Play:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Left click to reveal a cell</li>
              <li>• Right click to place/remove a flag</li>
              <li>• Numbers show how many mines are adjacent</li>
              <li>• Flag all mines and reveal all safe cells to win</li>
              <li>• Click on a mine and you lose!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}