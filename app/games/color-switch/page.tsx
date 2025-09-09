import { Metadata } from 'next';
import ColorSwitchWithLevels from '@/components/games/color-switch-with-levels';

export const metadata: Metadata = {
  title: 'Color Switch - Color Matching Reflex Game | Mini Games',
  description: 'Test your reflexes in Color Switch! Navigate through color-coded obstacles, collect power-ups, and see how far you can go. Features smooth physics and increasing difficulty. Free to play!',
  keywords: ['color switch', 'reflex game', 'color matching', 'obstacle game', 'arcade game', 'reaction game'],
  openGraph: {
    title: 'Color Switch - Color Matching Reflex Game',
    description: 'Navigate through color-coded obstacles and test your reflexes!',
    type: 'website',
  },
};

export default function ColorSwitchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ColorSwitchWithLevels />
    </div>
  );
}