'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryService } from '@/services/categoryService';
import { Category, GameMetadata } from '@/types/category';
import { ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [gamesByCategory, setGamesByCategory] = useState<Record<string, GameMetadata[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await CategoryService.getCategories();
      setCategories(categoriesData);

      // Load games for each category
      const gamesData: Record<string, GameMetadata[]> = {};
      await Promise.all(
        categoriesData.map(async (category) => {
          const games = await CategoryService.getGamesByCategory(category.id);
          gamesData[category.id] = games.slice(0, 6); // Get top 6 games per category
        })
      );
      setGamesByCategory(gamesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">All Game Categories</h1>
          <p className="text-lg opacity-90">
            Explore our collection of games organized by category
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Categories List */}
        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {/* Category Header */}
              <div 
                className="p-6 text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}dd, ${category.color}99)` 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{category.name}</h2>
                      <p className="opacity-90 mt-1">{category.description}</p>
                    </div>
                  </div>
                  <Link
                    href={`/category/${category.slug}`}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Games Preview */}
              <div className="p-6">
                {gamesByCategory[category.id] && gamesByCategory[category.id].length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {gamesByCategory[category.id].map((game) => (
                      <Link
                        key={game.id}
                        href={`/games/${game.slug}`}
                        className="group text-center"
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center text-3xl mb-2 group-hover:scale-105 transition-transform">
                          🎮
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {game.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {game.difficulty}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No games in this category yet
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Stats Section */}
        <section className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Game Collection Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div>
                <div className="text-4xl font-bold">40+</div>
                <div className="text-sm opacity-90">Total Games</div>
              </div>
              <div>
                <div className="text-4xl font-bold">{categories.length}</div>
                <div className="text-sm opacity-90">Categories</div>
              </div>
              <div>
                <div className="text-4xl font-bold">30</div>
                <div className="text-sm opacity-90">Single Player</div>
              </div>
              <div>
                <div className="text-4xl font-bold">10</div>
                <div className="text-sm opacity-90">Multiplayer</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}