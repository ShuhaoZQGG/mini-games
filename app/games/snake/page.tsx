import { Metadata } from 'next';
import { Snake } from '@/components/games/snake';

export const metadata: Metadata = {
  title: 'Snake Game - Classic Arcade Snake | Mini Games',
  description: 'Play the classic Snake game online. Control the snake, eat food, and grow longer without hitting the walls or yourself. Free to play!',
  keywords: ['snake game', 'classic snake', 'arcade game', 'retro game', 'online snake', 'free game'],
  openGraph: {
    title: 'Snake Game - Classic Arcade Snake',
    description: 'Play the classic Snake game online. Control the snake and see how long you can grow!',
    type: 'website',
  },
};

export default function SnakePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Snake />
    </div>
  );
}