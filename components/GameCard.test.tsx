import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GameCard } from './GameCard'
import type { GameMetadata } from '../lib/types/categories'

const mockGame: GameMetadata = {
  id: '2048',
  name: '2048',
  slug: '2048',
  description: 'Slide tiles to reach 2048',
  category: 'puzzle',
  tags: ['logic', 'numbers', 'sliding'],
  difficulty: 'medium',
  avgPlayTime: 10,
  playerCount: '1',
  thumbnail: '/thumbnails/2048.png',
  path: '/games/2048'
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('GameCard Component', () => {
  describe('Rendering', () => {
    it('should display game name and description', () => {
      render(<GameCard game={mockGame} />)
      
      expect(screen.getByText('2048')).toBeInTheDocument()
      expect(screen.getByText('Slide tiles to reach 2048')).toBeInTheDocument()
    })

    it('should show difficulty badge', () => {
      render(<GameCard game={mockGame} />)
      
      const difficultyBadge = screen.getByText('Medium')
      expect(difficultyBadge).toBeInTheDocument()
      expect(difficultyBadge).toHaveClass('bg-yellow-500')
    })

    it('should display play time', () => {
      render(<GameCard game={mockGame} />)
      
      expect(screen.getByText('10 min')).toBeInTheDocument()
    })

    it('should show player count', () => {
      render(<GameCard game={mockGame} />)
      
      expect(screen.getByText('1 Player')).toBeInTheDocument()
    })

    it('should display tags', () => {
      render(<GameCard game={mockGame} />)
      
      mockGame.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument()
      })
    })

    it('should render thumbnail image', () => {
      render(<GameCard game={mockGame} />)
      
      const thumbnail = screen.getByAltText('2048')
      expect(thumbnail).toBeInTheDocument()
      expect(thumbnail).toHaveAttribute('src', '/thumbnails/2048.png')
    })
  })

  describe('Difficulty Variants', () => {
    it('should show green badge for easy difficulty', () => {
      const easyGame = { ...mockGame, difficulty: 'easy' as const }
      render(<GameCard game={easyGame} />)
      
      const badge = screen.getByText('Easy')
      expect(badge).toHaveClass('bg-green-500')
    })

    it('should show yellow badge for medium difficulty', () => {
      render(<GameCard game={mockGame} />)
      
      const badge = screen.getByText('Medium')
      expect(badge).toHaveClass('bg-yellow-500')
    })

    it('should show red badge for hard difficulty', () => {
      const hardGame = { ...mockGame, difficulty: 'hard' as const }
      render(<GameCard game={hardGame} />)
      
      const badge = screen.getByText('Hard')
      expect(badge).toHaveClass('bg-red-500')
    })
  })

  describe('Player Count Display', () => {
    it('should display "1 Player" for single player games', () => {
      render(<GameCard game={mockGame} />)
      expect(screen.getByText('1 Player')).toBeInTheDocument()
    })

    it('should display "2 Players" for two player games', () => {
      const twoPlayerGame = { ...mockGame, playerCount: '2' as const }
      render(<GameCard game={twoPlayerGame} />)
      expect(screen.getByText('2 Players')).toBeInTheDocument()
    })

    it('should display "2+ Players" for multiplayer games', () => {
      const multiplayerGame = { ...mockGame, playerCount: '2+' as const }
      render(<GameCard game={multiplayerGame} />)
      expect(screen.getByText('2+ Players')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should navigate to game page on click', () => {
      render(<GameCard game={mockGame} />)
      
      const card = screen.getByRole('link')
      expect(card).toHaveAttribute('href', '/games/2048')
    })

    it('should have hover effect', () => {
      const { container } = render(<GameCard game={mockGame} />)
      
      const card = container.querySelector('.game-card')
      expect(card).toHaveClass('hover:scale-105')
      expect(card).toHaveClass('transition-transform')
    })

    it('should show play button on hover', () => {
      render(<GameCard game={mockGame} />)
      
      const playButton = screen.getByText('Play Now')
      expect(playButton).toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<GameCard game={mockGame} compact />)
      
      expect(screen.getByText('2048')).toBeInTheDocument()
      expect(screen.queryByText('Slide tiles to reach 2048')).not.toBeInTheDocument()
      expect(screen.getByText('10m')).toBeInTheDocument() // Shortened time format
    })
  })

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(<GameCard game={mockGame} isLoading />)
      
      expect(screen.getByTestId('game-card-skeleton')).toBeInTheDocument()
    })
  })

  describe('Featured Games', () => {
    it('should highlight featured games', () => {
      const { container } = render(<GameCard game={mockGame} featured />)
      
      const card = container.querySelector('.game-card')
      expect(card).toHaveClass('ring-2')
      expect(card).toHaveClass('ring-primary')
    })

    it('should show featured badge', () => {
      render(<GameCard game={mockGame} featured />)
      
      expect(screen.getByText('Featured')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<GameCard game={mockGame} />)
      
      const img = screen.getByAltText('2048')
      expect(img).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(<GameCard game={mockGame} />)
      
      const link = screen.getByRole('link')
      expect(link.tabIndex).toBeGreaterThanOrEqual(-1)
    })

    it('should have aria-label for play button', () => {
      render(<GameCard game={mockGame} />)
      
      const playButton = screen.getByText('Play Now')
      expect(playButton.closest('button')).toHaveAttribute('aria-label', 'Play 2048')
    })
  })

  describe('Rating Display', () => {
    it('should show rating if available', () => {
      const gameWithRating = { ...mockGame, rating: 4.5 }
      render(<GameCard game={gameWithRating} />)
      
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('★')).toBeInTheDocument()
    })

    it('should not show rating if unavailable', () => {
      render(<GameCard game={mockGame} />)
      
      expect(screen.queryByText('★')).not.toBeInTheDocument()
    })
  })
})