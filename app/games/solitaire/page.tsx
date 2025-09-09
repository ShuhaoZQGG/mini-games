import { Metadata } from 'next';
import { Solitaire } from '@/components/games/solitaire';

export const metadata: Metadata = {
  title: 'Solitaire - Classic Card Game | Mini Games',
  description: 'Play classic Solitaire (Klondike) online. Move all cards to foundations by suit in ascending order. Free to play!',
  keywords: 'solitaire, klondike, card game, patience, classic games, online solitaire',
};

export default function SolitairePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Solitaire</h1>
      <Solitaire />
    </div>
  );
}