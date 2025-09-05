import { BaseGame } from './base-game-v2';
import { GameState } from './types';

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SnakeGameData {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  gridSize: { width: number; height: number };
  speed: number;
  lastMoveTime: number;
}

export class SnakeGame extends BaseGame<SnakeGameData> {
  private moveInterval: NodeJS.Timeout | null = null;

  constructor() {
    super('Snake', 'snake');
    this.initializeGame();
  }

  protected initializeGameData(): SnakeGameData {
    const gridSize = { width: 20, height: 20 };
    const snake = this.createInitialSnake();
    const food = this.generateFood(snake, gridSize);
    
    return {
      snake,
      food,
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      gridSize,
      speed: 150, // milliseconds between moves
      lastMoveTime: 0
    };
  }

  private createInitialSnake(): Position[] {
    return [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
  }

  private generateFood(snake: Position[], gridSize: { width: number; height: number }): Position {
    let food: Position;
    do {
      food = {
        x: Math.floor(Math.random() * gridSize.width),
        y: Math.floor(Math.random() * gridSize.height)
      };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
  }

  public start(): void {
    if (this.state === GameState.PLAYING) return;
    
    this.state = GameState.PLAYING;
    this.gameData.lastMoveTime = Date.now();
    
    // Start the game loop
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
    
    this.moveInterval = setInterval(() => {
      if (this.state === GameState.PLAYING) {
        this.move();
      }
    }, this.gameData.speed);
  }

  public pause(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      if (this.moveInterval) {
        clearInterval(this.moveInterval);
        this.moveInterval = null;
      }
    }
  }

  public resume(): void {
    if (this.state === GameState.PAUSED) {
      this.start();
    }
  }

  public reset(): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
    
    this.state = GameState.READY;
    this.score = 0;
    this.gameData = this.initializeGameData();
  }

  public move(): void {
    if (this.state !== GameState.PLAYING) return;

    const { snake, direction, food, gridSize } = this.gameData;
    const head = { ...snake[0] };

    // Update direction if a new direction was set
    this.gameData.direction = this.gameData.nextDirection;

    // Move head based on direction
    switch (this.gameData.direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= gridSize.width || 
        head.y < 0 || head.y >= gridSize.height) {
      this.endGame();
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
      this.score += 10;
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
      // Generate new food
      this.gameData.food = this.generateFood(snake, gridSize);
    } else {
      // Remove tail if no food eaten
      snake.pop();
    }

    this.gameData.lastMoveTime = Date.now();
  }

  public changeDirection(newDirection: Direction): void {
    if (this.state !== GameState.PLAYING) return;

    const opposites: Record<Direction, Direction> = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    // Prevent moving in opposite direction
    if (opposites[this.gameData.direction] === newDirection) {
      return;
    }

    this.gameData.nextDirection = newDirection;
  }

  public checkCollision(): boolean {
    const { snake } = this.gameData;
    const head = snake[0];
    
    // Check self collision
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return true;
      }
    }
    
    return false;
  }

  public endGame(): void {
    this.state = GameState.GAME_OVER;
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }

  // Getters for testing and UI
  public getSnake(): Position[] {
    return this.gameData.snake;
  }

  public getFood(): Position {
    return this.gameData.food;
  }

  public getDirection(): Direction {
    return this.gameData.direction;
  }

  public getGridSize(): { width: number; height: number } {
    return this.gameData.gridSize;
  }

  public getSpeed(): number {
    return this.gameData.speed;
  }

  public setSpeed(speed: number): void {
    this.gameData.speed = speed;
    
    // Restart interval with new speed if playing
    if (this.state === GameState.PLAYING && this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = setInterval(() => {
        if (this.state === GameState.PLAYING) {
          this.move();
        }
      }, speed);
    }
  }

  // For testing purposes
  public setSnake(snake: Position[]): void {
    this.gameData.snake = snake;
  }

  public cleanup(): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }
}