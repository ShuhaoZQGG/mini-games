import { Metadata } from 'next';
import War from '@/components/games/card/War';

export const metadata: Metadata = {
  title: 'War - Simple Card Battle Game | Mini Games',
  description: 'Play War card game online. Simple and exciting card battle game where highest card wins. Perfect for quick games!',
  keywords: ['war card game', 'card battle', 'simple card game', 'war online', 'quick game'],
  openGraph: {
    title: 'War - Simple Card Battle Game',
    description: 'Play War card game online. Simple battle where highest card wins!',
    type: 'website',
  },
};

export default function WarPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <War />
    </div>
  );
}