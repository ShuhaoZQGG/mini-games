import { Metadata } from 'next';
import { WhackAMoleComponent } from '@/components/games/whack-a-mole';

export const metadata: Metadata = {
  title: 'Whack-a-Mole - Reaction Clicking Game | Mini Games',
  description: 'Whack the moles as they pop up! Avoid bombs, collect power-ups, and build combos. Features multiple difficulty levels and special abilities. Test your reflexes!',
  keywords: ['whack a mole', 'reaction game', 'clicking game', 'reflex game', 'arcade game', 'mole game', 'online arcade'],
  openGraph: {
    title: 'Whack-a-Mole - Reaction Clicking Game',
    description: 'Test your reflexes! Whack moles, avoid bombs, and collect power-ups.',
    type: 'website',
  },
};

export default function WhackAMolePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WhackAMoleComponent />
    </div>
  );
}