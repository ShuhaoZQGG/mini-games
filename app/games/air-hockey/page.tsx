import { Metadata } from 'next';
import { AirHockeyGame } from '@/src/components/games/air-hockey/air-hockey-game';

export const metadata: Metadata = {
  title: 'Air Hockey - Fast-Paced Table Game | Mini Games',
  description: 'Play Air Hockey online with smooth physics and responsive controls. Score goals against AI opponent with multiple difficulty levels. Fast-paced arcade action!',
  keywords: ['air hockey', 'arcade game', 'table hockey', 'air hockey online', 'puck game', 'sports game', 'multiplayer air hockey'],
  openGraph: {
    title: 'Air Hockey - Fast-Paced Table Game',
    description: 'Experience fast-paced Air Hockey action with smooth physics and challenging AI opponent!',
    type: 'website',
  },
};

export default function AirHockeyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AirHockeyGame />
    </div>
  );
}