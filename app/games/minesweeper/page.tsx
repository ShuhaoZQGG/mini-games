import { Metadata } from 'next';
import MinesweeperWithLevels from '@/components/games/minesweeper-with-levels';

export const metadata: Metadata = {
  title: 'Minesweeper - Classic Puzzle Game Online | Mini Games',
  description: 'Play Minesweeper online! The classic mine-finding puzzle game with multiple difficulty levels. Click to reveal, flag the mines, and beat your best time!',
  keywords: 'minesweeper, mine sweeper, puzzle game, classic game, logic game, strategy game',
};

export default function MinesweeperPage() {
  return <MinesweeperWithLevels />;
}