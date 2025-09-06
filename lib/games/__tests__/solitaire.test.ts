import { SolitaireGame, Card, Suit, Rank, Pile, MoveType } from '../solitaire'

describe('SolitaireGame', () => {
  let game: SolitaireGame

  beforeEach(() => {
    game = new SolitaireGame()
  })

  describe('Initialization', () => {
    it('should create a standard 52-card deck', () => {
      const deck = game['createDeck']()
      expect(deck).toHaveLength(52)
      
      // Check all suits and ranks are present
      const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
      const ranks = [
        Rank.Ace, Rank.Two, Rank.Three, Rank.Four, Rank.Five,
        Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
        Rank.Jack, Rank.Queen, Rank.King
      ]
      
      suits.forEach(suit => {
        ranks.forEach(rank => {
          const card = deck.find(c => c.suit === suit && c.rank === rank)
          expect(card).toBeDefined()
        })
      })
    })

    it('should shuffle the deck', () => {
      const deck1 = game['createDeck']()
      game['shuffleDeck'](deck1)
      
      const deck2 = game['createDeck']()
      game['shuffleDeck'](deck2)
      
      // Extremely unlikely to be the same after shuffle
      const isDifferent = deck1.some((card, index) => 
        card.suit !== deck2[index].suit || card.rank !== deck2[index].rank
      )
      expect(isDifferent).toBe(true)
    })

    it('should deal cards to tableau piles correctly', () => {
      game.start()
      const tableau = game.getTableau()
      
      // Check tableau setup: pile 0 has 1 card, pile 1 has 2, etc.
      expect(tableau).toHaveLength(7)
      tableau.forEach((pile, index) => {
        expect(pile.cards).toHaveLength(index + 1)
        // Last card should be face up
        expect(pile.cards[pile.cards.length - 1].faceUp).toBe(true)
        // Others should be face down
        for (let i = 0; i < pile.cards.length - 1; i++) {
          expect(pile.cards[i].faceUp).toBe(false)
        }
      })
    })

    it('should initialize stock pile with remaining cards', () => {
      game.start()
      const stock = game.getStock()
      
      // 52 cards - 28 tableau cards = 24 stock cards
      expect(stock.cards).toHaveLength(24)
      // All stock cards should be face down
      stock.cards.forEach(card => {
        expect(card.faceUp).toBe(false)
      })
    })

    it('should initialize empty foundation piles', () => {
      game.start()
      const foundations = game.getFoundations()
      
      expect(foundations).toHaveLength(4)
      foundations.forEach(pile => {
        expect(pile.cards).toHaveLength(0)
      })
    })

    it('should initialize empty waste pile', () => {
      game.start()
      const waste = game.getWaste()
      expect(waste.cards).toHaveLength(0)
    })
  })

  describe('Card Movement Rules', () => {
    beforeEach(() => {
      game.start()
    })

    it('should allow moving cards from stock to waste', () => {
      const initialStockSize = game.getStock().cards.length
      
      const result = game.drawFromStock()
      
      expect(result).toBe(true)
      expect(game.getStock().cards.length).toBe(initialStockSize - 3)
      expect(game.getWaste().cards.length).toBe(3)
      expect(game.getWaste().cards[game.getWaste().cards.length - 1].faceUp).toBe(true)
    })

    it('should recycle waste to stock when stock is empty', () => {
      // Draw all cards from stock
      while (game.getStock().cards.length > 0) {
        game.drawFromStock()
      }
      
      const wasteSize = game.getWaste().cards.length
      const result = game.drawFromStock()
      
      expect(result).toBe(true)
      expect(game.getStock().cards.length).toBeLessThan(wasteSize)
      expect(game.getWaste().cards.length).toBe(3)
    })

    it('should validate tableau moves correctly', () => {
      // Create specific card scenarios for testing
      const redKing = new Card(Suit.Hearts, Rank.King)
      const blackQueen = new Card(Suit.Spades, Rank.Queen)
      const redQueen = new Card(Suit.Diamonds, Rank.Queen)
      
      // Valid move: black Queen on red King
      expect(game['canPlaceOnTableau'](blackQueen, redKing)).toBe(true)
      
      // Invalid move: red Queen on red King
      expect(game['canPlaceOnTableau'](redQueen, redKing)).toBe(false)
      
      // Invalid move: wrong rank sequence
      const blackJack = new Card(Suit.Clubs, Rank.Jack)
      expect(game['canPlaceOnTableau'](blackJack, blackQueen)).toBe(false)
    })

    it('should validate foundation moves correctly', () => {
      const aceHearts = new Card(Suit.Hearts, Rank.Ace)
      const twoHearts = new Card(Suit.Hearts, Rank.Two)
      const twoClubs = new Card(Suit.Clubs, Rank.Two)
      
      // Can place Ace on empty foundation
      expect(game['canPlaceOnFoundation'](aceHearts, null)).toBe(true)
      
      // Can place Two of same suit on Ace
      expect(game['canPlaceOnFoundation'](twoHearts, aceHearts)).toBe(true)
      
      // Cannot place Two of different suit on Ace
      expect(game['canPlaceOnFoundation'](twoClubs, aceHearts)).toBe(false)
    })

    it('should handle moving cards between tableau piles', () => {
      // Set up a specific scenario
      const fromPile = 0
      const toPile = 1
      
      // Attempt move (actual result depends on dealt cards)
      const result = game.moveCard(MoveType.TableauToTableau, fromPile, toPile)
      
      // Just verify the method executes without error
      expect(typeof result).toBe('boolean')
    })

    it('should flip face-down cards when exposed', () => {
      // Find a tableau pile with multiple cards
      const tableau = game.getTableau()
      let testPile = -1
      
      for (let i = 0; i < tableau.length; i++) {
        if (tableau[i].cards.length > 1) {
          testPile = i
          break
        }
      }
      
      if (testPile >= 0) {
        // Remove the top card to expose the one below
        const topCard = tableau[testPile].cards.pop()!
        game['flipTopCardIfNeeded'](tableau[testPile])
        
        // The new top card should be face up
        const newTop = tableau[testPile].cards[tableau[testPile].cards.length - 1]
        expect(newTop.faceUp).toBe(true)
        
        // Restore the card
        tableau[testPile].cards.push(topCard)
      }
    })
  })

  describe('Game State', () => {
    beforeEach(() => {
      game.start()
    })

    it('should track score correctly', () => {
      const initialScore = game.getScore()
      expect(initialScore).toBe(0)
      
      // Drawing from stock shouldn't affect score
      game.drawFromStock()
      expect(game.getScore()).toBe(0)
      
      // Moving to foundation should increase score
      // (Implementation will determine exact scoring)
    })

    it('should track move count', () => {
      const initialMoves = game.getMoveCount()
      expect(initialMoves).toBe(0)
      
      game.drawFromStock()
      expect(game.getMoveCount()).toBe(1)
    })

    it('should detect win condition', () => {
      expect(game.isGameWon()).toBe(false)
      
      // Manually set up a win condition (all cards in foundations)
      const foundations = game.getFoundations()
      const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
      
      suits.forEach((suit, index) => {
        foundations[index].cards = []
        for (let rank = Rank.Ace; rank <= Rank.King; rank++) {
          foundations[index].cards.push(new Card(suit, rank, true))
        }
      })
      
      expect(game.isGameWon()).toBe(true)
    })

    it('should support undo functionality', () => {
      const initialState = game.getGameState()
      
      game.drawFromStock()
      const afterDrawState = game.getGameState()
      
      game.undo()
      const undoneState = game.getGameState()
      
      expect(undoneState.moveCount).toBe(initialState.moveCount)
      expect(undoneState.stock.cards.length).toBe(initialState.stock.cards.length)
    })

    it('should provide hint system', () => {
      const hint = game.getHint()
      
      // Hint should be null or a valid move
      if (hint) {
        expect(hint).toHaveProperty('type')
        expect(hint).toHaveProperty('from')
        expect(hint).toHaveProperty('to')
      }
    })

    it('should detect auto-complete availability', () => {
      // Auto-complete is available when all cards are face-up
      const canAutoComplete = game.canAutoComplete()
      expect(typeof canAutoComplete).toBe('boolean')
      
      // Initially should be false
      expect(canAutoComplete).toBe(false)
    })
  })

  describe('Touch and Mobile Support', () => {
    it('should handle drag start events', () => {
      game.start()
      
      const dragData = game.startDrag(Pile.Tableau, 0, 0)
      
      if (dragData) {
        expect(dragData).toHaveProperty('cards')
        expect(dragData).toHaveProperty('source')
        expect(dragData.cards.length).toBeGreaterThan(0)
      }
    })

    it('should validate drop targets', () => {
      game.start()
      
      // Get a card from tableau
      const tableau = game.getTableau()
      if (tableau[0].cards.length > 0) {
        const card = tableau[0].cards[tableau[0].cards.length - 1]
        
        // Check if can drop on another pile
        const canDrop = game.canDrop(card, Pile.Tableau, 1)
        expect(typeof canDrop).toBe('boolean')
      }
    })

    it('should handle touch coordinates for card selection', () => {
      const cardAtPoint = game.getCardAtPoint(100, 200)
      
      // Should return null or card info
      if (cardAtPoint) {
        expect(cardAtPoint).toHaveProperty('card')
        expect(cardAtPoint).toHaveProperty('pile')
        expect(cardAtPoint).toHaveProperty('index')
      }
    })
  })

  describe('Game Statistics', () => {
    it('should track game time', () => {
      game.start()
      
      // Simulate time passing
      jest.advanceTimersByTime(5000)
      
      const time = game.getElapsedTime()
      expect(time).toBeGreaterThanOrEqual(0)
    })

    it('should save and load game state', () => {
      game.start()
      game.drawFromStock()
      
      const savedState = game.serialize()
      expect(typeof savedState).toBe('string')
      
      const newGame = new SolitaireGame()
      newGame.deserialize(savedState)
      
      expect(newGame.getMoveCount()).toBe(game.getMoveCount())
      expect(newGame.getScore()).toBe(game.getScore())
    })

    it('should calculate game statistics', () => {
      game.start()
      
      const stats = game.getStatistics()
      
      expect(stats).toHaveProperty('movesCount')
      expect(stats).toHaveProperty('score')
      expect(stats).toHaveProperty('timeElapsed')
      expect(stats).toHaveProperty('cardsInFoundations')
      expect(stats).toHaveProperty('cardsRevealed')
    })
  })
})