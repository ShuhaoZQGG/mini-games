import { Metadata } from 'next';
import BlockBlastWithLevels from '@/components/games/BlockBlast';

export const metadata: Metadata = {
  title: 'Block Blast - Block Clearing Puzzle Game | Mini Games',
  description: 'Play Block Blast online! Clear lines by filling rows in this addictive block puzzle game with multiple difficulty levels.',
  keywords: ['block blast', 'puzzle game', 'block clearing', 'tetris-like', 'line clearing', 'puzzle levels'],
  openGraph: {
    title: 'Block Blast - Block Clearing Puzzle',
    description: 'Clear lines by filling rows in this challenging block puzzle game!',
    type: 'website',
  },
};

export default function BlockBlastPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BlockBlastWithLevels />
    </div>
  );
}