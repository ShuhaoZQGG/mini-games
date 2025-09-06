'use client'

import { useState, useEffect } from 'react'
import { Trophy, Clock, Target, Send, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { challengeService, type Challenge } from '@/lib/services/challenges'
import { friendService, type Friend } from '@/lib/services/friends'

interface ChallengeListProps {
  userId?: string
  className?: string
}

const GAMES = [
  { slug: 'cps-test', title: 'CPS Test' },
  { slug: 'typing-test', title: 'Typing Test' },
  { slug: 'reaction-time', title: 'Reaction Time' },
  { slug: 'memory-match', title: 'Memory Match' },
  { slug: 'aim-trainer', title: 'Aim Trainer' },
  { slug: 'snake', title: 'Snake' },
  { slug: '2048', title: '2048' },
  { slug: 'tetris', title: 'Tetris' },
]

export function ChallengeList({ userId, className }: ChallengeListProps) {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false)
  
  // Challenge form state
  const [selectedFriend, setSelectedFriend] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [challengeType, setChallengeType] = useState<Challenge['challengeType']>('score')
  const [targetValue, setTargetValue] = useState('')
  const [challengeMessage, setChallengeMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      if (userId) {
        await challengeService.initialize(userId)
      }
      
      const [challengesData, friendsData] = await Promise.all([
        challengeService.getChallenges(),
        friendService.getFriends()
      ])
      
      setChallenges(challengesData)
      setFriends(friendsData)
    } catch (error) {
      console.error('Failed to load challenges:', error)
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChallenge = async () => {
    if (!selectedFriend || !selectedGame) {
      toast({
        title: 'Error',
        description: 'Please select a friend and game',
        variant: 'destructive'
      })
      return
    }

    const game = GAMES.find(g => g.slug === selectedGame)
    if (!game) return

    try {
      const challenge = await challengeService.createChallenge({
        toUsername: selectedFriend,
        gameSlug: game.slug,
        gameTitle: game.title,
        challengeType,
        targetScore: challengeType === 'score' ? parseInt(targetValue) : undefined,
        targetTime: challengeType === 'time' ? parseInt(targetValue) : undefined,
        targetAccuracy: challengeType === 'accuracy' ? parseInt(targetValue) : undefined,
        customTarget: challengeType === 'custom' ? targetValue : undefined,
        message: challengeMessage
      })

      if (challenge) {
        toast({
          title: 'Challenge sent!',
          description: `Challenge sent to ${selectedFriend}`
        })
        setCreateChallengeOpen(false)
        resetForm()
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive'
      })
    }
  }

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const success = await challengeService.acceptChallenge(challengeId)
      if (success) {
        toast({
          title: 'Challenge accepted!',
          description: 'Good luck!'
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept challenge',
        variant: 'destructive'
      })
    }
  }

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const success = await challengeService.declineChallenge(challengeId)
      if (success) {
        toast({
          title: 'Challenge declined',
          description: 'Challenge has been declined'
        })
        loadData()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline challenge',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setSelectedFriend('')
    setSelectedGame('')
    setChallengeType('score')
    setTargetValue('')
    setChallengeMessage('')
  }

  const getStatusBadge = (status: Challenge['status']) => {
    const variants: Record<Challenge['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      accepted: 'secondary',
      completed: 'outline',
      expired: 'destructive',
      declined: 'destructive'
    }
    
    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    )
  }

  const getChallengeIcon = (type: Challenge['challengeType']) => {
    switch (type) {
      case 'score': return <Trophy className="h-4 w-4" />
      case 'time': return <Clock className="h-4 w-4" />
      case 'accuracy': return <Target className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const formatTarget = (challenge: Challenge) => {
    switch (challenge.challengeType) {
      case 'score':
        return `Score: ${challenge.targetScore?.toLocaleString() || 'Any'}`
      case 'time':
        return `Time: ${challenge.targetTime}s`
      case 'accuracy':
        return `Accuracy: ${challenge.targetAccuracy}%`
      case 'custom':
        return challenge.customTarget || 'Custom challenge'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading challenges...</div>
        </CardContent>
      </Card>
    )
  }

  const pendingChallenges = challenges.filter(c => c.status === 'pending')
  const activeChallenges = challenges.filter(c => c.status === 'accepted')
  const completedChallenges = challenges.filter(c => c.status === 'completed')

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Challenges</CardTitle>
        <Dialog open={createChallengeOpen} onOpenChange={setCreateChallengeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Challenge</DialogTitle>
              <DialogDescription>
                Challenge a friend to beat your score!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Friend</label>
                <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a friend" />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map(friend => (
                      <SelectItem key={friend.id} value={friend.username}>
                        {friend.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Game</label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAMES.map(game => (
                      <SelectItem key={game.slug} value={game.slug}>
                        {game.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Challenge Type</label>
                <Select value={challengeType} onValueChange={(v) => setChallengeType(v as Challenge['challengeType'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">High Score</SelectItem>
                    <SelectItem value="time">Best Time</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  {challengeType === 'score' && 'Target Score'}
                  {challengeType === 'time' && 'Target Time (seconds)'}
                  {challengeType === 'accuracy' && 'Target Accuracy (%)'}
                  {challengeType === 'custom' && 'Custom Target'}
                </label>
                <Input
                  type={challengeType === 'custom' ? 'text' : 'number'}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="Enter target value"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message (optional)</label>
                <Textarea
                  value={challengeMessage}
                  onChange={(e) => setChallengeMessage(e.target.value)}
                  placeholder="Add a message to your challenge"
                  rows={3}
                />
              </div>
              
              <Button onClick={handleCreateChallenge} className="w-full">
                Send Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedChallenges.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <ScrollArea className="h-[400px] pr-4">
              {pendingChallenges.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No pending challenges
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingChallenges.map(challenge => (
                    <div key={challenge.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChallengeIcon(challenge.challengeType)}
                          <div>
                            <p className="font-medium">{challenge.gameTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              From {challenge.fromUsername} • {formatTimestamp(challenge.createdAt)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(challenge.status)}
                      </div>
                      
                      <p className="text-sm mb-3">{formatTarget(challenge)}</p>
                      
                      {challenge.message && (
                        <p className="text-sm text-muted-foreground mb-3">
                          "{challenge.message}"
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcceptChallenge(challenge.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineChallenge(challenge.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="active">
            <ScrollArea className="h-[400px] pr-4">
              {activeChallenges.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No active challenges
                </div>
              ) : (
                <div className="space-y-2">
                  {activeChallenges.map(challenge => (
                    <div key={challenge.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChallengeIcon(challenge.challengeType)}
                          <div>
                            <p className="font-medium">{challenge.gameTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              vs {challenge.fromUserId === userId ? challenge.toUsername : challenge.fromUsername}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(challenge.status)}
                      </div>
                      
                      <p className="text-sm mb-3">{formatTarget(challenge)}</p>
                      
                      <Button size="sm" className="w-full" asChild>
                        <a href={`/games/${challenge.gameSlug}`}>
                          Play Now
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="completed">
            <ScrollArea className="h-[400px] pr-4">
              {completedChallenges.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No completed challenges yet
                </div>
              ) : (
                <div className="space-y-2">
                  {completedChallenges.map(challenge => (
                    <div key={challenge.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChallengeIcon(challenge.challengeType)}
                          <div>
                            <p className="font-medium">{challenge.gameTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              vs {challenge.fromUserId === userId ? challenge.toUsername : challenge.fromUsername}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(challenge.status)}
                      </div>
                      
                      {challenge.results && challenge.results.length === 2 && (
                        <div className="space-y-1 mt-2">
                          {challenge.results.map(result => (
                            <div key={result.userId} className="flex justify-between text-sm">
                              <span className={result.isWinner ? 'font-bold text-green-600' : ''}>
                                {result.username} {result.isWinner && '🏆'}
                              </span>
                              <span>
                                {challenge.challengeType === 'score' && `${result.score} pts`}
                                {challenge.challengeType === 'time' && `${result.time}s`}
                                {challenge.challengeType === 'accuracy' && `${result.accuracy}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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