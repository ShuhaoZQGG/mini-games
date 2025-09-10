'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, TrendingUp, Clock, Users, Gamepad2 } from 'lucide-react';
import { fuzzySearch, highlightMatches, SearchResult } from '@/utils/fuzzySearch';
import Link from 'next/link';

export interface Game {
  id: string;
  name: string;
  description: string;
  path: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  playerCount?: string;
  tags?: string[];
}

interface EnhancedGameSearchProps {
  games: Game[];
  onClose?: () => void;
  isOpen?: boolean;
}

export const EnhancedGameSearch: React.FC<EnhancedGameSearchProps> = ({ 
  games, 
  onClose,
  isOpen = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult<Game>[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentGameSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 5));
    }
    
    // Set popular games (mock data - in production would come from analytics)
    setPopularGames(games.slice(0, 6));
  }, [games]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform fuzzy search
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = fuzzySearch(
      query,
      games,
      [
        { key: 'name', weight: 2 },
        { key: 'description', weight: 1 },
        { key: 'category', weight: 1.5 },
        { key: 'tags', weight: 0.8 }
      ],
      0.2
    );

    setSearchResults(results.slice(0, 10));
    setSelectedIndex(0);
  }, [games]);

  // Debounced search
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Save search to recent
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentGameSearches', JSON.stringify(updated));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        saveRecentSearch(searchQuery);
        window.location.href = selected.item.path;
      }
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && searchResults.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, searchResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search games by name, category, or description..."
                className="w-full pl-12 pr-12 py-3 text-lg bg-gray-50 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {searchQuery && searchResults.length > 0 ? (
              <div ref={resultsRef} className="p-2">
                {searchResults.map((result, index) => (
                  <Link
                    key={result.item.id}
                    href={result.item.path}
                    onClick={() => saveRecentSearch(searchQuery)}
                  >
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Gamepad2 className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            <span dangerouslySetInnerHTML={{ 
                              __html: highlightMatches(result.item.name, searchQuery) 
                            }} />
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span dangerouslySetInnerHTML={{ 
                              __html: highlightMatches(result.item.description, searchQuery) 
                            }} />
                          </div>
                          {result.item.category && (
                            <div className="flex gap-2 mt-2">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                                {result.item.category}
                              </span>
                              {result.item.difficulty && (
                                <span className={`inline-block px-2 py-1 text-xs rounded ${
                                  result.item.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  result.item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {result.item.difficulty}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(result.score * 100)}% match
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No games found matching "{searchQuery}"
              </div>
            ) : (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(search)}
                          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Games */}
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    Popular Games
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {popularGames.map((game) => (
                      <Link key={game.id} href={game.path}>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {game.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {game.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Tips */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd> Navigate
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 ml-2">Enter</kbd> Select
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 ml-2">Esc</kbd> Close
              </div>
              <div>
                Fuzzy search enabled
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};