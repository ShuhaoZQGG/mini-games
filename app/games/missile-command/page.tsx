import { Metadata } from 'next';
import MissileCommand from '@/components/games/missile-command';

export const metadata: Metadata = {
  title: 'Missile Command - Mini Games',
  description: 'Play Missile Command online! Classic arcade defense game. Protect your cities from incoming missiles!',
  keywords: 'missile command, arcade, defense, retro game, classic, shooting, strategy',
};

export default function MissileCommandPage() {
  return <MissileCommand />;
}