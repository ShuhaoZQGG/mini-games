import { Metadata } from 'next';
import Checkers from '@/components/games/strategic/Checkers';

export const metadata: Metadata = {
  title: 'Checkers - Classic Board Game | Mini Games',
  description: 'Play Checkers (Draughts) online with AI opponent. Jump over pieces, get kings, and capture all enemy pieces. Multiple difficulty levels!',
  keywords: ['checkers', 'draughts', 'board game', 'strategy', 'checkers online', 'king me', 'jumping game'],
  openGraph: {
    title: 'Checkers - Classic Board Game',
    description: 'Play Checkers online with AI opponent. Classic strategy board game with multiple difficulty levels.',
    type: 'website',
  },
};

export default function CheckersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Checkers />
    </div>
  );
}