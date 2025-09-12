import { Metadata } from 'next';
import NinjaWarrior from '@/components/games/action/NinjaWarrior';

export const metadata: Metadata = {
  title: 'Ninja Warrior | Mini Games',
  description: 'Jump and dodge obstacles as a ninja warrior.',
  keywords: ['ninja warrior', 'action game', 'platformer', 'ninja game'],
};

export default function NinjaWarriorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NinjaWarrior />
    </div>
  );
}
