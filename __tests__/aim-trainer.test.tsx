import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AimTrainer from '@/components/games/aim-trainer'

describe('AimTrainer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders start screen initially', () => {
    render(<AimTrainer />)
    expect(screen.getByText(/Click targets as fast as you can!/i)).toBeInTheDocument()
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument()
  })

  it('starts game when start button is clicked', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
    expect(screen.getByText(/Time:/i)).toBeInTheDocument()
    expect(screen.getByTestId('game-area')).toBeInTheDocument()
  })

  it('increments score when target is clicked', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const target = screen.getByTestId('target')
    fireEvent.click(target)
    
    expect(screen.getByText(/Score: 1/i)).toBeInTheDocument()
  })

  it('decrements score when miss is clicked', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const gameArea = screen.getByTestId('game-area')
    fireEvent.click(gameArea)
    
    expect(screen.getByText(/Score: -1/i)).toBeInTheDocument()
  })

  it('moves target to new position after hit', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const target = screen.getByTestId('target')
    const initialPosition = {
      left: target.style.left,
      top: target.style.top
    }
    
    fireEvent.click(target)
    
    const newTarget = screen.getByTestId('target')
    expect(newTarget.style.left).not.toBe(initialPosition.left)
  })

  it('ends game after 30 seconds', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    jest.advanceTimersByTime(30000)
    
    expect(screen.getByText(/Game Over!/i)).toBeInTheDocument()
    expect(screen.getByText(/Play Again/i)).toBeInTheDocument()
  })

  it('calculates accuracy correctly', () => {
    render(<AimTrainer />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Hit target 3 times
    const target = screen.getByTestId('target')
    fireEvent.click(target)
    fireEvent.click(target)
    fireEvent.click(target)
    
    // Miss once
    const gameArea = screen.getByTestId('game-area')
    fireEvent.click(gameArea)
    
    jest.advanceTimersByTime(30000)
    
    expect(screen.getByText(/Accuracy: 75%/i)).toBeInTheDocument()
  })
})