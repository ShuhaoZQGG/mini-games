'use client';

import React from 'react';
import Link from 'next/link';
import { GameMetadata } from '@/types/category';
import { Clock, Users, Star, TrendingUp } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  showCategory?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ game, showCategory = false }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'hard': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
    >
      {/* Thumbnail placeholder - could be replaced with actual images */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-50">
          🎮
        </div>
        {game.featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {game.name}
          </h3>
          {game.rating && (
            <div className="flex items-center text-sm text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1">{game.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {game.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          <span className={`font-medium ${getDifficultyColor(game.difficulty)}`}>
            {game.difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {game.avg_play_time}min
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {game.player_count}
          </span>
          {game.play_count > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {game.play_count.toLocaleString()}
            </span>
          )}
        </div>

        {game.tags && game.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {game.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};