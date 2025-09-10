import Link from 'next/link'
import { CategoryGrid } from '../components/CategoryGrid'
import { GameCard } from '../components/GameCard'
import { getPopularGames, getFeaturedGames, ALL_GAMES_DATA } from '../lib/data/gameMetadata'

export default function HomePage() {
  const popularGames = getPopularGames(8)
  const featuredGames = getFeaturedGames()
  
  // Get multiplayer games (these aren't categorized yet but we'll show them separately)
  const multiplayerGames = [
    { id: 'chess', name: 'Chess', description: 'Strategic board game', path: '/games/chess' },
    { id: 'pool', name: '8-Ball Pool', description: 'Classic billiards game', path: '/games/pool' },
    { id: 'checkers', name: 'Checkers', description: 'Classic strategy game', path: '/games/checkers' },
    { id: 'battleship', name: 'Battleship', description: 'Naval strategy game', path: '/games/battleship' },
    { id: 'air-hockey', name: 'Air Hockey', description: 'Fast-paced table game', path: '/games/air-hockey' },
    { id: 'go', name: 'Go', description: 'Ancient strategy game', path: '/games/go' },
    { id: 'reversi', name: 'Reversi/Othello', description: 'Disc-flipping strategy', path: '/games/reversi' },
    { id: 'backgammon', name: 'Backgammon', description: 'Classic board game', path: '/games/backgammon' },
    { id: 'dots-and-boxes', name: 'Dots and Boxes', description: 'Connect dots to win', path: '/games/dots-and-boxes' },
    { id: 'mahjong-solitaire', name: 'Mahjong Solitaire', description: 'Tile matching puzzle', path: '/games/mahjong-solitaire' },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-indigo-700 text-white py-16">
        <div className="container-responsive text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Play Free Mini Games</h1>
          <p className="text-xl mb-8">No registration required. Start playing instantly!</p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="text-3xl font-bold">{ALL_GAMES_DATA.length}+</span>
              <p>Games Available</p>
            </div>
            <div>
              <span className="text-3xl font-bold">9</span>
              <p>Categories</p>
            </div>
            <div>
              <span className="text-3xl font-bold">Free</span>
              <p>Forever</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-responsive py-12">
        {/* Featured Games */}
        {featuredGames.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Featured Games</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredGames.map((game) => (
                <GameCard key={game.id} game={game} compact featured />
              ))}
            </div>
          </section>
        )}

        {/* Browse by Category */}
        <section id="categories" className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Browse by Category</h2>
            <Link href="/games" className="text-primary hover:underline">
              View All Games →
            </Link>
          </div>
          <CategoryGrid featured={['arcade', 'puzzle']} />
        </section>

        {/* Popular Games */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Popular Right Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {popularGames.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className="text-center cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center text-3xl">
                    {/* Placeholder for game icon */}
                    🎮
                  </div>
                  <p className="text-sm font-medium">{game.name}</p>
                  <p className="text-xs text-gray-500">{game.avgPlayTime}m</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Multiplayer Games Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Multiplayer Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {multiplayerGames.map((game) => (
              <Link key={game.id} href={game.path}>
                <div className="game-card cursor-pointer hover:scale-105 transition-transform border-2 border-blue-500">
                  <h4 className="text-xl font-semibold mb-2">{game.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{game.description}</p>
                  <span className="inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded mb-2">Multiplayer</span>
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