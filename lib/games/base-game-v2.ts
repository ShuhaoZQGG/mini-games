import { GameState } from './types';

export abstract class BaseGame<T = any> {
  protected state: GameState = GameState.READY;
  protected score: number = 0;
  protected highScore: number = 0;
  protected gameData: T;
  
  constructor(
    protected gameName: string,
    protected gameSlug: string
  ) {
    this.gameData = this.initializeGameData();
    const savedHighScore = this.loadHighScore();
    if (savedHighScore) {
      this.highScore = savedHighScore;
    }
  }

  protected abstract initializeGameData(): T;
  
  public abstract start(): void;
  public abstract pause(): void;
  public abstract resume(): void;
  public abstract reset(): void;

  public getState(): GameState {
    return this.state;
  }

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  protected saveHighScore(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${this.gameSlug}-highscore`, this.highScore.toString());
    }
  }

  protected loadHighScore(): number {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${this.gameSlug}-highscore`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  }

  protected initializeGame(): void {
    this.gameData = this.initializeGameData();
  }
}