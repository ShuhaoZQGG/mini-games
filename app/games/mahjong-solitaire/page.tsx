import { Metadata } from 'next';
import MahjongSolitaire from '@/components/games/MahjongSolitaire';

export const metadata: Metadata = {
  title: 'Mahjong Solitaire - Classic Tile Matching | Mini Games',
  description: 'Play Mahjong Solitaire online. Match tiles to clear the board with multiple layouts including Dragon, Pyramid, Butterfly, and Fortress.',
  keywords: ['mahjong solitaire', 'tile matching', 'puzzle game', 'mahjong', 'matching game'],
};

export default function MahjongSolitairePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MahjongSolitaire />
    </div>
  );
}
