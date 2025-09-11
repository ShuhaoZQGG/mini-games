import { Metadata } from 'next';
import BubbleWrap from '@/components/games/casual/BubbleWrap';

export const metadata: Metadata = {
  title: 'Bubble Wrap Pop | Mini Games',
  description: 'Pop virtual bubble wrap for satisfaction.',
  keywords: ['bubble wrap', 'popping game', 'satisfying', 'casual'],
};

export default function BubbleWrapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BubbleWrap />
    </div>
  );
}
