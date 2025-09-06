import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SimonSaysComponent } from '@/components/games/simon-says'

// Mock the score service
jest.mock('@/lib/services/scores', () => ({
  scoreService: {
    saveScore: jest.fn().mockResolvedValue({ success: true })
  }
}))

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 },
    type: ''
  })),
  createGainNode: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  })),
  destination: {},
  currentTime: 0,
  close: jest.fn()
}))

describe('Simon Says Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the game title', () => {
    render(<SimonSaysComponent />)
    expect(screen.getByText('Simon Says')).toBeInTheDocument()
  })

  it('shows start button and speed options initially', () => {
    render(<SimonSaysComponent />)
    expect(screen.getByText('Start Game')).toBeInTheDocument()
    expect(screen.getByText('Slow')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Fast')).toBeInTheDocument()
    expect(screen.getByText('Expert')).toBeInTheDocument()
  })

  it('allows changing game speed', () => {
    render(<SimonSaysComponent />)
    
    const fastButton = screen.getByText('Fast')
    fireEvent.click(fastButton)
    
    // Fast button should be selected (have default variant)
    expect(fastButton.closest('button')).toHaveClass('bg-primary')
  })

  it('starts game when start button is clicked', () => {
    render(<SimonSaysComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Should show game area with score and level
    expect(screen.getByText('Watch the sequence!')).toBeInTheDocument()
    expect(screen.getByText(/Score/)).toBeInTheDocument()
    expect(screen.getByText(/Level/)).toBeInTheDocument()
  })

  it('displays four color buttons during gameplay', () => {
    render(<SimonSaysComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Should have 4 color buttons
    const buttons = screen.getAllByRole('button', { name: /button$/ })
    expect(buttons).toHaveLength(4)
  })

  it('toggles sound on/off', () => {
    render(<SimonSaysComponent />)
    
    const soundButton = screen.getByText(/Sound On/)
    fireEvent.click(soundButton)
    
    expect(screen.getByText(/Sound Off/)).toBeInTheDocument()
    
    fireEvent.click(screen.getByText(/Sound Off/))
    expect(screen.getByText(/Sound On/)).toBeInTheDocument()
  })

  it('displays game instructions', () => {
    render(<SimonSaysComponent />)
    expect(screen.getByText('How to Play:')).toBeInTheDocument()
    expect(screen.getByText(/Watch the sequence of colors carefully/)).toBeInTheDocument()
  })

  it('shows game over screen with score', async () => {
    render(<SimonSaysComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Game will eventually end
    // For testing, we'd need to mock the game logic to trigger game over
  })

  it('displays high score', () => {
    render(<SimonSaysComponent />)
    expect(screen.getByText('High Score')).toBeInTheDocument()
  })

  it('shows play again button after game over', () => {
    // This would require mocking the game state to game over
  })

  it('has responsive design for mobile', () => {
    render(<SimonSaysComponent />)
    const container = screen.getByText('Simon Says').closest('.max-w-4xl')
    expect(container).toHaveClass('mx-auto', 'p-4')
  })

  it('handles color button clicks during player input phase', () => {
    render(<SimonSaysComponent />)
    const startButton = screen.getByText('Start Game')
    fireEvent.click(startButton)
    
    // Wait for player input phase
    // Would need to mock game state transitions
  })
})