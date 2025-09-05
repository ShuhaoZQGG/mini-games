'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, RefreshCw, Trophy } from 'lucide-react';
import { scoreService } from '@/lib/services/scores';

interface Piece {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

class TetrisGame {
  public board: (string | null)[][];
  public currentPiece: Piece | null;
  public nextPiece: Piece | null;
  public lines: number;
  public level: number;
  public score: number;
  public gameOver: boolean;
  public isPaused: boolean;
  private dropInterval: number;
  private lastDrop: number;
  private startTime: number;
  private duration: number;
  
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  
  private readonly PIECES = [
    { shape: [[1, 1, 1, 1]], color: 'cyan' },     // I
    { shape: [[1, 1], [1, 1]], color: 'yellow' },  // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' }, // T
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },  // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },    // Z
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },   // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }  // L
  ];

  constructor() {
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.lines = 0;
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.dropInterval = 1000;
    this.lastDrop = 0;
    this.startTime = 0;
    this.duration = 0;
  }

  private createEmptyBoard(): (string | null)[][] {
    return Array(this.BOARD_HEIGHT).fill(null).map(() => 
      Array(this.BOARD_WIDTH).fill(null)
    );
  }

  start(): void {
    this.startTime = Date.now();
    this.board = this.createEmptyBoard();
    this.lines = 0;
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.dropInterval = 1000;
    this.lastDrop = Date.now();
    this.currentPiece = this.generatePiece();
    this.nextPiece = this.generatePiece();
  }

  private generatePiece(): Piece {
    const pieceType = this.PIECES[Math.floor(Math.random() * this.PIECES.length)];
    return {
      shape: pieceType.shape,
      color: pieceType.color,
      x: Math.floor((this.BOARD_WIDTH - pieceType.shape[0].length) / 2),
      y: 0
    };
  }

  update(): void {
    if (this.gameOver || this.isPaused || !this.currentPiece) return;
    
    const now = Date.now();
    if (now - this.lastDrop > this.dropInterval) {
      this.moveDown();
      this.lastDrop = now;
    }
  }

  moveLeft(): void {
    if (!this.currentPiece || this.gameOver || this.isPaused) return;
    
    this.currentPiece.x--;
    if (this.hasCollision()) {
      this.currentPiece.x++;
    }
  }

  moveRight(): void {
    if (!this.currentPiece || this.gameOver || this.isPaused) return;
    
    this.currentPiece.x++;
    if (this.hasCollision()) {
      this.currentPiece.x--;
    }
  }

  moveDown(): boolean {
    if (!this.currentPiece || this.gameOver || this.isPaused) return false;
    
    this.currentPiece.y++;
    if (this.hasCollision()) {
      this.currentPiece.y--;
      this.lockPiece();
      return false;
    }
    return true;
  }

  hardDrop(): void {
    if (!this.currentPiece || this.gameOver || this.isPaused) return;
    
    while (this.moveDown()) {
      this.score += 2;
    }
  }

  rotate(): void {
    if (!this.currentPiece || this.gameOver || this.isPaused) return;
    
    const rotated = this.rotatePiece(this.currentPiece.shape);
    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    
    if (this.hasCollision()) {
      // Try wall kicks
      const kicks = [0, 1, -1, 2, -2];
      let kicked = false;
      
      for (const kick of kicks) {
        this.currentPiece.x += kick;
        if (!this.hasCollision()) {
          kicked = true;
          break;
        }
        this.currentPiece.x -= kick;
      }
      
      if (!kicked) {
        this.currentPiece.shape = originalShape;
      }
    }
  }

  private rotatePiece(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: number[][] = Array(cols).fill(null).map(() => Array(rows).fill(0));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotated[col][rows - 1 - row] = shape[row][col];
      }
    }
    
    return rotated;
  }

  private hasCollision(): boolean {
    if (!this.currentPiece) return false;
    
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardX = this.currentPiece.x + col;
          const boardY = this.currentPiece.y + row;
          
          if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
              boardY >= this.BOARD_HEIGHT ||
              (boardY >= 0 && this.board[boardY][boardX])) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;
    
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPiece.y + row;
          const boardX = this.currentPiece.x + col;
          
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      }
    }
    
    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generatePiece();
    
    if (this.hasCollision()) {
      this.gameOver = true;
      this.duration = Date.now() - this.startTime;
      scoreService.saveScore('tetris', this.score, {
        lines: this.lines,
        level: this.level,
        duration: this.duration
      });
    }
  }

  private clearLines(): void {
    let linesCleared = 0;
    
    for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== null)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.BOARD_WIDTH).fill(null));
        linesCleared++;
        row++; // Check the same row again
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += this.calculateLineScore(linesCleared);
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    }
  }

  private calculateLineScore(lines: number): number {
    const baseScores = [0, 100, 300, 500, 800];
    return baseScores[lines] * this.level;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  reset(): void {
    this.start();
  }

  getDisplayBoard(): (string | null)[][] {
    const display = this.board.map(row => [...row]);
    
    if (this.currentPiece && !this.gameOver) {
      for (let row = 0; row < this.currentPiece.shape.length; row++) {
        for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
          if (this.currentPiece.shape[row][col]) {
            const boardY = this.currentPiece.y + row;
            const boardX = this.currentPiece.x + col;
            
            if (boardY >= 0 && boardY < this.BOARD_HEIGHT && 
                boardX >= 0 && boardX < this.BOARD_WIDTH) {
              display[boardY][boardX] = this.currentPiece.color;
            }
          }
        }
      }
    }
    
    return display;
  }
}

export function Tetris() {
  const [game] = useState(() => new TetrisGame());
  const [board, setBoard] = useState(game.getDisplayBoard());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);

  const updateGameState = useCallback(() => {
    setBoard(game.getDisplayBoard());
    setScore(game.score);
    setLines(game.lines);
    setLevel(game.level);
    setGameOver(game.gameOver);
    setIsPaused(game.isPaused);
    setNextPiece(game.nextPiece);
  }, [game]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const gameLoop = () => {
        game.update();
        updateGameState();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [game, gameStarted, gameOver, updateGameState]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          game.moveLeft();
          updateGameState();
          break;
        case 'ArrowRight':
          e.preventDefault();
          game.moveRight();
          updateGameState();
          break;
        case 'ArrowDown':
          e.preventDefault();
          game.moveDown();
          updateGameState();
          break;
        case 'ArrowUp':
          e.preventDefault();
          game.rotate();
          updateGameState();
          break;
        case ' ':
          e.preventDefault();
          game.hardDrop();
          updateGameState();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          game.togglePause();
          updateGameState();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [game, gameStarted, gameOver, updateGameState]);

  const handleStart = useCallback(() => {
    game.start();
    setGameStarted(true);
    setGameOver(false);
    updateGameState();
  }, [game, updateGameState]);

  const handlePause = useCallback(() => {
    game.togglePause();
    updateGameState();
  }, [game, updateGameState]);

  const handleReset = useCallback(() => {
    game.reset();
    setGameStarted(true);
    updateGameState();
  }, [game, updateGameState]);

  const getCellColor = (cell: string | null): string => {
    if (!cell) return 'bg-gray-900';
    const colors: Record<string, string> = {
      cyan: 'bg-cyan-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500'
    };
    return colors[cell] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Tetris</h1>
        <p className="text-muted-foreground">
          Classic block-stacking puzzle game!
        </p>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        <Card className="p-6 bg-black">
          <div className="grid grid-cols-10 gap-px bg-gray-800 p-2">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-6 h-6 ${getCellColor(cell)} border border-gray-700`}
                />
              ))
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Next Piece</h3>
            <div className="grid grid-cols-4 gap-px bg-gray-800 p-2">
              {nextPiece && (
                <>
                  {Array(4).fill(null).map((_, row) => (
                    Array(4).fill(null).map((_, col) => {
                      const pieceRow = row;
                      const pieceCol = col;
                      const hasBlock = nextPiece.shape[pieceRow]?.[pieceCol];
                      return (
                        <div
                          key={`next-${row}-${col}`}
                          className={`w-4 h-4 ${
                            hasBlock ? getCellColor(nextPiece.color) : 'bg-gray-900'
                          } border border-gray-700`}
                        />
                      );
                    })
                  )).flat()}
                </>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines:</span>
                <span className="font-bold">{lines}</span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-bold">{level}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Controls</h3>
            <div className="text-sm space-y-1">
              <div>← → Move</div>
              <div>↓ Soft Drop</div>
              <div>↑ Rotate</div>
              <div>Space Hard Drop</div>
              <div>P Pause</div>
            </div>
          </Card>

          {gameOver && (
            <Card className="p-4 bg-red-100">
              <div className="text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-red-800">Game Over!</p>
                <p className="text-sm text-red-600">Final Score: {score}</p>
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            {!gameStarted ? (
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                Start Game
              </Button>
            ) : (
              <>
                {!gameOver && (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="gap-2"
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Game
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}