'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, User, Gamepad2, Clock, Eye } from 'lucide-react';
import { realtimeService, PresenceData } from '@/lib/services/realtime';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  gameId: string;
  variant?: 'compact' | 'detailed' | 'inline';
  showAvatars?: boolean;
  maxDisplay?: number;
}

export function PresenceIndicator({ 
  gameId, 
  variant = 'compact',
  showAvatars = true,
  maxDisplay = 5
}: PresenceIndicatorProps) {
  const [presenceData, setPresenceData] = useState<PresenceData[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupPresence = async () => {
      const userData = {
        user_id: `user_${Date.now()}`,
        username: localStorage.getItem('guest_name') || `Guest${Math.floor(Math.random() * 10000)}`
      };

      unsubscribe = await realtimeService.trackPresence(
        gameId,
        userData,
        (state) => {
          // Convert presence state to array
          const presenceArray: PresenceData[] = [];
          
          if (Array.isArray(state)) {
            presenceArray.push(...state);
          } else {
            Object.values(state).forEach((presences: any) => {
              if (Array.isArray(presences)) {
                presences.forEach(p => presenceArray.push(p));
              }
            });
          }
          
          setPresenceData(presenceArray);
        }
      );

      setIsTracking(true);
    };

    setupPresence();

    return () => {
      unsubscribe?.();
      setIsTracking(false);
    };
  }, [gameId]);

  const onlineCount = presenceData.length;
  const displayedUsers = presenceData.slice(0, maxDisplay);
  const remainingCount = Math.max(0, onlineCount - maxDisplay);

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1 text-green-500" />
          <span className="text-sm font-medium">{onlineCount}</span>
        </div>
        {showAvatars && displayedUsers.length > 0 && (
          <div className="flex -space-x-2">
            {displayedUsers.map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Avatar className="w-6 h-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            {remainingCount > 0 && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                +{remainingCount}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players Online
            </span>
            <Badge variant={onlineCount > 0 ? "default" : "secondary"}>
              {onlineCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        {showAvatars && displayedUsers.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {displayedUsers.map((user, index) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.status === 'playing' ? "bg-green-500" : 
                      user.status === 'idle' ? "bg-yellow-500" : "bg-blue-500"
                    )} />
                    <span className="text-xs">{user.username}</span>
                  </motion.div>
                ))}
                {remainingCount > 0 && (
                  <div className="flex items-center px-2 py-1 bg-muted rounded-full">
                    <span className="text-xs text-muted-foreground">
                      +{remainingCount} more
                    </span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Players
          </span>
          <div className="flex items-center gap-2">
            {isTracking && (
              <Badge variant="outline" className="animate-pulse">
                <Eye className="w-3 h-3 mr-1" />
                Tracking
              </Badge>
            )}
            <Badge variant={onlineCount > 0 ? "default" : "secondary"}>
              {onlineCount} online
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No other players online</p>
            <p className="text-xs mt-1">Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {displayedUsers.map((user, index) => (
                <motion.div
                  key={user.user_id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                    <AvatarFallback>
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{user.username}</span>
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Joined {getRelativeTime(user.joined_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {remainingCount > 0 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                and {remainingCount} more player{remainingCount !== 1 ? 's' : ''}...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    playing: { label: 'Playing', className: 'bg-green-500/10 text-green-600' },
    idle: { label: 'Idle', className: 'bg-yellow-500/10 text-yellow-600' },
    online: { label: 'Online', className: 'bg-blue-500/10 text-blue-600' }
  };

  const { label, className } = config[status as keyof typeof config] || config.online;

  return (
    <Badge variant="secondary" className={cn("text-xs", className)}>
      {label}
    </Badge>
  );
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((now - time) / 1000); // seconds

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Compact presence counter for game cards
export function PresenceCounter({ gameId }: { gameId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const trackPresence = async () => {
      const userData = {
        user_id: `viewer_${Date.now()}`,
        username: 'Viewer'
      };

      unsubscribe = await realtimeService.trackPresence(
        gameId,
        userData,
        (state) => {
          const total = Array.isArray(state) 
            ? state.length 
            : Object.values(state).reduce((acc: number, presences: any) => 
                acc + (Array.isArray(presences) ? presences.length : 0), 0);
          setCount(total);
        }
      );
    };

    trackPresence();

    return () => {
      unsubscribe?.();
    };
  }, [gameId]);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>{count} playing</span>
    </div>
  );
}