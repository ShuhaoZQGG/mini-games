import { Metadata } from 'next';
import GoFish from '@/components/games/card/GoFish';

export const metadata: Metadata = {
  title: 'Go Fish - Classic Card Matching Game | Mini Games',
  description: 'Play Go Fish online with AI opponents. Ask for cards, go fishing, and collect sets in this family-friendly card game!',
  keywords: ['go fish', 'card game', 'matching game', 'family game', 'go fish online', 'card matching'],
  openGraph: {
    title: 'Go Fish - Classic Card Matching Game',
    description: 'Play Go Fish online. Classic family card game with AI opponents.',
    type: 'website',
  },
};

export default function GoFishPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GoFish />
    </div>
  );
}