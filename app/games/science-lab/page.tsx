import { Metadata } from 'next';
import ScienceLab from '@/components/games/science-lab';

export const metadata: Metadata = {
  title: 'Science Lab - Mini Games',
  description: 'Play Science Lab online! Conduct physics experiments with pendulums, projectiles, collisions, and more. Learn science through interactive simulations!',
  keywords: 'science lab, physics, experiments, simulation, pendulum, projectile, energy, educational',
};

export default function ScienceLabPage() {
  return <ScienceLab />;
}