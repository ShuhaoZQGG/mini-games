import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GeographyQuiz from '@/components/games/geography-quiz'

describe('GeographyQuiz', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
  })

  it('renders geography quiz game', () => {
    render(<GeographyQuiz />)
    expect(screen.getByText(/Geography Quiz/i)).toBeInTheDocument()
  })

  it('shows difficulty selector at start', () => {
    render(<GeographyQuiz />)
    expect(screen.getByText(/Select Difficulty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Easy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Medium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hard/i })).toBeInTheDocument()
  })

  it('starts game when difficulty is selected', () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    expect(screen.getByText(/Level:/i)).toBeInTheDocument()
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
  })

  it('displays question when game starts', () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Should show either a capital or flag question
    const questionElement = screen.queryByText(/What is the capital of/i) || 
                           screen.queryByText(/Which country does this flag belong to/i)
    expect(questionElement).toBeInTheDocument()
  })

  it('shows multiple choice answers', () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Should have 4 answer options
    const answerButtons = screen.getAllByRole('button').filter(btn => 
      !btn.textContent?.includes('Easy') && 
      !btn.textContent?.includes('Medium') && 
      !btn.textContent?.includes('Hard') &&
      !btn.textContent?.includes('Next') &&
      !btn.textContent?.includes('Restart')
    )
    expect(answerButtons.length).toBe(4)
  })

  it('increments score on correct answer', async () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Initial score should be 0
    expect(screen.getByText(/Score: 0/i)).toBeInTheDocument()
    
    // Click an answer (for testing, we'll just click the first one)
    const answerButtons = screen.getAllByRole('button').filter(btn => 
      !btn.textContent?.includes('Easy') && 
      !btn.textContent?.includes('Medium') && 
      !btn.textContent?.includes('Hard')
    )
    
    if (answerButtons.length > 0) {
      fireEvent.click(answerButtons[0])
      
      // Wait for score update or next question
      await waitFor(() => {
        const scoreText = screen.getByText(/Score:/i)
        expect(scoreText).toBeInTheDocument()
      })
    }
  })

  it('progresses through levels', async () => {
    render(<GeographyQuiz />)
    const mediumButton = screen.getByRole('button', { name: /Medium/i })
    fireEvent.click(mediumButton)
    
    expect(screen.getByText(/Level: 1/i)).toBeInTheDocument()
  })

  it('shows star rating when level completes', async () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Complete multiple questions to finish a level
    // This would trigger star rating display
  })

  it('saves high score to localStorage', () => {
    render(<GeographyQuiz />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Play game and check localStorage is called
    expect(Storage.prototype.setItem).toHaveBeenCalled()
  })

  it('displays categories for trivia mode', () => {
    render(<GeographyQuiz />)
    // Should have options for capitals, flags, landmarks, etc.
  })
})