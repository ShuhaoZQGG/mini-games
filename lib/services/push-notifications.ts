import { createClient } from '@/lib/supabase/client';

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  challenges: boolean;
  tournaments: boolean;
  friendRequests: boolean;
  achievements: boolean;
  leaderboards: boolean;
  marketing: boolean;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEL9WLQ3Y5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n5Z5n';

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.swRegistration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription.toJSON() as PushSubscription;
        await this.saveSubscriptionToServer(this.subscription);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.subscribe();
    }
    
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      await this.initialize();
    }

    if (!this.swRegistration) {
      console.error('Service worker not ready');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as any
      });

      this.subscription = subscription.toJSON() as PushSubscription;
      await this.saveSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
        this.subscription = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.swRegistration) {
      await this.initialize();
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-72x72.png',
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
      data: payload.data
    };
    
    // Add actions if supported (not all browsers support it)
    if (payload.actions) {
      (options as any).actions = payload.actions;
    }
    
    // Add image if supported (not all browsers support it)
    if (payload.image) {
      (options as any).image = payload.image;
    }
    
    await this.swRegistration?.showNotification(payload.title, options);
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return this.getDefaultPreferences();
      }

      const { data, error } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return this.getDefaultPreferences();
      }

      return data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Store in localStorage for guests
        localStorage.setItem('notificationPreferences', JSON.stringify({
          ...this.getDefaultPreferences(),
          ...preferences
        }));
        return;
      }

      await (supabase as any)
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Fallback to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify({
        ...this.getDefaultPreferences(),
        ...preferences
      }));
    }
  }

  // Notification templates for common events
  async notifyChallengeReceived(challengerName: string, gameName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'New Challenge!',
      body: `${challengerName} challenged you to ${gameName}`,
      icon: '/icon-192x192.png',
      tag: 'challenge',
      requireInteraction: true,
      actions: [
        { action: 'accept', title: 'Accept', icon: '/icons/check.png' },
        { action: 'decline', title: 'Decline', icon: '/icons/x.png' }
      ],
      data: { type: 'challenge', challengerName, gameName }
    });
  }

  async notifyTournamentStart(tournamentName: string, startTime: Date): Promise<void> {
    await this.sendLocalNotification({
      title: 'Tournament Starting Soon!',
      body: `${tournamentName} starts at ${startTime.toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      tag: 'tournament',
      requireInteraction: false,
      actions: [
        { action: 'view', title: 'View Tournament', icon: '/icons/trophy.png' }
      ],
      data: { type: 'tournament', tournamentName, startTime: startTime.toISOString() }
    });
  }

  async notifyFriendRequest(friendName: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Friend Request',
      body: `${friendName} wants to be your friend`,
      icon: '/icon-192x192.png',
      tag: 'friend-request',
      requireInteraction: true,
      actions: [
        { action: 'accept', title: 'Accept', icon: '/icons/check.png' },
        { action: 'decline', title: 'Decline', icon: '/icons/x.png' }
      ],
      data: { type: 'friend-request', friendName }
    });
  }

  async notifyAchievementUnlocked(achievementName: string, points: number): Promise<void> {
    await this.sendLocalNotification({
      title: 'Achievement Unlocked!',
      body: `You earned "${achievementName}" (+${points} points)`,
      icon: '/icon-192x192.png',
      badge: '/icons/achievement.png',
      tag: 'achievement',
      requireInteraction: false,
      data: { type: 'achievement', achievementName, points }
    });
  }

  async notifyLeaderboardPosition(gameName: string, position: number, period: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Leaderboard Update!',
      body: `You're now #${position} in ${gameName} (${period})`,
      icon: '/icon-192x192.png',
      tag: 'leaderboard',
      requireInteraction: false,
      actions: [
        { action: 'view', title: 'View Leaderboard', icon: '/icons/leaderboard.png' }
      ],
      data: { type: 'leaderboard', gameName, position, period }
    });
  }

  async scheduleNotification(payload: NotificationPayload, delayMs: number): Promise<void> {
    setTimeout(() => {
      this.sendLocalNotification(payload);
    }, delayMs);
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Private helper methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await (supabase as any)
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription,
            created_at: new Date().toISOString()
          });
      } else {
        // Store in localStorage for guests
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      }
    } catch (error) {
      console.error('Failed to save subscription to server:', error);
      // Fallback to localStorage
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await (supabase as any)
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      } else {
        localStorage.removeItem('pushSubscription');
      }
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      localStorage.removeItem('pushSubscription');
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notificationPreferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    
    return {
      challenges: true,
      tournaments: true,
      friendRequests: true,
      achievements: true,
      leaderboards: false,
      marketing: false
    };
  }
}

// Create singleton instance
let pushNotificationService: PushNotificationService | null = null;

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService();
  }
  return pushNotificationService;
}

// Hook for React components
import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    challenges: true,
    tournaments: true,
    friendRequests: true,
    achievements: true,
    leaderboards: false,
    marketing: false
  });

  useEffect(() => {
    const service = getPushNotificationService();
    
    const init = async () => {
      await service.initialize();
      setPermission(await service.checkPermission());
      setIsSubscribed(service.isSubscribed());
      setPreferences(await service.getPreferences());
    };
    
    init();
  }, []);

  const requestPermission = async () => {
    const service = getPushNotificationService();
    const perm = await service.requestPermission();
    setPermission(perm);
    setIsSubscribed(service.isSubscribed());
    return perm;
  };

  const subscribe = async () => {
    const service = getPushNotificationService();
    const sub = await service.subscribe();
    setIsSubscribed(sub !== null);
    return sub;
  };

  const unsubscribe = async () => {
    const service = getPushNotificationService();
    const success = await service.unsubscribe();
    setIsSubscribed(!success);
    return success;
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const service = getPushNotificationService();
    await service.updatePreferences(newPrefs);
    setPreferences({ ...preferences, ...newPrefs });
  };

  return {
    permission,
    isSubscribed,
    preferences,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences
  };
}