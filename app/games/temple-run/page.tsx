import { Metadata } from 'next';
import TempleRun from '@/components/games/TempleRun';

export const metadata: Metadata = {
  title: 'Temple Run - Endless Runner | Mini Games',
  description: 'Play Temple Run online. Run, jump, and slide through obstacles in this thrilling endless runner game.',
  keywords: ['temple run', 'endless runner', 'running game', 'action game', 'obstacle game'],
};

export default function TempleRunPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TempleRun />
    </div>
  );
}
