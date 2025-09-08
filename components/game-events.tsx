'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  TrendingUp, 
  UserPlus, 
  UserMinus, 
  Play, 
  Square,
  Zap,
  Star,
  Target,
  Award
} from 'lucide-react';
import { realtimeService, GameEvent } from '@/lib/services/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GameEventsProps {
  gameId: string;
  maxEvents?: number;
  variant?: 'feed' | 'toast' | 'minimal';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function GameEvents({ 
  gameId, 
  maxEvents = 10,
  variant = 'feed',
  position = 'top-right'
}: GameEventsProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToGameEvents(gameId, (event) => {
      setEvents(prev => {
        const newEvents = [event, ...prev].slice(0, maxEvents);
        return newEvents;
      });

      // Auto-remove toast events after 5 seconds
      if (variant === 'toast') {
        setTimeout(() => {
          setEvents(prev => prev.filter(e => e !== event));
        }, 5000);
      }
    });

    setIsSubscribed(true);

    // Simulate some initial events for demo
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        broadcastGameEvent({
          type: 'player_joined',
          game_id: gameId,
          player_name: 'DemoPlayer1',
          data: null,
          timestamp: new Date().toISOString()
        });
      }, 1000);

      setTimeout(() => {
        broadcastGameEvent({
          type: 'score_update',
          game_id: gameId,
          player_name: 'DemoPlayer2',
          data: { score: 1500 },
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [gameId, maxEvents, variant]);

  const getEventIcon = (type: GameEvent['type']) => {
    switch (type) {
      case 'score_update':
        return <TrendingUp className="w-4 h-4" />;
      case 'player_joined':
        return <UserPlus className="w-4 h-4" />;
      case 'player_left':
        return <UserMinus className="w-4 h-4" />;
      case 'game_started':
        return <Play className="w-4 h-4" />;
      case 'game_ended':
        return <Square className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getEventMessage = (event: GameEvent): string => {
    switch (event.type) {
      case 'score_update':
        return `${event.player_name} scored ${event.data?.score || 0} points!`;
      case 'player_joined':
        return `${event.player_name} joined the game`;
      case 'player_left':
        return `${event.player_name} left the game`;
      case 'game_started':
        return `Game started!`;
      case 'game_ended':
        return `Game ended`;
      default:
        return 'New event';
    }
  };

  const getEventColor = (type: GameEvent['type']): string => {
    switch (type) {
      case 'score_update':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'player_joined':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'player_left':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'game_started':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'game_ended':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
  };

  if (variant === 'toast') {
    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };

    return (
      <div className={cn("fixed z-50", positionClasses[position])}>
        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={`${event.timestamp}-${index}`}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "mb-2 p-3 rounded-lg border shadow-lg backdrop-blur-sm",
                "bg-background/95",
                getEventColor(event.type)
              )}
            >
              <div className="flex items-center gap-2">
                {getEventIcon(event.type)}
                <span className="text-sm font-medium">
                  {getEventMessage(event)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {events.slice(0, 3).map((event, index) => (
            <motion.div
              key={`${event.timestamp}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              {getEventIcon(event.type)}
              <span className="truncate">{getEventMessage(event)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Default feed variant
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Live Feed
          </span>
          {isSubscribed && (
            <Badge variant="outline" className="animate-pulse">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for game events...</p>
              <p className="text-xs mt-1">Events will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div
                    key={`${event.timestamp}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      getEventColor(event.type)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getEventIcon(event.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getEventMessage(event)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Achievement notification component
export function AchievementNotification({ 
  achievement,
  onClose 
}: { 
  achievement: { name: string; description: string; icon?: string };
  onClose?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
    >
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="w-10 h-10 text-yellow-500" />
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Star className="w-10 h-10 text-yellow-400 opacity-50" />
              </motion.div>
            </div>
            <div>
              <h3 className="font-bold text-yellow-600">Achievement Unlocked!</h3>
              <p className="text-sm font-medium">{achievement.name}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper function to broadcast events (for game components to use)
export async function broadcastGameEvent(event: GameEvent) {
  await realtimeService.broadcastGameEvent(event);
}

// Hook for tracking game events
export function useGameEvents(gameId: string) {
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToGameEvents(gameId, (event) => {
      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
    });

    return unsubscribe;
  }, [gameId]);

  const broadcast = useCallback((type: GameEvent['type'], data?: any) => {
    const event: GameEvent = {
      type,
      game_id: gameId,
      player_name: localStorage.getItem('guest_name') || 'Guest',
      data,
      timestamp: new Date().toISOString()
    };
    
    broadcastGameEvent(event);
  }, [gameId]);

  return { events, broadcast };
}