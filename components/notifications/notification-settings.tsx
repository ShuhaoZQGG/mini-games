'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications } from '@/lib/services/push-notifications';

export function NotificationSettings() {
  const {
    permission,
    isSubscribed,
    preferences,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences
  } = usePushNotifications();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (permission === 'default') {
        const perm = await requestPermission();
        if (perm !== 'granted') {
          setMessage({ type: 'error', text: 'Please allow notifications in your browser settings' });
          setLoading(false);
          return;
        }
      }

      if (!isSubscribed) {
        const sub = await subscribe();
        if (sub) {
          setMessage({ type: 'success', text: 'Push notifications enabled successfully!' });
        } else {
          setMessage({ type: 'error', text: 'Failed to enable push notifications' });
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setMessage({ type: 'error', text: 'Failed to enable push notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const success = await unsubscribe();
      if (success) {
        setMessage({ type: 'success', text: 'Push notifications disabled' });
      } else {
        setMessage({ type: 'error', text: 'Failed to disable push notifications' });
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      setMessage({ type: 'error', text: 'Failed to disable push notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      setMessage({ type: 'error', text: 'Failed to update notification preferences' });
    }
  };

  const notificationTypes = [
    {
      key: 'challenges' as const,
      label: 'Game Challenges',
      description: 'When someone challenges you to a game'
    },
    {
      key: 'tournaments' as const,
      label: 'Tournament Updates',
      description: 'Tournament starts, matches, and results'
    },
    {
      key: 'friendRequests' as const,
      label: 'Friend Requests',
      description: 'When someone sends you a friend request'
    },
    {
      key: 'achievements' as const,
      label: 'Achievements',
      description: 'When you unlock new achievements'
    },
    {
      key: 'leaderboards' as const,
      label: 'Leaderboard Updates',
      description: 'When your ranking changes significantly'
    },
    {
      key: 'marketing' as const,
      label: 'News & Updates',
      description: 'New games, features, and platform updates'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage your notification preferences to stay updated on what matters to you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
              </p>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied' 
                  ? 'Blocked in browser settings'
                  : isSubscribed 
                    ? 'You will receive push notifications'
                    : 'Enable to receive push notifications'}
              </p>
            </div>
          </div>
          {permission !== 'denied' && (
            <Button
              variant={isSubscribed ? 'outline' : 'default'}
              size="sm"
              onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={loading}
            >
              {loading ? 'Processing...' : isSubscribed ? 'Disable' : 'Enable'}
            </Button>
          )}
        </div>

        {/* Browser Permission Denied Alert */}
        {permission === 'denied' && (
          <Alert>
            <AlertDescription>
              Push notifications are blocked in your browser settings. 
              Please enable them in your browser&apos;s site settings to receive notifications.
            </AlertDescription>
          </Alert>
        )}

        {/* Success/Error Messages */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Notification Types</h3>
            <div className="space-y-3">
              {notificationTypes.map((type) => (
                <div
                  key={type.key}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={type.key} className="font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <Switch
                    id={type.key}
                    checked={preferences[type.key]}
                    onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Notification Button */}
        {isSubscribed && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const { getPushNotificationService } = await import('@/lib/services/push-notifications');
                const service = getPushNotificationService();
                await service.sendLocalNotification({
                  title: 'Test Notification',
                  body: 'This is a test notification from Mini Games Platform',
                  icon: '/icon-192x192.png',
                  badge: '/icon-72x72.png',
                  tag: 'test'
                });
                setMessage({ type: 'success', text: 'Test notification sent!' });
              }}
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}