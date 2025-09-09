import { Metadata } from 'next';
import SnakeRealtimeWithLevels from '@/components/games/snake-realtime-with-levels';

export const metadata: Metadata = {
  title: 'Snake Game with Real-time Features - Live Leaderboard | Mini Games',
  description: 'Play Snake with real-time leaderboard updates, live player presence, and instant score sharing. Compete with players worldwide!',
  keywords: ['snake game', 'realtime game', 'live leaderboard', 'multiplayer snake', 'online snake', 'competitive gaming'],
  openGraph: {
    title: 'Snake Game - Real-time Competition',
    description: 'Play Snake with live leaderboard updates and see who\'s playing right now!',
    type: 'website',
  },
};

export default function SnakeRealtimePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SnakeRealtimeWithLevels />
    </div>
  );
}