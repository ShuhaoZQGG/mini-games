import { Metadata } from 'next';
import FlowFree from '@/components/games/FlowFree';

export const metadata: Metadata = {
  title: 'Flow Free - Connect Colors Puzzle | Mini Games',
  description: 'Play Flow Free online. Connect matching colors without crossing paths in this addictive puzzle game.',
  keywords: ['flow free', 'connect colors', 'puzzle game', 'logic game', 'path puzzle'],
};

export default function FlowFreePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FlowFree />
    </div>
  );
}
