export enum Suit {
  Clubs = 'clubs',
  Diamonds = 'diamonds',
  Hearts = 'hearts',
  Spades = 'spades'
}

export enum Rank {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13
}

export enum Pile {
  Stock = 'stock',
  Waste = 'waste',
  Foundation = 'foundation',
  Tableau = 'tableau'
}

export enum MoveType {
  StockToWaste = 'stockToWaste',
  WasteToTableau = 'wasteToTableau',
  WasteToFoundation = 'wasteToFoundation',
  TableauToTableau = 'tableauToTableau',
  TableauToFoundation = 'tableauToFoundation',
  FoundationToTableau = 'foundationToTableau'
}

export class Card {
  constructor(
    public suit: Suit,
    public rank: Rank,
    public faceUp: boolean = false
  ) {}

  get color(): 'red' | 'black' {
    return this.suit === Suit.Hearts || this.suit === Suit.Diamonds ? 'red' : 'black'
  }

  get rankName(): string {
    switch (this.rank) {
      case Rank.Ace: return 'A'
      case Rank.Jack: return 'J'
      case Rank.Queen: return 'Q'
      case Rank.King: return 'K'
      default: return this.rank.toString()
    }
  }

  flip(): void {
    this.faceUp = !this.faceUp
  }

  clone(): Card {
    return new Card(this.suit, this.rank, this.faceUp)
  }
}

export interface CardPile {
  cards: Card[]
  type: Pile
}

export interface Move {
  type: MoveType
  from: number
  to: number
  cards?: Card[]
}

export interface Hint {
  type: MoveType
  from: number
  to: number
  description: string
}

export interface GameState {
  stock: CardPile
  waste: CardPile
  foundations: CardPile[]
  tableau: CardPile[]
  score: number
  moveCount: number
  startTime: number
  elapsedTime: number
}

export interface GameStatistics {
  movesCount: number
  score: number
  timeElapsed: number
  cardsInFoundations: number
  cardsRevealed: number
}

export interface DragData {
  cards: Card[]
  source: { pile: Pile; index: number }
}

export interface CardLocation {
  card: Card
  pile: Pile
  index: number
  cardIndex: number
}

export class SolitaireGame {
  private stock: CardPile
  private waste: CardPile
  private foundations: CardPile[]
  private tableau: CardPile[]
  private score: number = 0
  private moveCount: number = 0
  private history: GameState[] = []
  private startTime: number = 0
  private dragData: DragData | null = null

  constructor() {
    this.stock = { cards: [], type: Pile.Stock }
    this.waste = { cards: [], type: Pile.Waste }
    this.foundations = Array(4).fill(null).map(() => ({ cards: [], type: Pile.Foundation }))
    this.tableau = Array(7).fill(null).map(() => ({ cards: [], type: Pile.Tableau }))
  }

  start(): void {
    this.reset()
    const deck = this.createDeck()
    this.shuffleDeck(deck)
    this.dealCards(deck)
    this.startTime = Date.now()
    this.saveState()
  }

  reset(): void {
    this.stock.cards = []
    this.waste.cards = []
    this.foundations.forEach(f => f.cards = [])
    this.tableau.forEach(t => t.cards = [])
    this.score = 0
    this.moveCount = 0
    this.history = []
    this.dragData = null
  }

  private createDeck(): Card[] {
    const deck: Card[] = []
    const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
    
    for (const suit of suits) {
      for (let rank = Rank.Ace; rank <= Rank.King; rank++) {
        deck.push(new Card(suit, rank, false))
      }
    }
    
    return deck
  }

  private shuffleDeck(deck: Card[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }

  private dealCards(deck: Card[]): void {
    let deckIndex = 0
    
    // Deal to tableau
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = deck[deckIndex++]
        if (j === i) {
          card.faceUp = true // Last card in each pile is face up
        }
        this.tableau[i].cards.push(card)
      }
    }
    
    // Remaining cards go to stock
    while (deckIndex < deck.length) {
      this.stock.cards.push(deck[deckIndex++])
    }
  }

  drawFromStock(): boolean {
    if (this.stock.cards.length === 0) {
      // Recycle waste to stock
      if (this.waste.cards.length === 0) {
        return false
      }
      
      while (this.waste.cards.length > 0) {
        const card = this.waste.cards.pop()!
        card.faceUp = false
        this.stock.cards.push(card)
      }
    }
    
    // Draw 3 cards (or remaining if less than 3)
    const drawCount = Math.min(3, this.stock.cards.length)
    for (let i = 0; i < drawCount; i++) {
      const card = this.stock.cards.pop()!
      card.faceUp = true
      this.waste.cards.push(card)
    }
    
    this.moveCount++
    this.saveState()
    return true
  }

  moveCard(type: MoveType, from: number, to: number, cardIndex?: number): boolean {
    let success = false
    
    switch (type) {
      case MoveType.WasteToTableau:
        success = this.moveWasteToTableau(to)
        break
      case MoveType.WasteToFoundation:
        success = this.moveWasteToFoundation(to)
        break
      case MoveType.TableauToTableau:
        success = this.moveTableauToTableau(from, to, cardIndex)
        break
      case MoveType.TableauToFoundation:
        success = this.moveTableauToFoundation(from, to)
        break
      case MoveType.FoundationToTableau:
        success = this.moveFoundationToTableau(from, to)
        break
    }
    
    if (success) {
      this.moveCount++
      this.saveState()
    }
    
    return success
  }

  private moveWasteToTableau(toPile: number): boolean {
    if (this.waste.cards.length === 0) return false
    
    const card = this.waste.cards[this.waste.cards.length - 1]
    const targetPile = this.tableau[toPile]
    
    if (this.canPlaceOnTableau(card, targetPile.cards[targetPile.cards.length - 1] || null)) {
      this.waste.cards.pop()
      targetPile.cards.push(card)
      this.score += 5
      return true
    }
    
    return false
  }

  private moveWasteToFoundation(toPile: number): boolean {
    if (this.waste.cards.length === 0) return false
    
    const card = this.waste.cards[this.waste.cards.length - 1]
    const targetPile = this.foundations[toPile]
    
    if (this.canPlaceOnFoundation(card, targetPile.cards[targetPile.cards.length - 1] || null)) {
      this.waste.cards.pop()
      targetPile.cards.push(card)
      this.score += 10
      return true
    }
    
    return false
  }

  private moveTableauToTableau(fromPile: number, toPile: number, cardIndex?: number): boolean {
    const sourcePile = this.tableau[fromPile]
    const targetPile = this.tableau[toPile]
    
    if (sourcePile.cards.length === 0) return false
    
    const index = cardIndex ?? sourcePile.cards.length - 1
    const cardsToMove = sourcePile.cards.slice(index)
    
    if (cardsToMove.length === 0 || !cardsToMove[0].faceUp) return false
    
    const bottomCard = cardsToMove[0]
    const targetTop = targetPile.cards[targetPile.cards.length - 1] || null
    
    if (this.canPlaceOnTableau(bottomCard, targetTop)) {
      sourcePile.cards.splice(index)
      targetPile.cards.push(...cardsToMove)
      this.flipTopCardIfNeeded(sourcePile)
      return true
    }
    
    return false
  }

  private moveTableauToFoundation(fromPile: number, toPile: number): boolean {
    const sourcePile = this.tableau[fromPile]
    const targetPile = this.foundations[toPile]
    
    if (sourcePile.cards.length === 0) return false
    
    const card = sourcePile.cards[sourcePile.cards.length - 1]
    const targetTop = targetPile.cards[targetPile.cards.length - 1] || null
    
    if (this.canPlaceOnFoundation(card, targetTop)) {
      sourcePile.cards.pop()
      targetPile.cards.push(card)
      this.flipTopCardIfNeeded(sourcePile)
      this.score += 10
      return true
    }
    
    return false
  }

  private moveFoundationToTableau(fromPile: number, toPile: number): boolean {
    const sourcePile = this.foundations[fromPile]
    const targetPile = this.tableau[toPile]
    
    if (sourcePile.cards.length === 0) return false
    
    const card = sourcePile.cards[sourcePile.cards.length - 1]
    const targetTop = targetPile.cards[targetPile.cards.length - 1] || null
    
    if (this.canPlaceOnTableau(card, targetTop)) {
      sourcePile.cards.pop()
      targetPile.cards.push(card)
      this.score -= 15 // Penalty for moving back from foundation
      return true
    }
    
    return false
  }

  private canPlaceOnTableau(card: Card, target: Card | null): boolean {
    if (!target) {
      return card.rank === Rank.King
    }
    
    return card.color !== target.color && card.rank === target.rank - 1
  }

  private canPlaceOnFoundation(card: Card, target: Card | null): boolean {
    if (!target) {
      return card.rank === Rank.Ace
    }
    
    return card.suit === target.suit && card.rank === target.rank + 1
  }

  private flipTopCardIfNeeded(pile: CardPile): void {
    if (pile.cards.length > 0) {
      const topCard = pile.cards[pile.cards.length - 1]
      if (!topCard.faceUp) {
        topCard.faceUp = true
        this.score += 5
      }
    }
  }

  undo(): boolean {
    if (this.history.length <= 1) return false
    
    this.history.pop() // Remove current state
    const previousState = this.history[this.history.length - 1]
    
    if (previousState) {
      this.restoreState(previousState)
      return true
    }
    
    return false
  }

  private saveState(): void {
    const state: GameState = {
      stock: { cards: this.stock.cards.map(c => c.clone()), type: Pile.Stock },
      waste: { cards: this.waste.cards.map(c => c.clone()), type: Pile.Waste },
      foundations: this.foundations.map(f => ({
        cards: f.cards.map(c => c.clone()),
        type: Pile.Foundation
      })),
      tableau: this.tableau.map(t => ({
        cards: t.cards.map(c => c.clone()),
        type: Pile.Tableau
      })),
      score: this.score,
      moveCount: this.moveCount,
      startTime: this.startTime,
      elapsedTime: this.getElapsedTime()
    }
    
    this.history.push(state)
    
    // Limit history size
    if (this.history.length > 50) {
      this.history.shift()
    }
  }

  private restoreState(state: GameState): void {
    this.stock = state.stock
    this.waste = state.waste
    this.foundations = state.foundations
    this.tableau = state.tableau
    this.score = state.score
    this.moveCount = state.moveCount
    this.startTime = state.startTime
  }

  getHint(): Hint | null {
    // Check waste to tableau/foundation
    if (this.waste.cards.length > 0) {
      const card = this.waste.cards[this.waste.cards.length - 1]
      
      for (let i = 0; i < this.foundations.length; i++) {
        const top = this.foundations[i].cards[this.foundations[i].cards.length - 1] || null
        if (this.canPlaceOnFoundation(card, top)) {
          return {
            type: MoveType.WasteToFoundation,
            from: 0,
            to: i,
            description: `Move ${card.rankName}${card.suit[0]} from waste to foundation`
          }
        }
      }
      
      for (let i = 0; i < this.tableau.length; i++) {
        const top = this.tableau[i].cards[this.tableau[i].cards.length - 1] || null
        if (this.canPlaceOnTableau(card, top)) {
          return {
            type: MoveType.WasteToTableau,
            from: 0,
            to: i,
            description: `Move ${card.rankName}${card.suit[0]} from waste to tableau ${i + 1}`
          }
        }
      }
    }
    
    // Check tableau to foundation
    for (let i = 0; i < this.tableau.length; i++) {
      if (this.tableau[i].cards.length > 0) {
        const card = this.tableau[i].cards[this.tableau[i].cards.length - 1]
        
        for (let j = 0; j < this.foundations.length; j++) {
          const top = this.foundations[j].cards[this.foundations[j].cards.length - 1] || null
          if (this.canPlaceOnFoundation(card, top)) {
            return {
              type: MoveType.TableauToFoundation,
              from: i,
              to: j,
              description: `Move ${card.rankName}${card.suit[0]} from tableau ${i + 1} to foundation`
            }
          }
        }
      }
    }
    
    // Check tableau to tableau
    for (let i = 0; i < this.tableau.length; i++) {
      const sourcePile = this.tableau[i]
      
      for (let cardIdx = 0; cardIdx < sourcePile.cards.length; cardIdx++) {
        const card = sourcePile.cards[cardIdx]
        if (!card.faceUp) continue
        
        for (let j = 0; j < this.tableau.length; j++) {
          if (i === j) continue
          
          const targetTop = this.tableau[j].cards[this.tableau[j].cards.length - 1] || null
          if (this.canPlaceOnTableau(card, targetTop)) {
            return {
              type: MoveType.TableauToTableau,
              from: i,
              to: j,
              description: `Move ${card.rankName}${card.suit[0]} from tableau ${i + 1} to tableau ${j + 1}`
            }
          }
        }
      }
    }
    
    // Suggest drawing from stock
    if (this.stock.cards.length > 0 || this.waste.cards.length > 0) {
      return {
        type: MoveType.StockToWaste,
        from: 0,
        to: 0,
        description: 'Draw cards from stock'
      }
    }
    
    return null
  }

  canAutoComplete(): boolean {
    // Check if all cards in tableau are face up
    for (const pile of this.tableau) {
      for (const card of pile.cards) {
        if (!card.faceUp) return false
      }
    }
    
    // Check if stock and waste are empty
    return this.stock.cards.length === 0 && this.waste.cards.length === 0
  }

  autoComplete(): boolean {
    if (!this.canAutoComplete()) return false
    
    let moved = true
    while (moved) {
      moved = false
      
      // Try to move cards to foundations
      for (let i = 0; i < this.tableau.length; i++) {
        if (this.tableau[i].cards.length > 0) {
          for (let j = 0; j < this.foundations.length; j++) {
            if (this.moveTableauToFoundation(i, j)) {
              moved = true
              break
            }
          }
        }
      }
    }
    
    return this.isGameWon()
  }

  isGameWon(): boolean {
    return this.foundations.every(f => f.cards.length === 13)
  }

  startDrag(pile: Pile, pileIndex: number, cardIndex: number): DragData | null {
    let cards: Card[] = []
    
    if (pile === Pile.Waste && this.waste.cards.length > 0) {
      cards = [this.waste.cards[this.waste.cards.length - 1]]
    } else if (pile === Pile.Tableau) {
      const tableauPile = this.tableau[pileIndex]
      if (cardIndex < tableauPile.cards.length && tableauPile.cards[cardIndex].faceUp) {
        cards = tableauPile.cards.slice(cardIndex)
      }
    } else if (pile === Pile.Foundation) {
      const foundationPile = this.foundations[pileIndex]
      if (foundationPile.cards.length > 0) {
        cards = [foundationPile.cards[foundationPile.cards.length - 1]]
      }
    }
    
    if (cards.length === 0) return null
    
    this.dragData = {
      cards,
      source: { pile, index: pileIndex }
    }
    
    return this.dragData
  }

  canDrop(card: Card, targetPile: Pile, targetIndex: number): boolean {
    if (targetPile === Pile.Tableau) {
      const pile = this.tableau[targetIndex]
      const top = pile.cards[pile.cards.length - 1] || null
      return this.canPlaceOnTableau(card, top)
    } else if (targetPile === Pile.Foundation) {
      const pile = this.foundations[targetIndex]
      const top = pile.cards[pile.cards.length - 1] || null
      return this.canPlaceOnFoundation(card, top)
    }
    
    return false
  }

  getCardAtPoint(x: number, y: number): CardLocation | null {
    // This would need actual coordinate mapping in the UI
    // For now, return null as this is primarily a UI concern
    return null
  }

  getElapsedTime(): number {
    if (this.startTime === 0) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  serialize(): string {
    const state = {
      stock: this.stock.cards.map(c => ({ suit: c.suit, rank: c.rank, faceUp: c.faceUp })),
      waste: this.waste.cards.map(c => ({ suit: c.suit, rank: c.rank, faceUp: c.faceUp })),
      foundations: this.foundations.map(f => 
        f.cards.map(c => ({ suit: c.suit, rank: c.rank, faceUp: c.faceUp }))
      ),
      tableau: this.tableau.map(t => 
        t.cards.map(c => ({ suit: c.suit, rank: c.rank, faceUp: c.faceUp }))
      ),
      score: this.score,
      moveCount: this.moveCount,
      startTime: this.startTime
    }
    
    return JSON.stringify(state)
  }

  deserialize(data: string): void {
    try {
      const state = JSON.parse(data)
      
      this.stock.cards = state.stock.map((c: any) => new Card(c.suit, c.rank, c.faceUp))
      this.waste.cards = state.waste.map((c: any) => new Card(c.suit, c.rank, c.faceUp))
      this.foundations = state.foundations.map((f: any[], index: number) => ({
        cards: f.map((c: any) => new Card(c.suit, c.rank, c.faceUp)),
        type: Pile.Foundation
      }))
      this.tableau = state.tableau.map((t: any[], index: number) => ({
        cards: t.map((c: any) => new Card(c.suit, c.rank, c.faceUp)),
        type: Pile.Tableau
      }))
      this.score = state.score
      this.moveCount = state.moveCount
      this.startTime = state.startTime
    } catch (error) {
      console.error('Failed to deserialize game state:', error)
    }
  }

  getStatistics(): GameStatistics {
    let cardsInFoundations = 0
    let cardsRevealed = 0
    
    this.foundations.forEach(f => {
      cardsInFoundations += f.cards.length
    })
    
    this.tableau.forEach(t => {
      t.cards.forEach(c => {
        if (c.faceUp) cardsRevealed++
      })
    })
    
    if (this.waste.cards.length > 0) {
      cardsRevealed += this.waste.cards.filter(c => c.faceUp).length
    }
    
    return {
      movesCount: this.moveCount,
      score: this.score,
      timeElapsed: this.getElapsedTime(),
      cardsInFoundations,
      cardsRevealed
    }
  }

  // Getters for game state
  getStock(): CardPile { return this.stock }
  getWaste(): CardPile { return this.waste }
  getFoundations(): CardPile[] { return this.foundations }
  getTableau(): CardPile[] { return this.tableau }
  getScore(): number { return this.score }
  getMoveCount(): number { return this.moveCount }
  
  getGameState(): GameState {
    return {
      stock: this.stock,
      waste: this.waste,
      foundations: this.foundations,
      tableau: this.tableau,
      score: this.score,
      moveCount: this.moveCount,
      startTime: this.startTime,
      elapsedTime: this.getElapsedTime()
    }
  }
}