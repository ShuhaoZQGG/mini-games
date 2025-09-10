import { Metadata } from 'next';
import Blackjack from '@/components/games/Blackjack';

export const metadata: Metadata = {
  title: 'Blackjack - Casino Card Game | Mini Games',
  description: 'Play Blackjack online. Try to beat the dealer by getting as close to 21 as possible without going over.',
  keywords: ['blackjack', 'card game', 'casino game', '21', 'gambling game'],
};

export default function BlackjackPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Blackjack />
    </div>
  );
}
