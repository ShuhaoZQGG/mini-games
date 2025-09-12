import { Metadata } from 'next';
import ZenGarden from '@/components/games/casual/ZenGarden';

export const metadata: Metadata = {
  title: 'Zen Garden | Mini Games',
  description: 'Grow and maintain a peaceful zen garden.',
  keywords: ['zen garden', 'relaxing game', 'garden simulator', 'casual'],
};

export default function ZenGardenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ZenGarden />
    </div>
  );
}
