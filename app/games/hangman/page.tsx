import Hangman from '@/components/games/Hangman';

export const metadata = {
  title: 'Hangman - Mini Games Platform',
  description: 'Guess the word before the hangman is complete! Test your vocabulary skills.',
};

export default function HangmanPage() {
  return (
    <div className="container-responsive py-8">
      <Hangman />
    </div>
  );
}