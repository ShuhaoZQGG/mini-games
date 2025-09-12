import { Metadata } from 'next';
import { SolitaireWithLevels } from '@/components/games/solitaire-with-levels';

export const metadata: Metadata = {
  title: 'Solitaire - Classic Card Game | Mini Games',
  description: 'Play classic Solitaire (Klondike) online. Move all cards to foundations by suit in ascending order. Free to play!',
  keywords: 'solitaire, klondike, card game, patience, classic games, online solitaire',
};

export default function SolitairePage() {
  return <SolitaireWithLevels />;
}