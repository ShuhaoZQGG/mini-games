'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Trophy, Users, Activity, Star, Gamepad2, Timer, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopPlayer {
  id: string;
  username: string;
  elo: number;
  streak: number;
  avatar?: string;
}

interface RecentActivity {
  id: string;
  type: 'achievement' | 'high_score' | 'tournament' | 'level_up';
  player: string;
  game: string;
  message: string;
  timestamp: Date;
}

interface CategoryStatsData {
  totalGames: number;
  averageRating: number;
  activePlayers: number;
  activeTournaments: number;
  dailyGames: number;
  weeklyGrowth: number;
  topPlayers: TopPlayer[];
  recentActivity: RecentActivity[];
}

interface CategoryStatsProps {
  categoryId: string;
  realtime?: boolean;
  showLeaderboard?: boolean;
  showActivity?: boolean;
}

export default function CategoryStats({
  categoryId,
  realtime = true,
  showLeaderboard = true,
  showActivity = true
}: CategoryStatsProps) {
  const [stats, setStats] = useState<CategoryStatsData>({
    totalGames: 15,
    averageRating: 4.8,
    activePlayers: 1234,
    activeTournaments: 45,
    dailyGames: 12456,
    weeklyGrowth: 15,
    topPlayers: [
      { id: '1', username: 'GrandMaster92', elo: 2450, streak: 23 },
      { id: '2', username: 'QueenGambit', elo: 2380, streak: 15 },
      { id: '3', username: 'KnightRider', elo: 2290, streak: 8 },
      { id: '4', username: 'BishopMaster', elo: 2210, streak: 5 },
      { id: '5', username: 'RookieNoMore', elo: 2150, streak: 3 }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'high_score',
        player: 'John',
        game: 'Chess',
        message: 'beat AI Expert',
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      },
      {
        id: '2',
        type: 'achievement',
        player: 'Sarah',
        game: 'Reversi',
        message: 'achieved Master rank',
        timestamp: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: '3',
        type: 'tournament',
        player: 'Tournament #234',
        game: '',
        message: 'starting in 5 minutes',
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: '4',
        type: 'level_up',
        player: 'Mike',
        game: 'Checkers',
        message: 'reached level 50',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ]
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!realtime) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activePlayers: prev.activePlayers + Math.floor(Math.random() * 10) - 5,
        dailyGames: prev.dailyGames + Math.floor(Math.random() * 5)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [realtime]);

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'high_score': return '⭐';
      case 'tournament': return '🎮';
      case 'level_up': return '📈';
      default: return '•';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          CATEGORY STATS
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Gamepad2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.dailyGames.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Games Today</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averageRating}/5
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activePlayers.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Players</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeTournaments}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tournaments</p>
            </div>
          </div>
        </div>

        {/* Weekly Growth Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Growth</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-green-500">
                +{stats.weeklyGrowth}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Players Leaderboard */}
      {showLeaderboard && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            TOP PLAYERS
          </h3>

          <div className="space-y-3">
            {stats.topPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {player.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {player.elo} ELO
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg">🔥</span>
                  <span className="font-semibold text-orange-500">{player.streak}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
            View Full Leaderboard →
          </button>
        </div>
      )}

      {/* Recent Activity Feed */}
      {showActivity && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            RECENT ACTIVITY
          </h3>

          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-xl mt-0.5">
                  {getActivityIcon(activity.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.player}</span>
                    {activity.game && (
                      <>
                        {' '}
                        {activity.message}
                        {' in '}
                        <span className="font-semibold">{activity.game}</span>
                      </>
                    )}
                    {!activity.game && ` ${activity.message}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {realtime && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live updates enabled
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}