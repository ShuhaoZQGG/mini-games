'use client'

import { useState, useEffect } from 'react'
import { User, UserPlus, UserX, MessageCircle, Trophy, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { friendService, type Friend, type FriendRequest, type FriendActivity } from '@/lib/services/friends'

interface FriendListProps {
  userId?: string
  className?: string
}

export function FriendList({ userId, className }: FriendListProps) {
  const { toast } = useToast()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [activities, setActivities] = useState<FriendActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [friendUsername, setFriendUsername] = useState('')
  const [friendMessage, setFriendMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      if (userId) {
        await friendService.initialize(userId)
      }
      
      const [friendsData, requestsData, activitiesData] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests(),
        friendService.getFriendActivities()
      ])
      
      setFriends(friendsData)
      setFriendRequests(requestsData)
      setActivities(activitiesData)
    } catch (error) {
      console.error('Failed to load friend data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load friend data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    if (!friendUsername.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        variant: 'destructive'
      })
      return
    }

    try {
      const success = await friendService.sendFriendRequest(friendUsername, friendMessage)
      if (success) {
        toast({
          title: 'Request sent!',
          description: `Friend request sent to ${friendUsername}`
        })
        setAddFriendOpen(false)
        setFriendUsername('')
        setFriendMessage('')
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive'
      })
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await friendService.acceptFriendRequest(requestId)
      if (success) {
        toast({
          title: 'Friend added!',
          description: 'Friend request accepted'
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive'
      })
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const success = await friendService.rejectFriendRequest(requestId)
      if (success) {
        toast({
          title: 'Request rejected',
          description: 'Friend request has been rejected'
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject friend request',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const success = await friendService.removeFriend(friendId)
      if (success) {
        toast({
          title: 'Friend removed',
          description: 'Friend has been removed from your list'
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'playing': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
    }
  }

  const getActivityIcon = (type: FriendActivity['type']) => {
    switch (type) {
      case 'high_score': return <Trophy className="h-4 w-4" />
      case 'achievement_unlocked': return <Trophy className="h-4 w-4 text-yellow-500" />
      case 'game_played': return <Clock className="h-4 w-4" />
      case 'challenge_sent': return <MessageCircle className="h-4 w-4" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading friends...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Friends</CardTitle>
        <Dialog open={addFriendOpen} onOpenChange={setAddFriendOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Send a friend request by entering their username
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Input
                  placeholder="Enter username"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add a message (optional)"
                  value={friendMessage}
                  onChange={(e) => setFriendMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleSendRequest} className="w-full">
                Send Friend Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({friendRequests.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends">
            <ScrollArea className="h-[400px] pr-4">
              {friends.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No friends yet. Add some friends to play together!
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={friend.avatarUrl} />
                            <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(friend.status)}`} />
                        </div>
                        
                        <div>
                          <p className="font-medium">{friend.username}</p>
                          {friend.currentGame && friend.status === 'playing' && (
                            <p className="text-xs text-muted-foreground">
                              Playing {friend.currentGame}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="requests">
            <ScrollArea className="h-[400px] pr-4">
              {friendRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pending friend requests
                </div>
              ) : (
                <div className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={request.fromAvatarUrl} />
                            <AvatarFallback>{request.fromUsername[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.fromUsername}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimestamp(request.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-sm text-muted-foreground mb-3">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="activity">
            <ScrollArea className="h-[400px] pr-4">
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity from friends
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <div className="mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.username}</span>
                          {activity.type === 'high_score' && (
                            <> scored <span className="font-bold">{activity.score}</span> in {activity.gameTitle}</>
                          )}
                          {activity.type === 'achievement_unlocked' && (
                            <> unlocked <span className="font-bold">{activity.achievement}</span> in {activity.gameTitle}</>
                          )}
                          {activity.type === 'game_played' && (
                            <> played {activity.gameTitle}</>
                          )}
                          {activity.type === 'challenge_sent' && (
                            <> sent you a challenge in {activity.gameTitle}</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}