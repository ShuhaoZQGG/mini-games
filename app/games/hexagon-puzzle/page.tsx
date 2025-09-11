import { Metadata } from 'next';
import HexagonPuzzle from '@/components/games/puzzle/HexagonPuzzle';

export const metadata: Metadata = {
  title: 'Hexagon Puzzle | Mini Games',
  description: 'Play Hexagon Puzzle - fit hexagonal pieces and clear lines.',
  keywords: ['hexagon puzzle', 'puzzle game', 'hexagonal', 'tetris-like'],
};

export default function HexagonPuzzlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <HexagonPuzzle />
    </div>
  );
}
