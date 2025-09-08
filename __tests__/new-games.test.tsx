import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideoPoker from '@/components/games/video-poker'
import FlappyBird from '@/components/games/flappy-bird'
import StackTower from '@/components/games/stack-tower'
import DoodleJump from '@/components/games/doodle-jump'
import JigsawPuzzle from '@/components/games/jigsaw-puzzle'

describe('New Games Tests', () => {
  describe('VideoPoker', () => {
    it('renders video poker game', () => {
      render(<VideoPoker />)
      expect(screen.getByText(/Video Poker/i)).toBeInTheDocument()
      expect(screen.getByText(/Jacks or Better/i)).toBeInTheDocument()
    })

    it('has deal cards button', () => {
      render(<VideoPoker />)
      const dealButton = screen.getByRole('button', { name: /Deal Cards/i })
      expect(dealButton).toBeInTheDocument()
    })

    it('shows credits', () => {
      render(<VideoPoker />)
      expect(screen.getByText(/Credits:/i)).toBeInTheDocument()
    })
  })

  describe('FlappyBird', () => {
    it('renders flappy bird game', () => {
      render(<FlappyBird />)
      expect(screen.getByText(/Flappy Bird/i)).toBeInTheDocument()
    })

    it('has start game button', () => {
      render(<FlappyBird />)
      const startButton = screen.getByRole('button', { name: /Start Game/i })
      expect(startButton).toBeInTheDocument()
    })

    it('shows score and high score', () => {
      render(<FlappyBird />)
      expect(screen.getByText(/Score:/i)).toBeInTheDocument()
      expect(screen.getByText(/High Score:/i)).toBeInTheDocument()
    })
  })

  describe('StackTower', () => {
    it('renders stack tower game', () => {
      render(<StackTower />)
      expect(screen.getByText(/Stack Tower/i)).toBeInTheDocument()
    })

    it('has start building button', () => {
      render(<StackTower />)
      const startButton = screen.getByRole('button', { name: /Start Building/i })
      expect(startButton).toBeInTheDocument()
    })

    it('shows game info', () => {
      render(<StackTower />)
      expect(screen.getByText(/Perfect placement = 50 points!/i)).toBeInTheDocument()
    })
  })

  describe('DoodleJump', () => {
    it('renders doodle jump game', () => {
      render(<DoodleJump />)
      expect(screen.getByText(/Doodle Jump/i)).toBeInTheDocument()
    })

    it('has start jumping button', () => {
      render(<DoodleJump />)
      const startButton = screen.getByRole('button', { name: /Start Jumping/i })
      expect(startButton).toBeInTheDocument()
    })

    it('shows controls info', () => {
      render(<DoodleJump />)
      expect(screen.getByText(/arrow keys/i)).toBeInTheDocument()
    })
  })

  describe('JigsawPuzzle', () => {
    it('renders jigsaw puzzle game', () => {
      render(<JigsawPuzzle />)
      expect(screen.getByText(/Jigsaw Puzzle/i)).toBeInTheDocument()
    })

    it('has difficulty buttons', () => {
      render(<JigsawPuzzle />)
      expect(screen.getByRole('button', { name: /Easy/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Medium/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Hard/i })).toBeInTheDocument()
    })

    it('has start puzzle button', () => {
      render(<JigsawPuzzle />)
      const startButton = screen.getByRole('button', { name: /Start Puzzle/i })
      expect(startButton).toBeInTheDocument()
    })

    it('can change difficulty', () => {
      render(<JigsawPuzzle />)
      const mediumButton = screen.getByRole('button', { name: /Medium/i })
      fireEvent.click(mediumButton)
      expect(screen.getByText(/4x4/i)).toBeInTheDocument()
    })
  })
})