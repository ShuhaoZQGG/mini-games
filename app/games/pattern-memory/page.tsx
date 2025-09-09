import { Metadata } from 'next';
import PatternMemoryWithLevels from '@/components/games/pattern-memory-with-levels';

export const metadata: Metadata = {
  title: 'Pattern Memory - Sequence Memorization Game | Mini Games',
  description: 'Test your memory with Pattern Memory game. Remember and repeat increasingly complex visual and audio sequences. Features multiple difficulty levels and time pressure modes. Free to play!',
  keywords: ['pattern memory', 'memory game', 'sequence game', 'brain training', 'simon says', 'memory test'],
  openGraph: {
    title: 'Pattern Memory - Sequence Memorization Game',
    description: 'Test and train your memory by repeating increasingly complex patterns!',
    type: 'website',
  },
};

export default function PatternMemoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PatternMemoryWithLevels />
    </div>
  );
}