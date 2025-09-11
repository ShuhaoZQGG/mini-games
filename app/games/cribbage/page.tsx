import { Metadata } from 'next';
import Cribbage from '@/components/games/cribbage';

export const metadata: Metadata = {
  title: 'Cribbage - Mini Games',
  description: 'Play Cribbage online! Classic card game with pegging board and unique scoring system. Race to 121 points!',
  keywords: 'cribbage, card game, pegging, crib, fifteens, pairs, runs, classic game',
};

export default function CribbagePage() {
  return <Cribbage />;
}