'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, Users, Calendar, Clock, DollarSign, Award, 
  ChevronRight, AlertCircle, CheckCircle, XCircle,
  Swords, Shield, Target, Zap, Timer, TrendingUp,
  Medal, Crown, Star, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';

// Types
interface Tournament {
  id: string;
  name: string;
  description: string;
  game_id: string;
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  min_participants: number;
  current_participants: number;
  registration_starts: string;
  registration_ends: string;
  tournament_starts: string;
  tournament_ends: string;
  rules: {
    time_limit?: number;
    rounds?: number;
    scoring_system?: string;
  };
  settings: {
    auto_start?: boolean;
    spectators_allowed?: boolean;
    chat_enabled?: boolean;
  };
  created_by: string;
  created_at: string;
}

interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  status: 'registered' | 'checked_in' | 'playing' | 'eliminated' | 'winner' | 'disqualified';
  seed: number;
  final_rank?: number;
  matches_played: number;
  matches_won: number;
  total_score: number;
  prize_amount: number;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  player1_score?: number;
  player2_score?: number;
  winner_id?: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
}

interface TournamentHubProps {
  gameId?: string;
  className?: string;
  userId?: string;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({
  gameId,
  className,
  userId,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const supabase = createClientComponentClient();

  // Fetch tournaments
  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('tournaments')
        .select('*')
        .order('tournament_starts', { ascending: true });

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const activeTournaments = data?.filter(t => {
        const regStart = new Date(t.registration_starts);
        const tourneyEnd = new Date(t.tournament_ends);
        return isAfter(now, regStart) && isBefore(now, tourneyEnd);
      }) || [];

      setTournaments(activeTournaments);

      // Fetch user's tournaments
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userParticipations } = await supabase
          .from('tournament_participants')
          .select('tournament_id')
          .eq('user_id', user.id);

        const userTournamentIds = userParticipations?.map(p => p.tournament_id) || [];
        const userTournaments = activeTournaments.filter(t => 
          userTournamentIds.includes(t.id)
        );
        setMyTournaments(userTournaments);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, [supabase, gameId]);

  // Fetch tournament details
  const fetchTournamentDetails = useCallback(async (tournamentId: string) => {
    try {
      // Fetch participants
      const { data: participantsData } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true });

      setParticipants(participantsData || []);

      // Fetch matches
      const { data: matchesData } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round,match_number', { ascending: true });

      setMatches(matchesData || []);
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    }
  }, [supabase]);

  // Register for tournament
  const registerForTournament = async (tournament: Tournament) => {
    try {
      setRegistering(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to register');
        return;
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.error('You are already registered for this tournament');
        return;
      }

      // Register participant
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Player',
          seed: tournament.current_participants + 1,
        });

      if (error) throw error;

      // Update tournament participant count
      await supabase
        .from('tournaments')
        .update({ 
          current_participants: tournament.current_participants + 1 
        })
        .eq('id', tournament.id);

      toast.success('Successfully registered for tournament!');
      fetchTournaments();
      fetchTournamentDetails(tournament.id);
    } catch (error) {
      console.error('Error registering for tournament:', error);
      toast.error('Failed to register for tournament');
    } finally {
      setRegistering(false);
    }
  };

  // Get tournament status color
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'registration':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'active':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  // Get tournament type icon
  const getTypeIcon = (type: Tournament['type']) => {
    switch (type) {
      case 'single_elimination':
        return <Swords className="w-4 h-4" />;
      case 'double_elimination':
        return <Shield className="w-4 h-4" />;
      case 'round_robin':
        return <Target className="w-4 h-4" />;
      case 'swiss':
        return <Zap className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  // Format tournament type
  const formatTournamentType = (type: Tournament['type']) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Initial load
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Load tournament details when selected
  useEffect(() => {
    if (selectedTournament) {
      fetchTournamentDetails(selectedTournament.id);
    }
  }, [selectedTournament, fetchTournamentDetails]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('tournament-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        () => fetchTournaments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_participants' },
        () => {
          if (selectedTournament) {
            fetchTournamentDetails(selectedTournament.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedTournament, fetchTournaments, fetchTournamentDetails]);

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Tournament Hub
          </CardTitle>
          <CardDescription>
            Compete in tournaments to win prizes and climb the rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="my-tournaments">My Tournaments</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active tournaments available
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tournaments.map((tournament) => (
                    <Card key={tournament.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{tournament.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(tournament.type)}
                              <span className="text-xs text-muted-foreground">
                                {formatTournamentType(tournament.type)}
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(tournament.status)}>
                            {tournament.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {tournament.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Participants
                            </span>
                            <span className="font-medium">
                              {tournament.current_participants}/{tournament.max_participants}
                            </span>
                          </div>
                          <Progress 
                            value={(tournament.current_participants / tournament.max_participants) * 100}
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span>Entry: ${tournament.entry_fee}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span>Prize: ${tournament.prize_pool}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>{format(new Date(tournament.tournament_starts), 'MMM d')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{format(new Date(tournament.tournament_starts), 'HH:mm')}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => setSelectedTournament(tournament)}
                        >
                          View Details
                        </Button>
                        {tournament.status === 'registration' && (
                          <Button
                            className="flex-1"
                            size="sm"
                            variant="default"
                            onClick={() => registerForTournament(tournament)}
                            disabled={registering}
                          >
                            Register
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-tournaments" className="space-y-4">
              {myTournaments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  You haven't joined any tournaments yet
                </div>
              ) : (
                <div className="space-y-4">
                  {myTournaments.map((tournament) => {
                    const participant = participants.find(p => p.tournament_id === tournament.id);
                    return (
                      <Card key={tournament.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{tournament.name}</CardTitle>
                              <CardDescription>
                                {formatDistanceToNow(new Date(tournament.tournament_starts), { addSuffix: true })}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(tournament.status)}>
                                {tournament.status}
                              </Badge>
                              {participant && (
                                <Badge variant="outline">
                                  Seed #{participant.seed}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold">{participant?.matches_played || 0}</p>
                              <p className="text-xs text-muted-foreground">Matches Played</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{participant?.matches_won || 0}</p>
                              <p className="text-xs text-muted-foreground">Matches Won</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">
                                {participant?.final_rank ? `#${participant.final_rank}` : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">Final Rank</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            className="w-full"
                            onClick={() => setSelectedTournament(tournament)}
                          >
                            View Tournament
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                Tournament results will appear here after completion
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tournament Details Modal */}
      <AnimatePresence>
        {selectedTournament && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTournament(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTournament.name}</h2>
                    <p className="text-muted-foreground">{selectedTournament.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedTournament(null)}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(90vh-8rem)]">
                <div className="p-6 space-y-6">
                  {/* Tournament Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Prize Pool</p>
                          <p className="text-xl font-bold">${selectedTournament.prize_pool}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Players</p>
                          <p className="text-xl font-bold">
                            {selectedTournament.current_participants}/{selectedTournament.max_participants}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Starts</p>
                          <p className="text-sm font-medium">
                            {format(new Date(selectedTournament.tournament_starts), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(selectedTournament.type)}
                        <div>
                          <p className="text-sm text-muted-foreground">Format</p>
                          <p className="text-sm font-medium">
                            {formatTournamentType(selectedTournament.type)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Participants */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Participants</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{participant.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.username}</p>
                              <p className="text-xs text-muted-foreground">
                                Seed #{participant.seed}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            participant.status === 'winner' ? 'default' :
                            participant.status === 'eliminated' ? 'destructive' :
                            'secondary'
                          }>
                            {participant.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bracket/Matches */}
                  {matches.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Tournament Bracket</h3>
                      <div className="space-y-4">
                        {Array.from(new Set(matches.map(m => m.round))).map(round => (
                          <div key={round}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Round {round}
                            </h4>
                            <div className="grid gap-2">
                              {matches.filter(m => m.round === round).map(match => (
                                <Card key={match.id} className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm">
                                          Player 1
                                        </span>
                                        <span className="font-bold">
                                          {match.player1_score ?? '-'}
                                        </span>
                                      </div>
                                      <div className="h-px bg-border my-1" />
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm">
                                          Player 2
                                        </span>
                                        <span className="font-bold">
                                          {match.player2_score ?? '-'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <Badge variant={
                                        match.status === 'completed' ? 'default' :
                                        match.status === 'in_progress' ? 'secondary' :
                                        'outline'
                                      }>
                                        {match.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};