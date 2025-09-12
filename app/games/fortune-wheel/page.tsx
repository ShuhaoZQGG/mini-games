import { Metadata } from 'next';
import FortuneWheel from '@/components/games/casual/FortuneWheel';

export const metadata: Metadata = {
  title: 'Fortune Wheel | Mini Games',
  description: 'Spin the wheel of fortune and win prizes.',
  keywords: ['fortune wheel', 'wheel of fortune', 'luck game', 'casino'],
};

export default function FortuneWheelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FortuneWheel />
    </div>
  );
}
