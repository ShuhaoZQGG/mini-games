import { Metadata } from 'next';
import { SolitaireComponent } from '@/components/games/solitaire';

export const metadata: Metadata = {
  title: 'Solitaire (Klondike) - Classic Card Game | Mini Games',
  description: 'Play classic Klondike Solitaire online. Build foundations from Ace to King, arrange cards in alternating colors. Features drag-and-drop, hints, undo, and auto-complete!',
  keywords: ['solitaire', 'klondike', 'card game', 'patience', 'classic solitaire', 'free solitaire', 'online card game'],
  openGraph: {
    title: 'Solitaire (Klondike) - Classic Card Game',
    description: 'Play the timeless classic Klondike Solitaire. Test your strategy and patience!',
    type: 'website',
  },
};

export default function SolitairePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SolitaireComponent />
    </div>
  );
}