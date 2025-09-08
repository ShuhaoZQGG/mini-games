import { Metadata } from 'next';
import ReactionTimeGame from '@/components/games/reaction-time';

export const metadata: Metadata = {
  title: 'Reaction Time Test - Test Your Reflexes | Mini Games',
  description: 'Test your reaction time and reflexes with our instant reaction speed test. Click as fast as you can when the screen turns green!',
  keywords: 'reaction time test, reflex test, reaction speed, click speed, response time',
};

export default function ReactionTimePage() {
  return <ReactionTimeGame />;
}