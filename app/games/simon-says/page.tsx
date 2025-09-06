import { Metadata } from 'next';
import { SimonSays } from '@/components/games/simon-says';

export const metadata: Metadata = {
  title: 'Simon Says - Memory Pattern Game | Mini Games',
  description: 'Play Simon Says online! Test your memory by repeating increasingly complex patterns. How many levels can you complete?',
  keywords: 'simon says, memory game, pattern game, brain training, concentration game, online simon',
};

export default function SimonSaysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Simon Says</h1>
      <SimonSays />
    </div>
  );
}