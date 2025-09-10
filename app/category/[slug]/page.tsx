'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Filter, Grid, List } from 'lucide-react';
import { CategoryService } from '@/services/categoryService';
import { CategoryWithGames } from '@/types/category';
import { GameCard } from '@/components/GameCard';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<CategoryWithGames | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'difficulty'>('popular');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  useEffect(() => {
    loadCategory();
  }, [slug]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategoryWithGames(slug);
      setCategory(data);
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedAndFilteredGames = () => {
    if (!category) return [];
    
    let games = [...category.games];

    // Apply filter
    if (filterDifficulty) {
      games = games.filter(g => g.difficulty === filterDifficulty);
    }

    // Apply sort
    switch (sortBy) {
      case 'popular':
        games.sort((a, b) => b.play_count - a.play_count);
        break;
      case 'name':
        games.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        games.sort((a, b) => 
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        );
        break;
    }

    return games;
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

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">Category not found</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const games = getSortedAndFilteredGames();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Category Header */}
      <section 
        className="text-white py-12"
        style={{ 
          background: `linear-gradient(135deg, ${category.color}dd, ${category.color}99)` 
        }}
      >
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{category.name}</h1>
              <p className="text-lg opacity-90 mt-2">{category.description}</p>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded">
              {games.length} games
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter:
                </span>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="name">Alphabetical</option>
                  <option value="difficulty">Difficulty</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Games Grid/List */}
        {games.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {game.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className={`font-medium ${
                          game.difficulty === 'easy' ? 'text-green-600' :
                          game.difficulty === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {game.difficulty}
                        </span>
                        <span>{game.avg_play_time} min</span>
                        <span>{game.player_count} players</span>
                        {game.play_count > 0 && (
                          <span>{game.play_count.toLocaleString()} plays</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Play Now
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No games found in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}