import { Metadata } from 'next';
import NumberChain from '@/components/games/puzzle/NumberChain';

export const metadata: Metadata = {
  title: 'Number Chain | Mini Games',
  description: 'Create number chains to reach target values.',
  keywords: ['number chain', 'math puzzle', 'number game', 'arithmetic'],
};

export default function NumberChainPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <NumberChain />
    </div>
  );
}
