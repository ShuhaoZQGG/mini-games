import { Metadata } from 'next';
import { TwentyFortyEight } from '@/components/games/twenty-forty-eight';

export const metadata: Metadata = {
  title: '2048 Game - Number Puzzle Game | Mini Games',
  description: 'Play 2048 online for free! Slide tiles to combine numbers and reach the 2048 tile. A challenging and addictive puzzle game.',
  keywords: ['2048 game', 'number puzzle', 'sliding puzzle', 'math game', 'brain game', 'free puzzle game'],
  openGraph: {
    title: '2048 - Number Puzzle Game',
    description: 'Play 2048 online. Combine tiles to reach 2048 in this addictive puzzle game!',
    type: 'website',
  },
};

export default function TwentyFortyEightPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TwentyFortyEight />
    </div>
  );
}