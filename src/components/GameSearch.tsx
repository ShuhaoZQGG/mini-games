'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { GameMetadata } from '@/types/category';
import { CategoryService } from '@/services/categoryService';

interface GameSearchProps {
  onSearchResults: (games: GameMetadata[]) => void;
  onClearSearch: () => void;
}

export const GameSearch: React.FC<GameSearchProps> = ({ onSearchResults, onClearSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    maxPlayTime: 0,
    playerCount: ''
  });

  const performSearch = useCallback(async (query: string, currentFilters: typeof filters) => {
    if (!query && !Object.values(currentFilters).some(v => v)) {
      onClearSearch();
      return;
    }

    setIsSearching(true);
    try {
      let results: GameMetadata[] = [];

      if (query) {
        results = await CategoryService.searchGames(query);
      } else {
        results = await CategoryService.getAllGamesWithCategories();
      }

      // Apply filters
      if (currentFilters.difficulty) {
        results = results.filter(g => g.difficulty === currentFilters.difficulty);
      }
      if (currentFilters.maxPlayTime > 0) {
        results = results.filter(g => g.avg_play_time <= currentFilters.maxPlayTime);
      }
      if (currentFilters.playerCount) {
        results = results.filter(g => g.player_count === currentFilters.playerCount);
      }

      onSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchResults, onClearSearch]);

  // Custom debounce implementation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(searchQuery, filters);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, filters, performSearch]);

  const clearSearch = () => {
    setSearchQuery('');
    setFilters({
      difficulty: '',
      maxPlayTime: 0,
      playerCount: ''
    });
    onClearSearch();
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(searchQuery || Object.values(filters).some(v => v)) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showFilters 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Play Time
              </label>
              <select
                value={filters.maxPlayTime}
                onChange={(e) => setFilters({ ...filters, maxPlayTime: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="0">Any</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Players
              </label>
              <select
                value={filters.playerCount}
                onChange={(e) => setFilters({ ...filters, playerCount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Any</option>
                <option value="1">Single Player</option>
                <option value="2">2 Players</option>
                <option value="1-2">1-2 Players</option>
                <option value="2+">2+ Players</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({ difficulty: '', maxPlayTime: 0, playerCount: '' });
                setShowFilters(false);
              }}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="absolute top-full mt-2 w-full flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Searching...</div>
        </div>
      )}
    </div>
  );
};