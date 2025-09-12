import { Metadata } from 'next';
import Dominoes from '@/components/games/Dominoes';

export const metadata: Metadata = {
  title: 'Dominoes - Traditional Tile Game | Mini Games',
  description: 'Play Dominoes online. Match tiles and outsmart your opponent in this classic strategy game.',
  keywords: ['dominoes', 'tile game', 'classic game', 'strategy game', 'traditional game'],
};

export default function DominoesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Dominoes />
    </div>
  );
}
