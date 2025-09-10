'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/category';

interface CategoryGridProps {
  categories: Category[];
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:scale-105"
        >
          <div 
            className="p-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)` 
            }}
          >
            <div className="text-4xl mb-2">{category.icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {category.description}
            </p>
          </div>
          <div 
            className="absolute inset-x-0 bottom-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform"
            style={{ backgroundColor: category.color }}
          />
        </Link>
      ))}
    </div>
  );
};