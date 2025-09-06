/**
 * Tournament Statistics Dashboard Component Tests
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TournamentStatisticsDashboard } from '@/components/tournaments/TournamentStatisticsDashboard'
import { tournamentHistoryService } from '@/lib/services/tournament-history'

// Mock the tournament history service
jest.mock('@/lib/services/tournament-history', () => ({
  tournamentHistoryService: {
    getUserStatistics: jest.fn(),
    getUserTournamentHistory: jest.fn(),
    searchTournamentHistory: jest.fn()
  }
}))

// Mock chart components
jest.mock('recharts', () => ({
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>
}))

describe('TournamentStatisticsDashboard', () => {
  const mockUserId = 'user_123'
  
  const mockStatistics = {
    totalTournaments: 24,
    tournamentsWon: 6,
    winRate: 25,
    averagePlacement: 3.5,
    bestPlacement: 1,
    totalPrizeWon: 450,
    totalMatchesPlayed: 120,
    totalMatchesWon: 78,
    matchWinRate: 65,
    favoriteGame: 'cps-test',
    gamesPlayed: {
      'cps-test': 10,
      'snake': 8,
      '2048': 6
    }
  }

  const mockHistory = [
    {
      id: 'history_1',
      tournamentId: 'tournament_1',
      userId: mockUserId,
      gameSlug: 'cps-test',
      placement: 1,
      matchesPlayed: 5,
      matchesWon: 5,
      totalScore: 3000,
      prizeWon: 100,
      completedAt: new Date('2025-01-01')
    },
    {
      id: 'history_2',
      tournamentId: 'tournament_2',
      userId: mockUserId,
      gameSlug: 'snake',
      placement: 3,
      matchesPlayed: 4,
      matchesWon: 2,
      totalScore: 1500,
      prizeWon: 25,
      completedAt: new Date('2025-01-05')
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(tournamentHistoryService.getUserStatistics as jest.Mock).mockResolvedValue(mockStatistics)
    ;(tournamentHistoryService.getUserTournamentHistory as jest.Mock).mockResolvedValue(mockHistory)
  })

  describe('Overview Section', () => {
    it('should display tournament statistics overview', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Tournament Statistics')).toBeInTheDocument()
      })

      expect(screen.getByText('24')).toBeInTheDocument()
      expect(screen.getByText('Total Tournaments')).toBeInTheDocument()
      
      expect(screen.getByText('25%')).toBeInTheDocument()
      expect(screen.getByText('Win Rate')).toBeInTheDocument()
      
      expect(screen.getByText('1st')).toBeInTheDocument()
      expect(screen.getByText('Best Placement')).toBeInTheDocument()
      
      expect(screen.getByText('$450')).toBeInTheDocument()
      expect(screen.getByText('Total Winnings')).toBeInTheDocument()
    })

    it('should display match statistics', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('120')).toBeInTheDocument()
        expect(screen.getByText('Matches Played')).toBeInTheDocument()
        
        expect(screen.getByText('65%')).toBeInTheDocument()
        expect(screen.getByText('Match Win Rate')).toBeInTheDocument()
      })
    })

    it('should display favorite game', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Favorite Game')).toBeInTheDocument()
        expect(screen.getByText('CPS Test')).toBeInTheDocument()
        expect(screen.getByText('10 tournaments')).toBeInTheDocument()
      })
    })

    it('should handle loading state', () => {
      ;(tournamentHistoryService.getUserStatistics as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Never resolves
      )
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      expect(screen.getByTestId('statistics-loading')).toBeInTheDocument()
    })

    it('should handle error state', async () => {
      ;(tournamentHistoryService.getUserStatistics as jest.Mock).mockRejectedValue(
        new Error('Failed to load statistics')
      )
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should handle empty statistics', async () => {
      ;(tournamentHistoryService.getUserStatistics as jest.Mock).mockResolvedValue({
        totalTournaments: 0,
        tournamentsWon: 0,
        winRate: 0,
        averagePlacement: 0,
        bestPlacement: 0,
        totalPrizeWon: 0,
        totalMatchesPlayed: 0,
        totalMatchesWon: 0,
        matchWinRate: 0,
        gamesPlayed: {}
      })
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('No tournament history yet')).toBeInTheDocument()
        expect(screen.getByText('Join your first tournament to see statistics')).toBeInTheDocument()
      })
    })
  })

  describe('Charts and Visualizations', () => {
    it('should render performance chart', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Performance Over Time')).toBeInTheDocument()
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })

    it('should render games distribution pie chart', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Games Distribution')).toBeInTheDocument()
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
      })
    })

    it('should render placement distribution bar chart', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Placement Distribution')).toBeInTheDocument()
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      })
    })

    it('should toggle between chart views', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Performance Over Time')).toBeInTheDocument()
      })

      // Switch to placement view
      fireEvent.click(screen.getByRole('tab', { name: 'Placements' }))
      expect(screen.getByText('Placement Distribution')).toBeInTheDocument()
      
      // Switch to games view
      fireEvent.click(screen.getByRole('tab', { name: 'Games' }))
      expect(screen.getByText('Games Distribution')).toBeInTheDocument()
    })
  })

  describe('Recent History', () => {
    it('should display recent tournament history', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Recent Tournaments')).toBeInTheDocument()
        expect(screen.getByText('CPS Test Championship')).toBeInTheDocument()
        expect(screen.getByText('1st place')).toBeInTheDocument()
        expect(screen.getByText('Prize: $100')).toBeInTheDocument()
      })
    })

    it('should format dates correctly', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument()
        expect(screen.getByText('Jan 5, 2025')).toBeInTheDocument()
      })
    })

    it('should show match statistics for each tournament', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Won 5/5 matches')).toBeInTheDocument()
        expect(screen.getByText('Won 2/4 matches')).toBeInTheDocument()
      })
    })

    it('should link to tournament details', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details')
        expect(viewDetailsButtons).toHaveLength(2)
        expect(viewDetailsButtons[0]).toHaveAttribute('href', '/tournaments/tournament_1')
      })
    })

    it('should paginate history', async () => {
      // Mock more history entries
      const manyHistoryEntries = Array.from({ length: 15 }, (_, i) => ({
        id: `history_${i}`,
        tournamentId: `tournament_${i}`,
        userId: mockUserId,
        gameSlug: 'cps-test',
        placement: (i % 4) + 1,
        matchesPlayed: 5,
        matchesWon: 3,
        totalScore: 2000,
        completedAt: new Date(`2025-01-${i + 1}`)
      }))
      
      ;(tournamentHistoryService.getUserTournamentHistory as jest.Mock).mockResolvedValue(manyHistoryEntries)
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Next'))
      
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
        expect(screen.getByText('Previous')).toBeInTheDocument()
      })
    })
  })

  describe('Filtering and Search', () => {
    it('should filter by game', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by game')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Filter by game'), {
        target: { value: 'cps-test' }
      })
      
      await waitFor(() => {
        expect(tournamentHistoryService.searchTournamentHistory).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({ gameSlug: 'cps-test' })
        )
      })
    })

    it('should filter by date range', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Start date')).toBeInTheDocument()
        expect(screen.getByLabelText('End date')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Start date'), {
        target: { value: '2025-01-01' }
      })
      
      fireEvent.change(screen.getByLabelText('End date'), {
        target: { value: '2025-01-31' }
      })
      
      fireEvent.click(screen.getByText('Apply Filters'))
      
      await waitFor(() => {
        expect(tournamentHistoryService.searchTournamentHistory).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date)
          })
        )
      })
    })

    it('should sort results', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Sort by')).toBeInTheDocument()
      })
      
      fireEvent.change(screen.getByLabelText('Sort by'), {
        target: { value: 'placement' }
      })
      
      await waitFor(() => {
        expect(tournamentHistoryService.searchTournamentHistory).toHaveBeenCalledWith(
          mockUserId,
          expect.objectContaining({ sortBy: 'placement' })
        )
      })
    })

    it('should reset filters', async () => {
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by game')).toBeInTheDocument()
      })
      
      // Apply some filters
      fireEvent.change(screen.getByLabelText('Filter by game'), {
        target: { value: 'cps-test' }
      })
      
      // Reset filters
      fireEvent.click(screen.getByText('Reset Filters'))
      
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by game')).toHaveValue('all')
        expect(tournamentHistoryService.getUserTournamentHistory).toHaveBeenCalledWith(mockUserId)
      })
    })
  })

  describe('Export and Sharing', () => {
    it('should export statistics as CSV', async () => {
      const mockCreateObjectURL = jest.fn()
      const mockRevokeObjectURL = jest.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Export CSV'))
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })

    it('should share statistics', async () => {
      const mockShare = jest.fn()
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true
      })
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Share Statistics')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Share Statistics'))
      
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Tournament Statistics'),
          text: expect.stringContaining('24 tournaments')
        })
      )
    })

    it('should copy statistics link', async () => {
      const mockWriteText = jest.fn()
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: mockWriteText,
        writable: true
      })
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Copy Link'))
      
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/users/user_123/tournament-stats')
      )
      
      await waitFor(() => {
        expect(screen.getByText('Link copied!')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      expect(screen.getByTestId('mobile-stats-view')).toBeInTheDocument()
    })

    it('should show swipeable cards on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<TournamentStatisticsDashboard userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('swipeable-stats-cards')).toBeInTheDocument()
      })
    })
  })
})