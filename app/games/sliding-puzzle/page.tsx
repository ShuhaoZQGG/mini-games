import { Metadata } from 'next';
import SlidingPuzzleWithLevels from '@/components/games/sliding-puzzle-with-levels';

export const metadata: Metadata = {
  title: 'Sliding Puzzle - 15-Puzzle Game | Mini Games',
  description: 'Play the classic sliding puzzle game. Choose between numbers or images, multiple grid sizes (3x3, 4x4, 5x5), and challenge yourself with move counter and timer. Free to play!',
  keywords: ['sliding puzzle', '15 puzzle', 'puzzle game', 'brain game', 'logic game', 'tile puzzle'],
  openGraph: {
    title: 'Sliding Puzzle - Classic 15-Puzzle Game',
    description: 'Solve the classic sliding tile puzzle with multiple grid sizes and modes!',
    type: 'website',
  },
};

export default function SlidingPuzzlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SlidingPuzzleWithLevels />
    </div>
  );
}