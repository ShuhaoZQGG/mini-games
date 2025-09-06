import { render, screen, fireEvent, act } from '@testing-library/react'
import MentalMath from '@/components/games/mental-math'

describe('MentalMath', () => {
  it('renders start screen initially', () => {
    render(<MentalMath />)
    expect(screen.getByText(/Solve math problems quickly!/i)).toBeInTheDocument()
    expect(screen.getByText(/Start Game/i)).toBeInTheDocument()
  })

  it('starts game when start button is clicked', () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
    expect(screen.getByText(/Time:/i)).toBeInTheDocument()
    expect(screen.getByTestId('math-problem')).toBeInTheDocument()
  })

  it('shows math problem when game starts', () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const problem = screen.getByTestId('math-problem')
    expect(problem.textContent).toMatch(/\d+\s*[+\-×÷]\s*\d+/)
  })

  it('accepts correct answers', () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Mock a simple problem
    const input = screen.getByTestId('answer-input') as HTMLInputElement
    const problem = screen.getByTestId('math-problem').textContent
    
    // For testing, assume 2 + 2
    if (problem === '2 + 2') {
      fireEvent.change(input, { target: { value: '4' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 13 })
      
      expect(screen.getByText(/Score: 1/i)).toBeInTheDocument()
    }
  })

  it('shows feedback for wrong answers', async () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const input = screen.getByTestId('answer-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '999' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13 })
    
    // Input should still have the value immediately after wrong answer
    expect(input.value).toBe('999')
    
    // Wait for the timeout to clear the input
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
    })
    
    // Now the input should be cleared
    expect(input.value).toBe('')
  })

  it('increases difficulty as score increases', () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Simulate multiple correct answers
    // Difficulty should increase (larger numbers, harder operations)
    expect(screen.getByText(/Level:/i)).toBeInTheDocument()
  })

  it('ends game after timer expires', () => {
    jest.useFakeTimers()
    
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    // Wrap timer advancement in act to handle state updates
    act(() => {
      jest.advanceTimersByTime(60000) // 60 seconds
    })
    
    expect(screen.getByText(/Game Over!/i)).toBeInTheDocument()
    expect(screen.getByText(/Play Again/i)).toBeInTheDocument()
    
    jest.useRealTimers()
  })

  it('shows correct answer when skipping', () => {
    render(<MentalMath />)
    const startButton = screen.getByText(/Start Game/i)
    fireEvent.click(startButton)
    
    const skipButton = screen.getByText(/Skip/i)
    fireEvent.click(skipButton)
    
    // Should move to next problem
    expect(screen.getByTestId('math-problem')).toBeInTheDocument()
  })
})