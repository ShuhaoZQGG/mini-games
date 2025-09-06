export enum Color {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow'
}

export enum GameSpeed {
  Slow = 'slow',
  Normal = 'normal',
  Fast = 'fast',
  Expert = 'expert'
}

export enum GameState {
  Ready = 'ready',
  ShowingSequence = 'showing',
  PlayerInput = 'input',
  GameOver = 'gameover',
  LevelComplete = 'levelcomplete'
}

export interface GameStatistics {
  score: number
  level: number
  highScore: number
  currentStreak: number
  longestStreak: number
}

export interface VisualFeedback {
  color: Color
  duration: number
  intensity: number
}

export interface SwipeMap {
  up: Color
  down: Color
  left: Color
  right: Color
}

type SequenceCallback = (color: Color | null, isActive: boolean) => void
type GameOverCallback = (score: number, level: number) => void
type SoundCallback = (color: Color, isCorrect: boolean) => void

export class SimonSaysGame {
  private state: GameState = GameState.Ready
  private sequence: Color[] = []
  private playerSequence: Color[] = []
  private level: number = 1
  private score: number = 0
  private highScore: number = 0
  private speed: GameSpeed = GameSpeed.Normal
  private currentStreak: number = 0
  private longestStreak: number = 0
  private lastInputTime: number = 0
  private sequenceIndex: number = 0
  
  private sequenceCallback?: SequenceCallback
  private gameOverCallback?: GameOverCallback
  private soundCallback?: SoundCallback
  
  private showSequenceTimer?: NodeJS.Timeout
  private inputDebounceTime: number = 200

  constructor() {
    this.loadHighScore()
  }

  start(): void {
    this.reset()
    this.state = GameState.ShowingSequence
    this.level = 1
    this.generateSequence()
    this.showSequence()
  }

  reset(): void {
    this.state = GameState.Ready
    this.sequence = []
    this.playerSequence = []
    this.level = 1
    this.score = 0
    this.currentStreak = 0
    this.sequenceIndex = 0
    this.clearTimers()
  }

  private clearTimers(): void {
    if (this.showSequenceTimer) {
      clearTimeout(this.showSequenceTimer)
      this.showSequenceTimer = undefined
    }
  }

  private generateSequence(): void {
    const colors = this.getColors()
    const newColor = colors[Math.floor(Math.random() * colors.length)]
    this.sequence.push(newColor)
  }

  private showSequence(): void {
    this.sequenceIndex = 0
    this.playerSequence = []
    this.showNextInSequence()
  }

  private showNextInSequence(): void {
    if (this.sequenceIndex >= this.sequence.length) {
      // Finished showing sequence
      this.state = GameState.PlayerInput
      return
    }

    const color = this.sequence[this.sequenceIndex]
    
    // Show the color
    if (this.sequenceCallback) {
      this.sequenceCallback(color, true)
    }
    if (this.soundCallback) {
      this.soundCallback(color, true)
    }

    // Hide the color after display time
    this.showSequenceTimer = setTimeout(() => {
      if (this.sequenceCallback) {
        this.sequenceCallback(null, false)
      }
      
      // Show next color after pause
      this.showSequenceTimer = setTimeout(() => {
        this.sequenceIndex++
        this.showNextInSequence()
      }, this.getPauseTime())
    }, this.getDisplayTime())
  }

  handleInput(color: Color): boolean {
    if (this.state !== GameState.PlayerInput) {
      return false
    }

    // Debounce rapid inputs
    const now = Date.now()
    if (now - this.lastInputTime < this.inputDebounceTime) {
      return false
    }
    this.lastInputTime = now

    const expectedColor = this.sequence[this.playerSequence.length]
    
    if (color === expectedColor) {
      // Correct input
      this.playerSequence.push(color)
      this.score += this.calculateScore()
      this.currentStreak++
      
      if (this.soundCallback) {
        this.soundCallback(color, true)
      }

      if (this.playerSequence.length === this.sequence.length) {
        // Level complete
        this.levelComplete()
      }
      
      return true
    } else {
      // Wrong input
      if (this.soundCallback) {
        this.soundCallback(color, false)
      }
      
      this.gameOver()
      return false
    }
  }

  handleTouch(color: Color): boolean {
    return this.handleInput(color)
  }

  private levelComplete(): void {
    this.state = GameState.LevelComplete
    this.level++
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak
    }

    // Add next color to sequence and show it
    setTimeout(() => {
      this.state = GameState.ShowingSequence
      this.generateSequence()
      this.showSequence()
    }, 1000)
  }

  private gameOver(): void {
    this.state = GameState.GameOver
    
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.saveHighScore()
    }

    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak
    }

    if (this.gameOverCallback) {
      this.gameOverCallback(this.score, this.level)
    }
  }

  private calculateScore(): number {
    let baseScore = 10 * this.level
    
    // Speed bonus
    switch (this.speed) {
      case GameSpeed.Fast:
        baseScore *= 1.5
        break
      case GameSpeed.Expert:
        baseScore *= 2
        break
    }
    
    return Math.floor(baseScore)
  }

  setSpeed(speed: GameSpeed): void {
    this.speed = speed
  }

  getDisplayTime(): number {
    switch (this.speed) {
      case GameSpeed.Slow:
        return 1000
      case GameSpeed.Normal:
        return 800
      case GameSpeed.Fast:
        return 600
      case GameSpeed.Expert:
        return 400
    }
  }

  getPauseTime(): number {
    switch (this.speed) {
      case GameSpeed.Slow:
        return 400
      case GameSpeed.Normal:
        return 300
      case GameSpeed.Fast:
        return 200
      case GameSpeed.Expert:
        return 100
    }
  }

  getColors(): Color[] {
    return [Color.Red, Color.Blue, Color.Green, Color.Yellow]
  }

  getSwipeToColorMap(): SwipeMap {
    return {
      up: Color.Red,
      right: Color.Blue,
      down: Color.Green,
      left: Color.Yellow
    }
  }

  getVisualFeedback(color: Color): VisualFeedback {
    return {
      color,
      duration: this.getDisplayTime(),
      intensity: this.state === GameState.ShowingSequence ? 1.0 : 0.8
    }
  }

  setSequenceCallback(callback: SequenceCallback): void {
    this.sequenceCallback = callback
  }

  setGameOverCallback(callback: GameOverCallback): void {
    this.gameOverCallback = callback
  }

  setSoundCallback(callback: SoundCallback): void {
    this.soundCallback = callback
  }

  private loadHighScore(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('simon-says-highscore')
      if (saved) {
        this.highScore = parseInt(saved, 10)
      }
    }
  }

  private saveHighScore(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('simon-says-highscore', this.highScore.toString())
    }
  }

  getStatistics(): GameStatistics {
    return {
      score: this.score,
      level: this.level,
      highScore: this.highScore,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak
    }
  }

  // Protected methods for testing
  protected setState(state: GameState): void {
    this.state = state
  }

  // Getters
  getState(): GameState { return this.state }
  getScore(): number { return this.score }
  getLevel(): number { return this.level }
  getHighScore(): number { return this.highScore }
  getSpeed(): GameSpeed { return this.speed }
  getSequence(): Color[] { return [...this.sequence] }
  getPlayerSequence(): Color[] { return [...this.playerSequence] }
}