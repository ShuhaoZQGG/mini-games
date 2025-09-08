import Link from 'next/link'

export default function HomePage() {
  const games = [
    { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', path: '/games/cps-test' },
    { id: 'reaction-time', name: 'Reaction Time', description: 'Test your reflexes', path: '/games/reaction-time' },
    { id: 'aim-trainer', name: 'Aim Trainer', description: 'Test your accuracy', path: '/games/aim-trainer' },
    { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', path: '/games/memory-match' },
    { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', path: '/games/typing-test' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', description: 'Classic X and O game', path: '/games/tic-tac-toe' },
    { id: 'minesweeper', name: 'Minesweeper', description: 'Find all the mines', path: '/games/minesweeper' },
    { id: 'snake', name: 'Snake', description: 'Classic snake game', path: '/games/snake' },
    { id: '2048', name: '2048', description: 'Slide tiles to reach 2048', path: '/games/2048' },
    { id: 'sudoku', name: 'Sudoku', description: 'Number puzzle game', path: '/games/sudoku' },
    { id: 'connect-four', name: 'Connect Four', description: 'Get four in a row', path: '/games/connect-four' },
    { id: 'word-search', name: 'Word Search', description: 'Find hidden words', path: '/games/word-search' },
    { id: 'tetris', name: 'Tetris', description: 'Stack falling blocks', path: '/games/tetris' },
    { id: 'breakout', name: 'Breakout', description: 'Break all the bricks', path: '/games/breakout' },
    { id: 'mental-math', name: 'Mental Math', description: 'Solve math problems', path: '/games/mental-math' },
  ]

  return (
    <div>
      <section className="bg-gradient-to-b from-primary to-indigo-700 text-white py-16">
        <div className="container-responsive text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Play Free Mini Games</h1>
          <p className="text-xl">No registration required. Start playing instantly!</p>
        </div>
      </section>

      <div className="container-responsive py-12">
        <section>
          <h2 className="text-2xl font-semibold mb-6">Popular Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className="game-card cursor-pointer hover:scale-105 transition-transform">
                  <h4 className="text-xl font-semibold mb-2">{game.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{game.description}</p>
                  <button className="mt-4 btn-primary">Play Now</button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}