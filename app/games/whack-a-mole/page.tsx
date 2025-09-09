import { Metadata } from 'next';
import WhackAMoleWithLevels from '@/components/games/whack-a-mole-with-levels';

export const metadata: Metadata = {
  title: 'Whack-a-Mole - Reaction Time Game | Mini Games',
  description: 'Play Whack-a-Mole online! Test your reflexes by clicking moles as they pop up. Build combos for higher scores!',
  keywords: 'whack a mole, reaction game, reflex test, arcade game, speed game, online whack a mole',
};

export default function WhackAMolePage() {
  return <WhackAMoleWithLevels />;
}