import { Metadata } from 'next';
import OnlineReversi from '@/components/games/strategy/OnlineReversi';

export const metadata: Metadata = {
  title: 'Online Reversi with Rankings | Mini Games',
  description: 'Play Online Reversi (Othello) with strategy rankings and competitive play.',
  keywords: ['online reversi', 'othello', 'strategy game', 'rankings'],
};

export default function OnlineReversiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineReversi />
    </div>
  );
}
