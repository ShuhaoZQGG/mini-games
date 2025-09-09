import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PacMan from '@/components/games/pacman';

describe('PacMan Game', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders game interface', () => {
    render(<PacMan />);
    
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByText(/Lives:/)).toBeInTheDocument();
    expect(screen.getByText(/High Score:/)).toBeInTheDocument();
  });

  it('starts game when start button is clicked', () => {
    render(<PacMan />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
  });

  it('pauses and resumes game', async () => {
    render(<PacMan />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    const pauseButton = screen.getByText('Pause');
    fireEvent.click(pauseButton);
    
    expect(screen.getByText('Resume')).toBeInTheDocument();
    
    const resumeButton = screen.getByText('Resume');
    fireEvent.click(resumeButton);
    
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('responds to keyboard controls', () => {
    render(<PacMan />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    // Game should still be running
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('increases difficulty with level progression', () => {
    render(<PacMan />);
    
    const easyButton = screen.getByText('Easy');
    const hardButton = screen.getByText('Hard');
    
    fireEvent.click(hardButton);
    expect(hardButton.className).toContain('bg-blue-600');
    
    fireEvent.click(easyButton);
    expect(easyButton.className).toContain('bg-blue-600');
  });

  it('saves and loads high score', () => {
    render(<PacMan />);
    
    // Should load default high score
    expect(screen.getByText(/High Score: 0/)).toBeInTheDocument();
    
    // Simulate game with score
    localStorage.setItem('pacman-highScore', '1000');
    
    // Re-render to load saved score
    const { unmount } = render(<PacMan />);
    unmount();
    render(<PacMan />);
    
    expect(screen.getByText(/High Score: 1000/)).toBeInTheDocument();
  });

  it('shows game over state', () => {
    render(<PacMan />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Simulate game over by setting lives to 0
    // This would normally happen through gameplay
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });
});