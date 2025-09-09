'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Loader2, Play, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface MatchmakingProps {
  gameType: string;
  onMatchFound: (roomId: string, isHost: boolean) => void;
  playerRating?: number;
}

export function MatchmakingSystem({ gameType, onMatchFound, playerRating = 1200 }: MatchmakingProps) {
  const [mode, setMode] = useState<'menu' | 'quick' | 'create' | 'join'>('menu');
  const [searching, setSearching] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [playersInQueue, setPlayersInQueue] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(15);

  useEffect(() => {
    if (mode === 'quick' && searching) {
      startQuickMatch();
    }
  }, [mode, searching]);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const startQuickMatch = async () => {
    setSearching(true);
    setError('');

    try {
      // Check for available rooms
      const { data: rooms, error: roomError } = await (supabase
        .from('game_rooms') as any)
        .select('*')
        .eq('game_type', gameType)
        .eq('status', 'waiting')
        .gte('rating_min', playerRating - 200)
        .lte('rating_max', playerRating + 200)
        .limit(1);

      if (roomError) throw roomError;

      if (rooms && rooms.length > 0) {
        // Join existing room
        const room = rooms[0] as any; // TODO: Add proper type from database
        await joinRoom(room.id, false);
      } else {
        // Create new room and wait
        const newRoomId = await createRoom(true);
        waitForOpponent(newRoomId);
      }
    } catch (err) {
      setError('Failed to start matchmaking');
      setSearching(false);
    }
  };

  const createRoom = async (isQuickMatch = false): Promise<string> => {
    const code = generateRoomCode();
    const roomId = `${gameType}-${code}`;

    try {
      const { error } = await (supabase
        .from('game_rooms') as any)
        .insert({
          id: roomId,
          game_type: gameType,
          host_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'waiting',
          settings: {
            is_quick_match: isQuickMatch,
            rating_min: playerRating - 200,
            rating_max: playerRating + 200,
            room_code: code
          }
        });

      if (error) throw error;

      if (!isQuickMatch) {
        setRoomCode(code);
      }

      return roomId;
    } catch (err) {
      setError('Failed to create room');
      throw err;
    }
  };

  const joinRoom = async (roomId: string, isHost: boolean) => {
    try {
      const { error } = await (supabase
        .from('game_rooms') as any)
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      onMatchFound(roomId, isHost);
    } catch (err) {
      setError('Failed to join room');
    }
  };

  const waitForOpponent = (roomId: string) => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        if (payload.new.status === 'active') {
          channel.unsubscribe();
          onMatchFound(roomId, true);
        }
      })
      .subscribe();

    // Simulate queue updates
    const interval = setInterval(() => {
      setPlayersInQueue(Math.floor(Math.random() * 50) + 10);
      setEstimatedTime(Math.floor(Math.random() * 30) + 5);
    }, 3000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  };

  const handleCreateRoom = async () => {
    setMode('create');
    setError('');
    try {
      await createRoom(false);
    } catch (err) {
      // Error already handled in createRoom
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode || joinCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    setError('');
    const roomId = `${gameType}-${joinCode.toUpperCase()}`;

    try {
      const { data: room, error } = await (supabase
        .from('game_rooms') as any)
        .select('*')
        .eq('id', roomId)
        .eq('status', 'waiting')
        .single();

      if (error || !room) {
        setError('Room not found or already started');
        return;
      }

      await joinRoom(roomId, false);
    } catch (err) {
      setError('Failed to join room');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cancelSearch = () => {
    setSearching(false);
    setMode('menu');
    setError('');
  };

  if (mode === 'menu') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Multiplayer Options</h2>
        
        <div className="space-y-4">
          <Button
            className="w-full h-16"
            onClick={() => {
              setMode('quick');
              setSearching(true);
            }}
          >
            <Users className="mr-2" />
            Quick Match
          </Button>

          <Button
            className="w-full h-16"
            variant="outline"
            onClick={handleCreateRoom}
          >
            Create Private Room
          </Button>

          <Button
            className="w-full h-16"
            variant="outline"
            onClick={() => setMode('join')}
          >
            Join Private Room
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </Card>
    );
  }

  if (mode === 'quick' && searching) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Finding Match</h2>
        
        <div className="flex justify-center mb-6">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
        </div>

        <div className="space-y-4 text-center">
          <p className="text-lg">Searching for opponents...</p>
          
          <div className="flex justify-center gap-4 text-sm text-gray-600">
            <span>Players in queue: {playersInQueue}</span>
            <span>Est. time: {estimatedTime}s</span>
          </div>

          <div className="pt-4">
            <Badge variant="outline">
              Skill Range: {playerRating - 200} - {playerRating + 200} ELO
            </Badge>
          </div>
        </div>

        <Button
          className="w-full mt-6"
          variant="outline"
          onClick={cancelSearch}
        >
          Cancel
        </Button>
      </Card>
    );
  }

  if (mode === 'create') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Private Room Created</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Room Code</p>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-mono font-bold flex-1 text-center">
                {roomCode}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyRoomCode}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600">
            Share this code with your friend to start the game
          </p>

          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Waiting for opponent to join...</span>
          </div>
        </div>

        <Button
          className="w-full mt-6"
          variant="outline"
          onClick={() => setMode('menu')}
        >
          Cancel
        </Button>
      </Card>
    );
  }

  if (mode === 'join') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Join Private Room</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Enter Room Code
            </label>
            <Input
              type="text"
              placeholder="6-character code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-mono uppercase"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleJoinRoom}
            disabled={joinCode.length !== 6}
          >
            <Play className="mr-2" />
            Join Game
          </Button>
        </div>

        <Button
          className="w-full mt-4"
          variant="outline"
          onClick={() => {
            setMode('menu');
            setJoinCode('');
            setError('');
          }}
        >
          Back
        </Button>
      </Card>
    );
  }

  return null;
}