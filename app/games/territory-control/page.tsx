import { Metadata } from 'next';
import TerritoryControl from '@/components/games/territory-control';

export const metadata: Metadata = {
  title: 'Territory Control - Area Domination Strategy Game | Mini Games',
  description: 'Command your armies to conquer territories and dominate the map. Strategic area control with challenging AI opponents.',
  keywords: 'territory control, strategy game, area domination, conquest game, tactical warfare',
};

export default function TerritoryControlPage() {
  return <TerritoryControl />;
}