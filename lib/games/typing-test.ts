import { BaseGame } from './base-game'

export interface TypingStats {
  wpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  totalChars: number
}

export class TypingTestGame extends BaseGame {
  private text: string = ''
  private typedText: string = ''
  private correctChars: number = 0
  private incorrectChars: number = 0
  private duration: number = 60000 // 60 seconds default
  private timer: NodeJS.Timeout | null = null
  private onUpdate?: (stats: TypingStats, timeLeft: number) => void
  private onComplete?: (stats: TypingStats) => void

  private sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This pangram contains all letters of the alphabet.",
    "Technology has transformed the way we live, work, and communicate with each other in the modern world.",
    "Practice makes perfect. The more you type, the faster and more accurate you will become over time.",
    "Learning to type efficiently is an essential skill in today's digital age where keyboards are everywhere.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts in the end.",
  ]

  constructor(duration: number = 60000) {
    super()
    this.duration = duration
  }

  initialize(): void {
    this.text = this.sampleTexts[Math.floor(Math.random() * this.sampleTexts.length)]
    this.typedText = ''
    this.correctChars = 0
    this.incorrectChars = 0
    
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
      
      const stats = this.calculateStats()
      if (this.onUpdate) {
        this.onUpdate(stats, timeLeft)
      }
      
      if (timeLeft === 0 || this.typedText.length >= this.text.length) {
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

  handleInput(char: string): void {
    if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) {
      return
    }

    const expectedChar = this.text[this.typedText.length]
    
    if (char === expectedChar) {
      this.correctChars++
      this.typedText += char
    } else if (char === 'Backspace' && this.typedText.length > 0) {
      const lastChar = this.typedText[this.typedText.length - 1]
      const expectedLastChar = this.text[this.typedText.length - 1]
      
      if (lastChar !== expectedLastChar) {
        this.incorrectChars--
      } else {
        this.correctChars--
      }
      
      this.typedText = this.typedText.slice(0, -1)
    } else if (char !== 'Backspace') {
      this.incorrectChars++
      this.typedText += char
    }

    if (this.typedText.length >= this.text.length) {
      this.endGame()
    }
  }

  private calculateStats(): TypingStats {
    const totalChars = this.correctChars + this.incorrectChars
    const accuracy = totalChars > 0 ? (this.correctChars / totalChars) * 100 : 100
    
    let wpm = 0
    if (this.state.startTime) {
      const elapsed = Date.now() - this.state.startTime.getTime()
      const minutes = elapsed / 60000
      const words = this.correctChars / 5 // Average word length
      wpm = minutes > 0 ? Math.round(words / minutes) : 0
    }
    
    return {
      wpm,
      accuracy: Math.round(accuracy),
      correctChars: this.correctChars,
      incorrectChars: this.incorrectChars,
      totalChars,
    }
  }

  endGame(): void {
    super.endGame()
    
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    const stats = this.calculateStats()
    this.state.score = stats.wpm
    this.setHighScore(stats.wpm)
    
    if (this.onComplete) {
      this.onComplete(stats)
    }
  }

  getText(): string {
    return this.text
  }

  getTypedText(): string {
    return this.typedText
  }

  setUpdateCallback(callback: (stats: TypingStats, timeLeft: number) => void): void {
    this.onUpdate = callback
  }

  setCompleteCallback(callback: (stats: TypingStats) => void): void {
    this.onComplete = callback
  }
}