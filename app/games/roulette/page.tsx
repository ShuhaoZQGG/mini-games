import Roulette from '@/components/games/Roulette';

export const metadata = {
  title: 'Roulette - Mini Games Platform',
  description: 'Spin the wheel and test your luck in this classic casino game!',
};

export default function RoulettePage() {
  return (
    <div className="container-responsive py-8">
      <Roulette />
    </div>
  );
}