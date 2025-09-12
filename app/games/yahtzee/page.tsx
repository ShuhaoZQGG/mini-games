import { Metadata } from 'next';
import Yahtzee from '@/components/games/Yahtzee';

export const metadata: Metadata = {
  title: 'Yahtzee - Dice Scoring Game | Mini Games',
  description: 'Play Yahtzee online. Roll dice and score combinations in this classic dice game.',
  keywords: ['yahtzee', 'dice game', 'scoring game', 'classic game', 'probability game'],
};

export default function YahtzeePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Yahtzee />
    </div>
  );
}
