'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Play, Trophy, Clock, TrendingUp, Star } from 'lucide-react';
import { EloRating } from '@/lib/elo-rating';
import { MatchmakingSystem } from './matchmaking-system';

interface GameInfo {
  id: string;
  name: string;
  icon: string;
  playersOnline: number;
  avgWaitTime: number;
  description: string;
}

interface ActiveGame {
  id: string;
  gameType: string;
  players: string[];
  startTime: string;
  status: 'waiting' | 'active' | 'finished';
}

export function MultiplayerLobby() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [playerRating, setPlayerRating] = useState(1200);
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  const multiplayerGames: GameInfo[] = [
    {
      id: 'chess',
      name: 'Chess',
      icon: '♟️',
      playersOnline: 234,
      avgWaitTime: 15,
      description: 'Classic strategy game with ELO rating'
    },
    {
      id: 'checkers',
      name: 'Checkers',
      icon: '🎯',
      playersOnline: 156,
      avgWaitTime: 10,
      description: 'Fast-paced capturing game'
    },
    {
      id: 'battleship',
      name: 'Battleship',
      icon: '⚓',
      playersOnline: 89,
      avgWaitTime: 20,
      description: 'Naval strategy and tactics'
    },
    {
      id: 'pool',
      name: '8-Ball Pool',
      icon: '🎱',
      playersOnline: 178,
      avgWaitTime: 12,
      description: 'Physics-based billiards'
    },
    {
      id: 'air-hockey',
      name: 'Air Hockey',
      icon: '🏒',
      playersOnline: 112,
      avgWaitTime: 8,
      description: 'Real-time fast action'
    },
    {
      id: 'backgammon',
      name: 'Backgammon',
      icon: '🎲',
      playersOnline: 67,
      avgWaitTime: 25,
      description: 'Ancient dice and strategy'
    },
    {
      id: 'go',
      name: 'Go',
      icon: '⚫',
      playersOnline: 45,
      avgWaitTime: 30,
      description: 'Territory control strategy'
    },
    {
      id: 'reversi',
      name: 'Reversi',
      icon: '⚪',
      playersOnline: 78,
      avgWaitTime: 18,
      description: 'Flip and capture game'
    }
  ];

  useEffect(() => {
    // Simulate active games updates
    const interval = setInterval(() => {
      const mockGames: ActiveGame[] = [
        {
          id: '1',
          gameType: 'chess',
          players: ['AlphaGamer', 'BetaPlayer'],
          startTime: '2 min ago',
          status: 'active'
        },
        {
          id: '2',
          gameType: 'pool',
          players: ['ProShooter', 'CueMaster'],
          startTime: '5 min ago',
          status: 'active'
        },
        {
          id: '3',
          gameType: 'checkers',
          players: ['KingMe', 'Waiting...'],
          startTime: 'Just now',
          status: 'waiting'
        }
      ];
      setActiveGames(mockGames);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setShowMatchmaking(true);
  };

  const handleMatchFound = (roomId: string, isHost: boolean) => {
    // Navigate to the game with room ID
    window.location.href = `/games/${selectedGame}?room=${roomId}&host=${isHost}`;
  };

  const ratingTier = EloRating.getRatingTier(playerRating);

  if (showMatchmaking && selectedGame) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => {
            setShowMatchmaking(false);
            setSelectedGame(null);
          }}
          variant="outline"
          className="mb-4"
        >
          ← Back to Lobby
        </Button>
        <MatchmakingSystem
          gameType={selectedGame}
          onMatchFound={handleMatchFound}
          playerRating={playerRating}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Multiplayer Lobby</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Challenge players from around the world in real-time matches
        </p>
      </div>

      {/* Player Stats Bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Your Rating:</span>
              <Badge variant="outline" className={`text-${ratingTier.color}-600`}>
                {ratingTier.icon} {playerRating} ({ratingTier.name})
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm">Win Rate: 62%</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Rank: #1,234</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="games" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">Available Games</TabsTrigger>
          <TabsTrigger value="active">Active Matches</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboards</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {multiplayerGames.map((game) => (
              <Card
                key={game.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleGameSelect(game.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{game.icon}</div>
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {game.playersOnline} online
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {game.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    ~{game.avgWaitTime}s wait
                  </div>
                  <Button size="sm">
                    <Play className="w-4 h-4 mr-1" />
                    Play Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Live Matches</h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {activeGames.map((game) => (
                  <Card key={game.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {multiplayerGames.find(g => g.id === game.gameType)?.icon}
                        </div>
                        <div>
                          <div className="font-medium">
                            {game.players[0]} vs {game.players[1]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {game.startTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={game.status === 'active' ? 'default' : 'secondary'}
                        >
                          {game.status === 'active' ? 'In Progress' : 'Waiting'}
                        </Badge>
                        {game.status === 'active' && (
                          <Button size="sm" variant="outline">
                            Spectate
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Global Rankings</h3>
            <div className="space-y-2">
              {[
                { rank: 1, player: 'GrandMaster99', rating: 2456, tier: 'Grandmaster' },
                { rank: 2, player: 'ChessKing', rating: 2398, tier: 'Master' },
                { rank: 3, player: 'ProGamer123', rating: 2341, tier: 'Master' },
                { rank: 47, player: 'You', rating: playerRating, tier: ratingTier.name },
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.player === 'You' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold w-12">
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </div>
                    <div>
                      <div className="font-medium">{entry.player}</div>
                      <div className="text-sm text-gray-500">{entry.tier}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{entry.rating} ELO</Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Full Leaderboard
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}