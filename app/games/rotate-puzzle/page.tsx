import { Metadata } from 'next';
import RotatePuzzleWithLevels from '@/components/games/RotatePuzzle';

export const metadata: Metadata = {
  title: 'Rotate Puzzle - Rotation-Based Puzzle Game | Mini Games',
  description: 'Play Rotate Puzzle online! Rotate pieces to connect paths in this challenging puzzle game with multiple difficulty levels.',
  keywords: ['rotate puzzle', 'rotation game', 'path puzzle', 'puzzle solving', 'connection game', 'pipe puzzle'],
  openGraph: {
    title: 'Rotate Puzzle - Connection Game',
    description: 'Rotate pieces to create connections and solve puzzles!',
    type: 'website',
  },
};

export default function RotatePuzzlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RotatePuzzleWithLevels />
    </div>
  );
}