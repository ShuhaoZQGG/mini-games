'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RealtimeLeaderboard from '@/components/realtime-leaderboard';
import { PresenceIndicator } from '@/components/presence-indicator';
import { GameEvents, broadcastGameEvent } from '@/components/game-events';
import { realtimeService } from '@/lib/services/realtime';
import { scoreService } from '@/lib/services/scores';
import { 
  Wifi, 
  WifiOff, 
  Send, 
  Trophy, 
  Users, 
  Zap, 
  Info,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_GAME_ID = 'realtime-demo';

export default function RealtimeShowcase() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [score, setScore] = useState('');
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    const configured = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
    );
    
    setIsSupabaseConfigured(configured);
    setIsConnected(true); // Mock connection is always available
    
    // Set default username
    const savedName = localStorage.getItem('guest_name');
    if (savedName) {
      setUsername(savedName);
    } else {
      const defaultName = `Player${Math.floor(Math.random() * 10000)}`;
      setUsername(defaultName);
      localStorage.setItem('guest_name', defaultName);
    }
  }, []);

  const handleSubmitScore = async () => {
    const scoreValue = parseInt(score);
    if (!scoreValue || scoreValue <= 0) {
      toast.error('Please enter a valid score');
      return;
    }

    // Submit score
    const result = await scoreService.saveScore(DEMO_GAME_ID, scoreValue, {
      demo: true,
      timestamp: Date.now()
    });

    if (result.success) {
      toast.success(`Score ${scoreValue} submitted successfully!`);
      
      // Broadcast score update event
      await broadcastGameEvent({
        type: 'score_update',
        game_id: DEMO_GAME_ID,
        player_name: username,
        data: { score: scoreValue },
        timestamp: new Date().toISOString()
      });

      setScore('');
    } else {
      toast.error('Failed to submit score');
    }
  };

  const handleBroadcastEvent = async (eventType: 'player_joined' | 'player_left' | 'game_started') => {
    await broadcastGameEvent({
      type: eventType,
      game_id: DEMO_GAME_ID,
      player_name: username,
      data: null,
      timestamp: new Date().toISOString()
    });

    toast.success(`Event "${eventType}" broadcasted!`);
  };

  const simulateActivity = async () => {
    // Simulate multiple events
    const events = [
      { type: 'player_joined' as const, player: 'SimPlayer1' },
      { type: 'score_update' as const, player: 'SimPlayer2', score: Math.floor(Math.random() * 5000) },
      { type: 'score_update' as const, player: 'SimPlayer3', score: Math.floor(Math.random() * 5000) },
      { type: 'player_left' as const, player: 'SimPlayer1' },
    ];

    for (const event of events) {
      await broadcastGameEvent({
        type: event.type,
        game_id: DEMO_GAME_ID,
        player_name: event.player,
        data: event.type === 'score_update' ? { score: event.score } : null,
        timestamp: new Date().toISOString()
      });

      // Add delay between events
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success('Simulated activity completed!');
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Alert */}
      <Alert className={isSupabaseConfigured ? '' : 'border-yellow-500'}>
        <Info className="h-4 w-4" />
        <AlertTitle>Connection Status</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {isSupabaseConfigured 
              ? 'Connected to Supabase Realtime' 
              : 'Using Mock WebSocket (Supabase not configured)'}
          </span>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Interactive Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Controls</CardTitle>
          <CardDescription>
            Test real-time features by submitting scores and broadcasting events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                localStorage.setItem('guest_name', e.target.value);
              }}
              className="max-w-xs"
            />
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              {username}
            </Badge>
          </div>

          {/* Score Submission */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter score (e.g., 1000)"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleSubmitScore} disabled={!score}>
              <Send className="w-4 h-4 mr-2" />
              Submit Score
            </Button>
          </div>

          {/* Event Broadcasting */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleBroadcastEvent('player_joined')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join Game
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBroadcastEvent('game_started')}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBroadcastEvent('player_left')}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              Leave Game
            </Button>
            <Button 
              variant="secondary" 
              onClick={simulateActivity}
            >
              <Zap className="w-4 h-4 mr-2" />
              Simulate Activity
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Presence Indicator */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Player Presence
          </h3>
          <PresenceIndicator gameId={DEMO_GAME_ID} variant="detailed" />
        </div>

        {/* Live Leaderboard */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Live Leaderboard
          </h3>
          <RealtimeLeaderboard 
            gameId={DEMO_GAME_ID} 
            gameName="Demo"
            formatScore={(s) => s.toLocaleString()}
          />
        </div>

        {/* Game Events Feed */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Event Feed
          </h3>
          <GameEvents gameId={DEMO_GAME_ID} variant="feed" maxEvents={10} />
        </div>
      </div>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureStatus 
              name="WebSocket Connection" 
              status={isConnected} 
              description="Real-time bidirectional communication"
            />
            <FeatureStatus 
              name="Supabase Integration" 
              status={isSupabaseConfigured} 
              description="Database-backed real-time sync"
            />
            <FeatureStatus 
              name="Live Leaderboards" 
              status={true} 
              description="Instant score updates across all clients"
            />
            <FeatureStatus 
              name="Presence Tracking" 
              status={true} 
              description="See who\'s online in real-time"
            />
            <FeatureStatus 
              name="Event Broadcasting" 
              status={true} 
              description="Share game events instantly"
            />
            <FeatureStatus 
              name="Fallback Support" 
              status={true} 
              description="Works without Supabase configuration"
            />
          </div>
        </CardContent>
      </Card>

      {/* Toast Container for Events */}
      <GameEvents gameId={DEMO_GAME_ID} variant="toast" position="bottom-right" />
    </div>
  );
}

function FeatureStatus({ 
  name, 
  status, 
  description 
}: { 
  name: string; 
  status: boolean; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {status ? (
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
      )}
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Import for missing components
import { UserPlus, UserMinus } from 'lucide-react';