import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpaceInvaders from '@/components/games/space-invaders';

describe('Space Invaders Game', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders game interface', () => {
    render(<SpaceInvaders />);
    
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Wave:/)).toBeInTheDocument();
    expect(screen.getByText(/Lives:/)).toBeInTheDocument();
    expect(screen.getByText(/High Score:/)).toBeInTheDocument();
  });

  it('starts game when start button is clicked', () => {
    render(<SpaceInvaders />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('pauses and resumes game', () => {
    render(<SpaceInvaders />);
    
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
    render(<SpaceInvaders />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Test movement
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    // Test shooting
    fireEvent.keyDown(window, { key: ' ' });
    
    // Game should still be running
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('changes difficulty levels', () => {
    render(<SpaceInvaders />);
    
    const easyButton = screen.getByText('Easy');
    const mediumButton = screen.getByText('Medium');
    const hardButton = screen.getByText('Hard');
    
    fireEvent.click(hardButton);
    expect(hardButton.className).toContain('bg-blue-600');
    
    fireEvent.click(mediumButton);
    expect(mediumButton.className).toContain('bg-blue-600');
    
    fireEvent.click(easyButton);
    expect(easyButton.className).toContain('bg-blue-600');
  });

  it('saves and loads high score', () => {
    render(<SpaceInvaders />);
    
    // Should load default high score
    expect(screen.getByText(/High Score: 0/)).toBeInTheDocument();
    
    // Simulate game with score
    localStorage.setItem('spaceInvaders-highScore', '5000');
    
    // Re-render to load saved score
    const { unmount } = render(<SpaceInvaders />);
    unmount();
    render(<SpaceInvaders />);
    
    expect(screen.getByText(/High Score: 5000/)).toBeInTheDocument();
  });

  it('shows wave progression', () => {
    render(<SpaceInvaders />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Initial wave should be 1
    expect(screen.getByText(/Wave: 1/)).toBeInTheDocument();
  });

  it('handles new game after game over', () => {
    render(<SpaceInvaders />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Wave: 1/)).toBeInTheDocument();
  });
});