import { Metadata } from 'next';
import ColorMatchWithLevels from '@/components/games/ColorMatch';

export const metadata: Metadata = {
  title: 'Color Match - Pattern Matching Puzzle Game | Mini Games',
  description: 'Play Color Match online! Connect matching colors to create patterns in this addictive puzzle game with increasing complexity.',
  keywords: ['color match', 'pattern matching', 'puzzle game', 'color puzzle', 'matching game', 'pattern game'],
  openGraph: {
    title: 'Color Match - Pattern Matching Puzzle',
    description: 'Connect matching colors to create patterns in this challenging puzzle!',
    type: 'website',
  },
};

export default function ColorMatchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ColorMatchWithLevels />
    </div>
  );
}