export enum HoleContent {
  Empty = 'empty',
  Mole = 'mole',
  Bomb = 'bomb',
  PowerUp = 'powerup'
}

export enum PowerUp {
  DoubleScore = 'double',
  FreezeTime = 'freeze',
  MultiHit = 'multi'
}

export enum GameState {
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameover'
}

export enum Difficulty {
  Easy = 'easy',
  Normal = 'normal',
  Hard = 'hard',
  Expert = 'expert'
}

export interface Hole {
  content: HoleContent
  isActive: boolean
  spawnTime: number
  powerUp?: PowerUp
}

export interface WhackResult {
  hit: boolean
  points: number
  content: HoleContent
  combo?: number
}

export interface GameStatistics {
  score: number
  hits: number
  misses: number
  accuracy: number
  highestCombo: number
  molesWhacked: number
  bombsHit: number
  powerUpsCollected: number
}

export interface HapticFeedback {
  intensity: number
  duration: number
}

export class WhackAMoleGame {
  private state: GameState = GameState.Ready
  private holes: Hole[] = []
  private score: number = 0
  private level: number = 1
  private lives: number = 3
  private combo: number = 0
  private highestCombo: number = 0
  private difficulty: Difficulty = Difficulty.Normal
  private highScore: number = 0
  
  private startTime: number = 0
  private gameDuration: number = 60000 // 60 seconds
  private timeRemaining: number = 60000
  private timeFrozen: boolean = false
  private freezeEndTime: number = 0
  
  private activePowerUp: PowerUp | null = null
  private powerUpEndTime: number = 0
  
  private hits: number = 0
  private misses: number = 0
  private molesWhacked: number = 0
  private bombsHit: number = 0
  private powerUpsCollected: number = 0
  
  private spawnTimer?: NodeJS.Timeout
  private gameTimer?: NodeJS.Timeout
  private moleTimers: Map<number, NodeJS.Timeout> = new Map()

  constructor() {
    this.initializeHoles()
    this.loadHighScore()
  }

  private initializeHoles(): void {
    this.holes = Array(9).fill(null).map(() => ({
      content: HoleContent.Empty,
      isActive: false,
      spawnTime: 0
    }))
  }

  start(): void {
    this.reset()
    this.state = GameState.Playing
    this.startTime = Date.now()
    this.timeRemaining = this.gameDuration
    
    this.startSpawning()
    this.startGameTimer()
  }

  reset(): void {
    this.state = GameState.Ready
    this.score = 0
    this.level = 1
    this.lives = 3
    this.combo = 0
    this.highestCombo = 0
    this.hits = 0
    this.misses = 0
    this.molesWhacked = 0
    this.bombsHit = 0
    this.powerUpsCollected = 0
    this.activePowerUp = null
    this.powerUpEndTime = 0
    this.timeFrozen = false
    this.freezeEndTime = 0
    
    this.clearTimers()
    this.initializeHoles()
  }

  private clearTimers(): void {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer)
      this.spawnTimer = undefined
    }
    
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
      this.gameTimer = undefined
    }
    
    this.moleTimers.forEach(timer => clearTimeout(timer))
    this.moleTimers.clear()
  }

  private startSpawning(): void {
    const spawn = () => {
      if (this.state !== GameState.Playing) return
      
      const random = Math.random()
      if (random < 0.7) {
        this.spawnMole()
      } else if (random < 0.85) {
        this.spawnBomb()
      } else if (random < 0.95) {
        this.spawnPowerUp()
      } else {
        // Spawn multiple moles at higher levels
        if (this.level > 3) {
          this.spawnMole()
          this.spawnMole()
        }
      }
    }
    
    spawn() // Initial spawn
    this.spawnTimer = setInterval(spawn, this.getSpawnRate())
  }

  private startGameTimer(): void {
    this.gameTimer = setInterval(() => {
      if (this.state !== GameState.Playing) return
      
      if (!this.timeFrozen) {
        this.timeRemaining -= 100
        
        // Check for freeze time expiry
        if (this.freezeEndTime > 0 && Date.now() >= this.freezeEndTime) {
          this.timeFrozen = false
          this.freezeEndTime = 0
        }
      }
      
      // Check for power-up expiry
      if (this.activePowerUp && Date.now() >= this.powerUpEndTime) {
        this.activePowerUp = null
        this.powerUpEndTime = 0
      }
      
      // Update level based on time
      const elapsed = this.gameDuration - this.timeRemaining
      this.level = Math.floor(elapsed / 10000) + 1 // Level up every 10 seconds
      
      if (this.timeRemaining <= 0) {
        this.endGame()
      }
    }, 100)
  }

  private spawnMole(): void {
    const emptyHoles = this.holes
      .map((hole, index) => ({ hole, index }))
      .filter(({ hole }) => !hole.isActive)
    
    if (emptyHoles.length === 0) return
    
    const { hole, index } = emptyHoles[Math.floor(Math.random() * emptyHoles.length)]
    
    hole.content = HoleContent.Mole
    hole.isActive = true
    hole.spawnTime = Date.now()
    
    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      if (hole.isActive && hole.content === HoleContent.Mole) {
        hole.isActive = false
        hole.content = HoleContent.Empty
      }
      this.moleTimers.delete(index)
    }, this.getMoleDisplayTime())
    
    this.moleTimers.set(index, hideTimer)
  }

  private spawnBomb(): void {
    if (this.difficulty === Difficulty.Easy) return // No bombs in easy mode
    
    const emptyHoles = this.holes
      .map((hole, index) => ({ hole, index }))
      .filter(({ hole }) => !hole.isActive)
    
    if (emptyHoles.length === 0) return
    
    const { hole, index } = emptyHoles[Math.floor(Math.random() * emptyHoles.length)]
    
    hole.content = HoleContent.Bomb
    hole.isActive = true
    hole.spawnTime = Date.now()
    
    // Bombs stay slightly longer than moles
    const hideTimer = setTimeout(() => {
      if (hole.isActive && hole.content === HoleContent.Bomb) {
        hole.isActive = false
        hole.content = HoleContent.Empty
      }
      this.moleTimers.delete(index)
    }, this.getMoleDisplayTime() * 1.2)
    
    this.moleTimers.set(index, hideTimer)
  }

  private spawnPowerUp(): void {
    const emptyHoles = this.holes
      .map((hole, index) => ({ hole, index }))
      .filter(({ hole }) => !hole.isActive)
    
    if (emptyHoles.length === 0) return
    
    const { hole, index } = emptyHoles[Math.floor(Math.random() * emptyHoles.length)]
    
    const powerUps = [PowerUp.DoubleScore, PowerUp.FreezeTime, PowerUp.MultiHit]
    hole.powerUp = powerUps[Math.floor(Math.random() * powerUps.length)]
    hole.content = HoleContent.PowerUp
    hole.isActive = true
    hole.spawnTime = Date.now()
    
    // Power-ups disappear quickly
    const hideTimer = setTimeout(() => {
      if (hole.isActive && hole.content === HoleContent.PowerUp) {
        hole.isActive = false
        hole.content = HoleContent.Empty
        hole.powerUp = undefined
      }
      this.moleTimers.delete(index)
    }, this.getMoleDisplayTime() * 0.8)
    
    this.moleTimers.set(index, hideTimer)
  }

  whack(holeIndex: number): WhackResult {
    if (this.state !== GameState.Playing || holeIndex < 0 || holeIndex >= this.holes.length) {
      return { hit: false, points: 0, content: HoleContent.Empty }
    }
    
    const hole = this.holes[holeIndex]
    
    if (!hole.isActive) {
      this.misses++
      this.combo = 0
      return { hit: false, points: 0, content: HoleContent.Empty }
    }
    
    const result: WhackResult = {
      hit: true,
      points: 0,
      content: hole.content,
      combo: this.combo
    }
    
    // Clear the hide timer
    const timer = this.moleTimers.get(holeIndex)
    if (timer) {
      clearTimeout(timer)
      this.moleTimers.delete(holeIndex)
    }
    
    switch (hole.content) {
      case HoleContent.Mole:
        this.hits++
        this.molesWhacked++
        this.combo++
        
        if (this.combo > this.highestCombo) {
          this.highestCombo = this.combo
        }
        
        let points = 10 * this.level
        
        // Combo multiplier
        if (this.combo > 1) {
          points *= (1 + this.combo * 0.1)
        }
        
        // Power-up multiplier
        if (this.activePowerUp === PowerUp.DoubleScore) {
          points *= 2
        }
        
        result.points = Math.floor(points)
        this.score += result.points
        break
        
      case HoleContent.Bomb:
        this.hits++
        this.bombsHit++
        this.combo = 0
        this.lives--
        
        result.points = -50
        this.score = Math.max(0, this.score + result.points)
        
        if (this.lives <= 0) {
          this.endGame()
        }
        break
        
      case HoleContent.PowerUp:
        this.hits++
        this.powerUpsCollected++
        this.combo++
        
        if (hole.powerUp) {
          this.activatePowerUp(hole.powerUp)
        }
        
        result.points = 25
        this.score += result.points
        break
    }
    
    // Multi-hit power-up effect
    if (this.activePowerUp === PowerUp.MultiHit && hole.content === HoleContent.Mole) {
      this.hitNearbyMoles(holeIndex)
    }
    
    hole.isActive = false
    hole.content = HoleContent.Empty
    hole.powerUp = undefined
    
    return result
  }

  private hitNearbyMoles(centerIndex: number): void {
    const adjacentIndices = this.getAdjacentIndices(centerIndex)
    
    adjacentIndices.forEach(index => {
      const hole = this.holes[index]
      if (hole.isActive && hole.content === HoleContent.Mole) {
        hole.isActive = false
        hole.content = HoleContent.Empty
        this.molesWhacked++
        this.score += 5 * this.level // Reduced points for multi-hit
        
        const timer = this.moleTimers.get(index)
        if (timer) {
          clearTimeout(timer)
          this.moleTimers.delete(index)
        }
      }
    })
  }

  private getAdjacentIndices(index: number): number[] {
    const row = Math.floor(index / 3)
    const col = index % 3
    const adjacent: number[] = []
    
    // Check all 8 directions
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < 3 && c >= 0 && c < 3 && (r !== row || c !== col)) {
          adjacent.push(r * 3 + c)
        }
      }
    }
    
    return adjacent
  }

  private activatePowerUp(powerUp: PowerUp): void {
    this.activePowerUp = powerUp
    
    switch (powerUp) {
      case PowerUp.DoubleScore:
        this.powerUpEndTime = Date.now() + 8000 // 8 seconds
        break
        
      case PowerUp.FreezeTime:
        this.timeFrozen = true
        this.freezeEndTime = Date.now() + 5000 // 5 seconds
        this.powerUpEndTime = this.freezeEndTime
        break
        
      case PowerUp.MultiHit:
        this.powerUpEndTime = Date.now() + 6000 // 6 seconds
        break
    }
  }

  handleTouch(holeIndex: number): WhackResult {
    return this.whack(holeIndex)
  }

  handleMultiTouch(holeIndices: number[]): WhackResult[] {
    if (this.activePowerUp === PowerUp.MultiHit) {
      return holeIndices.map(index => this.whack(index))
    }
    
    // Without multi-hit, only process first touch
    return [this.whack(holeIndices[0])]
  }

  private endGame(): void {
    this.state = GameState.GameOver
    this.clearTimers()
    
    const finalScore = this.calculateFinalScore()
    if (finalScore > this.highScore) {
      this.highScore = finalScore
      this.saveHighScore(finalScore)
    }
  }

  calculateFinalScore(): number {
    let finalScore = this.score
    
    // Accuracy bonus
    const accuracy = this.getAccuracy()
    if (accuracy > 90) {
      finalScore += 500
    } else if (accuracy > 80) {
      finalScore += 300
    } else if (accuracy > 70) {
      finalScore += 100
    }
    
    // Combo bonus
    finalScore += this.highestCombo * 50
    
    // Lives bonus
    finalScore += this.lives * 200
    
    // Difficulty multiplier
    switch (this.difficulty) {
      case Difficulty.Easy:
        finalScore *= 0.8
        break
      case Difficulty.Hard:
        finalScore *= 1.5
        break
      case Difficulty.Expert:
        finalScore *= 2
        break
    }
    
    return Math.floor(finalScore)
  }

  private getAccuracy(): number {
    const total = this.hits + this.misses
    if (total === 0) return 0
    return Math.round((this.hits / total) * 100)
  }

  getHapticFeedback(content: HoleContent): HapticFeedback {
    switch (content) {
      case HoleContent.Mole:
        return { intensity: 0.5, duration: 50 }
      case HoleContent.Bomb:
        return { intensity: 1.0, duration: 200 }
      case HoleContent.PowerUp:
        return { intensity: 0.7, duration: 100 }
      default:
        return { intensity: 0.2, duration: 20 }
    }
  }

  private getSpawnRate(): number {
    let baseRate = 1500
    
    switch (this.difficulty) {
      case Difficulty.Easy:
        baseRate = 2000
        break
      case Difficulty.Hard:
        baseRate = 1000
        break
      case Difficulty.Expert:
        baseRate = 700
        break
    }
    
    // Increase spawn rate with level
    return Math.max(500, baseRate - (this.level - 1) * 100)
  }

  private getMoleDisplayTime(): number {
    let baseTime = 1500
    
    switch (this.difficulty) {
      case Difficulty.Easy:
        baseTime = 2000
        break
      case Difficulty.Hard:
        baseTime = 1000
        break
      case Difficulty.Expert:
        baseTime = 700
        break
    }
    
    // Decrease display time with level
    return Math.max(400, baseTime - (this.level - 1) * 50)
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty
  }

  private loadHighScore(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`whack-a-mole-highscore-${this.difficulty}`)
      if (saved) {
        this.highScore = parseInt(saved, 10)
      }
    }
  }

  private saveHighScore(score: number): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`whack-a-mole-highscore-${this.difficulty}`, score.toString())
    }
  }

  getStatistics(): GameStatistics {
    return {
      score: this.score,
      hits: this.hits,
      misses: this.misses,
      accuracy: this.getAccuracy(),
      highestCombo: this.highestCombo,
      molesWhacked: this.molesWhacked,
      bombsHit: this.bombsHit,
      powerUpsCollected: this.powerUpsCollected
    }
  }

  // Getters
  getState(): GameState { return this.state }
  getHoles(): Hole[] { return [...this.holes] }
  getScore(): number { return this.score }
  getLevel(): number { return this.level }
  getLives(): number { return this.lives }
  getCombo(): number { return this.combo }
  getDifficulty(): Difficulty { return this.difficulty }
  getHighScore(): number { return this.highScore }
  getTimeRemaining(): number { return Math.max(0, Math.floor(this.timeRemaining / 1000)) }
  getActivePowerUp(): PowerUp | null { return this.activePowerUp }
}