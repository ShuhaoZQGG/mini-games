import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Reversi from '@/components/games/strategic/Reversi'

describe('Reversi/Othello Game', () => {
  describe('Board Setup', () => {
    it('should render an 8x8 game board', () => {
      render(<Reversi />)
      const board = screen.getByTestId('reversi-board')
      expect(board).toBeInTheDocument()
      const squares = screen.getAllByTestId(/square-/)
      expect(squares).toHaveLength(64)
    })

    it('should initialize with 4 discs in center', () => {
      render(<Reversi />)
      // Center positions: d4, e4, d5, e5
      expect(screen.getByTestId('disc-3-3')).toHaveClass('white')
      expect(screen.getByTestId('disc-4-4')).toHaveClass('white')
      expect(screen.getByTestId('disc-3-4')).toHaveClass('black')
      expect(screen.getByTestId('disc-4-3')).toHaveClass('black')
    })

    it('should start with black player turn', () => {
      render(<Reversi />)
      const turnIndicator = screen.getByTestId('turn-indicator')
      expect(turnIndicator).toHaveTextContent('Black')
    })
  })

  describe('Move Validation', () => {
    it('should only allow moves that flip opponent discs', () => {
      render(<Reversi />)
      const validSquare = screen.getByTestId('square-2-3')
      const invalidSquare = screen.getByTestId('square-0-0')
      
      fireEvent.click(validSquare)
      expect(screen.getByTestId('disc-2-3')).toHaveClass('black')
      
      fireEvent.click(invalidSquare)
      expect(screen.queryByTestId('disc-0-0')).toBeNull()
    })

    it('should highlight valid moves', () => {
      render(<Reversi />)
      const validMoves = screen.getAllByTestId(/valid-move-/)
      expect(validMoves.length).toBe(4) // Initial valid moves for black
    })

    it('should not allow moves on occupied squares', () => {
      render(<Reversi />)
      const occupiedSquare = screen.getByTestId('square-3-3')
      const initialClass = screen.getByTestId('disc-3-3').className
      
      fireEvent.click(occupiedSquare)
      expect(screen.getByTestId('disc-3-3').className).toBe(initialClass)
    })
  })

  describe('Disc Flipping', () => {
    it('should flip discs in straight lines', () => {
      render(<Reversi />)
      const square = screen.getByTestId('square-2-3')
      
      fireEvent.click(square)
      expect(screen.getByTestId('disc-3-3')).toHaveClass('black')
    })

    it('should flip discs in multiple directions simultaneously', () => {
      render(<Reversi />)
      // Setup scenario where move flips in multiple directions
      // This requires specific move sequence
    })

    it('should animate disc flipping', () => {
      render(<Reversi />)
      const square = screen.getByTestId('square-2-3')
      
      fireEvent.click(square)
      const flippedDisc = screen.getByTestId('disc-3-3')
      expect(flippedDisc).toHaveClass('flipping')
    })
  })

  describe('Game Rules', () => {
    it('should alternate turns between players', () => {
      render(<Reversi />)
      const turnIndicator = screen.getByTestId('turn-indicator')
      expect(turnIndicator).toHaveTextContent('Black')
      
      const square = screen.getByTestId('square-2-3')
      fireEvent.click(square)
      
      expect(turnIndicator).toHaveTextContent('White')
    })

    it('should skip turn if player has no valid moves', () => {
      render(<Reversi />)
      // Setup scenario where one player has no moves
      // Verify turn skips to other player
    })

    it('should end game when board is full', () => {
      render(<Reversi />)
      // Fill board and verify game ends
    })

    it('should end game when neither player can move', () => {
      render(<Reversi />)
      // Setup scenario where neither player can move
    })

    it('should correctly count and display scores', () => {
      render(<Reversi />)
      const blackScore = screen.getByTestId('black-score')
      const whiteScore = screen.getByTestId('white-score')
      
      expect(blackScore).toHaveTextContent('2')
      expect(whiteScore).toHaveTextContent('2')
      
      // Make a move and verify score updates
      const square = screen.getByTestId('square-2-3')
      fireEvent.click(square)
      
      expect(blackScore).toHaveTextContent('4')
      expect(whiteScore).toHaveTextContent('1')
    })
  })

  describe('AI Strategy', () => {
    it('should make AI move after player move', async () => {
      render(<Reversi />)
      const square = screen.getByTestId('square-2-3')
      fireEvent.click(square)
      
      await waitFor(() => {
        const whiteDiscs = screen.getAllByTestId(/disc-/).filter(disc => 
          disc.classList.contains('white')
        )
        expect(whiteDiscs.length).toBeGreaterThan(1)
      }, { timeout: 2000 })
    })

    it('should prioritize corner positions in AI strategy', () => {
      render(<Reversi />)
      // Setup scenario where corner is available
      // Verify AI chooses corner
    })

    it('should avoid edge positions early in game', () => {
      render(<Reversi />)
      // Verify AI strategy avoids edges initially
    })

    it('should have different difficulty levels', () => {
      render(<Reversi />)
      const difficultySelector = screen.getByTestId('difficulty-selector')
      expect(difficultySelector).toBeInTheDocument()
      
      expect(screen.getByText('Easy')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })
  })

  describe('UI Features', () => {
    it('should show disc count for each player', () => {
      render(<Reversi />)
      expect(screen.getByTestId('black-count')).toBeInTheDocument()
      expect(screen.getByTestId('white-count')).toBeInTheDocument()
    })

    it('should highlight last move', () => {
      render(<Reversi />)
      const square = screen.getByTestId('square-2-3')
      fireEvent.click(square)
      
      expect(square).toHaveClass('last-move')
    })

    it('should have undo move option', () => {
      render(<Reversi />)
      const undoButton = screen.getByRole('button', { name: /undo/i })
      expect(undoButton).toBeInTheDocument()
      
      // Make a move
      const square = screen.getByTestId('square-2-3')
      fireEvent.click(square)
      
      // Undo
      fireEvent.click(undoButton)
      expect(screen.queryByTestId('disc-2-3')).toBeNull()
    })

    it('should have restart game option', () => {
      render(<Reversi />)
      const restartButton = screen.getByRole('button', { name: /restart/i })
      expect(restartButton).toBeInTheDocument()
      
      fireEvent.click(restartButton)
      // Verify board is reset to initial state
    })

    it('should display move preview on hover', () => {
      render(<Reversi />)
      const square = screen.getByTestId('square-2-3')
      
      fireEvent.mouseEnter(square)
      expect(square).toHaveClass('preview')
      
      // Should show which discs would be flipped
      const previewDiscs = screen.getAllByTestId(/preview-flip-/)
      expect(previewDiscs.length).toBeGreaterThan(0)
    })
  })

  describe('Level System', () => {
    it('should display current level', () => {
      render(<Reversi />)
      const levelDisplay = screen.getByTestId('level-display')
      expect(levelDisplay).toBeInTheDocument()
    })

    it('should track game score', () => {
      render(<Reversi />)
      const scoreDisplay = screen.getByTestId('score-display')
      expect(scoreDisplay).toBeInTheDocument()
    })

    it('should award points based on disc difference', () => {
      render(<Reversi />)
      // Complete a game and verify score calculation
    })

    it('should give bonus for corner captures', () => {
      render(<Reversi />)
      // Capture corner and verify bonus points
    })
  })

  describe('Statistics', () => {
    it('should track mobility (available moves)', () => {
      render(<Reversi />)
      const mobilityDisplay = screen.getByTestId('mobility-display')
      expect(mobilityDisplay).toBeInTheDocument()
    })

    it('should show territory control', () => {
      render(<Reversi />)
      const territoryDisplay = screen.getByTestId('territory-display')
      expect(territoryDisplay).toBeInTheDocument()
    })

    it('should display game phase indicator', () => {
      render(<Reversi />)
      const phaseIndicator = screen.getByTestId('game-phase')
      expect(phaseIndicator).toHaveTextContent('Opening')
    })
  })
})