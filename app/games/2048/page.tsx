import { Metadata } from 'next';
import Game2048WithLevels from '@/components/games/2048-with-levels';

export const metadata: Metadata = {
  title: '2048 Game with Levels - Number Puzzle Game | Mini Games',
  description: 'Play 2048 online for free with multiple difficulty levels! Slide tiles to combine numbers and reach 2048 and beyond. A challenging and addictive puzzle game.',
  keywords: ['2048 game', 'number puzzle', 'sliding puzzle', 'math game', 'brain game', 'free puzzle game', 'difficulty levels'],
  openGraph: {
    title: '2048 with Levels - Number Puzzle Game',
    description: 'Play 2048 online with difficulty levels. Combine tiles to reach 2048 and beyond in this addictive puzzle game!',
    type: 'website',
  },
};

export default function TwentyFortyEightPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Game2048WithLevels />
    </div>
  );
}