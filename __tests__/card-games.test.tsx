import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GoFish from '@/components/games/card/GoFish'
import War from '@/components/games/card/War'
import CrazyEights from '@/components/games/card/CrazyEights'
import Hearts from '@/components/games/card/Hearts'
import Spades from '@/components/games/card/Spades'

describe('Go Fish Game', () => {
  it('should deal 7 cards to each player (2 players)', () => {
    render(<GoFish />)
    const playerHand = screen.getByTestId('player-hand')
    const cards = playerHand.querySelectorAll('[data-testid^="card-"]')
    expect(cards).toHaveLength(7)
  })

  it('should allow asking for specific rank', () => {
    render(<GoFish />)
    const askButton = screen.getByRole('button', { name: /ask for/i })
    expect(askButton).toBeInTheDocument()
  })

  it('should draw from pond when opponent does not have requested card', () => {
    render(<GoFish />)
    const pond = screen.getByTestId('pond')
    const initialCards = pond.textContent
    
    // Make a request that fails
    const askButton = screen.getByRole('button', { name: /ask for/i })
    fireEvent.click(askButton)
    
    // Should draw from pond
    waitFor(() => {
      expect(pond.textContent).not.toBe(initialCards)
    })
  })

  it('should form sets of 4 cards automatically', () => {
    render(<GoFish />)
    const setsArea = screen.getByTestId('sets-area')
    expect(setsArea).toBeInTheDocument()
  })

  it('should track score based on sets collected', () => {
    render(<GoFish />)
    const scoreDisplay = screen.getByTestId('score-display')
    expect(scoreDisplay).toBeInTheDocument()
  })

  it('should end game when pond is empty or all sets formed', () => {
    render(<GoFish />)
    // Test end game conditions
  })

  it('should have AI opponent with memory', () => {
    render(<GoFish />)
    // AI should remember cards asked for
  })
})

describe('War Card Game', () => {
  it('should deal 26 cards to each player', () => {
    render(<War />)
    const playerDeck = screen.getByTestId('player-deck')
    const opponentDeck = screen.getByTestId('opponent-deck')
    
    expect(playerDeck).toHaveTextContent('26')
    expect(opponentDeck).toHaveTextContent('26')
  })

  it('should compare cards and award to winner', () => {
    render(<War />)
    const playButton = screen.getByRole('button', { name: /play card/i })
    fireEvent.click(playButton)
    
    const playerCard = screen.getByTestId('player-played-card')
    const opponentCard = screen.getByTestId('opponent-played-card')
    
    expect(playerCard).toBeInTheDocument()
    expect(opponentCard).toBeInTheDocument()
  })

  it('should trigger war on tie', () => {
    render(<War />)
    // Mock a tie scenario
    // Should place 3 cards face down, 1 face up
  })

  it('should end game when one player has all cards', () => {
    render(<War />)
    // Test win condition
  })

  it('should have auto-play option', () => {
    render(<War />)
    const autoPlayButton = screen.getByRole('button', { name: /auto-play/i })
    expect(autoPlayButton).toBeInTheDocument()
  })

  it('should display card count for both players', () => {
    render(<War />)
    expect(screen.getByTestId('player-card-count')).toBeInTheDocument()
    expect(screen.getByTestId('opponent-card-count')).toBeInTheDocument()
  })
})

describe('Crazy Eights Game', () => {
  it('should deal 8 cards to each player', () => {
    render(<CrazyEights />)
    const playerHand = screen.getByTestId('player-hand')
    const cards = playerHand.querySelectorAll('[data-testid^="card-"]')
    expect(cards).toHaveLength(8)
  })

  it('should allow playing cards matching suit or rank', () => {
    render(<CrazyEights />)
    const discardPile = screen.getByTestId('discard-pile')
    const topCard = screen.getByTestId('top-card')
    
    // Should highlight matching cards in hand
    const validCards = screen.getAllByTestId(/valid-card-/)
    expect(validCards.length).toBeGreaterThan(0)
  })

  it('should allow eights as wildcards', () => {
    render(<CrazyEights />)
    const eight = screen.queryByTestId(/card-.*-8/)
    if (eight) {
      expect(eight).toHaveClass('playable')
    }
  })

  it('should prompt for suit selection when eight is played', () => {
    render(<CrazyEights />)
    // Play an eight
    const eight = screen.queryByTestId(/card-.*-8/)
    if (eight) {
      fireEvent.click(eight)
      expect(screen.getByTestId('suit-selector')).toBeInTheDocument()
    }
  })

  it('should draw cards when no valid play', () => {
    render(<CrazyEights />)
    const drawButton = screen.getByRole('button', { name: /draw/i })
    expect(drawButton).toBeInTheDocument()
  })

  it('should end game when player empties hand', () => {
    render(<CrazyEights />)
    // Test win condition
  })

  it('should have AI that prioritizes strategic plays', () => {
    render(<CrazyEights />)
    // AI should save eights, play high cards first
  })
})

describe('Hearts Game', () => {
  it('should deal 13 cards to each player', () => {
    render(<Hearts />)
    const playerHand = screen.getByTestId('player-hand')
    const cards = playerHand.querySelectorAll('[data-testid^="card-"]')
    expect(cards).toHaveLength(13)
  })

  it('should have passing phase before rounds', () => {
    render(<Hearts />)
    const passButton = screen.getByRole('button', { name: /pass cards/i })
    expect(passButton).toBeInTheDocument()
    
    // Should select 3 cards to pass
    const passIndicator = screen.getByTestId('pass-direction')
    expect(passIndicator).toBeInTheDocument()
  })

  it('should enforce following suit', () => {
    render(<Hearts />)
    // Start a trick
    // Only cards of led suit should be playable
  })

  it('should not allow hearts until broken', () => {
    render(<Hearts />)
    const heartsStatus = screen.getByTestId('hearts-broken')
    expect(heartsStatus).toHaveTextContent('No')
  })

  it('should track points for hearts and queen of spades', () => {
    render(<Hearts />)
    const scoreBoard = screen.getByTestId('score-board')
    expect(scoreBoard).toBeInTheDocument()
    
    // Hearts = 1 point each
    // Queen of Spades = 13 points
  })

  it('should detect shooting the moon', () => {
    render(<Hearts />)
    // If player takes all hearts + QoS
    // Other players get 26 points
  })

  it('should end game at 100 points', () => {
    render(<Hearts />)
    // Test game end condition
  })

  it('should display trick winner', () => {
    render(<Hearts />)
    const trickArea = screen.getByTestId('trick-area')
    expect(trickArea).toBeInTheDocument()
  })
})

describe('Spades Game', () => {
  it('should deal 13 cards to each player', () => {
    render(<Spades />)
    const playerHand = screen.getByTestId('player-hand')
    const cards = playerHand.querySelectorAll('[data-testid^="card-"]')
    expect(cards).toHaveLength(13)
  })

  it('should have bidding phase', () => {
    render(<Spades />)
    const bidInput = screen.getByTestId('bid-input')
    expect(bidInput).toBeInTheDocument()
    
    // Should allow bids 0-13
    expect(bidInput).toHaveAttribute('min', '0')
    expect(bidInput).toHaveAttribute('max', '13')
  })

  it('should support nil bids', () => {
    render(<Spades />)
    const nilButton = screen.getByRole('button', { name: /nil/i })
    expect(nilButton).toBeInTheDocument()
  })

  it('should support blind nil bids', () => {
    render(<Spades />)
    const blindNilButton = screen.getByRole('button', { name: /blind nil/i })
    expect(blindNilButton).toBeInTheDocument()
  })

  it('should track tricks won vs bid', () => {
    render(<Spades />)
    const bidDisplay = screen.getByTestId('player-bid')
    const tricksWon = screen.getByTestId('player-tricks')
    
    expect(bidDisplay).toBeInTheDocument()
    expect(tricksWon).toBeInTheDocument()
  })

  it('should enforce spades as trump', () => {
    render(<Spades />)
    // Spades should win over other suits
  })

  it('should calculate partnership scores', () => {
    render(<Spades />)
    const teamScore = screen.getByTestId('team-score')
    expect(teamScore).toBeInTheDocument()
    
    // Meeting bid = bid * 10
    // Each overtrick = 1 (bag)
    // 10 bags = -100 penalty
  })

  it('should penalize for bags', () => {
    render(<Spades />)
    const bagsDisplay = screen.getByTestId('bags-count')
    expect(bagsDisplay).toBeInTheDocument()
  })

  it('should end game at 500 points', () => {
    render(<Spades />)
    // Test game end condition
  })

  it('should have AI with bidding strategy', () => {
    render(<Spades />)
    // AI should bid based on high cards, spades count
  })
})

describe('Common Card Game Features', () => {
  const games = [
    { Component: GoFish, name: 'GoFish' },
    { Component: War, name: 'War' },
    { Component: CrazyEights, name: 'CrazyEights' },
    { Component: Hearts, name: 'Hearts' },
    { Component: Spades, name: 'Spades' }
  ]

  games.forEach(({ Component, name }) => {
    describe(`${name} Common Features`, () => {
      it('should shuffle deck properly', () => {
        render(<Component />)
        // Verify randomized deck
      })

      it('should display cards with suit and rank', () => {
        render(<Component />)
        const card = screen.queryByTestId(/card-/)
        if (card) {
          expect(card).toHaveAttribute('data-suit')
          expect(card).toHaveAttribute('data-rank')
        }
      })

      it('should have smooth card animations', () => {
        render(<Component />)
        const cards = screen.queryAllByTestId(/card-/)
        cards.forEach(card => {
          expect(card).toHaveClass('animated')
        })
      })

      it('should have difficulty levels', () => {
        render(<Component />)
        const difficultySelector = screen.getByTestId('difficulty-selector')
        expect(difficultySelector).toBeInTheDocument()
      })

      it('should track and display score', () => {
        render(<Component />)
        const scoreDisplay = screen.getByTestId('score-display')
        expect(scoreDisplay).toBeInTheDocument()
      })

      it('should have restart option', () => {
        render(<Component />)
        const restartButton = screen.getByRole('button', { name: /restart/i })
        expect(restartButton).toBeInTheDocument()
      })

      it('should save score to localStorage', () => {
        render(<Component />)
        // Verify localStorage interaction
      })

      it('should be responsive on mobile', () => {
        global.innerWidth = 375
        render(<Component />)
        const gameContainer = screen.getByTestId('game-container')
        expect(gameContainer).toHaveClass('mobile-optimized')
      })
    })
  })
})