import { Metadata } from 'next';
import Risk from '@/components/games/Risk';

export const metadata: Metadata = {
  title: 'Risk - Territory Conquest Strategy | Mini Games',
  description: 'Play Risk online. Conquer territories and defeat your opponents in this simplified strategy war game.',
  keywords: ['risk', 'strategy game', 'war game', 'territory conquest', 'board game'],
};

export default function RiskPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Risk />
    </div>
  );
}
