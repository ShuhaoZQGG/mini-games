import { Metadata } from 'next';
import OnlineCheckers from '@/components/games/strategy/OnlineCheckers';

export const metadata: Metadata = {
  title: 'Online Checkers with Matchmaking | Mini Games',
  description: 'Play Online Checkers with matchmaking system and competitive rankings.',
  keywords: ['online checkers', 'matchmaking', 'draughts', 'multiplayer checkers'],
};

export default function OnlineCheckersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineCheckers />
    </div>
  );
}
