import { Metadata } from 'next';
import Hearts from '@/components/games/card/Hearts';

export const metadata: Metadata = {
  title: 'Hearts - Trick-Taking Card Game | Mini Games',
  description: 'Play Hearts online with AI opponents. Avoid hearts and the Queen of Spades in this classic trick-taking card game. Shoot the moon for bonus points!',
  keywords: ['hearts', 'card game', 'trick-taking', 'hearts online', 'queen of spades', 'shoot the moon'],
  openGraph: {
    title: 'Hearts - Trick-Taking Card Game',
    description: 'Play Hearts online. Classic trick-avoidance card game with strategic depth.',
    type: 'website',
  },
};

export default function HeartsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Hearts />
    </div>
  );
}