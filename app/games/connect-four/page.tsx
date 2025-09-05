import { Metadata } from 'next';
import { ConnectFour } from '@/components/games/connect-four';

export const metadata: Metadata = {
  title: 'Connect Four - Mini Games',
  description: 'Play Connect Four online! Drop your pieces strategically to get four in a row horizontally, vertically, or diagonally.',
  keywords: 'connect four, strategy game, board game, online game, mini game',
};

export default function ConnectFourPage() {
  return <ConnectFour />;
}