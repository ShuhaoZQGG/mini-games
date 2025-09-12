'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Filter } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  isMobile?: boolean;
}

const categoryConfig: Record<string, { icon: string; color: string }> = {
  puzzle: { icon: '🧩', color: '#8B5CF6' },
  action: { icon: '⚡', color: '#EF4444' },
  strategy: { icon: '♟️', color: '#3B82F6' },
  arcade: { icon: '🕹️', color: '#F59E0B' },
  card: { icon: '🃏', color: '#10B981' },
  word: { icon: '📝', color: '#6366F1' },
  skill: { icon: '🎯', color: '#EC4899' },
  casino: { icon: '🎰', color: '#14B8A6' },
  memory: { icon: '🧠', color: '#8B5CF6' },
  sports: { icon: '⚽', color: '#059669' },
  quiz: { icon: '❓', color: '#7C3AED' },
};

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  isMobile = false,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  const selectAll = () => {
    onCategoryChange(categories);
  };

  // Mobile bottom sheet
  if (isMobile && showMobileSheet) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileSheet(false)}
        />

        {/* Bottom Sheet */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl z-50 md:hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter by Category
              </h3>
              <button
                onClick={() => setShowMobileSheet(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {categories.map((category) => {
                const config = categoryConfig[category.toLowerCase()] || {
                  icon: '🎮',
                  color: '#6B7280',
                };
                const isSelected = selectedCategories.includes(category);

                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.icon}</span>
                      <span
                        className={`font-medium capitalize ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {category}
                      </span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowMobileSheet(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Apply Filters ({selectedCategories.length} selected)
            </button>
          </div>
        </div>
      </>
    );
  }

  // Mobile trigger button
  if (isMobile) {
    return (
      <button
        onClick={() => setShowMobileSheet(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 md:hidden"
      >
        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Categories ({selectedCategories.length})
        </span>
      </button>
    );
  }

  // Desktop dropdown
  return (
    <div ref={dropdownRef} className="relative hidden md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Categories
          {selectedCategories.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
              {selectedCategories.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Category
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {categories.map((category) => {
              const config = categoryConfig[category.toLowerCase()] || {
                icon: '🎮',
                color: '#6B7280',
              };
              const isSelected = selectedCategories.includes(category);

              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icon}</span>
                    <span
                      className={`text-sm capitalize ${
                        isSelected
                          ? 'font-medium text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {category}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}