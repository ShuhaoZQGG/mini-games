import { Metadata } from 'next';
import BattleTactics from '@/components/games/battle-tactics';

export const metadata: Metadata = {
  title: 'Battle Tactics - Turn-Based Strategy Combat | Mini Games',
  description: 'Command your units in strategic turn-based combat. Multiple unit types, tactical positioning, and challenging AI opponents.',
  keywords: 'battle tactics, turn-based strategy, tactical combat, strategy game, unit command',
};

export default function BattleTacticsPage() {
  return <BattleTactics />;
}