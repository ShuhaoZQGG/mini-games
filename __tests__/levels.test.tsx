import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameWithLevels from '@/components/ui/game-with-levels'
import SnakeWithLevels from '@/components/games/snake-with-levels'
import { useGameLevels } from '@/hooks/useGameLevels'
import { renderHook, act } from '@testing-library/react'

describe('Level System Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('GameWithLevels Component', () => {
    const mockLevels = [
      { id: 1, name: 'Easy', difficulty: 'easy' as const, config: { speed: 100 }, requiredStars: 0 },
      { id: 2, name: 'Medium', difficulty: 'medium' as const, config: { speed: 50 }, requiredStars: 3 }
    ]

    const mockRenderGame = jest.fn((config, onScore) => <div>Game Content</div>)
    const mockGetStars = jest.fn((score, config) => (score > 50 ? 3 : score > 25 ? 2 : 1) as 1 | 2 | 3)

    it('renders level selector initially', () => {
      render(
        <GameWithLevels
          gameId="test"
          gameName="Test Game"
          levels={mockLevels}
          renderGame={mockRenderGame}
          getStars={mockGetStars}
        />
      )
      
      expect(screen.getByText('Test Game')).toBeInTheDocument()
      expect(screen.getByText('Choose a difficulty level to play')).toBeInTheDocument()
      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Easy')).toBeInTheDocument()
    })

    it('shows locked levels with required stars', () => {
      render(
        <GameWithLevels
          gameId="test"
          gameName="Test Game"
          levels={mockLevels}
          renderGame={mockRenderGame}
          getStars={mockGetStars}
        />
      )
      
      expect(screen.getByText('Need 3 stars')).toBeInTheDocument()
    })

    it('shows total stars counter', () => {
      render(
        <GameWithLevels
          gameId="test"
          gameName="Test Game"
          levels={mockLevels}
          renderGame={mockRenderGame}
          getStars={mockGetStars}
        />
      )
      
      expect(screen.getByText(/Total Stars:/)).toBeInTheDocument()
    })
  })

  describe('SnakeWithLevels', () => {
    it('renders snake game with levels', () => {
      render(<SnakeWithLevels />)
      expect(screen.getByText('Snake Game')).toBeInTheDocument()
      expect(screen.getByText('Beginner Snake')).toBeInTheDocument()
    })

    it('shows 5 difficulty levels', () => {
      render(<SnakeWithLevels />)
      expect(screen.getByText('Beginner Snake')).toBeInTheDocument()
      expect(screen.getByText('Normal Speed')).toBeInTheDocument()
      expect(screen.getByText('Fast Snake')).toBeInTheDocument()
      expect(screen.getByText('Expert Speed')).toBeInTheDocument()
      expect(screen.getByText('Master Challenge')).toBeInTheDocument()
    })
  })

  describe('useGameLevels Hook', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useGameLevels('test'))
      
      expect(result.current.selectedLevel).toBe(0)
      expect(result.current.totalStars).toBe(0)
      expect(result.current.progress).toEqual({})
    })

    it('loads saved progress from localStorage', () => {
      localStorage.setItem('test_levels', JSON.stringify({
        progress: { 0: { level: 0, score: 100, stars: 3 } },
        totalStars: 3
      }))
      
      const { result } = renderHook(() => useGameLevels('test'))
      
      expect(result.current.totalStars).toBe(3)
      expect(result.current.progress[0]).toEqual({ level: 0, score: 100, stars: 3 })
    })

    it('updates progress correctly', () => {
      const { result } = renderHook(() => useGameLevels('test'))
      
      act(() => {
        result.current.updateProgress(0, 150, 3)
      })
      
      expect(result.current.progress[0]).toEqual({ level: 0, score: 150, stars: 3 })
      expect(result.current.totalStars).toBe(3)
    })

    it('saves progress to localStorage', () => {
      const { result } = renderHook(() => useGameLevels('test'))
      
      act(() => {
        result.current.updateProgress(0, 200, 2)
      })
      
      const saved = JSON.parse(localStorage.getItem('test_levels') || '{}')
      expect(saved.totalStars).toBe(2)
      expect(saved.progress[0]).toEqual({ level: 0, score: 200, stars: 2 })
    })

    it('checks level unlock status correctly', () => {
      localStorage.setItem('2048_levels', JSON.stringify({
        progress: { 0: { level: 0, score: 100, stars: 3 } },
        totalStars: 3
      }))
      
      const { result } = renderHook(() => useGameLevels('2048'))
      
      expect(result.current.isUnlocked(0)).toBe(true) // First level always unlocked
      expect(result.current.isUnlocked(1)).toBe(true) // Has 3 stars, needs 2
      expect(result.current.isUnlocked(2)).toBe(false) // Has 3 stars, needs 5
    })
  })
})