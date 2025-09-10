import { Metadata } from 'next';
import Hexagon from '@/components/games/Hexagon';

export const metadata: Metadata = {
  title: 'Hexagon - Hexagonal Puzzle Game | Mini Games',
  description: 'Play Hexagon online. Fit hexagonal pieces together and clear lines in this Tetris-like puzzle game.',
  keywords: ['hexagon', 'hexagonal puzzle', 'tetris-like', 'puzzle game', 'line clearing'],
};

export default function HexagonPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Hexagon />
    </div>
  );
}
