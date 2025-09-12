import { Metadata } from 'next';
import OnlineChess from '@/components/games/strategy/OnlineChess';

export const metadata: Metadata = {
  title: 'Online Chess with ELO Rating | Mini Games',
  description: 'Play Online Chess with ELO rating system, matchmaking, and tournament features.',
  keywords: ['online chess', 'elo rating', 'chess tournament', 'multiplayer chess'],
};

export default function OnlineChessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineChess />
    </div>
  );
}
