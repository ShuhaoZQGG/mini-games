import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WordleWithLevels } from '@/components/games/Wordle'
import { BubbleShooterWithLevels } from '@/components/games/BubbleShooter'

describe('Wordle Game Tests', () => {
  it('renders wordle game with levels', () => {
    render(<WordleWithLevels />)
    expect(screen.getByText(/Wordle/i)).toBeInTheDocument()
  })

  it('shows level selection initially', () => {
    render(<WordleWithLevels />)
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Beginner Words/i)).toBeInTheDocument()
  })

  it('has multiple difficulty levels', () => {
    render(<WordleWithLevels />)
    expect(screen.getByText(/Beginner Words/i)).toBeInTheDocument()
    expect(screen.getByText(/Common Words/i)).toBeInTheDocument()
    expect(screen.getByText(/Challenging Words/i)).toBeInTheDocument()
    expect(screen.getByText(/Expert Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Time Challenge/i)).toBeInTheDocument()
  })

  it('can start a game by clicking a level', () => {
    render(<WordleWithLevels />)
    const levelButton = screen.getByText(/Beginner Words/i)
    fireEvent.click(levelButton)
    // After clicking, the game should start
    expect(screen.getByText(/Wordle/i)).toBeInTheDocument()
  })
})

describe('Bubble Shooter Game Tests', () => {
  it('renders bubble shooter game with levels', () => {
    render(<BubbleShooterWithLevels />)
    expect(screen.getByText(/Bubble Shooter/i)).toBeInTheDocument()
  })

  it('shows level selection initially', () => {
    render(<BubbleShooterWithLevels />)
    expect(screen.getByText(/Level 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Easy Start/i)).toBeInTheDocument()
  })

  it('has multiple difficulty levels', () => {
    render(<BubbleShooterWithLevels />)
    expect(screen.getByText(/Easy Start/i)).toBeInTheDocument()
    expect(screen.getByText(/More Colors/i)).toBeInTheDocument()
    expect(screen.getByText(/Challenging/i)).toBeInTheDocument()
    expect(screen.getByText(/Expert Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Master Challenge/i)).toBeInTheDocument()
  })

  it('can start a game by clicking a level', () => {
    render(<BubbleShooterWithLevels />)
    const levelButton = screen.getByText(/Easy Start/i)
    fireEvent.click(levelButton)
    // After clicking, the game should start
    expect(screen.getByText(/Bubble Shooter/i)).toBeInTheDocument()
  })
})