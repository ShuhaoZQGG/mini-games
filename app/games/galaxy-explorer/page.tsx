import { Metadata } from 'next';
import GalaxyExplorer from '@/components/games/action/GalaxyExplorer';

export const metadata: Metadata = {
  title: 'Galaxy Explorer | Mini Games',
  description: 'Explore the galaxy and discover new planets.',
  keywords: ['galaxy explorer', 'space game', 'exploration', 'adventure'],
};

export default function GalaxyExplorerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GalaxyExplorer />
    </div>
  );
}
