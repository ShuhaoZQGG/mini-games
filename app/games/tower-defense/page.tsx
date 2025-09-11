import { Metadata } from 'next';
import TowerDefense from '@/components/games/tower-defense';

export const metadata: Metadata = {
  title: 'Tower Defense Lite - Strategic Tower Placement Game | Mini Games',
  description: 'Place towers strategically to defend against waves of enemies. Multiple tower types, upgrade paths, and challenging levels.',
  keywords: 'tower defense, strategy game, tower placement, wave defense, tactical game',
};

export default function TowerDefensePage() {
  return <TowerDefense />;
}