import { Metadata } from 'next';
import SpeedRunner from '@/components/games/action/SpeedRunner';

export const metadata: Metadata = {
  title: 'Speed Runner | Mini Games',
  description: 'Run and jump at high speeds through challenging platforms.',
  keywords: ['speed runner', 'platformer', 'running game', 'action game'],
};

export default function SpeedRunnerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SpeedRunner />
    </div>
  );
}
