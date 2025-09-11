import { Metadata } from 'next';
import CookieClicker from '@/components/games/casual/CookieClicker';

export const metadata: Metadata = {
  title: 'Cookie Clicker Evolution | Mini Games',
  description: 'Click cookies and build your cookie empire.',
  keywords: ['cookie clicker', 'idle game', 'clicker game', 'incremental'],
};

export default function CookieClickerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CookieClicker />
    </div>
  );
}
