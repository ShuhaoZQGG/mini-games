'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryGrid } from '@/components/CategoryGrid';
import { GameCard } from '@/components/GameCard';
import { GameSearch } from '@/components/GameSearch';
import { CategoryService } from '@/services/categoryService';
import { Category, GameMetadata } from '@/types/category';
import { TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredGames, setFeaturedGames] = useState<GameMetadata[]>([]);
  const [recentGames, setRecentGames] = useState<GameMetadata[]>([]);
  const [searchResults, setSearchResults] = useState<GameMetadata[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, featuredData] = await Promise.all([
        CategoryService.getCategories(),
        CategoryService.getFeaturedGames()
      ]);
      
      setCategories(categoriesData);
      setFeaturedGames(featuredData);

      // Load recent games if user is logged in
      if (user) {
        const recentData = await CategoryService.getRecentlyPlayedGames(user.id);
        setRecentGames(recentData);
      }
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (games: GameMetadata[]) => {
    setSearchResults(games);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Play 40+ Free Mini Games
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              No registration required. Start playing instantly!
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <GameSearch
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search Results */}
        {searchResults !== null ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search Results ({searchResults.length} games)
              </h2>
              <button
                onClick={handleClearSearch}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear Search
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchResults.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No games found. Try adjusting your search or filters.
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Continue Playing Section */}
            {user && recentGames.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Continue Playing
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {recentGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎮</div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {game.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Browse Categories */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Browse Categories
              </h2>
              <CategoryGrid categories={categories} />
              <div className="text-center mt-6">
                <Link
                  href="/categories"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View All Categories →
                </Link>
              </div>
            </section>

            {/* Featured Games */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Featured Games
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>

            {/* Popular Right Now */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Popular Right Now
                </h2>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {featuredGames.slice(0, 6).map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="flex-shrink-0 w-32 text-center group"
                    >
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center text-4xl mb-2 group-hover:scale-105 transition-transform">
                        🎮
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {game.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {game.play_count.toLocaleString()} plays
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* Daily Challenge CTA */}
            <section className="mb-12">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-4">Daily Challenges</h2>
                  <p className="text-lg mb-6 opacity-90">
                    Complete daily challenges to earn XP and climb the leaderboards!
                  </p>
                  <Link
                    href="/challenges"
                    className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    View Today's Challenges
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}