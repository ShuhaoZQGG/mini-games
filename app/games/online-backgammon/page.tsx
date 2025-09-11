import { Metadata } from 'next';
import OnlineBackgammon from '@/components/games/strategy/OnlineBackgammon';

export const metadata: Metadata = {
  title: 'Online Backgammon Tournament | Mini Games',
  description: 'Play Online Backgammon with tournament features and doubling cube.',
  keywords: ['online backgammon', 'tournament', 'doubling cube', 'board game'],
};

export default function OnlineBackgammonPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlineBackgammon />
    </div>
  );
}
