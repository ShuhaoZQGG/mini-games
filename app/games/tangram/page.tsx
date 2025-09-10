import { Metadata } from 'next';
import Tangram from '@/components/games/Tangram';

export const metadata: Metadata = {
  title: 'Tangram - Shape Arrangement Puzzle | Mini Games',
  description: 'Play Tangram online. Arrange geometric shapes to match target patterns in this classic puzzle game.',
  keywords: ['tangram', 'shape puzzle', 'spatial puzzle', 'geometric puzzle', 'arrangement game'],
};

export default function TangramPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tangram />
    </div>
  );
}
