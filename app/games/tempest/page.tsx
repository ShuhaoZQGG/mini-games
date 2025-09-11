import { Metadata } from 'next';
import Tempest from '@/components/games/tempest';

export const metadata: Metadata = {
  title: 'Tempest - Mini Games',
  description: 'Play Tempest online! Classic arcade tube shooter with geometric enemies. Navigate the web and blast your way through!',
  keywords: 'tempest, arcade, tube shooter, retro game, classic, geometric, vector graphics',
};

export default function TempestPage() {
  return <Tempest />;
}