import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Category } from '@/types/category';

const mockCategories: Category[] = [
  {
    id: '1',
    slug: 'puzzle-games',
    name: 'Puzzle Games',
    icon: '🧩',
    color: '#8B5CF6',
    description: 'Brain teasers and logic challenges',
    display_order: 1,
  },
  {
    id: '2',
    slug: 'arcade-classics',
    name: 'Arcade Classics',
    icon: '👾',
    color: '#F59E0B',
    description: 'Retro arcade favorites',
    display_order: 2,
  },
];

describe('CategoryGrid', () => {
  it('renders all categories', () => {
    render(<CategoryGrid categories={mockCategories} />);
    
    expect(screen.getByText('Puzzle Games')).toBeInTheDocument();
    expect(screen.getByText('Arcade Classics')).toBeInTheDocument();
  });

  it('displays category descriptions', () => {
    render(<CategoryGrid categories={mockCategories} />);
    
    expect(screen.getByText('Brain teasers and logic challenges')).toBeInTheDocument();
    expect(screen.getByText('Retro arcade favorites')).toBeInTheDocument();
  });

  it('displays category icons', () => {
    render(<CategoryGrid categories={mockCategories} />);
    
    expect(screen.getByText('🧩')).toBeInTheDocument();
    expect(screen.getByText('👾')).toBeInTheDocument();
  });

  it('creates correct links for each category', () => {
    render(<CategoryGrid categories={mockCategories} />);
    
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/category/puzzle-games');
    expect(links[1]).toHaveAttribute('href', '/category/arcade-classics');
  });

  it('applies category color styles', () => {
    const { container } = render(<CategoryGrid categories={mockCategories} />);
    
    const categoryElements = container.querySelectorAll('[style*="background"]');
    expect(categoryElements.length).toBeGreaterThan(0);
  });

  it('renders empty state when no categories provided', () => {
    const { container } = render(<CategoryGrid categories={[]} />);
    
    const grid = container.querySelector('.grid');
    expect(grid?.children).toHaveLength(0);
  });
});