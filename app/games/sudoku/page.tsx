import { Metadata } from 'next';
import { SudokuWithLevels } from '@/components/games/sudoku-with-levels';

export const metadata: Metadata = {
  title: 'Sudoku Game - Number Puzzle | Mini Games',
  description: 'Play Sudoku online for free! Progress through 5 difficulty levels from beginner to master. Fill the grid with numbers 1-9 following Sudoku rules.',
  keywords: ['sudoku', 'number puzzle', 'logic game', 'brain training', 'puzzle game', 'free sudoku', 'sudoku levels'],
  openGraph: {
    title: 'Sudoku - Classic Number Puzzle with Levels',
    description: 'Play Sudoku online. Challenge your logic skills with 5 difficulty levels!',
    type: 'website',
  },
};

export default function SudokuPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SudokuWithLevels />
    </div>
  );
}