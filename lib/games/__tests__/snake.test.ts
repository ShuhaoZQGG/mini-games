import { SnakeGame } from '../snake';
import { GameState } from '../types';

describe('SnakeGame', () => {
  let game: SnakeGame;

  beforeEach(() => {
    game = new SnakeGame();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
      expect(game.getGridSize()).toEqual({ width: 20, height: 20 });
    });

    it('should have snake at starting position', () => {
      const snake = game.getSnake();
      expect(snake.length).toBe(3);
      expect(snake[0]).toEqual({ x: 10, y: 10 });
    });

    it('should have initial direction set to right', () => {
      expect(game.getDirection()).toBe('RIGHT');
    });

    it('should place food on the grid', () => {
      const food = game.getFood();
      expect(food).toBeDefined();
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(20);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(20);
    });
  });

  describe('movement', () => {
    it('should move snake in current direction', () => {
      game.start();
      const initialHead = game.getSnake()[0];
      game.move();
      const newHead = game.getSnake()[0];
      expect(newHead.x).toBe(initialHead.x + 1);
      expect(newHead.y).toBe(initialHead.y);
    });

    it('should change direction when valid', () => {
      game.start();
      game.changeDirection('UP');
      expect(game.getDirection()).toBe('UP');
    });

    it('should not allow opposite direction change', () => {
      game.start();
      game.changeDirection('LEFT'); // Opposite of RIGHT
      expect(game.getDirection()).toBe('RIGHT'); // Should remain RIGHT
    });

    it('should allow perpendicular direction change', () => {
      game.start();
      game.changeDirection('UP');
      expect(game.getDirection()).toBe('UP');
      game.changeDirection('LEFT');
      expect(game.getDirection()).toBe('LEFT');
    });
  });

  describe('collision detection', () => {
    it('should detect wall collision', () => {
      game.start();
      // Move snake to edge
      const snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
      game.setSnake(snake);
      game.move(); // Move right into wall
      expect(game.getState()).toBe(GameState.GAME_OVER);
    });

    it('should detect self collision', () => {
      game.start();
      // Create a snake that will collide with itself
      const snake = [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 11, y: 11 },
        { x: 10, y: 11 },
        { x: 10, y: 10 } // This creates a loop
      ];
      game.setSnake(snake);
      expect(game.checkCollision()).toBe(true);
    });
  });

  describe('food consumption', () => {
    it('should grow snake when eating food', () => {
      game.start();
      const initialLength = game.getSnake().length;
      const food = game.getFood();
      
      // Position snake head next to food
      const snake = [
        { x: food.x - 1, y: food.y },
        { x: food.x - 2, y: food.y },
        { x: food.x - 3, y: food.y }
      ];
      game.setSnake(snake);
      game.move(); // Move right to eat food
      
      expect(game.getSnake().length).toBe(initialLength + 1);
      expect(game.getScore()).toBeGreaterThan(0);
    });

    it('should place new food after eating', () => {
      game.start();
      const initialFood = game.getFood();
      
      // Position snake to eat food
      const snake = [
        { x: initialFood.x - 1, y: initialFood.y },
        { x: initialFood.x - 2, y: initialFood.y },
        { x: initialFood.x - 3, y: initialFood.y }
      ];
      game.setSnake(snake);
      game.move();
      
      const newFood = game.getFood();
      expect(newFood).not.toEqual(initialFood);
    });
  });

  describe('scoring', () => {
    it('should increase score when eating food', () => {
      game.start();
      const initialScore = game.getScore();
      const food = game.getFood();
      
      // Position snake to eat food
      const snake = [
        { x: food.x - 1, y: food.y },
        { x: food.x - 2, y: food.y },
        { x: food.x - 3, y: food.y }
      ];
      game.setSnake(snake);
      game.move();
      
      expect(game.getScore()).toBe(initialScore + 10);
    });

    it('should track high score', () => {
      game.start();
      const food = game.getFood();
      
      // Eat food to increase score
      const snake = [
        { x: food.x - 1, y: food.y },
        { x: food.x - 2, y: food.y },
        { x: food.x - 3, y: food.y }
      ];
      game.setSnake(snake);
      game.move();
      
      const score = game.getScore();
      expect(game.getHighScore()).toBe(score);
      
      // Reset and check high score persists
      game.reset();
      expect(game.getHighScore()).toBe(score);
    });
  });

  describe('game control', () => {
    it('should start game', () => {
      game.start();
      expect(game.getState()).toBe(GameState.PLAYING);
    });

    it('should pause and resume game', () => {
      game.start();
      game.pause();
      expect(game.getState()).toBe(GameState.PAUSED);
      game.resume();
      expect(game.getState()).toBe(GameState.PLAYING);
    });

    it('should reset game', () => {
      game.start();
      game.move();
      game.reset();
      expect(game.getState()).toBe(GameState.READY);
      expect(game.getScore()).toBe(0);
      expect(game.getSnake().length).toBe(3);
    });

    it('should handle game over', () => {
      game.start();
      game.endGame();
      expect(game.getState()).toBe(GameState.GAME_OVER);
    });
  });
});