import { Metadata } from 'next';
import FruitNinja from '@/components/games/action/FruitNinja';

export const metadata: Metadata = {
  title: 'Fruit Ninja - Swipe to Slice | Mini Games',
  description: 'Play Fruit Ninja online. Swipe to slice fruits and avoid bombs in this addictive action game.',
  keywords: ['fruit ninja', 'slice game', 'swipe game', 'action game', 'fruit slicing'],
};

export default function FruitNinjaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FruitNinja />
    </div>
  );
}
