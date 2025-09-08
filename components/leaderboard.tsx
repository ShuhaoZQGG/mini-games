'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { getLeaderboard, getPersonalBest } from '@/lib/services/scores';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardProps {
  gameId: string;
  gameName: string;
  formatScore?: (score: number) => string;
}

type Period = 'all_time' | 'monthly' | 'weekly' | 'daily';

export default function Leaderboard({ gameId, gameName, formatScore = (s) => s.toString() }: LeaderboardProps) {
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

  useEffect(() => {
    loadLeaderboard(period);
    loadPersonalBest();
  }, [gameId]);

  useEffect(() => {
    if (!leaderboardData[period].length) {
      loadLeaderboard(period);
    }
  }, [period]);

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
        {data.map((entry, index) => (
          <div
            key={entry.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              index < 3 ? "bg-muted" : "hover:bg-muted/50"
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {gameName} Leaderboard
        </CardTitle>
        <CardDescription>
          Compete with players worldwide!
          {personalBest !== null && (
            <span className="block mt-1">
              Your best: <span className="font-semibold">{formatScore(personalBest)}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
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