'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SudokuGame, Difficulty } from '@/lib/games/sudoku';
import { GameState } from '@/lib/games/types';
import { cn } from '@/lib/utils';

export function Sudoku() {
  const gameRef = useRef<SudokuGame | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [grid, setGrid] = useState<ReturnType<SudokuGame['getFullGrid']>>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mistakes, setMistakes] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [timer, setTimer] = useState(0);
  const [noteMode, setNoteMode] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateGameDisplay = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    setGameState(game.getState());
    setGrid([...game.getFullGrid()]);
    setMistakes(game.getMistakes());
    setHintsRemaining(game.getHintsRemaining());
    setTimer(game.getTimer());
    setSelectedCell(game.getSelectedCell());
  }, []);

  useEffect(() => {
    gameRef.current = new SudokuGame();
    updateGameDisplay();

    // Set up timer update interval
    timerIntervalRef.current = setInterval(() => {
      if (gameRef.current && gameRef.current.getState() === GameState.PLAYING) {
        setTimer(gameRef.current.getTimer());
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [updateGameDisplay]);

  const handleStart = (selectedDifficulty: Difficulty) => {
    if (!gameRef.current) return;
    setDifficulty(selectedDifficulty);
    gameRef.current.start(selectedDifficulty);
    updateGameDisplay();
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameRef.current || gameState !== GameState.PLAYING) return;
    
    gameRef.current.selectCell(row, col);
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (number: number) => {
    if (!gameRef.current || !selectedCell || gameState !== GameState.PLAYING) return;
    
    if (noteMode) {
      gameRef.current.toggleNote(selectedCell.row, selectedCell.col, number);
    } else {
      gameRef.current.placeNumber(selectedCell.row, selectedCell.col, number);
    }
    updateGameDisplay();
  };

  const handleClear = () => {
    if (!gameRef.current || !selectedCell || gameState !== GameState.PLAYING) return;
    
    gameRef.current.clearCell(selectedCell.row, selectedCell.col);
    updateGameDisplay();
  };

  const handleHint = () => {
    if (!gameRef.current || gameState !== GameState.PLAYING) return;
    
    const hint = gameRef.current.getHint();
    if (hint) {
      gameRef.current.placeNumber(hint.row, hint.col, hint.value);
      gameRef.current.selectCell(hint.row, hint.col);
      updateGameDisplay();
    }
  };

  const handlePauseResume = () => {
    if (!gameRef.current) return;
    
    if (gameState === GameState.PLAYING) {
      gameRef.current.pause();
    } else if (gameState === GameState.PAUSED) {
      gameRef.current.resume();
    }
    updateGameDisplay();
  };

  const handleReset = () => {
    if (!gameRef.current) return;
    gameRef.current.reset();
    updateGameDisplay();
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameRef.current || !selectedCell || gameState !== GameState.PLAYING) return;
    
    const key = e.key;
    
    // Number input
    if (key >= '1' && key <= '9') {
      e.preventDefault();
      handleNumberInput(parseInt(key));
    }
    
    // Clear cell
    if (key === 'Backspace' || key === 'Delete' || key === '0') {
      e.preventDefault();
      handleClear();
    }
    
    // Arrow key navigation
    const { row, col } = selectedCell;
    if (key === 'ArrowUp' && row > 0) {
      handleCellClick(row - 1, col);
    } else if (key === 'ArrowDown' && row < 8) {
      handleCellClick(row + 1, col);
    } else if (key === 'ArrowLeft' && col > 0) {
      handleCellClick(row, col - 1);
    } else if (key === 'ArrowRight' && col < 8) {
      handleCellClick(row, col + 1);
    }
    
    // Toggle note mode
    if (key === 'n' || key === 'N') {
      setNoteMode(!noteMode);
    }
  }, [selectedCell, gameState, noteMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellClass = (row: number, col: number, cell: any): string => {
    const classes = [];
    
    // Base styling
    classes.push('aspect-square flex items-center justify-center text-lg font-semibold cursor-pointer transition-colors');
    
    // Selected cell
    if (selectedCell?.row === row && selectedCell?.col === col) {
      classes.push('bg-blue-200');
    } else {
      classes.push('hover:bg-gray-100');
    }
    
    // Fixed cells
    if (cell.isFixed) {
      classes.push('bg-gray-50 text-gray-900');
    } else if (cell.value > 0) {
      classes.push('text-blue-600');
    }
    
    // Error cells
    if (cell.isError) {
      classes.push('text-red-600 bg-red-50');
    }
    
    // Border styling for 3x3 boxes
    if (col % 3 === 0 && col !== 0) {
      classes.push('border-l-2 border-l-gray-400');
    }
    if (row % 3 === 0 && row !== 0) {
      classes.push('border-t-2 border-t-gray-400');
    }
    
    return cn(classes);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Sudoku</CardTitle>
        <CardDescription>
          Fill the grid so each row, column, and 3x3 box contains digits 1-9.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === GameState.READY && (
          <div className="flex justify-center space-x-4">
            <Button onClick={() => handleStart('easy')}>Easy</Button>
            <Button onClick={() => handleStart('medium')}>Medium</Button>
            <Button onClick={() => handleStart('hard')}>Hard</Button>
          </div>
        )}

        {gameState !== GameState.READY && (
          <>
            <div className="flex justify-between items-center">
              <div className="space-x-4 text-sm">
                <span>Difficulty: <strong className="capitalize">{difficulty}</strong></span>
                <span>Time: <strong>{formatTime(timer)}</strong></span>
                <span>Mistakes: <strong className="text-red-600">{mistakes}/3</strong></span>
                <span>Hints: <strong>{hintsRemaining}</strong></span>
              </div>
              <div className="space-x-2">
                <Button size="sm" onClick={handlePauseResume}>
                  {gameState === GameState.PLAYING ? 'Pause' : 'Resume'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  New Game
                </Button>
              </div>
            </div>

            {gameState === GameState.PAUSED ? (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-2xl font-semibold text-gray-500">Game Paused</p>
              </div>
            ) : (
              <>
                <div className="border-2 border-gray-400 rounded-lg overflow-hidden bg-white">
                  <div className="grid grid-cols-9">
                    {grid.map((row, rowIndex) => (
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={getCellClass(rowIndex, colIndex, cell)}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {cell.value > 0 ? (
                            cell.value
                          ) : (
                            <div className="grid grid-cols-3 gap-0 text-xs text-gray-400">
                              {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                                <span key={n} className="w-2 h-2 flex items-center justify-center">
                                  {cell.notes.has(n) ? n : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <Button
                        key={num}
                        size="sm"
                        variant="outline"
                        className="w-12 h-12"
                        onClick={() => handleNumberInput(num)}
                        disabled={gameState !== GameState.PLAYING}
                      >
                        {num}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-12 h-12"
                      onClick={handleClear}
                      disabled={gameState !== GameState.PLAYING}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant={noteMode ? 'default' : 'outline'}
                    onClick={() => setNoteMode(!noteMode)}
                    disabled={gameState !== GameState.PLAYING}
                  >
                    Notes (N)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleHint}
                    disabled={gameState !== GameState.PLAYING || hintsRemaining === 0}
                  >
                    Hint ({hintsRemaining})
                  </Button>
                </div>
              </>
            )}

            {gameState === GameState.GAME_OVER && (
              <div className="text-center">
                {mistakes >= 3 ? (
                  <p className="text-lg text-red-600 font-semibold">Game Over! Too many mistakes.</p>
                ) : (
                  <p className="text-lg text-green-600 font-semibold">
                    Congratulations! You solved the puzzle in {formatTime(timer)}!
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Use number keys 1-9 to fill cells, arrow keys to navigate</p>
          <p>Press N to toggle note mode, Backspace to clear</p>
        </div>
      </CardContent>
    </Card>
  );
}