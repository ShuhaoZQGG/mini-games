import { Metadata } from 'next';
import FishTank from '@/components/games/casual/FishTank';

export const metadata: Metadata = {
  title: 'Fish Tank Manager | Mini Games',
  description: 'Manage your virtual aquarium and keep fish happy.',
  keywords: ['fish tank', 'aquarium game', 'pet simulator', 'casual'],
};

export default function FishTankPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FishTank />
    </div>
  );
}
