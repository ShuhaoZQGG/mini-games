import { Metadata } from 'next';
import { WhackAMole } from '@/components/games/whack-a-mole';

export const metadata: Metadata = {
  title: 'Whack-a-Mole - Reaction Time Game | Mini Games',
  description: 'Play Whack-a-Mole online! Test your reflexes by clicking moles as they pop up. Build combos for higher scores!',
  keywords: 'whack a mole, reaction game, reflex test, arcade game, speed game, online whack a mole',
};

export default function WhackAMolePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Whack-a-Mole</h1>
      <WhackAMole />
    </div>
  );
}