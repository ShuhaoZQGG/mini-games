'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Clock, Target, Zap, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

// Types
interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  score: number;
  rank: number;
  games_played: number;
  win_streak: number;
  best_streak: number;
  time_played: number;
  metadata: {
    avatar_url?: string;
    country?: string;
    level?: number;
  };
  created_at: string;
  updated_at: string;
}

interface GameInfo {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface GlobalLeaderboardProps {
  gameId?: string;
  className?: string;
  showGameSelector?: boolean;
  maxEntries?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  gameId: initialGameId,
  className,
  showGameSelector = true,
  maxEntries = 100,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>(initialGameId || 'all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all_time');
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  const supabase = createClientComponentClient();

  // Fetch available games
  const fetchGames = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from your games database
      // For now, using a static list based on your 150 games
      const gamesList: GameInfo[] = [
        { id: 'all', name: 'All Games', category: 'all' },
        { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', category: 'Strategy' },
        { id: 'memory-match', name: 'Memory Match', category: 'Puzzle' },
        { id: 'snake', name: 'Snake', category: 'Arcade' },
        // Add more games as needed
      ];
      setGames(gamesList);
    } catch (err) {
      console.error('Error fetching games:', err);
    }
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('global_leaderboards')
        .select('*')
        .eq('period_type', selectedPeriod)
        .order('score', { ascending: false })
        .limit(maxEntries);

      if (selectedGame !== 'all') {
        query = query.eq('game_id', selectedGame);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLeaderboard(data || []);

      // Fetch current user's rank
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRank } = await supabase
          .from('global_leaderboards')
          .select('*')
          .eq('user_id', user.id)
          .eq('period_type', selectedPeriod)
          .eq('game_id', selectedGame === 'all' ? null : selectedGame)
          .single();

        setCurrentUserRank(userRank);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedGame, selectedPeriod, maxEntries]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_leaderboards',
          filter: selectedGame !== 'all' ? `game_id=eq.${selectedGame}` : undefined,
        },
        (payload) => {
          console.log('Leaderboard update:', payload);
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedGame, isRealTimeEnabled, fetchLeaderboard]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLeaderboard, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLeaderboard]);

  // Initial load
  useEffect(() => {
    fetchGames();
    fetchLeaderboard();
  }, [fetchGames, fetchLeaderboard]);

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    if (rank === 3) return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
    if (rank <= 10) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (rank <= 25) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-muted text-muted-foreground';
  };

  // Format play time
  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Global Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            {showGameSelector && (
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={cn(isRealTimeEnabled && 'bg-green-500/10 border-green-500')}
            >
              <Zap className={cn('w-4 h-4', isRealTimeEnabled && 'text-green-500')} />
              {isRealTimeEnabled ? 'Live' : 'Static'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No entries yet. Be the first to play!
              </div>
            ) : (
              <div className="space-y-2">
                {/* Current user rank (if not in top list) */}
                {currentUserRank && currentUserRank.rank > maxEntries && (
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 text-center">{getRankIcon(currentUserRank.rank)}</div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={currentUserRank.metadata?.avatar_url} />
                          <AvatarFallback>{currentUserRank.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">You</p>
                          <p className="text-xs text-muted-foreground">
                            {currentUserRank.games_played} games
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{currentUserRank.score.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leaderboard entries */}
                <AnimatePresence>
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = currentUserRank?.user_id === entry.user_id;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg transition-colors',
                          isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50',
                          entry.rank <= 3 && 'bg-gradient-to-r',
                          entry.rank === 1 && 'from-yellow-500/10 to-yellow-500/5',
                          entry.rank === 2 && 'from-gray-400/10 to-gray-400/5',
                          entry.rank === 3 && 'from-orange-600/10 to-orange-600/5'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 text-center">{getRankIcon(entry.rank)}</div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={entry.metadata?.avatar_url} />
                            <AvatarFallback>{entry.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{entry.username}</p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                              {entry.metadata?.level && (
                                <Badge variant="secondary" className="text-xs">
                                  Lv.{entry.metadata.level}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {entry.games_played} games
                              </span>
                              {entry.win_streak > 0 && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {entry.win_streak} streak
                                </span>
                              )}
                              {entry.time_played > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatPlayTime(entry.time_played)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{entry.score.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Players</p>
                <p className="font-bold">{leaderboard.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Top Score</p>
                <p className="font-bold">{leaderboard[0]?.score.toLocaleString() || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="font-bold">
                  {leaderboard.length > 0
                    ? Math.round(
                        leaderboard.reduce((sum, e) => sum + e.score, 0) / leaderboard.length
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};