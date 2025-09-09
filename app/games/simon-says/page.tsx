import { Metadata } from 'next';
import SimonSaysWithLevels from '@/components/games/simon-says-with-levels';

export const metadata: Metadata = {
  title: 'Simon Says - Memory Pattern Game | Mini Games',
  description: 'Play Simon Says online! Test your memory by repeating increasingly complex patterns. How many levels can you complete?',
  keywords: 'simon says, memory game, pattern game, brain training, concentration game, online simon',
};

export default function SimonSaysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SimonSaysWithLevels />
    </div>
  );
}