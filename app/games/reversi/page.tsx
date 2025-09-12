import { Metadata } from 'next';
import Reversi from '@/components/games/strategic/Reversi';

export const metadata: Metadata = {
  title: 'Reversi (Othello) - Strategic Board Game | Mini Games',
  description: 'Play Reversi/Othello online with AI opponent. Flip discs to dominate the board with strategic corner control. Multiple difficulty levels!',
  keywords: ['reversi', 'othello', 'board game', 'strategy', 'flip game', 'reversi online', 'othello online'],
  openGraph: {
    title: 'Reversi (Othello) - Strategic Board Game',
    description: 'Play Reversi/Othello online. Flip discs and control the board in this classic strategy game.',
    type: 'website',
  },
};

export default function ReversiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Reversi />
    </div>
  );
}