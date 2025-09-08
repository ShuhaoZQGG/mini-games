import { Metadata } from 'next';
import CrosswordGame from '@/components/games/crossword';

export const metadata: Metadata = {
  title: 'Crossword Puzzle - Word Game | Mini Games',
  description: 'Challenge yourself with crossword puzzles! Features daily puzzles, multiple difficulty levels, hint system, and automatic grid generation. Test your vocabulary and knowledge. Free to play!',
  keywords: ['crossword', 'crossword puzzle', 'word game', 'puzzle game', 'vocabulary game', 'brain training'],
  openGraph: {
    title: 'Crossword Puzzle - Daily Word Challenges',
    description: 'Solve crossword puzzles with various difficulty levels and topics!',
    type: 'website',
  },
};

export default function CrosswordPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CrosswordGame />
    </div>
  );
}