import { Metadata } from 'next';
import MinesweeperGame from '@/components/games/minesweeper';

export const metadata: Metadata = {
  title: 'Minesweeper - Classic Puzzle Game Online | Mini Games',
  description: 'Play Minesweeper online! The classic mine-finding puzzle game with multiple difficulty levels. Click to reveal, flag the mines, and beat your best time!',
  keywords: 'minesweeper, mine sweeper, puzzle game, classic game, logic game, strategy game',
};

export default function MinesweeperPage() {
  return <MinesweeperGame />;
}