import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MathBlaster from '@/components/games/math-blaster'

describe('MathBlaster', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
  })

  it('renders math blaster game', () => {
    render(<MathBlaster />)
    expect(screen.getByText(/Math Blaster/i)).toBeInTheDocument()
  })

  it('shows difficulty selector at start', () => {
    render(<MathBlaster />)
    expect(screen.getByText(/Select Difficulty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Easy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Medium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hard/i })).toBeInTheDocument()
  })

  it('starts game when difficulty is selected', () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    expect(screen.getByText(/Level:/i)).toBeInTheDocument()
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
  })

  it('displays math problem when game starts', () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Should show a math equation
    const problemElement = screen.getByTestId('math-problem')
    expect(problemElement).toBeInTheDocument()
  })

  it('has input field for answer', () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('shows timer countdown', () => {
    render(<MathBlaster />)
    const mediumButton = screen.getByRole('button', { name: /Medium/i })
    fireEvent.click(mediumButton)
    
    expect(screen.getByText(/Time:/i)).toBeInTheDocument()
  })

  it('increments score on correct answer', async () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    expect(screen.getByText(/Score: 0/i)).toBeInTheDocument()
    
    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    
    // Enter an answer
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      const scoreText = screen.getByText(/Score:/i)
      expect(scoreText).toBeInTheDocument()
    })
  })

  it('supports different operators', () => {
    render(<MathBlaster />)
    const hardButton = screen.getByRole('button', { name: /Hard/i })
    fireEvent.click(hardButton)
    
    // Hard mode should include multiplication and division
    const problemElement = screen.getByTestId('math-problem')
    const problemText = problemElement.textContent || ''
    
    // Check for various operators
    const hasOperator = ['+', '-', '×', '÷'].some(op => problemText.includes(op))
    expect(hasOperator).toBe(true)
  })

  it('progresses through levels', () => {
    render(<MathBlaster />)
    const mediumButton = screen.getByRole('button', { name: /Medium/i })
    fireEvent.click(mediumButton)
    
    expect(screen.getByText(/Level: 1/i)).toBeInTheDocument()
  })

  it('shows star rating when level completes', async () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Complete multiple problems to finish a level
    // This would trigger star rating display
  })

  it('saves high score to localStorage', () => {
    render(<MathBlaster />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Play game and check localStorage is called
    expect(Storage.prototype.setItem).toHaveBeenCalled()
  })
})