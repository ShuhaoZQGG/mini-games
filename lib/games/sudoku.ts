import { BaseGame } from './base-game-v2';
import { GameState } from './types';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface Cell {
  value: number;
  isFixed: boolean;
  isError: boolean;
  notes: Set<number>;
}

interface SudokuGameData {
  grid: Cell[][];
  solution: number[][];
  difficulty: Difficulty;
  mistakes: number;
  hintsRemaining: number;
  selectedCell: { row: number; col: number } | null;
  timer: number;
  isPaused: boolean;
}

export class SudokuGame extends BaseGame<SudokuGameData> {
  private timerInterval: NodeJS.Timeout | null = null;

  constructor() {
    super('Sudoku', 'sudoku');
    this.initializeGame();
  }

  protected initializeGameData(): SudokuGameData {
    return {
      grid: this.createEmptyGrid(),
      solution: [],
      difficulty: 'easy',
      mistakes: 0,
      hintsRemaining: 3,
      selectedCell: null,
      timer: 0,
      isPaused: false
    };
  }

  private createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let i = 0; i < 9; i++) {
      grid[i] = [];
      for (let j = 0; j < 9; j++) {
        grid[i][j] = {
          value: 0,
          isFixed: false,
          isError: false,
          notes: new Set()
        };
      }
    }
    return grid;
  }

  public start(difficulty: Difficulty = 'easy'): void {
    if (this.state === GameState.PLAYING) return;

    this.state = GameState.PLAYING;
    this.gameData.difficulty = difficulty;
    this.gameData.mistakes = 0;
    this.gameData.hintsRemaining = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 2;
    this.gameData.timer = 0;
    
    const puzzle = this.generatePuzzle(difficulty);
    this.gameData.grid = puzzle.grid;
    this.gameData.solution = puzzle.solution;

    // Start timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (!this.gameData.isPaused) {
        this.gameData.timer++;
      }
    }, 1000);
  }

  private generatePuzzle(difficulty: Difficulty): { grid: Cell[][], solution: number[][] } {
    // Generate a complete valid Sudoku solution
    const solution = this.generateCompleteSudoku();
    
    // Create puzzle by removing numbers based on difficulty
    const grid = this.createEmptyGrid();
    const cellsToShow = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 32 : 23;
    
    // Copy solution to grid with some cells removed
    const positions: { row: number, col: number }[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({ row, col });
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Show only the required number of cells
    for (let i = 0; i < cellsToShow; i++) {
      const { row, col } = positions[i];
      grid[row][col].value = solution[row][col];
      grid[row][col].isFixed = true;
    }
    
    return { grid, solution };
  }

  private generateCompleteSudoku(): number[][] {
    const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // Fill the diagonal 3x3 boxes first (they don't affect each other)
    for (let box = 0; box < 9; box += 3) {
      this.fillBox(grid, box, box);
    }
    
    // Fill remaining cells using backtracking
    this.solveSudoku(grid);
    
    return grid;
  }

  private fillBox(grid: number[][], startRow: number, startCol: number): void {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Shuffle numbers
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    let idx = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        grid[startRow + row][startCol + col] = nums[idx++];
      }
    }
  }

  private solveSudoku(grid: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          // Shuffle for randomness
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          
          for (const num of nums) {
            if (this.isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;
              if (this.solveSudoku(grid)) {
                return true;
              }
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }
    
    return true;
  }

  public placeNumber(row: number, col: number, value: number): boolean {
    if (this.state !== GameState.PLAYING) return false;
    if (this.gameData.grid[row][col].isFixed) return false;
    
    this.gameData.grid[row][col].value = value;
    this.gameData.grid[row][col].notes.clear();
    
    // Check if placement is correct
    const isCorrect = value === this.gameData.solution[row][col];
    if (!isCorrect && value !== 0) {
      this.gameData.mistakes++;
      this.gameData.grid[row][col].isError = true;
      
      // Game over after 3 mistakes in hard mode
      if (this.gameData.difficulty === 'hard' && this.gameData.mistakes >= 3) {
        this.endGame();
      }
    } else {
      this.gameData.grid[row][col].isError = false;
    }
    
    // Check for completion
    if (this.isComplete()) {
      this.win();
    }
    
    return true;
  }

  public clearCell(row: number, col: number): void {
    if (this.state !== GameState.PLAYING) return;
    if (this.gameData.grid[row][col].isFixed) return;
    
    this.gameData.grid[row][col].value = 0;
    this.gameData.grid[row][col].isError = false;
  }

  public toggleNote(row: number, col: number, number: number): void {
    if (this.state !== GameState.PLAYING) return;
    if (this.gameData.grid[row][col].isFixed) return;
    if (this.gameData.grid[row][col].value !== 0) return;
    
    const notes = this.gameData.grid[row][col].notes;
    if (notes.has(number)) {
      notes.delete(number);
    } else {
      notes.add(number);
    }
  }

  public isValidMove(row: number, col: number, value: number): boolean {
    const grid = this.gameData.grid;
    
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x].value === value) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col].value === value) return false;
    }
    
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const checkRow = startRow + i;
        const checkCol = startCol + j;
        if ((checkRow !== row || checkCol !== col) && 
            grid[checkRow][checkCol].value === value) {
          return false;
        }
      }
    }
    
    return true;
  }

  public getHint(): { row: number, col: number, value: number } | null {
    if (this.gameData.hintsRemaining <= 0) return null;
    
    // Find an empty cell
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.gameData.grid[row][col].value === 0) {
          this.gameData.hintsRemaining--;
          return {
            row,
            col,
            value: this.gameData.solution[row][col]
          };
        }
      }
    }
    
    return null;
  }

  public isComplete(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.gameData.grid[row][col].value !== this.gameData.solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  private win(): void {
    this.state = GameState.GAME_OVER;
    this.score = Math.max(0, 1000 - this.gameData.timer - (this.gameData.mistakes * 100));
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.cleanup();
  }

  public endGame(): void {
    this.state = GameState.GAME_OVER;
    this.cleanup();
  }

  public pause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.gameData.isPaused = true;
    }
  }

  public resume(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.gameData.isPaused = false;
    }
  }

  public reset(): void {
    this.cleanup();
    this.state = GameState.READY;
    this.score = 0;
    this.gameData = this.initializeGameData();
  }

  private cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Getters for UI and testing
  public getGrid(): number[][] {
    return this.gameData.grid.map(row => row.map(cell => cell.value));
  }

  public getFullGrid(): Cell[][] {
    return this.gameData.grid;
  }

  public setGrid(grid: number[][]): void {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.gameData.grid[row][col].value = grid[row][col];
      }
    }
  }

  public markAllAsFixed(): void {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.gameData.grid[row][col].value > 0) {
          this.gameData.grid[row][col].isFixed = true;
        }
      }
    }
  }

  public getDifficulty(): Difficulty {
    return this.gameData.difficulty;
  }

  public getMistakes(): number {
    return this.gameData.mistakes;
  }

  public getHintsRemaining(): number {
    return this.gameData.hintsRemaining;
  }

  public getTimer(): number {
    return this.gameData.timer;
  }

  public selectCell(row: number, col: number): void {
    this.gameData.selectedCell = { row, col };
  }

  public getSelectedCell(): { row: number, col: number } | null {
    return this.gameData.selectedCell;
  }
}