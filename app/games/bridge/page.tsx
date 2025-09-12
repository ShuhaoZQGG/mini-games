import { Metadata } from 'next';
import BridgeGame from '@/components/games/bridge';

export const metadata: Metadata = {
  title: 'Bridge - Mini Games',
  description: 'Play Bridge online! Classic card game with bidding system and trick-taking. Test your strategy and partnership skills!',
  keywords: 'bridge, card game, bidding, trick taking, partnership, strategy game, contract bridge',
};

export default function BridgePage() {
  return <BridgeGame />;
}