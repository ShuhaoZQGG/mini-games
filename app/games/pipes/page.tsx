import { Metadata } from 'next';
import Pipes from '@/components/games/Pipes';

export const metadata: Metadata = {
  title: 'Pipes - Connect Flow Puzzle | Mini Games',
  description: 'Play Pipes online. Rotate pipe pieces to connect the flow from start to end in this challenging puzzle game.',
  keywords: ['pipes', 'flow puzzle', 'rotation puzzle', 'pipe game', 'connection puzzle'],
};

export default function PipesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Pipes />
    </div>
  );
}
