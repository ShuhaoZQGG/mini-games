import { Metadata } from 'next';
import Spades from '@/components/games/card/Spades';

export const metadata: Metadata = {
  title: 'Spades - Partnership Bidding Card Game | Mini Games',
  description: 'Play Spades online with AI partners and opponents. Bid tricks, use spades as trump, and work with your partner to win!',
  keywords: ['spades', 'card game', 'partnership', 'bidding', 'spades online', 'trick-taking', 'trump cards'],
  openGraph: {
    title: 'Spades - Partnership Bidding Card Game',
    description: 'Play Spades online. Strategic partnership card game with bidding and trump cards.',
    type: 'website',
  },
};

export default function SpadesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Spades />
    </div>
  );
}