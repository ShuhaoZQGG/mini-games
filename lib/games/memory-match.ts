import { BaseGame } from './base-game'

export interface Card {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

export class MemoryMatchGame extends BaseGame {
  private cards: Card[] = []
  private flippedCards: number[] = []
  private moves: number = 0
  private matches: number = 0
  private gridSize: number = 4
  private onUpdate?: (cards: Card[], moves: number) => void
  private onComplete?: (moves: number, time: number) => void

  constructor(gridSize: number = 4) {
    super()
    this.gridSize = gridSize
  }

  initialize(): void {
    const totalCards = this.gridSize * this.gridSize
    const pairs = totalCards / 2
    const emojis = ['🎮', '🎯', '🎲', '🎸', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎹', '🎺', '🎻', '🎰', '🎳', '🎯']
    
    const values: string[] = []
    for (let i = 0; i < pairs; i++) {
      const emoji = emojis[i % emojis.length]
      values.push(emoji, emoji)
    }
    
    // Shuffle values
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]]
    }
    
    this.cards = values.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }))
    
    this.flippedCards = []
    this.moves = 0
    this.matches = 0
    
    this.state = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      highScore: this.state.highScore || Infinity,
    }
  }

  start(): void {
    this.initialize()
    this.state.isPlaying = true
    this.state.startTime = new Date()
    
    if (this.onUpdate) {
      this.onUpdate(this.cards, this.moves)
    }
  }

  pause(): void {
    if (this.state.isPlaying && !this.state.isPaused) {
      this.state.isPaused = true
    }
  }

  resume(): void {
    if (this.state.isPlaying && this.state.isPaused) {
      this.state.isPaused = false
    }
  }

  reset(): void {
    this.initialize()
  }

  handleInput(cardId: number): void {
    if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) {
      return
    }
    
    const card = this.cards[cardId]
    
    if (card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
      return
    }
    
    card.isFlipped = true
    this.flippedCards.push(cardId)
    
    if (this.flippedCards.length === 2) {
      this.moves++
      this.checkMatch()
    }
    
    if (this.onUpdate) {
      this.onUpdate(this.cards, this.moves)
    }
  }

  private checkMatch(): void {
    const [first, second] = this.flippedCards
    const firstCard = this.cards[first]
    const secondCard = this.cards[second]
    
    if (firstCard.value === secondCard.value) {
      firstCard.isMatched = true
      secondCard.isMatched = true
      this.matches++
      this.flippedCards = []
      
      if (this.matches === this.cards.length / 2) {
        this.endGame()
      }
    } else {
      setTimeout(() => {
        firstCard.isFlipped = false
        secondCard.isFlipped = false
        this.flippedCards = []
        
        if (this.onUpdate) {
          this.onUpdate(this.cards, this.moves)
        }
      }, 1000)
    }
  }

  endGame(): void {
    super.endGame()
    
    const time = this.state.endTime && this.state.startTime
      ? Math.floor((this.state.endTime.getTime() - this.state.startTime.getTime()) / 1000)
      : 0
    
    this.state.score = this.moves
    
    if (this.moves < this.state.highScore) {
      this.state.highScore = this.moves
    }
    
    if (this.onComplete) {
      this.onComplete(this.moves, time)
    }
  }

  getCards(): Card[] {
    return this.cards
  }

  getMoves(): number {
    return this.moves
  }

  setUpdateCallback(callback: (cards: Card[], moves: number) => void): void {
    this.onUpdate = callback
  }

  setCompleteCallback(callback: (moves: number, time: number) => void): void {
    this.onComplete = callback
  }
}