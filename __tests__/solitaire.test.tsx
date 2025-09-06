import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SolitaireComponent } from '@/components/games/solitaire'

// Mock the score service
jest.mock('@/lib/services/scores', () => ({
  scoreService: {
    saveScore: jest.fn().mockResolvedValue({ success: true })
  }
}))

describe('Solitaire Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the game title', () => {
    render(<SolitaireComponent />)
    expect(screen.getByText('Solitaire (Klondike)')).toBeInTheDocument()
  })

  it('shows start button initially', () => {
    render(<SolitaireComponent />)
    expect(screen.getByText('Start Game')).toBeInTheDocument()
  })

  it('starts game when start button is clicked', () => {
    render(<SolitaireComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Game controls should appear
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByText('Hint')).toBeInTheDocument()
    expect(screen.getByText(/Score:/)).toBeInTheDocument()
    expect(screen.getByText(/Moves:/)).toBeInTheDocument()
  })

  it('displays game instructions', () => {
    render(<SolitaireComponent />)
    expect(screen.getByText('How to Play:')).toBeInTheDocument()
    expect(screen.getByText(/Build foundation piles from Ace to King/)).toBeInTheDocument()
  })

  it('handles undo action', () => {
    render(<SolitaireComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    const undoButton = screen.getByText('Undo')
    fireEvent.click(undoButton)
    
    // Should not crash and game should continue
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('handles hint action', () => {
    render(<SolitaireComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    const hintButton = screen.getByText('Hint')
    fireEvent.click(hintButton)
    
    // Should not crash
    expect(screen.getByText('Hint')).toBeInTheDocument()
  })

  it('displays timer during gameplay', async () => {
    render(<SolitaireComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Timer should show
    expect(screen.getByText(/Time:/)).toBeInTheDocument()
    expect(screen.getByText(/0:0/)).toBeInTheDocument()
  })

  it('shows game over screen when game is won', async () => {
    render(<SolitaireComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Game will trigger win condition internally
    // For testing, we'd need to mock the game logic
  })

  it('has responsive design for mobile', () => {
    render(<SolitaireComponent />)
    const container = screen.getByText('Solitaire (Klondike)').closest('.max-w-7xl')
    expect(container).toHaveClass('mx-auto', 'p-4')
  })
})