import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChemistryLab from '@/components/games/chemistry-lab'

describe('ChemistryLab', () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn()
    Storage.prototype.setItem = jest.fn()
  })

  it('renders chemistry lab game', () => {
    render(<ChemistryLab />)
    expect(screen.getByText(/Chemistry Lab/i)).toBeInTheDocument()
  })

  it('shows difficulty selector', () => {
    render(<ChemistryLab />)
    expect(screen.getByText(/Select Difficulty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Easy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Medium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hard/i })).toBeInTheDocument()
  })

  it('starts game when difficulty is selected', () => {
    render(<ChemistryLab />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    expect(screen.getByText(/Level:/i)).toBeInTheDocument()
    expect(screen.getByText(/Score:/i)).toBeInTheDocument()
  })

  it('displays periodic table elements', () => {
    render(<ChemistryLab />)
    const easyButton = screen.getByRole('button', { name: /Easy/i })
    fireEvent.click(easyButton)
    
    // Should show element matching or compound building
    expect(screen.queryByText(/Match/i) || screen.queryByText(/Build/i)).toBeInTheDocument()
  })
})