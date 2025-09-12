import { Metadata } from 'next';
import WordLadder from '@/components/games/puzzle/WordLadder';

export const metadata: Metadata = {
  title: 'Word Ladder Puzzle | Mini Games',
  description: 'Transform one word into another by changing one letter at a time.',
  keywords: ['word ladder', 'word puzzle', 'vocabulary', 'word game'],
};

export default function WordLadderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WordLadder />
    </div>
  );
}
