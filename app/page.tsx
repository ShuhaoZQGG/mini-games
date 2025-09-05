import Link from 'next/link'

export default function HomePage() {
  const games = [
    { id: 'cps-test', name: 'CPS Test', description: 'Test your clicking speed', path: '/games/cps-test' },
    { id: 'memory-match', name: 'Memory Match', description: 'Match the cards', path: '/games/memory-match' },
    { id: 'typing-test', name: 'Typing Test', description: 'Test your typing speed', path: '/games/typing-test' },
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