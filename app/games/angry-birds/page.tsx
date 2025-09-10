import { Metadata } from 'next';
import AngryBirds from '@/components/games/AngryBirds';

export const metadata: Metadata = {
  title: 'Angry Birds - Physics Projectile Game | Mini Games',
  description: 'Play Angry Birds online. Launch birds to destroy structures and defeat pigs in this physics-based game.',
  keywords: ['angry birds', 'physics game', 'projectile game', 'slingshot game', 'action puzzle'],
};

export default function AngryBirdsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AngryBirds />
    </div>
  );
}
