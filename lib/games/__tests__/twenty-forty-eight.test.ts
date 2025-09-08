import { TwentyFortyEightGame } from '../twenty-forty-eight';
import { GameState } from '../types';

describe('TwentyFortyEightGame', () => {
  let game: TwentyFortyEightGame;

  beforeEach(() => {
    game = new TwentyFortyEightGame();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
      expect(game.getGrid().length).toBe(4);
      expect(game.getGrid()[0].length).toBe(4);
    });

    it('should start with 2 tiles on the board', () => {
      game.start();
      const grid = game.getGrid();
      let tileCount = 0;
      for (let row of grid) {
        for (let cell of row) {
          if (cell > 0) tileCount++;
        }
      }
      expect(tileCount).toBe(2);
    });

    it('should spawn tiles with value 2 or 4', () => {
      game.start();
      const grid = game.getGrid();
      for (let row of grid) {
        for (let cell of row) {
          if (cell > 0) {
            expect([2, 4]).toContain(cell);
          }
        }
      }
    });
  });

  describe('movement', () => {
    it('should move tiles left', () => {
      const testGrid = [
        [0, 2, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('LEFT');
      const grid = game.getGrid();
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBeGreaterThanOrEqual(0); // New tile or empty
      expect(grid[0][2]).toBe(0);
      expect(grid[0][3]).toBe(0);
    });

    it('should move tiles right', () => {
      const testGrid = [
        [2, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('RIGHT');
      const grid = game.getGrid();
      expect(grid[0][3]).toBe(4);
    });

    it('should move tiles up', () => {
      const testGrid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('UP');
      const grid = game.getGrid();
      expect(grid[0][0]).toBe(4);
    });

    it('should move tiles down', () => {
      const testGrid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('DOWN');
      const grid = game.getGrid();
      expect(grid[3][0]).toBe(4);
    });

    it('should not move if no valid moves in direction', () => {
      const testGrid = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      const gridBefore = JSON.stringify(game.getGrid());
      game.move('UP');
      const gridAfter = JSON.stringify(game.getGrid());
      expect(gridAfter).toBe(gridBefore);
    });
  });

  describe('merging', () => {
    it('should merge equal tiles', () => {
      const testGrid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('LEFT');
      const grid = game.getGrid();
      expect(grid[0][0]).toBe(4);
    });

    it('should only merge once per move', () => {
      const testGrid = [
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('LEFT');
      const grid = game.getGrid();
      expect(grid[0][0]).toBe(4);
      expect(grid[0][1]).toBe(4);
    });

    it('should update score when merging', () => {
      const testGrid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      const initialScore = game.getScore();
      game.move('LEFT');
      expect(game.getScore()).toBe(initialScore + 4);
    });
  });

  describe('win condition', () => {
    it('should detect win when 2048 tile is created', () => {
      const testGrid = [
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('LEFT');
      expect(game.hasWon()).toBe(true);
    });

    it('should allow continuing after win', () => {
      const testGrid = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      expect(game.hasWon()).toBe(true);
      expect(game.getState()).toBe(GameState.PLAYING);
    });
  });

  describe('game over', () => {
    it('should detect game over when board is full and no moves', () => {
      const testGrid = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2]
      ];
      game.setGrid(testGrid);
      game.start();
      expect(game.isGameOver()).toBe(true);
    });

    it('should not be game over if merges are possible', () => {
      const testGrid = [
        [2, 2, 4, 8],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128]
      ];
      game.setGrid(testGrid);
      game.start();
      expect(game.isGameOver()).toBe(false);
    });

    it('should not be game over if empty cells exist', () => {
      const testGrid = [
        [2, 4, 8, 16],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      expect(game.isGameOver()).toBe(false);
    });
  });

  describe('game control', () => {
    it('should start game', () => {
      game.start();
      expect(game.getState()).toBe(GameState.PLAYING);
    });

    it('should reset game', () => {
      game.start();
      game.move('LEFT');
      game.reset();
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
    });

    it('should track high score', () => {
      const testGrid = [
        [1024, 1024, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      game.move('LEFT'); // Creates 2048, score +2048
      const score = game.getScore();
      expect(game.getHighScore()).toBe(score);
      
      game.reset();
      expect(game.getHighScore()).toBe(score);
    });
  });

  describe('undo functionality', () => {
    it('should undo last move', () => {
      const testGrid = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ];
      game.setGrid(testGrid);
      game.start();
      const gridBefore = JSON.stringify(game.getGrid());
      const scoreBefore = game.getScore();
      
      game.move('RIGHT');
      game.undo();
      
      const gridAfter = JSON.stringify(game.getGrid());
      expect(gridAfter).toBe(gridBefore);
      expect(game.getScore()).toBe(scoreBefore);
    });

    it('should not undo if no moves made', () => {
      game.start();
      const gridBefore = JSON.stringify(game.getGrid());
      game.undo();
      const gridAfter = JSON.stringify(game.getGrid());
      expect(gridAfter).toBe(gridBefore);
    });
  });
});