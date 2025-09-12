import { Metadata } from 'next';
import Scrabble from '@/components/games/Scrabble';

export const metadata: Metadata = {
  title: 'Scrabble - Word Building Game | Mini Games',
  description: 'Play Scrabble online. Build words with letter values and maximize your score in this classic word game.',
  keywords: ['scrabble', 'word game', 'letter values', 'vocabulary game', 'strategy game'],
};

export default function ScrabblePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Scrabble />
    </div>
  );
}
