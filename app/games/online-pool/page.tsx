import { Metadata } from 'next';
import OnlinePool from '@/components/games/skill/OnlinePool';

export const metadata: Metadata = {
  title: 'Online Pool (8-Ball) | Mini Games',
  description: 'Play Online Pool with realistic physics and multiplayer support.',
  keywords: ['online pool', '8-ball', 'billiards', 'multiplayer pool'],
};

export default function OnlinePoolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnlinePool />
    </div>
  );
}
