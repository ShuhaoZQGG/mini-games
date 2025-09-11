import { Metadata } from 'next';
import LaserDefense from '@/components/games/action/LaserDefense';

export const metadata: Metadata = {
  title: 'Laser Defense | Mini Games',
  description: 'Defend against laser attacks with shields and strategy.',
  keywords: ['laser defense', 'defense game', 'action game', 'arcade'],
};

export default function LaserDefensePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LaserDefense />
    </div>
  );
}
