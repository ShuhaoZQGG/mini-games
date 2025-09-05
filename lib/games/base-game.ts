import { GameStatus } from './types'

export abstract class BaseGame {
  protected state: GameStatus = {
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
  }

  abstract initialize(): void
  abstract start(): void
  abstract pause(): void
  abstract resume(): void
  abstract reset(): void
  abstract handleInput(input: any): void

  getState(): GameStatus {
    return { ...this.state }
  }

  updateScore(points: number): void {
    this.state.score += points
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score
    }
  }

  endGame(): void {
    this.state.isPlaying = false
    this.state.isGameOver = true
    this.state.endTime = new Date()
  }

  protected setHighScore(score: number): void {
    if (score > this.state.highScore) {
      this.state.highScore = score
    }
  }
}