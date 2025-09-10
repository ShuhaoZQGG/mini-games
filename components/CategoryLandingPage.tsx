'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Users, Star, TrendingUp, Filter, SortAsc, Grid, List } from 'lucide-react';
import { CategoryWithGames, GameMetadata } from '@/types/category';
import { GameCard } from '@/components/GameCard';
import { CategoryBadge } from '@/components/CategoryBadge';

interface CategoryLandingPageProps {
  category: CategoryWithGames;
}

const relatedCategories: Record<string, string[]> = {
  puzzle: ['strategy', 'memory', 'skill'],
  action: ['arcade', 'skill', 'sports'],
  strategy: ['puzzle', 'card', 'skill'],
  arcade: ['action', 'skill', 'casino'],
  card: ['strategy', 'casino', 'puzzle'],
  word: ['puzzle', 'memory', 'quiz'],
  skill: ['action', 'arcade', 'puzzle'],
  casino: ['card', 'arcade', 'skill'],
  memory: ['puzzle', 'word', 'skill'],
  sports: ['action', 'arcade', 'skill'],
  quiz: ['word', 'memory', 'puzzle'],
};

export function CategoryLandingPage({ category }: CategoryLandingPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'difficulty' | 'playtime'>('popular');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterPlayTime, setFilterPlayTime] = useState<string>('');

  // Get sorted and filtered games
  const filteredGames = useMemo(() => {
    let games = [...category.games];

    // Apply difficulty filter
    if (filterDifficulty) {
      games = games.filter((g) => g.difficulty === filterDifficulty);
    }

    // Apply play time filter
    if (filterPlayTime) {
      games = games.filter((g) => {
        switch (filterPlayTime) {
          case 'quick':
            return g.avg_play_time <= 5;
          case 'medium':
            return g.avg_play_time > 5 && g.avg_play_time <= 15;
          case 'long':
            return g.avg_play_time > 15;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        games.sort((a, b) => b.play_count - a.play_count);
        break;
      case 'name':
        games.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty':
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        games.sort(
          (a, b) =>
            (diffOrder[a.difficulty as keyof typeof diffOrder] || 0) -
            (diffOrder[b.difficulty as keyof typeof diffOrder] || 0)
        );
        break;
      case 'playtime':
        games.sort((a, b) => a.avg_play_time - b.avg_play_time);
        break;
    }

    return games;
  }, [category.games, filterDifficulty, filterPlayTime, sortBy]);

  // Get most played games
  const mostPlayedGames = useMemo(() => {
    return [...category.games]
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5);
  }, [category.games]);

  // Get related categories
  const related = relatedCategories[category.slug] || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section
        className="relative text-white py-16 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${category.color}dd, ${category.color}99)`,
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Games
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="text-6xl md:text-8xl">{category.icon}</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">{category.name} Games</h1>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="font-semibold">{category.games.length}</span>
                    <span className="ml-2 opacity-90">Games Available</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="font-semibold">
                      {category.games.reduce((acc, g) => acc + g.play_count, 0).toLocaleString()}
                    </span>
                    <span className="ml-2 opacity-90">Total Plays</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Difficulty Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Play Time Filter */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterPlayTime}
                      onChange={(e) => setFilterPlayTime(e.target.value)}
                      className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Durations</option>
                      <option value="quick">Quick (5 min or less)</option>
                      <option value="medium">Medium (5-15 min)</option>
                      <option value="long">Long (15+ min)</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4 text-gray-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="name">Alphabetical</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="playtime">Play Time</option>
                    </select>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(filterDifficulty || filterPlayTime) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                  {filterDifficulty && (
                    <button
                      onClick={() => setFilterDifficulty('')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {filterDifficulty}
                      <span className="text-xs">✕</span>
                    </button>
                  )}
                  {filterPlayTime && (
                    <button
                      onClick={() => setFilterPlayTime('')}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {filterPlayTime === 'quick' ? '5 min or less' : filterPlayTime === 'medium' ? '5-15 min' : '15+ min'}
                      <span className="text-xs">✕</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Games Display */}
            {filteredGames.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredGames.map((game) => (
                    <div key={game.id} className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <CategoryBadge category={category.slug} size="sm" />
                      </div>
                      <GameCard game={game} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {game.name}
                            </h3>
                            <CategoryBadge category={category.slug} size="sm" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {game.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span
                              className={`font-medium ${
                                game.difficulty === 'easy'
                                  ? 'text-green-600'
                                  : game.difficulty === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {game.difficulty}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {game.avg_play_time} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {game.player_count}
                            </span>
                            {game.play_count > 0 && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {game.play_count.toLocaleString()} plays
                              </span>
                            )}
                            {game.rating && (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-3 h-3 fill-current" />
                                {game.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-6">
                          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                            Play Now
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  No games found with the selected filters
                </p>
                <button
                  onClick={() => {
                    setFilterDifficulty('');
                    setFilterPlayTime('');
                  }}
                  className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* Most Played Games */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Most Played
              </h2>
              <div className="space-y-3">
                {mostPlayedGames.map((game, index) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.slug}`}
                    className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {game.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {game.play_count.toLocaleString()} plays
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Related Categories */}
            {related.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Related Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {related.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${cat}`}
                      className="inline-block"
                    >
                      <CategoryBadge category={cat} size="md" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}