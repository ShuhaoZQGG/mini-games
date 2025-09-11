import { Metadata } from 'next';
import LogicGridWithLevels from '@/components/games/LogicGrid';

export const metadata: Metadata = {
  title: 'Logic Grid - Grid-Based Logic Puzzles | Mini Games',
  description: 'Play Logic Grid puzzles online! Solve challenging logic puzzles using clues and deduction in this brain-training game.',
  keywords: ['logic grid', 'logic puzzle', 'deduction game', 'brain training', 'puzzle solving', 'grid puzzle'],
  openGraph: {
    title: 'Logic Grid - Deduction Puzzle Game',
    description: 'Solve challenging logic puzzles using clues and deduction!',
    type: 'website',
  },
};

export default function LogicGridPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LogicGridWithLevels />
    </div>
  );
}