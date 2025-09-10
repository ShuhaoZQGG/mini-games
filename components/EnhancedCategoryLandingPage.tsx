'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Users, Star, Activity, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryWithGames, GameMetadata } from '@/types/category';
import { GameCard } from '@/src/components/GameCard';
import FilterBar, { FilterState } from './CategoryLandingPage/FilterBar';
import FeaturedCarousel, { FeaturedGame } from './CategoryLandingPage/FeaturedCarousel';
import CategoryStats from './CategoryLandingPage/CategoryStats';
import QuickPlay from './CategoryLandingPage/QuickPlay';

interface EnhancedCategoryLandingPageProps {
  category: CategoryWithGames;
}

export function EnhancedCategoryLandingPage({ category }: EnhancedCategoryLandingPageProps) {
  const [filters, setFilters] = useState<FilterState>({
    difficulty: [],
    playTime: [],
    popularity: null,
    searchQuery: ''
  });
  const [quickPlayGameId, setQuickPlayGameId] = useState<string | null>(null);

  // Convert games to featured format
  const featuredGames: FeaturedGame[] = useMemo(() => {
    return category.games
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 3)
      .map(game => ({
        id: game.id,
        name: game.name,
        description: game.description || `Play ${game.name} - A fun ${category.name.toLowerCase()} game!`,
        category: category.name,
        rating: game.rating || 4.5,
        ratingCount: Math.floor(game.play_count / 10) || 100,
        playersOnline: Math.floor(Math.random() * 200) + 50,
        averagePlayTime: game.avg_play_time || 10,
        xpReward: Math.floor(game.play_count / 100) * 10 || 100,
        previewImage: undefined
      }));
  }, [category]);

  // Filter and sort games based on current filters
  const filteredGames = useMemo(() => {
    let games = [...category.games];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      games = games.filter(g => 
        g.name.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
      );
    }

    // Apply difficulty filter
    if (filters.difficulty.length > 0) {
      games = games.filter(g => {
        const gameDifficulty = g.difficulty || 'intermediate';
        return filters.difficulty.includes(gameDifficulty as any);
      });
    }

    // Apply play time filter
    if (filters.playTime.length > 0) {
      games = games.filter(g => {
        const time = g.avg_play_time || 10;
        return filters.playTime.some(pt => {
          switch (pt) {
            case 'quick': return time < 5;
            case 'medium': return time >= 5 && time < 15;
            case 'long': return time >= 15 && time < 30;
            case 'extended': return time >= 30;
            default: return true;
          }
        });
      });
    }

    // Apply popularity sort
    if (filters.popularity) {
      switch (filters.popularity) {
        case 'most-played':
          games.sort((a, b) => b.play_count - a.play_count);
          break;
        case 'top-rated':
          games.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'trending':
          // Simulate trending with a mix of play count
          games.sort((a, b) => {
            const scoreA = a.play_count;
            const scoreB = b.play_count;
            return scoreB - scoreA;
          });
          break;
        case 'new':
          // Filter by featured games (as proxy for new)
          games.sort((a, b) => b.play_count - a.play_count).slice(0, 5);
          break;
      }
    } else {
      // Default sort by play count
      games.sort((a, b) => b.play_count - a.play_count);
    }

    return games;
  }, [category.games, filters]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleQuickPlay = useCallback((gameId: string) => {
    setQuickPlayGameId(gameId);
  }, []);

  const handleCloseQuickPlay = useCallback(() => {
    setQuickPlayGameId(null);
  }, []);

  // Calculate stats
  const categoryStats = {
    totalGames: category.games.length,
    playersOnline: Math.floor(Math.random() * 2000) + 500,
    averageRating: 4.8,
    weeklyGrowth: 15
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Live Stats */}
      <section
        className="relative text-white py-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${category.color}ee, ${category.color}aa)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 relative z-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl">{category.icon}</div>
            <div>
              <h1 className="text-5xl font-bold mb-2">{category.name.toUpperCase()} GAMES</h1>
              <p className="text-xl text-white/90 max-w-2xl">
                {category.description || `Master tactical thinking and strategic planning with our ${category.name.toLowerCase()} games collection.`}
              </p>
            </div>
          </div>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                <span className="font-bold text-2xl">{categoryStats.totalGames}</span>
              </div>
              <p className="text-sm text-white/80">Games</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold text-2xl">{categoryStats.playersOnline.toLocaleString()}</span>
              </div>
              <p className="text-sm text-white/80">Playing Now</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span className="font-bold text-2xl">{categoryStats.averageRating}</span>
              </div>
              <p className="text-sm text-white/80">Average</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-bold text-2xl">234</span>
              </div>
              <p className="text-sm text-white/80">Tournaments</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span className="font-bold text-2xl">+{categoryStats.weeklyGrowth}%</span>
              </div>
              <p className="text-sm text-white/80">This Week</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Featured Games Carousel */}
        {featuredGames.length > 0 && (
          <FeaturedCarousel
            games={featuredGames}
            onQuickPlay={handleQuickPlay}
            showPreview={true}
          />
        )}

        {/* Advanced Filter Bar */}
        <FilterBar
          onFilterChange={handleFilterChange}
          totalGames={category.games.length}
          filteredCount={filteredGames.length}
        />

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Game Grid - 3 columns */}
          <div className="lg:col-span-3">
            {filteredGames.length > 0 ? (
              <motion.div 
                className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {filteredGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div onClick={() => handleQuickPlay(game.id)} className="cursor-pointer">
                      <GameCard
                        game={game}
                        showCategory={true}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No games found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>

          {/* Sidebar with Stats */}
          <div className="lg:col-span-1">
            <CategoryStats
              categoryId={category.id}
              realtime={true}
              showLeaderboard={true}
              showActivity={true}
            />
          </div>
        </div>
      </div>

      {/* Quick Play Modal */}
      {quickPlayGameId && (
        <QuickPlay
          gameId={quickPlayGameId}
          variant="modal"
          onClose={handleCloseQuickPlay}
          preloadAssets={true}
        />
      )}
    </div>
  );
}