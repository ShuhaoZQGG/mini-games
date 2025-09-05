import { Metadata } from 'next';
import RealtimeShowcase from '@/components/realtime-showcase';

export const metadata: Metadata = {
  title: 'Real-time Features Demo - Live Gaming Platform | Mini Games',
  description: 'Experience real-time gaming features: live leaderboards, player presence, instant score updates, and game events broadcasting.',
  keywords: ['realtime gaming', 'live leaderboard', 'multiplayer games', 'websocket games', 'online gaming platform'],
};

export default function RealtimeDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Real-time Features Showcase</h1>
          <p className="text-lg text-muted-foreground">
            Experience the power of real-time gaming with live updates, presence tracking, and instant score sharing
          </p>
        </div>
        
        <RealtimeShowcase />
      </div>
    </div>
  );
}