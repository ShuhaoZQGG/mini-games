import { Metadata } from 'next';
import TimeAttack from '@/components/games/action/TimeAttack';

export const metadata: Metadata = {
  title: 'Time Attack | Mini Games',
  description: 'Hit targets quickly before time runs out.',
  keywords: ['time attack', 'target game', 'reflex game', 'action'],
};

export default function TimeAttackPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TimeAttack />
    </div>
  );
}
