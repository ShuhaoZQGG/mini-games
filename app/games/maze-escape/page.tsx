import { Metadata } from 'next';
import MazeEscape from '@/components/games/maze-escape';

export const metadata: Metadata = {
  title: 'Maze Escape - Strategic Maze Navigation | Mini Games',
  description: 'Navigate through challenging mazes with limited moves. Collect keys, avoid traps, and find the exit before running out of moves.',
  keywords: 'maze escape, maze game, strategic navigation, puzzle game, limited moves',
};

export default function MazeEscapePage() {
  return <MazeEscape />;
}