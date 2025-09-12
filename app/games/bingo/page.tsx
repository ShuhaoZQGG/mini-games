import Bingo from '@/components/games/Bingo';

export const metadata = {
  title: 'Bingo - Mini Games Platform',
  description: 'Play classic Bingo with auto-call feature and multiple winning patterns!',
};

export default function BingoPage() {
  return (
    <div className="container-responsive py-8">
      <Bingo />
    </div>
  );
}