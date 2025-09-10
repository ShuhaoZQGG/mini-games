'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RotateCcw, CheckCircle, Lightbulb } from 'lucide-react';

type Cell = {
  value: number | null;
  isClue: boolean;
  downClue?: number;
  rightClue?: number;
  isEditable: boolean;
};

export default function Kakuro() {
  const [gridSize, setGridSize] = useState<'6x6' | '9x9' | '12x12'>('6x6');
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'complete'>('menu');
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(3);
  const [timer, setTimer] = useState(0);
  
  // Simplified 6x6 puzzle
  const initial6x6: Cell[][] = [
    [
      { value: null, isClue: true, isEditable: false },
      { value: null, isClue: true, downClue: 16, isEditable: false },
      { value: null, isClue: true, downClue: 9, isEditable: false },
      { value: null, isClue: true, isEditable: false },
      { value: null, isClue: true, isEditable: false },
      { value: null, isClue: true, isEditable: false }
    ],
    [
      { value: null, isClue: true, rightClue: 17, isEditable: false },
      { value: null, isClue: false, isEditable: true },
      { value: null, isClue: false, isEditable: true },
      { value: null, isClue: true, downClue: 15, rightClue: 12, isEditable: false },
      { value: null, isClue: false, isEditable: true },
      { value: null, isClue: false, isEditable: true }
    ],
    // Add more rows...
  ];

  const [grid, setGrid] = useState<Cell[][]>(initial6x6);

  const startGame = () => {
    setGameState('playing');
    setMistakes(0);
    setHints(3);
    setTimer(0);
    // Initialize grid based on size
    setGrid(initial6x6);
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isClue || !grid[row][col].isEditable) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const newGrid = [...grid];
    newGrid[selectedCell.row][selectedCell.col].value = num;
    setGrid(newGrid);
    
    // Check if puzzle is complete
    if (checkComplete()) {
      setGameState('complete');
    }
  };

  const checkComplete = () => {
    // Check if all cells are filled and sums are correct
    for (let row of grid) {
      for (let cell of row) {
        if (!cell.isClue && cell.value === null) return false;
      }
    }
    return validateSums();
  };

  const validateSums = () => {
    // Simplified validation logic
    return true;
  };

  const useHint = () => {
    if (hints <= 0 || !selectedCell) return;
    // Provide hint logic
    setHints(hints - 1);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Kakuro
        </CardTitle>
        <CardDescription>Fill the grid so each sum matches the clues!</CardDescription>
      </CardHeader>
      <CardContent>
        {gameState === 'menu' && (
          <div className="text-center py-8">
            <Brain className="w-24 h-24 mx-auto mb-4 text-purple-500" />
            <h2 className="text-2xl font-bold mb-4">Number Crossword Puzzle</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Place digits 1-9 so that each row and column adds up to the given clues.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Grid Size</label>
              <div className="flex gap-2 justify-center">
                <Button
                  variant={gridSize === '6x6' ? 'default' : 'outline'}
                  onClick={() => setGridSize('6x6')}
                >
                  6×6
                </Button>
                <Button
                  variant={gridSize === '9x9' ? 'default' : 'outline'}
                  onClick={() => setGridSize('9x9')}
                >
                  9×9
                </Button>
                <Button
                  variant={gridSize === '12x12' ? 'default' : 'outline'}
                  onClick={() => setGridSize('12x12')}
                >
                  12×12
                </Button>
              </div>
            </div>
            <Button onClick={startGame} size="lg">Start Puzzle</Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div className="flex justify-between mb-4">
              <div className="flex gap-4">
                <span>Mistakes: {mistakes}/3</span>
                <span>Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
              </div>
              <Button
                onClick={useHint}
                size="sm"
                variant="outline"
                disabled={hints === 0}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint ({hints})
              </Button>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-6 gap-0 max-w-md mx-auto mb-6">
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`
                      border border-gray-400 aspect-square flex items-center justify-center relative
                      ${cell.isClue ? 'bg-gray-800' : 'bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600'}
                      ${selectedCell?.row === rowIdx && selectedCell?.col === colIdx ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                  >
                    {cell.isClue && (cell.downClue || cell.rightClue) && (
                      <>
                        {cell.downClue && (
                          <span className="absolute bottom-1 right-1 text-xs text-white">
                            {cell.downClue}
                          </span>
                        )}
                        {cell.rightClue && (
                          <span className="absolute top-1 left-1 text-xs text-white">
                            {cell.rightClue}
                          </span>
                        )}
                        {cell.downClue && cell.rightClue && (
                          <div className="absolute inset-0">
                            <svg className="w-full h-full">
                              <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="1" />
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                    {!cell.isClue && cell.value && (
                      <span className="text-lg font-bold">{cell.value}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Number input */}
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  variant="outline"
                  size="sm"
                >
                  {num}
                </Button>
              ))}
              <Button
                onClick={() => handleNumberInput(0)}
                variant="outline"
                size="sm"
                className="col-span-2"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {gameState === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="w-24 h-24 mx-auto mb-4 text-green-500" />
            <h2 className="text-3xl font-bold mb-4">Puzzle Complete!</h2>
            <p className="text-xl mb-2">Time: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
            <p className="text-lg mb-6">Mistakes: {mistakes}</p>
            <Button onClick={() => setGameState('menu')} size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              New Puzzle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}