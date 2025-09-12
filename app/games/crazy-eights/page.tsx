import { Metadata } from 'next';
import CrazyEights from '@/components/games/card/CrazyEights';

export const metadata: Metadata = {
  title: 'Crazy Eights - Wild Card Game | Mini Games',
  description: 'Play Crazy Eights online with AI opponents. Match suits and numbers, play wild eights, and be first to empty your hand!',
  keywords: ['crazy eights', 'card game', 'uno-like', 'wild cards', 'crazy eights online', 'shedding game'],
  openGraph: {
    title: 'Crazy Eights - Wild Card Game',
    description: 'Play Crazy Eights online. Match cards and use wild eights strategically!',
    type: 'website',
  },
};

export default function CrazyEightsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CrazyEights />
    </div>
  );
}