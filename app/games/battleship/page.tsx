import { Metadata } from 'next';
import Battleship from '@/components/games/multiplayer/Battleship';

export const metadata: Metadata = {
  title: 'Battleship - Naval Strategy Game | Mini Games',
  description: 'Play the classic Battleship game online. Place your fleet strategically and sink enemy ships. Features smart AI with multiple difficulty levels.',
  keywords: ['battleship', 'naval strategy', 'strategy game', 'battleship online', 'sea battle', 'ship placement', 'multiplayer battleship'],
  openGraph: {
    title: 'Battleship - Naval Strategy Game',
    description: 'Command your fleet in the classic Battleship game. Strategic ship placement and tactical attacks!',
    type: 'website',
  },
};

export default function BattleshipPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Battleship />
    </div>
  );
}