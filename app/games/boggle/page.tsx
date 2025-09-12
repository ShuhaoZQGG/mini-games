import { Metadata } from 'next';
import Boggle from '@/components/games/Boggle';

export const metadata: Metadata = {
  title: 'Boggle - Word Finding Game | Mini Games',
  description: 'Play Boggle online. Find words in a letter grid before time runs out in this classic word game.',
  keywords: ['boggle', 'word game', 'letter grid', 'word search', 'vocabulary game'],
};

export default function BogglePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Boggle />
    </div>
  );
}
