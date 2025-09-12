'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Star, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface FeaturedGame {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  ratingCount: number;
  playersOnline: number;
  averagePlayTime: number;
  xpReward: number;
  previewImage?: string;
  previewAnimation?: string;
}

interface FeaturedCarouselProps {
  games: FeaturedGame[];
  autoPlayInterval?: number;
  onQuickPlay: (gameId: string) => void;
  showPreview?: boolean;
}

export default function FeaturedCarousel({
  games,
  autoPlayInterval = 5000,
  onQuickPlay,
  showPreview = true
}: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlaying && !isHovered && games.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % games.length);
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isHovered, games.length, autoPlayInterval]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (games.length === 0) {
    return null;
  }

  const currentGame = games[currentIndex];

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-xl overflow-hidden mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            FEATURED THIS WEEK
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
              aria-label="Previous game"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              {games.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goToNext}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
              aria-label="Next game"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6"
            >
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Game Preview */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {showPreview && currentGame.previewAnimation ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🎮</div>
                        <p className="text-gray-600 dark:text-gray-400">Live Preview</p>
                        <div className="mt-4 animate-pulse">
                          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                      <div className="text-8xl opacity-50">🎮</div>
                    </div>
                  )}
                  
                  {/* Quick Play Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => onQuickPlay(currentGame.id)}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg font-bold transform hover:scale-110 transition-transform flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Quick Play
                    </button>
                  </div>
                </div>

                {/* Game Info */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentGame.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {currentGame.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {currentGame.rating}/5
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({currentGame.ratingCount.toLocaleString()} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {currentGame.playersOnline}
                        </span>
                        <span className="text-gray-500 text-sm">playing now</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {currentGame.averagePlayTime} min
                        </span>
                        <span className="text-gray-500 text-sm">avg time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏅</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {currentGame.xpReward} XP
                        </span>
                        <span className="text-gray-500 text-sm">reward</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => onQuickPlay(currentGame.id)}
                      className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      QUICK PLAY
                    </button>
                    <Link
                      href={`/games/${currentGame.id}`}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Info className="w-5 h-5" />
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}