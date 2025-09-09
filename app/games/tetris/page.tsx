import { Metadata } from 'next';
import { TetrisWithLevels } from '@/components/games/tetris-with-levels';

export const metadata: Metadata = {
  title: 'Tetris - Mini Games',
  description: 'Play Tetris online! Stack falling blocks to clear lines across 5 difficulty levels. Test your speed and strategy!',
  keywords: 'tetris, puzzle game, block game, falling blocks, classic game, arcade game, tetris levels',
};

export default function TetrisPage() {
  return <TetrisWithLevels />;
}