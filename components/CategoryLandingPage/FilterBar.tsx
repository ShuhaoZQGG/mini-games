'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'master';
export type PlayTime = 'quick' | 'medium' | 'long' | 'extended';
export type PopularitySort = 'most-played' | 'top-rated' | 'trending' | 'new';

export interface FilterState {
  difficulty: Difficulty[];
  playTime: PlayTime[];
  popularity: PopularitySort | null;
  searchQuery: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  defaultFilters?: FilterState;
  totalGames: number;
  filteredCount: number;
}

export default function FilterBar({ 
  onFilterChange, 
  defaultFilters,
  totalGames,
  filteredCount 
}: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters || {
    difficulty: [],
    playTime: [],
    popularity: null,
    searchQuery: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' },
    { value: 'master', label: 'Master' }
  ];

  const playTimeOptions: { value: PlayTime; label: string; description: string }[] = [
    { value: 'quick', label: '< 5 min', description: 'Quick games' },
    { value: 'medium', label: '5-15 min', description: 'Medium length' },
    { value: 'long', label: '15-30 min', description: 'Longer games' },
    { value: 'extended', label: '30+ min', description: 'Extended play' }
  ];

  const popularityOptions: { value: PopularitySort; label: string; icon: string }[] = [
    { value: 'most-played', label: 'Most Played', icon: '🎮' },
    { value: 'top-rated', label: 'Top Rated', icon: '⭐' },
    { value: 'trending', label: 'Trending Now', icon: '🔥' },
    { value: 'new', label: 'New Releases', icon: '🆕' }
  ];

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleDifficulty = (difficulty: Difficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulty: prev.difficulty.includes(difficulty)
        ? prev.difficulty.filter(d => d !== difficulty)
        : [...prev.difficulty, difficulty]
    }));
  };

  const togglePlayTime = (time: PlayTime) => {
    setFilters(prev => ({
      ...prev,
      playTime: prev.playTime.includes(time)
        ? prev.playTime.filter(t => t !== time)
        : [...prev.playTime, time]
    }));
  };

  const setPopularity = (sort: PopularitySort | null) => {
    setFilters(prev => ({
      ...prev,
      popularity: prev.popularity === sort ? null : sort
    }));
  };

  const resetFilters = () => {
    setFilters({
      difficulty: [],
      playTime: [],
      popularity: null,
      searchQuery: ''
    });
  };

  const hasActiveFilters = filters.difficulty.length > 0 || 
    filters.playTime.length > 0 || 
    filters.popularity !== null ||
    filters.searchQuery !== '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      {/* Search and Toggle */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search games..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            hasActiveFilters 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="bg-white text-blue-500 rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {filters.difficulty.length + filters.playTime.length + (filters.popularity ? 1 : 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Difficulty Filter */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">DIFFICULTY</h3>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => toggleDifficulty(option.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        filters.difficulty.includes(option.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Play Time Filter */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">PLAY TIME</h3>
                <div className="flex flex-wrap gap-2">
                  {playTimeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => togglePlayTime(option.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        filters.playTime.includes(option.value)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="hidden sm:inline ml-1 text-xs opacity-75">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Popularity Sort */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">POPULARITY</h3>
                <div className="flex flex-wrap gap-2">
                  {popularityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setPopularity(option.value)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        filters.popularity === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredCount} of {totalGames} games
        {hasActiveFilters && ' (filtered)'}
      </div>
    </div>
  );
}