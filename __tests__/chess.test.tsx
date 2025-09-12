import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Chess from '@/components/games/strategic/Chess'

describe('Chess Game', () => {
  describe('Board Setup', () => {
    it('should render an 8x8 chess board', () => {
      render(<Chess />)
      const board = screen.getByTestId('chess-board')
      expect(board).toBeInTheDocument()
      const squares = screen.getAllByTestId(/square-/)
      expect(squares).toHaveLength(64)
    })

    it('should initialize pieces in correct starting positions', () => {
      render(<Chess />)
      // White pieces
      expect(screen.getByTestId('piece-a1')).toHaveTextContent('♜')
      expect(screen.getByTestId('piece-b1')).toHaveTextContent('♞')
      expect(screen.getByTestId('piece-c1')).toHaveTextContent('♝')
      expect(screen.getByTestId('piece-d1')).toHaveTextContent('♛')
      expect(screen.getByTestId('piece-e1')).toHaveTextContent('♚')
      expect(screen.getByTestId('piece-h1')).toHaveTextContent('♜')
      
      // Black pieces
      expect(screen.getByTestId('piece-a8')).toHaveTextContent('♖')
      expect(screen.getByTestId('piece-e8')).toHaveTextContent('♔')
      
      // Pawns
      for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        expect(screen.getByTestId(`piece-${file}2`)).toHaveTextContent('♟')
        expect(screen.getByTestId(`piece-${file}7`)).toHaveTextContent('♙')
      }
    })
  })

  describe('Move Validation', () => {
    it('should allow valid pawn moves', () => {
      render(<Chess />)
      const pawn = screen.getByTestId('piece-e2')
      const targetSquare = screen.getByTestId('square-e4')
      
      fireEvent.click(pawn)
      fireEvent.click(targetSquare)
      
      expect(screen.getByTestId('piece-e4')).toHaveTextContent('♟')
      expect(screen.queryByTestId('piece-e2')).not.toHaveTextContent('♟')
    })

    it('should not allow invalid pawn moves', () => {
      render(<Chess />)
      const pawn = screen.getByTestId('piece-e2')
      const invalidSquare = screen.getByTestId('square-e5')
      
      fireEvent.click(pawn)
      fireEvent.click(invalidSquare)
      
      expect(screen.getByTestId('piece-e2')).toHaveTextContent('♟')
      expect(screen.queryByTestId('piece-e5')).not.toHaveTextContent('♟')
    })

    it('should allow knight L-shaped moves', () => {
      render(<Chess />)
      const knight = screen.getByTestId('piece-b1')
      const targetSquare = screen.getByTestId('square-c3')
      
      fireEvent.click(knight)
      fireEvent.click(targetSquare)
      
      expect(screen.getByTestId('piece-c3')).toHaveTextContent('♞')
    })

    it('should allow bishop diagonal moves', () => {
      render(<Chess />)
      // First move pawn to open diagonal
      fireEvent.click(screen.getByTestId('piece-e2'))
      fireEvent.click(screen.getByTestId('square-e4'))
      
      // Wait for AI move
      waitFor(() => {
        // Move bishop
        fireEvent.click(screen.getByTestId('piece-f1'))
        fireEvent.click(screen.getByTestId('square-c4'))
        expect(screen.getByTestId('piece-c4')).toHaveTextContent('♝')
      })
    })

    it('should allow rook straight line moves', () => {
      render(<Chess />)
      // Clear path for rook
      fireEvent.click(screen.getByTestId('piece-a2'))
      fireEvent.click(screen.getByTestId('square-a4'))
      
      waitFor(() => {
        fireEvent.click(screen.getByTestId('piece-a1'))
        fireEvent.click(screen.getByTestId('square-a3'))
        expect(screen.getByTestId('piece-a3')).toHaveTextContent('♜')
      })
    })

    it('should allow queen to move in any direction', () => {
      render(<Chess />)
      // Clear path for queen
      fireEvent.click(screen.getByTestId('piece-d2'))
      fireEvent.click(screen.getByTestId('square-d4'))
      
      waitFor(() => {
        fireEvent.click(screen.getByTestId('piece-d1'))
        fireEvent.click(screen.getByTestId('square-d3'))
        expect(screen.getByTestId('piece-d3')).toHaveTextContent('♛')
      })
    })

    it('should allow king to move one square in any direction', () => {
      render(<Chess />)
      // Clear path for king
      fireEvent.click(screen.getByTestId('piece-e2'))
      fireEvent.click(screen.getByTestId('square-e4'))
      
      waitFor(() => {
        fireEvent.click(screen.getByTestId('piece-e1'))
        fireEvent.click(screen.getByTestId('square-e2'))
        expect(screen.getByTestId('piece-e2')).toHaveTextContent('♚')
      })
    })
  })

  describe('Special Moves', () => {
    it('should allow castling when conditions are met', () => {
      render(<Chess />)
      // Clear path for castling
      fireEvent.click(screen.getByTestId('piece-g1'))
      fireEvent.click(screen.getByTestId('square-f3'))
      
      waitFor(() => {
        fireEvent.click(screen.getByTestId('piece-f1'))
        fireEvent.click(screen.getByTestId('square-e2'))
        
        // Castle kingside
        fireEvent.click(screen.getByTestId('piece-e1'))
        fireEvent.click(screen.getByTestId('square-g1'))
        
        expect(screen.getByTestId('piece-g1')).toHaveTextContent('♚')
        expect(screen.getByTestId('piece-f1')).toHaveTextContent('♜')
      })
    })

    it('should allow en passant capture', () => {
      render(<Chess />)
      // Setup en passant scenario
      // This would require specific move sequence
      // Implementation depends on game logic
    })

    it('should promote pawn when reaching opposite end', () => {
      render(<Chess />)
      // This would require a specific move sequence to get pawn to 8th rank
      // Implementation depends on game logic and promotion UI
    })
  })

  describe('Check and Checkmate', () => {
    it('should detect check', () => {
      render(<Chess />)
      // Setup a check scenario
      // This would require specific moves
    })

    it('should detect checkmate', () => {
      render(<Chess />)
      // Setup a checkmate scenario
      // This would require specific moves
    })

    it('should not allow moves that leave king in check', () => {
      render(<Chess />)
      // Setup scenario where moving a piece would expose king
    })
  })

  describe('Game Flow', () => {
    it('should alternate turns between white and black', () => {
      render(<Chess />)
      const currentPlayer = screen.getByTestId('current-player')
      expect(currentPlayer).toHaveTextContent('White')
      
      // Make a move
      fireEvent.click(screen.getByTestId('piece-e2'))
      fireEvent.click(screen.getByTestId('square-e4'))
      
      waitFor(() => {
        expect(currentPlayer).toHaveTextContent('Black')
      })
    })

    it('should display captured pieces', () => {
      render(<Chess />)
      const capturedPieces = screen.getByTestId('captured-pieces')
      expect(capturedPieces).toBeInTheDocument()
    })

    it('should show move history in algebraic notation', () => {
      render(<Chess />)
      const moveHistory = screen.getByTestId('move-history')
      expect(moveHistory).toBeInTheDocument()
      
      // Make a move
      fireEvent.click(screen.getByTestId('piece-e2'))
      fireEvent.click(screen.getByTestId('square-e4'))
      
      expect(moveHistory).toHaveTextContent('e4')
    })

    it('should offer resign option', () => {
      render(<Chess />)
      const resignButton = screen.getByRole('button', { name: /resign/i })
      expect(resignButton).toBeInTheDocument()
      
      fireEvent.click(resignButton)
      expect(screen.getByText(/game over/i)).toBeInTheDocument()
    })

    it('should offer draw option', () => {
      render(<Chess />)
      const drawButton = screen.getByRole('button', { name: /offer draw/i })
      expect(drawButton).toBeInTheDocument()
    })
  })

  describe('AI Opponent', () => {
    it('should make AI move after player move', async () => {
      render(<Chess />)
      const initialPieces = screen.getAllByTestId(/piece-/).length
      
      // Player move
      fireEvent.click(screen.getByTestId('piece-e2'))
      fireEvent.click(screen.getByTestId('square-e4'))
      
      // Wait for AI move
      await waitFor(() => {
        const currentPieces = screen.getAllByTestId(/piece-/)
        expect(currentPieces.length).toBe(initialPieces)
      }, { timeout: 3000 })
    })

    it('should have different difficulty levels', () => {
      render(<Chess />)
      const difficultySelector = screen.getByTestId('difficulty-selector')
      expect(difficultySelector).toBeInTheDocument()
      
      const options = ['Easy', 'Medium', 'Hard']
      options.forEach(level => {
        expect(screen.getByText(level)).toBeInTheDocument()
      })
    })
  })

  describe('Level Progression', () => {
    it('should display current level', () => {
      render(<Chess />)
      expect(screen.getByTestId('current-level')).toBeInTheDocument()
    })

    it('should track score', () => {
      render(<Chess />)
      const scoreDisplay = screen.getByTestId('score-display')
      expect(scoreDisplay).toBeInTheDocument()
      expect(scoreDisplay).toHaveTextContent('0')
    })

    it('should increase score on win', async () => {
      render(<Chess />)
      // This would require playing through to a win
      // Implementation depends on game logic
    })
  })

  describe('Responsiveness', () => {
    it('should be playable on mobile devices', () => {
      // Set mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
      
      render(<Chess />)
      const board = screen.getByTestId('chess-board')
      expect(board).toHaveClass('touch-enabled')
    })

    it('should support touch interactions', () => {
      render(<Chess />)
      const piece = screen.getByTestId('piece-e2')
      const targetSquare = screen.getByTestId('square-e4')
      
      // Simulate touch events
      fireEvent.touchStart(piece)
      fireEvent.touchEnd(targetSquare)
      
      expect(screen.getByTestId('piece-e4')).toHaveTextContent('♟')
    })
  })
})