import { Metadata } from 'next';
import PacManWithLevels from '@/components/games/pacman-with-levels';

export const metadata: Metadata = {
  title: 'Pac-Man - Classic Arcade Game | Mini Games',
  description: 'Play the classic Pac-Man arcade game online. Navigate mazes, avoid ghosts, eat power pellets, and collect fruits for bonus points. Free to play!',
  keywords: ['pac-man', 'pacman game', 'arcade game', 'retro game', 'classic game', 'maze game', 'ghosts'],
  openGraph: {
    title: 'Pac-Man - Classic Arcade Game',
    description: 'Play the classic Pac-Man arcade game online. Navigate mazes, avoid ghosts, and collect all the dots!',
    type: 'website',
  },
};

export default function PacManPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PacManWithLevels />
    </div>
  );
}