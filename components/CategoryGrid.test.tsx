import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CategoryGrid } from './CategoryGrid'
import { GAME_CATEGORIES } from '../lib/data/gameMetadata'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

describe('CategoryGrid Component', () => {
  describe('Rendering', () => {
    it('should render all game categories', () => {
      render(<CategoryGrid />)
      
      GAME_CATEGORIES.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument()
        expect(screen.getByText(category.description)).toBeInTheDocument()
      })
    })

    it('should display category icons', () => {
      render(<CategoryGrid />)
      
      GAME_CATEGORIES.forEach(category => {
        const iconElement = screen.getByText(category.icon)
        expect(iconElement).toBeInTheDocument()
      })
    })

    it('should show game count for each category', () => {
      render(<CategoryGrid />)
      
      GAME_CATEGORIES.forEach(category => {
        const gameCountText = `${category.games.length} games`
        expect(screen.getByText(gameCountText)).toBeInTheDocument()
      })
    })

    it('should apply correct color classes', () => {
      const { container } = render(<CategoryGrid />)
      
      GAME_CATEGORIES.forEach(category => {
        const categoryCard = container.querySelector(`[data-category="${category.id}"]`)
        expect(categoryCard).toHaveClass(`border-${category.color}-500`)
      })
    })
  })

  describe('Interactions', () => {
    it('should navigate to category page on click', () => {
      const { container } = render(<CategoryGrid />)
      
      const puzzleCategory = container.querySelector('[data-category="puzzle"]')
      expect(puzzleCategory).toBeDefined()
      
      if (puzzleCategory) {
        fireEvent.click(puzzleCategory)
        // Navigation should be handled by Link component
        expect(puzzleCategory.closest('a')).toHaveAttribute('href', '/categories/puzzle')
      }
    })

    it('should have hover effects', () => {
      const { container } = render(<CategoryGrid />)
      
      const categoryCard = container.querySelector('[data-category="arcade"]')
      expect(categoryCard).toHaveClass('hover:scale-105')
      expect(categoryCard).toHaveClass('transition-transform')
    })
  })

  describe('Responsive Layout', () => {
    it('should use responsive grid', () => {
      const { container } = render(<CategoryGrid />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })

    it('should have proper spacing', () => {
      const { container } = render(<CategoryGrid />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('gap-6')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(<CategoryGrid />)
      
      GAME_CATEGORIES.forEach(category => {
        const link = screen.getByRole('link', { name: new RegExp(category.name, 'i') })
        expect(link).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', () => {
      const { container } = render(<CategoryGrid />)
      
      const links = container.querySelectorAll('a')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link.tabIndex).toBeGreaterThanOrEqual(-1)
      })
    })
  })

  describe('Featured Categories', () => {
    it('should highlight popular categories', () => {
      render(<CategoryGrid featured={['arcade', 'puzzle']} />)
      
      const arcadeCard = screen.getByTestId('category-arcade')
      const puzzleCard = screen.getByTestId('category-puzzle')
      
      expect(arcadeCard).toHaveClass('ring-2')
      expect(puzzleCard).toHaveClass('ring-2')
    })
  })

  describe('Search Integration', () => {
    it('should filter categories based on search', () => {
      render(<CategoryGrid searchQuery="puzzle" />)
      
      expect(screen.getByText('Puzzle Games')).toBeInTheDocument()
      expect(screen.queryByText('Arcade Classics')).not.toBeInTheDocument()
    })

    it('should show empty state when no matches', () => {
      render(<CategoryGrid searchQuery="xyz123" />)
      
      expect(screen.getByText('No categories match your search')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show skeleton loaders when loading', () => {
      render(<CategoryGrid isLoading={true} />)
      
      const skeletons = screen.getAllByTestId('category-skeleton')
      expect(skeletons).toHaveLength(9) // Should show 9 skeleton cards
    })
  })
})