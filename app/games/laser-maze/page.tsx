import { Metadata } from 'next'
import LaserMaze from '@/components/games/laser-maze'

export const metadata: Metadata = {
  title: 'Laser Maze - Navigate Through Obstacles | Mini Games',
  description: 'Navigate through dangerous laser obstacles and reach the goal in this challenging puzzle action game!',
  keywords: 'laser maze, obstacle course, puzzle game, action game, navigation',
}

export default function LaserMazePage() {
  return <LaserMaze />
}