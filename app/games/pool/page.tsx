import { Metadata } from 'next';
import PoolGame from '@/src/components/games/pool/pool-game';

export const metadata: Metadata = {
  title: 'Pool (8-Ball) - Classic Billiards Game | Mini Games',
  description: 'Play 8-Ball Pool online with realistic physics. Pocket your balls (solids or stripes) and sink the 8-ball to win. Features AI opponent with multiple difficulty levels.',
  keywords: ['pool', '8-ball', 'billiards', 'pool game online', 'snooker', 'cue sports', 'multiplayer pool'],
  openGraph: {
    title: 'Pool (8-Ball) - Classic Billiards Game',
    description: 'Play 8-Ball Pool with realistic physics and AI opponent. Master your shots and sink the 8-ball to win!',
    type: 'website',
  },
};

export default function PoolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PoolGame />
    </div>
  );
}