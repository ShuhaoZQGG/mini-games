import { Metadata } from 'next';
import BackgammonPro from '@/components/games/backgammon-pro';

export const metadata: Metadata = {
  title: 'Backgammon Pro - Mini Games',
  description: 'Play Backgammon Pro online! Classic board game with dice, doubling cube, and bearing off. Test your strategy and luck!',
  keywords: 'backgammon, board game, dice game, doubling cube, strategy, bearing off, classic game',
};

export default function BackgammonProPage() {
  return <BackgammonPro />;
}