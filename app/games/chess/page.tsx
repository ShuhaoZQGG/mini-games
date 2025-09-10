import { Metadata } from 'next';
import Chess from '@/components/games/strategic/Chess';

export const metadata: Metadata = {
  title: 'Chess - Ultimate Strategy Board Game | Mini Games',
  description: 'Play Chess online with AI opponent. Master the ultimate strategy game with castling, en passant, and checkmate detection. Multiple difficulty levels available!',
  keywords: ['chess', 'strategy game', 'board game', 'chess online', 'chess AI', 'checkmate', 'castling', 'en passant'],
  openGraph: {
    title: 'Chess - Ultimate Strategy Board Game',
    description: 'Play Chess online with AI opponent. Master the ultimate strategy game with multiple difficulty levels.',
    type: 'website',
  },
};

export default function ChessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Chess />
    </div>
  );
}