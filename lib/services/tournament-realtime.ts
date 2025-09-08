/**
 * Real-time Tournament Updates Service
 * Handles live tournament notifications and WebSocket connections
 */

import { createClient } from '@/lib/supabase/client';
import { Tournament, TournamentMatch, TournamentParticipant } from './tournaments';
import { getPushNotificationService } from './push-notifications';

export interface TournamentUpdate {
  type: 'match_start' | 'match_end' | 'round_complete' | 'tournament_complete' | 
        'participant_joined' | 'participant_left' | 'bracket_update' | 'score_update';
  tournamentId: string;
  data: any;
  timestamp: Date;
}

export interface TournamentSubscription {
  tournamentId: string;
  callback: (update: TournamentUpdate) => void;
  unsubscribe: () => void;
}

class TournamentRealtimeService {
  private subscriptions: Map<string, TournamentSubscription[]> = new Map();
  private supabaseChannel: any = null;
  private mockWebSocket: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Initialize real-time connection
   */
  async connect(): Promise<boolean> {
    try {
      // Try Supabase Realtime first
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = createClient();
        
        this.supabaseChannel = supabase
          .channel('tournament_updates')
          .on('broadcast', { event: 'tournament_update' }, (payload: any) => {
            this.handleUpdate(payload.payload as TournamentUpdate);
          })
          .subscribe((status: string) => {
            this.isConnected = status === 'SUBSCRIBED';
            console.log('Supabase Realtime status:', status);
          });
          
        return true;
      }
      
      // Fallback to mock WebSocket for development
      return this.connectMockWebSocket();
    } catch (error) {
      console.error('Failed to connect to real-time service:', error);
      return false;
    }
  }

  /**
   * Disconnect from real-time service
   */
  async disconnect(): Promise<void> {
    if (this.supabaseChannel) {
      const supabase = createClient();
      await supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }

    if (this.mockWebSocket) {
      this.mockWebSocket.close();
      this.mockWebSocket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnected = false;
    this.subscriptions.clear();
  }

  /**
   * Subscribe to tournament updates
   */
  subscribeTournament(
    tournamentId: string, 
    callback: (update: TournamentUpdate) => void
  ): TournamentSubscription {
    const subscription: TournamentSubscription = {
      tournamentId,
      callback,
      unsubscribe: () => {
        this.unsubscribeTournament(tournamentId, subscription);
      }
    };

    const existing = this.subscriptions.get(tournamentId) || [];
    existing.push(subscription);
    this.subscriptions.set(tournamentId, existing);

    // Send initial connection message
    this.broadcastUpdate({
      type: 'participant_joined',
      tournamentId,
      data: { message: 'Subscribed to tournament updates' },
      timestamp: new Date()
    });

    return subscription;
  }

  /**
   * Unsubscribe from tournament updates
   */
  unsubscribeTournament(tournamentId: string, subscription: TournamentSubscription): void {
    const subs = this.subscriptions.get(tournamentId) || [];
    const filtered = subs.filter(s => s !== subscription);
    
    if (filtered.length > 0) {
      this.subscriptions.set(tournamentId, filtered);
    } else {
      this.subscriptions.delete(tournamentId);
    }
  }

  /**
   * Broadcast tournament update
   */
  async broadcastUpdate(update: TournamentUpdate): Promise<void> {
    // Send via Supabase if available
    if (this.supabaseChannel) {
      const supabase = createClient();
      await supabase.channel('tournament_updates').send({
        type: 'broadcast',
        event: 'tournament_update',
        payload: update
      });
    }

    // Send via mock WebSocket if available
    if (this.mockWebSocket && this.mockWebSocket.readyState === WebSocket.OPEN) {
      this.mockWebSocket.send(JSON.stringify(update));
    }

    // Directly notify local subscribers
    this.handleUpdate(update);
  }

  /**
   * Notify match start
   */
  async notifyMatchStart(
    tournamentId: string, 
    match: TournamentMatch
  ): Promise<void> {
    const update: TournamentUpdate = {
      type: 'match_start',
      tournamentId,
      data: match,
      timestamp: new Date()
    };

    await this.broadcastUpdate(update);

    // Send push notification to participants
    const pushService = getPushNotificationService();
    if (match.player1Name && match.player2Name) {
      await pushService.sendLocalNotification({
        title: 'Tournament Match Starting!',
        body: `${match.player1Name} vs ${match.player2Name} - Round ${match.round}`,
        icon: '/icon-192x192.png',
        tag: `match-${match.id}`,
        requireInteraction: false,
        actions: [
          { action: 'watch', title: 'Watch', icon: '/icons/eye.png' }
        ],
        data: { type: 'tournament-match', tournamentId, matchId: match.id }
      });
    }
  }

  /**
   * Notify match end
   */
  async notifyMatchEnd(
    tournamentId: string, 
    match: TournamentMatch,
    winnerId: string,
    winnerName: string
  ): Promise<void> {
    const update: TournamentUpdate = {
      type: 'match_end',
      tournamentId,
      data: { ...match, winnerId, winnerName },
      timestamp: new Date()
    };

    await this.broadcastUpdate(update);

    // Send push notification
    const pushService = getPushNotificationService();
    await pushService.sendLocalNotification({
      title: 'Match Result',
      body: `${winnerName} wins! (${match.player1Score} - ${match.player2Score})`,
      icon: '/icon-192x192.png',
      tag: `match-result-${match.id}`,
      requireInteraction: false,
      data: { type: 'match-result', tournamentId, matchId: match.id }
    });
  }

  /**
   * Notify round complete
   */
  async notifyRoundComplete(
    tournamentId: string,
    roundNumber: number,
    nextRoundMatches: TournamentMatch[]
  ): Promise<void> {
    const update: TournamentUpdate = {
      type: 'round_complete',
      tournamentId,
      data: { roundNumber, nextRoundMatches },
      timestamp: new Date()
    };

    await this.broadcastUpdate(update);

    // Send push notification
    const pushService = getPushNotificationService();
    await pushService.sendLocalNotification({
      title: 'Round Complete!',
      body: `Round ${roundNumber} is complete. Next round starting soon!`,
      icon: '/icon-192x192.png',
      tag: `round-${tournamentId}-${roundNumber}`,
      requireInteraction: false,
      actions: [
        { action: 'view-bracket', title: 'View Bracket', icon: '/icons/bracket.png' }
      ],
      data: { type: 'round-complete', tournamentId, roundNumber }
    });
  }

  /**
   * Notify tournament complete
   */
  async notifyTournamentComplete(
    tournament: Tournament,
    winner: TournamentParticipant,
    runnerUp?: TournamentParticipant
  ): Promise<void> {
    const update: TournamentUpdate = {
      type: 'tournament_complete',
      tournamentId: tournament.id,
      data: { tournament, winner, runnerUp },
      timestamp: new Date()
    };

    await this.broadcastUpdate(update);

    // Send push notification
    const pushService = getPushNotificationService();
    await pushService.sendLocalNotification({
      title: `${tournament.name} Complete!`,
      body: `🏆 ${winner.username} wins the tournament!`,
      icon: '/icon-192x192.png',
      badge: '/icons/trophy.png',
      tag: `tournament-complete-${tournament.id}`,
      requireInteraction: true,
      actions: [
        { action: 'view-results', title: 'View Results', icon: '/icons/leaderboard.png' }
      ],
      data: { type: 'tournament-complete', tournamentId: tournament.id }
    });
  }

  /**
   * Notify score update in live match
   */
  async notifyScoreUpdate(
    tournamentId: string,
    matchId: string,
    player1Score: number,
    player2Score: number
  ): Promise<void> {
    const update: TournamentUpdate = {
      type: 'score_update',
      tournamentId,
      data: { matchId, player1Score, player2Score },
      timestamp: new Date()
    };

    await this.broadcastUpdate(update);
  }

  /**
   * Get connection status
   */
  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  // Private methods

  private handleUpdate(update: TournamentUpdate): void {
    const subscribers = this.subscriptions.get(update.tournamentId) || [];
    subscribers.forEach(sub => {
      try {
        sub.callback(update);
      } catch (error) {
        console.error('Error in tournament update callback:', error);
      }
    });
  }

  private connectMockWebSocket(): boolean {
    try {
      // Create mock WebSocket for development
      this.mockWebSocket = new WebSocket('wss://echo.websocket.org/');
      
      this.mockWebSocket.onopen = () => {
        console.log('Mock WebSocket connected for tournament updates');
        this.isConnected = true;
      };

      this.mockWebSocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as TournamentUpdate;
          this.handleUpdate(update);
        } catch (error) {
          console.error('Failed to parse tournament update:', error);
        }
      };

      this.mockWebSocket.onerror = (error) => {
        console.error('Mock WebSocket error:', error);
      };

      this.mockWebSocket.onclose = () => {
        console.log('Mock WebSocket disconnected');
        this.isConnected = false;
        this.attemptReconnect();
      };

      return true;
    } catch (error) {
      console.error('Failed to connect mock WebSocket:', error);
      return false;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect tournament real-time service...');
      this.connect();
      this.reconnectTimer = null;
    }, 5000);
  }
}

// Create singleton instance
let tournamentRealtimeService: TournamentRealtimeService | null = null;

export function getTournamentRealtimeService(): TournamentRealtimeService {
  if (!tournamentRealtimeService) {
    tournamentRealtimeService = new TournamentRealtimeService();
  }
  return tournamentRealtimeService;
}

// React hook for tournament real-time updates
import { useState, useEffect } from 'react';

export function useTournamentRealtime(tournamentId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<TournamentUpdate[]>([]);
  const [subscription, setSubscription] = useState<TournamentSubscription | null>(null);

  useEffect(() => {
    const service = getTournamentRealtimeService();
    
    const init = async () => {
      const connected = await service.connect();
      setIsConnected(connected);
      
      if (connected && tournamentId) {
        const sub = service.subscribeTournament(tournamentId, (update) => {
          setUpdates(prev => [...prev, update]);
        });
        setSubscription(sub);
      }
    };
    
    init();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tournamentId]);

  return {
    isConnected,
    updates,
    latestUpdate: updates[updates.length - 1]
  };
}