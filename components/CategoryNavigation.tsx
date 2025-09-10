'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  slug: string;
  name: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  { slug: 'puzzle', name: 'Puzzle', icon: '🧩', color: '#8B5CF6' },
  { slug: 'action', name: 'Action', icon: '⚡', color: '#EF4444' },
  { slug: 'strategy', name: 'Strategy', icon: '♟️', color: '#3B82F6' },
  { slug: 'arcade', name: 'Arcade', icon: '🕹️', color: '#F59E0B' },
  { slug: 'card', name: 'Card', icon: '🃏', color: '#10B981' },
  { slug: 'word', name: 'Word', icon: '📝', color: '#6366F1' },
  { slug: 'skill', name: 'Skill', icon: '🎯', color: '#EC4899' },
  { slug: 'casino', name: 'Casino', icon: '🎰', color: '#14B8A6' },
  { slug: 'memory', name: 'Memory', icon: '🧠', color: '#8B5CF6' },
];

export function CategoryNavigation() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentCategory = pathname.match(/\/category\/([^/]+)/)?.[1];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center">
          {/* Left scroll button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 z-10 bg-gradient-to-r from-white via-white dark:from-gray-800 dark:via-gray-800 to-transparent pr-8 hidden md:block"
            aria-label="Scroll left"
          >
            <div className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </button>

          {/* Categories container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-2 md:px-10"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Games pill */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                !currentCategory
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-sm">🎮</span>
              <span className="text-sm font-medium">All Games</span>
            </Link>

            {/* Category pills */}
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  currentCategory === category.slug
                    ? 'shadow-md text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={{
                  backgroundColor: currentCategory === category.slug ? category.color : undefined,
                }}
              >
                <span className="text-sm">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>

          {/* Right scroll button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 z-10 bg-gradient-to-l from-white via-white dark:from-gray-800 dark:via-gray-800 to-transparent pl-8 hidden md:block"
            aria-label="Scroll right"
          >
            <div className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </button>
        </div>
      </div>

      {/* Custom CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}