import { Metadata } from 'next';
import { Tetris } from '@/components/games/tetris';

export const metadata: Metadata = {
  title: 'Tetris - Mini Games',
  description: 'Play Tetris online! Stack falling blocks to clear lines in this classic puzzle game. Test your speed and strategy!',
  keywords: 'tetris, puzzle game, block game, falling blocks, classic game, arcade game',
};

export default function TetrisPage() {
  return <Tetris />;
}