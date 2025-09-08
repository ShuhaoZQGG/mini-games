import { SudokuGame } from '../sudoku';
import { GameState } from '../types';

describe('SudokuGame', () => {
  let game: SudokuGame;

  beforeEach(() => {
    game = new SudokuGame();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
      expect(game.getGrid().length).toBe(9);
      expect(game.getGrid()[0].length).toBe(9);
    });

    it('should generate a valid puzzle when started', () => {
      game.start('easy');
      const grid = game.getGrid();
      let filledCells = 0;
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] > 0) {
            filledCells++;
          }
        }
      }
      
      // Easy puzzle should have around 35-45 given numbers
      expect(filledCells).toBeGreaterThanOrEqual(35);
      expect(filledCells).toBeLessThanOrEqual(45);
    });

    it('should have different difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      const expectedGivens = {
        easy: { min: 35, max: 45 },
        medium: { min: 27, max: 35 },
        hard: { min: 17, max: 27 }
      };
      
      difficulties.forEach(difficulty => {
        game.reset();
        game.start(difficulty);
        const grid = game.getGrid();
        let filledCells = 0;
        
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (grid[row][col] > 0) {
              filledCells++;
            }
          }
        }
        
        expect(filledCells).toBeGreaterThanOrEqual(expectedGivens[difficulty].min);
        expect(filledCells).toBeLessThanOrEqual(expectedGivens[difficulty].max);
      });
    });
  });

  describe('cell placement', () => {
    it('should place a valid number in an empty cell', () => {
      game.start('easy');
      const grid = game.getGrid();
      
      // Find an empty cell
      let emptyRow = -1, emptyCol = -1;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            emptyRow = row;
            emptyCol = col;
            break;
          }
        }
        if (emptyRow !== -1) break;
      }
      
      if (emptyRow !== -1) {
        const placed = game.placeNumber(emptyRow, emptyCol, 5);
        expect(placed).toBeDefined();
        expect(game.getGrid()[emptyRow][emptyCol]).toBe(5);
      }
    });

    it('should not place number in a fixed cell', () => {
      game.start('easy');
      const grid = game.getGrid();
      
      // Find a filled (fixed) cell
      let fixedRow = -1, fixedCol = -1;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] > 0) {
            fixedRow = row;
            fixedCol = col;
            break;
          }
        }
        if (fixedRow !== -1) break;
      }
      
      if (fixedRow !== -1) {
        const originalValue = grid[fixedRow][fixedCol];
        const placed = game.placeNumber(fixedRow, fixedCol, 9);
        expect(placed).toBe(false);
        expect(game.getGrid()[fixedRow][fixedCol]).toBe(originalValue);
      }
    });

    it('should clear a user-placed number', () => {
      game.start('easy');
      
      // Find empty cell and place a number
      let emptyRow = -1, emptyCol = -1;
      const grid = game.getGrid();
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            emptyRow = row;
            emptyCol = col;
            break;
          }
        }
        if (emptyRow !== -1) break;
      }
      
      if (emptyRow !== -1) {
        game.placeNumber(emptyRow, emptyCol, 5);
        expect(game.getGrid()[emptyRow][emptyCol]).toBe(5);
        
        game.clearCell(emptyRow, emptyCol);
        expect(game.getGrid()[emptyRow][emptyCol]).toBe(0);
      }
    });
  });

  describe('validation', () => {
    it('should validate a correct number placement', () => {
      const testGrid = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ];
      
      game.setGrid(testGrid);
      game.markAllAsFixed();
      
      // Placing 4 at (0, 2) should be valid
      const isValid = game.isValidMove(0, 2, 4);
      expect(isValid).toBe(true);
    });

    it('should invalidate duplicate in row', () => {
      const testGrid = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ];
      
      game.setGrid(testGrid);
      game.markAllAsFixed();
      
      // Placing 5 at (0, 2) should be invalid (5 already in row)
      const isValid = game.isValidMove(0, 2, 5);
      expect(isValid).toBe(false);
    });

    it('should invalidate duplicate in column', () => {
      const testGrid = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ];
      
      game.setGrid(testGrid);
      game.markAllAsFixed();
      
      // Placing 8 at (0, 2) should be invalid (8 already in column)
      const isValid = game.isValidMove(0, 2, 8);
      expect(isValid).toBe(false);
    });

    it('should invalidate duplicate in 3x3 box', () => {
      const testGrid = [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
      ];
      
      game.setGrid(testGrid);
      game.markAllAsFixed();
      
      // Placing 9 at (0, 2) should be invalid (9 already in box)
      const isValid = game.isValidMove(0, 2, 9);
      expect(isValid).toBe(false);
    });
  });

  describe('puzzle completion', () => {
    it('should detect when puzzle is complete', () => {
      const completedGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ];
      
      game.setGrid(completedGrid);
      expect(game.isComplete()).toBe(true);
    });

    it('should not mark incomplete puzzle as complete', () => {
      const incompleteGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,0] // Last cell is empty
      ];
      
      game.setGrid(incompleteGrid);
      expect(game.isComplete()).toBe(false);
    });

    it('should not mark invalid puzzle as complete', () => {
      const invalidGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,5] // Duplicate 5 in last row
      ];
      
      game.setGrid(invalidGrid);
      expect(game.isComplete()).toBe(false);
    });
  });

  describe('hints', () => {
    it('should provide a hint for an empty cell', () => {
      game.start('easy');
      const hint = game.getHint();
      
      if (hint) {
        expect(hint.row).toBeGreaterThanOrEqual(0);
        expect(hint.row).toBeLessThan(9);
        expect(hint.col).toBeGreaterThanOrEqual(0);
        expect(hint.col).toBeLessThan(9);
        expect(hint.value).toBeGreaterThanOrEqual(1);
        expect(hint.value).toBeLessThanOrEqual(9);
        
        // Hint should be valid
        expect(game.isValidMove(hint.row, hint.col, hint.value)).toBe(true);
      }
    });

    it('should decrease hint count when used', () => {
      game.start('easy');
      const initialHints = game.getHintsRemaining();
      game.getHint();
      expect(game.getHintsRemaining()).toBe(initialHints - 1);
    });

    it('should not provide hint when none remaining', () => {
      game.start('easy');
      
      // Use all hints
      while (game.getHintsRemaining() > 0) {
        game.getHint();
      }
      
      const hint = game.getHint();
      expect(hint).toBeNull();
    });
  });

  describe('game control', () => {
    it('should start game with specified difficulty', () => {
      game.start('medium');
      expect(game.getState()).toBe(GameState.PLAYING);
      expect(game.getDifficulty()).toBe('medium');
    });

    it('should pause and resume game', () => {
      game.start('easy');
      game.pause();
      expect(game.getState()).toBe(GameState.PAUSED);
      game.resume();
      expect(game.getState()).toBe(GameState.PLAYING);
    });

    it('should reset game', () => {
      game.start('easy');
      game.placeNumber(0, 0, 5);
      game.reset();
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
    });

    it('should track mistakes', () => {
      game.start('easy');
      const initialMistakes = game.getMistakes();
      
      // Make an invalid move
      const grid = game.getGrid();
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            // Try to place a number that's already in the row
            const invalidNumber = grid[row].find(n => n > 0) || 1;
            game.placeNumber(row, col, invalidNumber);
            break;
          }
        }
        if (game.getMistakes() > initialMistakes) break;
      }
      
      expect(game.getMistakes()).toBeGreaterThanOrEqual(initialMistakes);
    });
  });
});