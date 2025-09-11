import { Metadata } from 'next';
import PatternQuest from '@/components/games/puzzle/PatternQuest';

export const metadata: Metadata = {
  title: 'Pattern Quest | Mini Games',
  description: 'Match patterns and solve visual puzzles.',
  keywords: ['pattern quest', 'pattern matching', 'visual puzzle', 'pattern game'],
};

export default function PatternQuestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PatternQuest />
    </div>
  );
}
