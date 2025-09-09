import { Metadata } from 'next';
import SpaceInvadersWithLevels from '@/components/games/space-invaders-with-levels';

export const metadata: Metadata = {
  title: 'Space Invaders - Classic Arcade Shooter | Mini Games',
  description: 'Play Space Invaders online. Defend Earth from alien invaders in this classic arcade shooter. Features wave progression, UFO bonuses, and destructible barriers. Free to play!',
  keywords: ['space invaders', 'arcade game', 'shooter game', 'retro game', 'alien game', 'classic game'],
  openGraph: {
    title: 'Space Invaders - Classic Arcade Shooter',
    description: 'Defend Earth from waves of alien invaders in this classic arcade shooter game!',
    type: 'website',
  },
};

export default function SpaceInvadersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SpaceInvadersWithLevels />
    </div>
  );
}