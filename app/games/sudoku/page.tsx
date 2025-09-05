import { Metadata } from 'next';
import { Sudoku } from '@/components/games/sudoku';

export const metadata: Metadata = {
  title: 'Sudoku Game - Number Puzzle | Mini Games',
  description: 'Play Sudoku online for free! Challenge yourself with easy, medium, or hard puzzles. Fill the grid with numbers 1-9 following Sudoku rules.',
  keywords: ['sudoku', 'number puzzle', 'logic game', 'brain training', 'puzzle game', 'free sudoku'],
  openGraph: {
    title: 'Sudoku - Classic Number Puzzle',
    description: 'Play Sudoku online. Challenge your logic skills with our free Sudoku puzzles!',
    type: 'website',
  },
};

export default function SudokuPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Sudoku />
    </div>
  );
}