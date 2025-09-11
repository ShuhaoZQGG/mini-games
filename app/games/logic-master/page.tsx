import { Metadata } from 'next';
import LogicMaster from '@/components/games/puzzle/LogicMaster';

export const metadata: Metadata = {
  title: 'Logic Master | Mini Games',
  description: 'Solve logic puzzles and deduction challenges.',
  keywords: ['logic puzzle', 'deduction', 'brain game', 'logic master'],
};

export default function LogicMasterPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LogicMaster />
    </div>
  );
}
