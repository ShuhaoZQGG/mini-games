import { Metadata } from 'next';
import BridgeBuilderWithLevels from '@/components/games/BridgeBuilder';

export const metadata: Metadata = {
  title: 'Bridge Builder - Physics Construction Puzzle | Mini Games',
  description: 'Play Bridge Builder online! Design and test bridges in this physics-based construction puzzle game with realistic simulation.',
  keywords: ['bridge builder', 'physics puzzle', 'construction game', 'engineering game', 'puzzle game', 'bridge construction'],
  openGraph: {
    title: 'Bridge Builder - Physics Puzzle',
    description: 'Build and test bridges in this challenging physics puzzle game!',
    type: 'website',
  },
};

export default function BridgeBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BridgeBuilderWithLevels />
    </div>
  );
}