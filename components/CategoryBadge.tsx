'use client';

import React from 'react';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  puzzle: { icon: '🧩', color: '#8B5CF6', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  action: { icon: '⚡', color: '#EF4444', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  strategy: { icon: '♟️', color: '#3B82F6', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  arcade: { icon: '🕹️', color: '#F59E0B', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  card: { icon: '🃏', color: '#10B981', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  word: { icon: '📝', color: '#6366F1', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  skill: { icon: '🎯', color: '#EC4899', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  casino: { icon: '🎰', color: '#14B8A6', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  memory: { icon: '🧠', color: '#8B5CF6', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  sports: { icon: '⚽', color: '#059669', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  quiz: { icon: '❓', color: '#7C3AED', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
};

export function CategoryBadge({ category, size = 'sm', showIcon = true, className = '' }: CategoryBadgeProps) {
  const config = categoryConfig[category.toLowerCase()] || {
    icon: '🎮',
    color: '#6B7280',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${sizeClasses[size]} ${className}`}
      style={{ 
        color: config.color,
        borderColor: config.color,
        borderWidth: '1px',
        borderStyle: 'solid',
        opacity: 0.9
      }}
    >
      {showIcon && (
        <span className={iconSizes[size]} role="img" aria-label={category}>
          {config.icon}
        </span>
      )}
      <span className="capitalize">{category}</span>
    </div>
  );
}