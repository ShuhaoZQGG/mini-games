import { Metadata } from 'next';
import { SimonSaysComponent } from '@/components/games/simon-says';

export const metadata: Metadata = {
  title: 'Simon Says - Memory Sequence Game | Mini Games',
  description: 'Test your memory with Simon Says! Watch the color sequence and repeat it correctly. Progressive difficulty with multiple speed modes. How many levels can you complete?',
  keywords: ['simon says', 'memory game', 'sequence game', 'pattern game', 'brain training', 'concentration game', 'online memory game'],
  openGraph: {
    title: 'Simon Says - Memory Sequence Game',
    description: 'Challenge your memory! Watch and repeat the growing color sequences.',
    type: 'website',
  },
};

export default function SimonSaysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SimonSaysComponent />
    </div>
  );
}