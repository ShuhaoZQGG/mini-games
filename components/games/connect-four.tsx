'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Trophy, Circle } from 'lucide-react';
import { scoreService } from '@/lib/services/scores';

class ConnectFourGame {
  public board: (string | null)[][];
  public currentPlayer: 'red' | 'yellow';
  public winner: string | null;
  public winningCells: [number, number][];
  public score: number;
  private moveCount: number;
  private startTime: number;
  private duration: number;

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'red';
    this.winner = null;
    this.winningCells = [];
    this.moveCount = 0;
    this.score = 0;
    this.startTime = 0;
    this.duration = 0;
  }

  private createEmptyBoard(): (string | null)[][] {
    return Array(6).fill(null).map(() => Array(7).fill(null));
  }

  start(): void {
    this.startTime = Date.now();
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'red';
    this.winner = null;
    this.winningCells = [];
    this.moveCount = 0;
  }

  makeMove(column: number): boolean {
    if (this.winner || this.board[0][column] !== null) {
      return false;
    }

    // Find the lowest empty row
    let row = 5;
    while (row >= 0 && this.board[row][column] !== null) {
      row--;
    }

    if (row < 0) return false;

    this.board[row][column] = this.currentPlayer;
    this.moveCount++;

    // Check for winner
    if (this.checkWinner(row, column)) {
      this.winner = this.currentPlayer;
      this.duration = Date.now() - this.startTime;
      this.score = this.calculateScore();
      scoreService.saveScore('connect-four', this.score, {
        winner: this.winner,
        moves: this.moveCount,
        duration: this.duration
      });
    } else if (this.moveCount === 42) {
      this.winner = 'draw';
      this.duration = Date.now() - this.startTime;
    } else {
      this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
    }

    return true;
  }

  private checkWinner(row: number, col: number): boolean {
    const player = this.board[row][col];
    if (!player) return false;

    // Check all directions
    const directions = [
      [[0, 1], [0, -1]], // Horizontal
      [[1, 0], [-1, 0]], // Vertical
      [[1, 1], [-1, -1]], // Diagonal \
      [[1, -1], [-1, 1]] // Diagonal /
    ];

    for (const direction of directions) {
      const cells: [number, number][] = [[row, col]];
      
      for (const [dr, dc] of direction) {
        let r = row + dr;
        let c = col + dc;
        
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
          cells.push([r, c]);
          r += dr;
          c += dc;
        }
      }

      if (cells.length >= 4) {
        this.winningCells = cells;
        return true;
      }
    }

    return false;
  }

  private calculateScore(): number {
    if (!this.winner || this.winner === 'draw') return 0;
    // Score based on how quickly the game was won
    const maxMoves = 42;
    return Math.max(1000, 5000 - (this.moveCount * 100));
  }

  reset(): void {
    this.start();
  }
}

export function ConnectFour() {
  const [game] = useState(() => new ConnectFourGame());
  const [board, setBoard] = useState(game.board);
  const [currentPlayer, setCurrentPlayer] = useState(game.currentPlayer);
  const [winner, setWinner] = useState(game.winner);
  const [winningCells, setWinningCells] = useState(game.winningCells);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

  const updateGameState = useCallback(() => {
    setBoard([...game.board]);
    setCurrentPlayer(game.currentPlayer);
    setWinner(game.winner);
    setWinningCells([...game.winningCells]);
  }, [game]);

  const handleColumnClick = useCallback((column: number) => {
    if (game.makeMove(column)) {
      updateGameState();
    }
  }, [game, updateGameState]);

  const handleReset = useCallback(() => {
    game.reset();
    updateGameState();
  }, [game, updateGameState]);

  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  const getDropRow = (column: number): number => {
    if (winner || !hoveredColumn) return -1;
    let row = 5;
    while (row >= 0 && board[row][column] !== null) {
      row--;
    }
    return row;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Connect Four</h1>
        <p className="text-muted-foreground">
          Drop your pieces to get four in a row!
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-lg">
            {winner ? (
              winner === 'draw' ? (
                <span className="font-semibold">It&apos;s a draw!</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">
                    <Circle 
                      className={`inline-block h-4 w-4 ${
                        winner === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'
                      }`} 
                    />
                    {' '}{winner === 'red' ? 'Red' : 'Yellow'} wins!
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span>Current player:</span>
                <Circle 
                  className={`h-5 w-5 ${
                    currentPlayer === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'
                  }`} 
                />
                <span className="font-semibold">
                  {currentPlayer === 'red' ? 'Red' : 'Yellow'}
                </span>
              </div>
            )}
          </div>

          <div className="relative bg-blue-600 p-4 rounded-lg">
            <div className="grid grid-cols-7 gap-2">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      relative w-12 h-12 bg-blue-700 rounded-full
                      ${!winner && !cell ? 'hover:bg-blue-800 cursor-pointer' : ''}
                      transition-colors
                    `}
                    onClick={() => handleColumnClick(colIndex)}
                    onMouseEnter={() => setHoveredColumn(colIndex)}
                    onMouseLeave={() => setHoveredColumn(null)}
                    disabled={!!winner}
                  >
                    {cell && (
                      <Circle
                        className={`
                          absolute inset-1 
                          ${cell === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'}
                          ${isWinningCell(rowIndex, colIndex) ? 'animate-pulse' : ''}
                        `}
                      />
                    )}
                    {!cell && hoveredColumn === colIndex && getDropRow(colIndex) === rowIndex && !winner && (
                      <Circle
                        className={`
                          absolute inset-1 opacity-50
                          ${currentPlayer === 'red' ? 'fill-red-500 text-red-500' : 'fill-yellow-500 text-yellow-500'}
                        `}
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            New Game
          </Button>
        </div>
      </Card>
    </div>
  );
}