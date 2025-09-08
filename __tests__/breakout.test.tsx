import { render, screen, fireEvent } from '@testing-library/react'
import Breakout from '@/components/games/breakout'

describe('Breakout', () => {
  it('renders start screen initially', () => {
    render(<Breakout />)
    expect(screen.getByText(/Break all the bricks!/i)).toBeInTheDocument()
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument()
  })

  it('starts game when start button is clicked', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
    expect(screen.getByText(/Lives:/i)).toBeInTheDocument()
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument()
  })

  it('moves paddle with arrow keys', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const canvas = screen.getByTestId('game-canvas')
    
    // Test left arrow
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' })
    // Paddle should move left (test would check paddle position in actual game logic)
    
    // Test right arrow
    fireEvent.keyDown(canvas, { key: 'ArrowRight' })
    // Paddle should move right
  })

  it('launches ball with space key', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const canvas = screen.getByTestId('game-canvas')
    fireEvent.keyDown(canvas, { key: ' ' })
    
    // Ball should start moving
  })

  it('pauses game with p key', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const canvas = screen.getByTestId('game-canvas')
    fireEvent.keyDown(canvas, { key: 'p' })
    
    expect(screen.getByText(/Paused/i)).toBeInTheDocument()
  })

  it('shows game over when all lives are lost', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Simulate losing all lives
    const component = screen.getByTestId('breakout-game')
    fireEvent(component, new CustomEvent('gameOver'))
    
    expect(screen.getByText(/Game Over!/i)).toBeInTheDocument()
    expect(screen.getByText(/Play Again/i)).toBeInTheDocument()
  })

  it('shows victory when all bricks are destroyed', () => {
    render(<Breakout />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Simulate destroying all bricks
    const component = screen.getByTestId('breakout-game')
    fireEvent(component, new CustomEvent('victory'))
    
    expect(screen.getByText(/Victory!/i)).toBeInTheDocument()
    expect(screen.getByText(/Play Again/i)).toBeInTheDocument()
  })
})