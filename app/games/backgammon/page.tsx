import { Metadata } from 'next';
import Backgammon from '@/components/games/strategic/Backgammon';

export const metadata: Metadata = {
  title: 'Backgammon - Ancient Dice Strategy Game | Mini Games',
  description: 'Play Backgammon online with AI opponent. Roll dice, move checkers, and bear off in this ancient strategy game. Features doubling cube!',
  keywords: ['backgammon', 'board game', 'dice game', 'strategy', 'backgammon online', 'doubling cube', 'bearing off'],
  openGraph: {
    title: 'Backgammon - Ancient Dice Strategy Game',
    description: 'Play Backgammon online. Ancient board game combining strategy and dice luck.',
    type: 'website',
  },
};

export default function BackgammonPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Backgammon />
    </div>
  );
}