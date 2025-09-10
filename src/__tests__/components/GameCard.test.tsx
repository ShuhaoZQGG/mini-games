import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameCard } from '@/components/GameCard';
import { GameMetadata } from '@/types/category';

const mockGame: GameMetadata = {
  id: '1',
  slug: 'chess',
  name: 'Chess',
  category_id: 'strategy',
  tags: ['strategy', 'board', 'classic'],
  difficulty: 'hard',
  avg_play_time: 30,
  player_count: '2',
  description: 'The ultimate strategy game',
  play_count: 12500,
  rating: 4.8,
  featured: true,
  thumbnail_url: '/images/chess.png',
};

describe('GameCard', () => {
  it('renders game name and description', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.getByText('The ultimate strategy game')).toBeInTheDocument();
  });

  it('displays difficulty with correct color', () => {
    render(<GameCard game={mockGame} />);
    
    const difficulty = screen.getByText('hard');
    expect(difficulty).toHaveClass('text-red-600');
  });

  it('shows play time and player count', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('30min')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays rating when available', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('shows featured badge when game is featured', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('displays play count when greater than 0', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  it('shows tags up to 3', () => {
    render(<GameCard game={mockGame} />);
    
    expect(screen.getByText('strategy')).toBeInTheDocument();
    expect(screen.getByText('board')).toBeInTheDocument();
    expect(screen.getByText('classic')).toBeInTheDocument();
  });

  it('creates correct link to game page', () => {
    render(<GameCard game={mockGame} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/games/chess');
  });

  it('applies correct difficulty colors', () => {
    const easyGame = { ...mockGame, difficulty: 'easy' as const };
    const { rerender } = render(<GameCard game={easyGame} />);
    expect(screen.getByText('easy')).toHaveClass('text-green-600');

    const mediumGame = { ...mockGame, difficulty: 'medium' as const };
    rerender(<GameCard game={mediumGame} />);
    expect(screen.getByText('medium')).toHaveClass('text-yellow-600');
  });

  it('does not show rating when not available', () => {
    const gameWithoutRating = { ...mockGame, rating: undefined };
    render(<GameCard game={gameWithoutRating} />);
    
    expect(screen.queryByText('4.8')).not.toBeInTheDocument();
  });

  it('does not show featured badge when not featured', () => {
    const nonFeaturedGame = { ...mockGame, featured: false };
    render(<GameCard game={nonFeaturedGame} />);
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });
});