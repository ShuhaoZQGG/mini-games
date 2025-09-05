import { BaseGame } from './base-game-v2';
import { GameState } from './types';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TwentyFortyEightGameData {
  grid: number[][];
  previousGrid: number[][];
  previousScore: number;
  hasWon: boolean;
  hasContinuedAfterWin: boolean;
}

export class TwentyFortyEightGame extends BaseGame<TwentyFortyEightGameData> {
  constructor() {
    super('2048', 'twenty-forty-eight');
    this.initializeGame();
  }

  protected initializeGameData(): TwentyFortyEightGameData {
    return {
      grid: this.createEmptyGrid(),
      previousGrid: this.createEmptyGrid(),
      previousScore: 0,
      hasWon: false,
      hasContinuedAfterWin: false
    };
  }

  private createEmptyGrid(): number[][] {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }

  public start(): void {
    if (this.state === GameState.PLAYING) return;
    
    this.state = GameState.PLAYING;
    this.score = 0;
    this.gameData = this.initializeGameData();
    
    // Add two initial tiles
    this.addRandomTile();
    this.addRandomTile();
  }

  public reset(): void {
    this.state = GameState.READY;
    this.score = 0;
    this.gameData = this.initializeGameData();
  }

  public pause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    }
  }

  public resume(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
    }
  }

  private addRandomTile(): boolean {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.gameData.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    if (emptyCells.length === 0) return false;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    // 90% chance of 2, 10% chance of 4
    const value = Math.random() < 0.9 ? 2 : 4;
    this.gameData.grid[randomCell.row][randomCell.col] = value;
    
    return true;
  }

  public move(direction: Direction): boolean {
    if (this.state !== GameState.PLAYING) return false;
    
    // Save state for undo
    this.gameData.previousGrid = this.gameData.grid.map(row => [...row]);
    this.gameData.previousScore = this.score;
    
    let moved = false;
    const grid = this.gameData.grid;
    
    switch (direction) {
      case 'LEFT':
        moved = this.moveLeft();
        break;
      case 'RIGHT':
        moved = this.moveRight();
        break;
      case 'UP':
        moved = this.moveUp();
        break;
      case 'DOWN':
        moved = this.moveDown();
        break;
    }
    
    if (moved) {
      this.addRandomTile();
      
      // Check for 2048 tile
      if (!this.gameData.hasWon && this.has2048()) {
        this.gameData.hasWon = true;
      }
      
      // Check for game over
      if (this.isGameOver()) {
        this.state = GameState.GAME_OVER;
      }
      
      // Update high score
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    }
    
    return moved;
  }

  private moveLeft(): boolean {
    let moved = false;
    const grid = this.gameData.grid;
    
    for (let row = 0; row < 4; row++) {
      const oldRow = [...grid[row]];
      const newRow = this.slideAndMerge(grid[row]);
      grid[row] = newRow;
      
      if (JSON.stringify(oldRow) !== JSON.stringify(newRow)) {
        moved = true;
      }
    }
    
    return moved;
  }

  private moveRight(): boolean {
    let moved = false;
    const grid = this.gameData.grid;
    
    for (let row = 0; row < 4; row++) {
      const oldRow = [...grid[row]];
      const reversed = [...grid[row]].reverse();
      const newRow = this.slideAndMerge(reversed).reverse();
      grid[row] = newRow;
      
      if (JSON.stringify(oldRow) !== JSON.stringify(newRow)) {
        moved = true;
      }
    }
    
    return moved;
  }

  private moveUp(): boolean {
    let moved = false;
    const grid = this.gameData.grid;
    
    for (let col = 0; col < 4; col++) {
      const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
      const oldColumn = [...column];
      const newColumn = this.slideAndMerge(column);
      
      for (let row = 0; row < 4; row++) {
        grid[row][col] = newColumn[row];
      }
      
      if (JSON.stringify(oldColumn) !== JSON.stringify(newColumn)) {
        moved = true;
      }
    }
    
    return moved;
  }

  private moveDown(): boolean {
    let moved = false;
    const grid = this.gameData.grid;
    
    for (let col = 0; col < 4; col++) {
      const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
      const oldColumn = [...column];
      const reversed = [...column].reverse();
      const newColumn = this.slideAndMerge(reversed).reverse();
      
      for (let row = 0; row < 4; row++) {
        grid[row][col] = newColumn[row];
      }
      
      if (JSON.stringify(oldColumn) !== JSON.stringify(newColumn)) {
        moved = true;
      }
    }
    
    return moved;
  }

  private slideAndMerge(line: number[]): number[] {
    // Remove zeros and slide
    let newLine = line.filter(cell => cell !== 0);
    
    // Merge adjacent equal tiles
    for (let i = 0; i < newLine.length - 1; i++) {
      if (newLine[i] === newLine[i + 1]) {
        newLine[i] *= 2;
        this.score += newLine[i];
        newLine[i + 1] = 0;
      }
    }
    
    // Remove zeros again after merging
    newLine = newLine.filter(cell => cell !== 0);
    
    // Pad with zeros
    while (newLine.length < 4) {
      newLine.push(0);
    }
    
    return newLine;
  }

  public undo(): void {
    if (this.state !== GameState.PLAYING) return;
    
    if (this.gameData.previousGrid.some(row => row.some(cell => cell !== 0))) {
      this.gameData.grid = this.gameData.previousGrid.map(row => [...row]);
      this.score = this.gameData.previousScore;
      this.gameData.previousGrid = this.createEmptyGrid();
      this.gameData.previousScore = 0;
    }
  }

  public isGameOver(): boolean {
    const grid = this.gameData.grid;
    
    // Check for empty cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] === 0) return false;
      }
    }
    
    // Check for possible merges horizontally
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row][col] === grid[row][col + 1]) return false;
      }
    }
    
    // Check for possible merges vertically
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] === grid[row + 1][col]) return false;
      }
    }
    
    return true;
  }

  private has2048(): boolean {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.gameData.grid[row][col] >= 2048) return true;
      }
    }
    return false;
  }

  public hasWon(): boolean {
    return this.gameData.hasWon;
  }

  public continueAfterWin(): void {
    this.gameData.hasContinuedAfterWin = true;
  }

  // Getters for UI and testing
  public getGrid(): number[][] {
    return this.gameData.grid;
  }

  public setGrid(grid: number[][]): void {
    this.gameData.grid = grid.map(row => [...row]);
  }

  public canUndo(): boolean {
    return this.gameData.previousGrid.some(row => row.some(cell => cell !== 0));
  }

  public getLargestTile(): number {
    let largest = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.gameData.grid[row][col] > largest) {
          largest = this.gameData.grid[row][col];
        }
      }
    }
    return largest;
  }
}