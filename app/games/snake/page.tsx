import { Metadata } from 'next';
import SnakeWithLevels from '@/components/games/snake-with-levels';

export const metadata: Metadata = {
  title: 'Snake Game - Classic Arcade Snake with Levels | Mini Games',
  description: 'Play the classic Snake game online with multiple difficulty levels. Control the snake, eat food, and grow longer without hitting the walls or yourself. Free to play!',
  keywords: ['snake game', 'classic snake', 'arcade game', 'retro game', 'online snake', 'free game', 'difficulty levels'],
  openGraph: {
    title: 'Snake Game - Classic Arcade Snake with Levels',
    description: 'Play the classic Snake game online with 5 difficulty levels. Control the snake and see how long you can grow!',
    type: 'website',
  },
};

export default function SnakePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SnakeWithLevels />
    </div>
  );
}