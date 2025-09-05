import { BaseGame } from './base-game'

export class CPSTestGame extends BaseGame {
  private clicks: number = 0
  private duration: number = 10000 // 10 seconds default
  private timer: NodeJS.Timeout | null = null
  private onUpdate?: (clicks: number, timeLeft: number) => void
  private onComplete?: (cps: number) => void

  constructor(duration: number = 10000) {
    super()
    this.duration = duration
  }

  initialize(): void {
    this.clicks = 0
    this.state = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      highScore: this.state.highScore || 0,
    }
  }

  start(): void {
    this.initialize()
    this.state.isPlaying = true
    this.state.startTime = new Date()
    
    let timeElapsed = 0
    this.timer = setInterval(() => {
      timeElapsed += 100
      const timeLeft = Math.max(0, this.duration - timeElapsed)
      
      if (this.onUpdate) {
        this.onUpdate(this.clicks, timeLeft)
      }
      
      if (timeLeft === 0) {
        this.endGame()
      }
    }, 100)
  }

  pause(): void {
    if (this.state.isPlaying && !this.state.isPaused) {
      this.state.isPaused = true
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  }

  resume(): void {
    if (this.state.isPlaying && this.state.isPaused) {
      this.state.isPaused = false
      // Restart timer from where it left off
      this.start()
    }
  }

  reset(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.initialize()
  }

  handleInput(input: 'click'): void {
    if (this.state.isPlaying && !this.state.isPaused && !this.state.isGameOver) {
      this.clicks++
    }
  }

  endGame(): void {
    super.endGame()
    
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    const cps = this.calculateCPS()
    this.state.score = cps
    this.setHighScore(cps)
    
    if (this.onComplete) {
      this.onComplete(cps)
    }
  }

  private calculateCPS(): number {
    const seconds = this.duration / 1000
    return Number((this.clicks / seconds).toFixed(2))
  }

  getClicks(): number {
    return this.clicks
  }

  getCPS(): number {
    if (this.state.startTime) {
      const elapsed = Math.min(
        Date.now() - this.state.startTime.getTime(),
        this.duration
      )
      const seconds = elapsed / 1000
      return seconds > 0 ? Number((this.clicks / seconds).toFixed(2)) : 0
    }
    return 0
  }

  setUpdateCallback(callback: (clicks: number, timeLeft: number) => void): void {
    this.onUpdate = callback
  }

  setCompleteCallback(callback: (cps: number) => void): void {
    this.onComplete = callback
  }
}