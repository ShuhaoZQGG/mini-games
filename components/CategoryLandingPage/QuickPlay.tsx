'use client';

import { useState } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickPlayProps {
  gameId: string;
  variant?: 'modal' | 'inline' | 'fullscreen';
  onClose?: () => void;
  preloadAssets?: boolean;
}

// Placeholder component for games that aren't implemented yet
const PlaceholderGame = ({ gameId }: { gameId: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">🎮</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {gameId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Game coming soon! Check back later for this exciting game.
      </p>
      <button
        onClick={() => window.location.href = `/games/${gameId}`}
        className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Full Game Page
      </button>
    </div>
  </div>
);

export default function QuickPlay({
  gameId,
  variant = 'modal',
  onClose,
  preloadAssets = true
}: QuickPlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(variant === 'fullscreen');
  const [isMuted, setIsMuted] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (variant === 'inline') {
    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <PlaceholderGame gameId={gameId} />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {(variant === 'modal' || variant === 'fullscreen') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden ${
              isFullscreen 
                ? 'w-full h-full' 
                : 'w-full max-w-4xl h-[80vh] max-h-[800px]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="Close game"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Game Content */}
            <div className="w-full h-full">
              <PlaceholderGame gameId={gameId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}