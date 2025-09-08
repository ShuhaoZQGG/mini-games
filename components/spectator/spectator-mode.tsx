'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Users, 
  MessageCircle, 
  Send, 
  X, 
  Tv,
  Trophy,
  Clock,
  Activity,
  UserPlus,
  ExternalLink
} from 'lucide-react'
import { 
  spectatorService, 
  type SpectatorSession, 
  type SpectatorMessage, 
  type SpectatorViewer,
  type GameState 
} from '@/lib/services/spectator'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface SpectatorModeProps {
  sessionId?: string
  isHost?: boolean
  gameSlug?: string
  onClose?: () => void
}

export function SpectatorMode({ sessionId, isHost = false, gameSlug, onClose }: SpectatorModeProps) {
  const [session, setSession] = useState<SpectatorSession | null>(null)
  const [viewers, setViewers] = useState<SpectatorViewer[]>([])
  const [messages, setMessages] = useState<SpectatorMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [viewerName, setViewerName] = useState('')
  const [activeSessions, setActiveSessions] = useState<SpectatorSession[]>([])
  const [activeTab, setActiveTab] = useState<'watch' | 'browse'>('browse')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load active sessions
  useEffect(() => {
    loadActiveSessions()
  }, [])

  // Setup spectator service callbacks
  useEffect(() => {
    spectatorService.onGameStateUpdate((state) => {
      setGameState(state)
    })

    spectatorService.onChatMessage((message) => {
      setMessages(prev => [...prev, message])
    })

    spectatorService.onViewersUpdate((viewers) => {
      setViewers(viewers)
    })

    return () => {
      spectatorService.cleanup()
    }
  }, [])

  // Load session if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  const loadActiveSessions = async () => {
    const sessions = await spectatorService.getActiveSessions()
    setActiveSessions(sessions)
  }

  const loadSession = async (id: string) => {
    const sessionDetails = await spectatorService.getSessionDetails(id)
    if (sessionDetails) {
      setSession(sessionDetails)
      const sessionViewers = await spectatorService.getSessionViewers(id)
      setViewers(sessionViewers)
      const sessionMessages = await spectatorService.getChatMessages(id)
      setMessages(sessionMessages)
      setActiveTab('watch')
    }
  }

  const handleJoinSession = async (sessionToJoin: SpectatorSession) => {
    if (!viewerName.trim()) {
      alert('Please enter your name')
      return
    }

    setIsJoining(true)
    const userId = localStorage.getItem('userId') || undefined
    const success = await spectatorService.joinSession(
      sessionToJoin.id,
      viewerName,
      userId
    )

    if (success) {
      setSession(sessionToJoin)
      await loadSession(sessionToJoin.id)
      setActiveTab('watch')
    }
    setIsJoining(false)
  }

  const handleLeaveSession = async () => {
    if (session) {
      const viewerId = localStorage.getItem('viewerId') || 'current_viewer'
      await spectatorService.leaveSession(viewerId)
      setSession(null)
      setViewers([])
      setMessages([])
      setGameState(null)
      setActiveTab('browse')
      await loadActiveSessions()
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !session) return

    const userId = localStorage.getItem('userId') || undefined
    const username = viewerName || 'Anonymous'

    await spectatorService.sendMessage({
      message: messageInput,
      messageType: 'chat',
      userId,
      username
    })

    setMessageInput('')
  }

  const handleEndSession = async () => {
    if (isHost && confirm('Are you sure you want to end this spectator session?')) {
      await spectatorService.endSession()
      setSession(null)
      onClose?.()
    }
  }

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const formatDuration = (startedAt: Date) => {
    const now = new Date()
    const diff = now.getTime() - startedAt.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  if (activeTab === 'browse' && !session) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Live Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Enter your name to join a session..."
              value={viewerName}
              onChange={(e) => setViewerName(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onJoin={() => handleJoinSession(s)}
                    disabled={!viewerName.trim() || isJoining}
                  />
                ))}
                {activeSessions.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No active sessions at the moment
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="games">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSessions
                  .filter(s => s.sessionType === 'game')
                  .map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onJoin={() => handleJoinSession(s)}
                      disabled={!viewerName.trim() || isJoining}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="tournaments">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSessions
                  .filter(s => s.sessionType === 'tournament')
                  .map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onJoin={() => handleJoinSession(s)}
                      disabled={!viewerName.trim() || isJoining}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No active session</p>
            <Button onClick={() => setActiveTab('browse')}>
              Browse Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto grid gap-4 lg:grid-cols-[1fr_350px]">
      {/* Main viewing area */}
      <Card className="h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={session.sessionType === 'tournament' ? 'default' : 'secondary'}>
                {session.sessionType === 'tournament' ? (
                  <Trophy className="h-3 w-3 mr-1" />
                ) : (
                  <Tv className="h-3 w-3 mr-1" />
                )}
                {session.sessionType}
              </Badge>
              <div>
                <h3 className="font-semibold">
                  {session.gameInfo?.tournamentName || session.gameInfo?.gameName || 'Live Session'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Host: {session.hostUsername}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {formatViewerCount(viewers.length)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.startedAt)}
              </Badge>
              {isHost ? (
                <Button size="sm" variant="destructive" onClick={handleEndSession}>
                  End Session
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={handleLeaveSession}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] bg-muted/20 rounded-lg p-4">
          {/* Game state display */}
          {gameState ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-5xl font-bold">
                  {gameState.score}
                </div>
                <div className="text-muted-foreground">
                  Score
                </div>
                {gameState.timeElapsed && (
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                {gameState.currentLevel && (
                  <Badge>Level {gameState.currentLevel}</Badge>
                )}
                <div className="flex items-center gap-1 justify-center text-sm text-green-500">
                  <Activity className="h-4 w-4" />
                  Live
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Waiting for game to start...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sidebar with chat and viewers */}
      <div className="space-y-4">
        {/* Viewers list */}
        <Card className="h-[200px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Viewers ({viewers.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[140px] px-4">
            <div className="space-y-1">
              {viewers.map((viewer) => (
                <div key={viewer.id} className="flex items-center gap-2 py-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">{viewer.viewerName}</span>
                  {viewer.viewerType === 'registered' && (
                    <Badge variant="outline" className="text-xs h-5">
                      Member
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat */}
        <Card className="h-[380px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-[270px] px-4">
              <div className="space-y-2 py-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "text-sm",
                    msg.messageType === 'system' && "text-muted-foreground italic"
                  )}>
                    {msg.messageType === 'chat' ? (
                      <>
                        <span className="font-medium">{msg.username}:</span>{' '}
                        <span>{msg.message}</span>
                      </>
                    ) : (
                      <span>{msg.message}</span>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button size="icon" type="submit" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Session card component for browsing
function SessionCard({ 
  session, 
  onJoin, 
  disabled 
}: { 
  session: SpectatorSession
  onJoin: () => void
  disabled?: boolean
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">
                {session.gameInfo?.tournamentName || session.gameInfo?.gameName || 'Live Session'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {session.hostUsername}
              </p>
            </div>
            <Badge variant={session.sessionType === 'tournament' ? 'default' : 'secondary'}>
              {session.sessionType}
            </Badge>
          </div>

          {session.sessionType === 'tournament' && session.gameInfo && (
            <div className="text-sm text-muted-foreground">
              Round {session.gameInfo.round} - Match {session.gameInfo.matchNumber}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{formatViewerCount(session.viewerCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(session.startedAt)}</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="sm"
            onClick={onJoin}
            disabled={disabled}
          >
            <Eye className="h-4 w-4 mr-2" />
            Watch
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  function formatViewerCount(count: number) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  function formatDuration(startedAt: Date) {
    const now = new Date()
    const diff = now.getTime() - startedAt.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }
}