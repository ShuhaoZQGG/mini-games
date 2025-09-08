'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, User, Users, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getLeaderboard, getPersonalBest } from '@/lib/services/scores';
import { realtimeService, useRealtimeLeaderboard, RealtimeScore } from '@/lib/services/realtime';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface RealtimeLeaderboardProps {
  gameId: string;
  gameName: string;
  formatScore?: (score: number) => string;
  showPresence?: boolean;
}

type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

export default function RealtimeLeaderboard({ 
  gameId, 
  gameName, 
  formatScore = (s) => s.toString(),
  showPresence = true 
}: RealtimeLeaderboardProps) {
  const [period, setPeriod] = useState<Period>('all_time');
  const [leaderboardData, setLeaderboardData] = useState<Record<Period, any[]>>({
    all_time: [],
    monthly: [],
    weekly: [],
    daily: [],
  });
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState<Period | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [recentScores, setRecentScores] = useState<RealtimeScore[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribeScores: (() => void) | undefined;
    let unsubscribeLeaderboard: (() => void) | undefined;
    let unsubscribePresence: (() => void) | undefined;

    const setupRealtime = async () => {
      // Subscribe to new scores
      unsubscribeScores = realtimeService.subscribeToScores(gameId, (newScore) => {
        // Add new score with animation
        setRecentScores(prev => {
          const updated = [newScore, ...prev].slice(0, 5); // Keep last 5 scores
          return updated;
        });

        // Flash the leaderboard to indicate update
        setTimeout(() => {
          loadLeaderboard(period);
        }, 500);
      });

      // Subscribe to leaderboard changes
      unsubscribeLeaderboard = realtimeService.subscribeToLeaderboard(
        gameId,
        period,
        (updatedLeaderboard) => {
          setLeaderboardData(prev => ({
            ...prev,
            [period]: updatedLeaderboard
          }));
        }
      );

      // Track presence if enabled
      if (showPresence) {
        const userData = {
          user_id: `user_${Date.now()}`,
          username: localStorage.getItem('guest_name') || 'Guest'
        };

        unsubscribePresence = await realtimeService.trackPresence(
          gameId,
          userData,
          (presenceState) => {
            const count = Array.isArray(presenceState) 
              ? presenceState.length 
              : Object.keys(presenceState).reduce((acc, key) => 
                  acc + ((presenceState as any)[key]?.length || 0), 0);
            setOnlineCount(count);
          }
        );
      }

      setIsConnected(true);
    };

    setupRealtime();

    // Initial load
    loadLeaderboard(period);
    loadPersonalBest();

    return () => {
      unsubscribeScores?.();
      unsubscribeLeaderboard?.();
      unsubscribePresence?.();
    };
  }, [gameId, period, showPresence]);

  const loadLeaderboard = async (period: Period) => {
    setLoadingPeriod(period);
    const result = await getLeaderboard({ gameId, period, limit: 10 });
    if (result.success) {
      setLeaderboardData(prev => ({
        ...prev,
        [period]: result.data,
      }));
    }
    setLoadingPeriod(null);
    setLoading(false);
  };

  const loadPersonalBest = async () => {
    const result = await getPersonalBest(gameId);
    if (result.success && result.data) {
      setPersonalBest((result.data as any).score);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="w-5 text-center text-sm font-medium">{rank}</span>;
    }
  };

  const renderLeaderboardContent = (data: any[]) => {
    if (loadingPeriod === period) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No scores yet. Be the first to play!
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {data.map((entry, index) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                index < 3 ? "bg-muted" : "hover:bg-muted/50",
                "transition-all duration-200"
              )}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(index + 1)}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{entry.player_name}</span>
                </div>
              </div>
              <span className="font-bold text-lg">{formatScore(entry.score)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderRecentScores = () => {
    if (recentScores.length === 0) return null;

    return (
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-green-500" />
          Live Updates
        </h4>
        <div className="space-y-1">
          <AnimatePresence>
            {recentScores.map((score, index) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between items-center text-sm py-1"
              >
                <span className="text-muted-foreground">
                  {score.player_name}
                </span>
                <span className="font-medium">
                  {formatScore(score.score)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Connection Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge 
          variant={isConnected ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {gameName} Leaderboard
        </CardTitle>
        <CardDescription>
          <span className="block">Compete with players worldwide!</span>
          {personalBest !== null && (
            <span className="block mt-1">
              Your best: <span className="font-semibold">{formatScore(personalBest)}</span>
            </span>
          )}
          {showPresence && onlineCount > 0 && (
            <span className="flex items-center gap-1 mt-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{onlineCount}</span> players online
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Recent live scores */}
        {renderRecentScores()}

        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">Week</TabsTrigger>
            <TabsTrigger value="monthly">Month</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-4">
            {renderLeaderboardContent(leaderboardData.daily)}
          </TabsContent>
          <TabsContent value="weekly" className="mt-4">
            {renderLeaderboardContent(leaderboardData.weekly)}
          </TabsContent>
          <TabsContent value="monthly" className="mt-4">
            {renderLeaderboardContent(leaderboardData.monthly)}
          </TabsContent>
          <TabsContent value="all_time" className="mt-4">
            {renderLeaderboardContent(leaderboardData.all_time)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}