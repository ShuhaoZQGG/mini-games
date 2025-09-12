import { Metadata } from 'next';
import GeometryDash from '@/components/games/GeometryDash';

export const metadata: Metadata = {
  title: 'Geometry Dash - Rhythm Platformer | Mini Games',
  description: 'Play Geometry Dash online. Jump to the rhythm and avoid obstacles in this challenging platformer game.',
  keywords: ['geometry dash', 'rhythm game', 'platformer', 'jumping game', 'music game'],
};

export default function GeometryDashPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GeometryDash />
    </div>
  );
}
