import { Metadata } from 'next';
import TankBattle from '@/components/games/TankBattle';

export const metadata: Metadata = {
  title: 'Tank Battle - Top-Down Shooter | Mini Games',
  description: 'Play Tank Battle online. Control your tank and defeat enemies in this action-packed top-down shooter.',
  keywords: ['tank battle', 'shooter game', 'top-down shooter', 'tank game', 'action game'],
};

export default function TankBattlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TankBattle />
    </div>
  );
}
