'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Tournament, 
  TournamentBracket,
  tournamentService 
} from '@/lib/services/tournaments'
import { Trophy, Users, Calendar, Clock, Award } from 'lucide-react'

export function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [bracket, setBracket] = useState<TournamentBracket | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    loadTournaments()
  }, [activeTab])

  const loadTournaments = async () => {
    setLoading(true)
    try {
      await tournamentService.initialize('user_1')
      const filter = activeTab === 'all' ? undefined : activeTab as any
      const data = await tournamentService.getTournaments(filter)
      setTournaments(data)
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (tournamentId: string) => {
    const success = await tournamentService.registerForTournament(tournamentId)
    if (success) {
      loadTournaments()
    }
  }

  const handleViewBracket = async (tournament: Tournament) => {
    setSelectedTournament(tournament)
    const bracketData = await tournamentService.getTournamentBracket(tournament.id)
    setBracket(bracketData)
  }

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'registration': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'completed': return 'bg-gray-500'
      case 'upcoming': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const getFormatName = (format: Tournament['format']) => {
    switch (format) {
      case 'single_elimination': return 'Single Elimination'
      case 'double_elimination': return 'Double Elimination'
      case 'round_robin': return 'Round Robin'
      case 'swiss': return 'Swiss'
      default: return format
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">Loading tournaments...</div>
              ) : tournaments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tournaments found
                </div>
              ) : (
                <div className="grid gap-4">
                  {tournaments.map((tournament) => (
                    <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{tournament.name}</h3>
                            {tournament.description && (
                              <p className="text-gray-600 dark:text-gray-400">
                                {tournament.description}
                              </p>
                            )}
                          </div>
                          <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                            {tournament.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              <strong>{tournament.gameTitle}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {tournament.currentParticipants}/{tournament.maxParticipants} players
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {new Date(tournament.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {getFormatName(tournament.format)}
                            </span>
                          </div>
                        </div>

                        {tournament.prizePool && (
                          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <strong className="text-yellow-700 dark:text-yellow-400">
                              Prize Pool: {tournament.prizePool}
                            </strong>
                          </div>
                        )}

                        {tournament.rules && tournament.rules.length > 0 && (
                          <div className="mb-4">
                            <strong className="text-sm">Rules:</strong>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {tournament.rules.map((rule, index) => (
                                <li key={index}>• {rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {tournament.status === 'registration' && (
                            <Button 
                              onClick={() => handleRegister(tournament.id)}
                              disabled={tournament.currentParticipants >= tournament.maxParticipants}
                            >
                              {tournament.currentParticipants >= tournament.maxParticipants 
                                ? 'Tournament Full' 
                                : 'Register'}
                            </Button>
                          )}
                          {tournament.status === 'in_progress' && (
                            <Button 
                              onClick={() => handleViewBracket(tournament)}
                              variant="outline"
                            >
                              View Bracket
                            </Button>
                          )}
                          {tournament.status === 'completed' && (
                            <Button 
                              onClick={() => handleViewBracket(tournament)}
                              variant="outline"
                            >
                              View Results
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bracket Modal */}
      {selectedTournament && bracket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedTournament.name} - Bracket</span>
                <Button 
                  onClick={() => {
                    setSelectedTournament(null)
                    setBracket(null)
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {bracket.rounds.map((round) => (
                  <div key={round.roundNumber}>
                    <h3 className="font-bold text-lg mb-3">{round.name}</h3>
                    <div className="grid gap-2">
                      {round.matches.map((match) => (
                        <div 
                          key={match.id}
                          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className={`flex justify-between items-center p-2 ${
                                match.winnerId === match.player1Id ? 'font-bold' : ''
                              }`}>
                                <span>{match.player1Name || 'TBD'}</span>
                                <span>{match.player1Score ?? '-'}</span>
                              </div>
                              <div className="border-t"></div>
                              <div className={`flex justify-between items-center p-2 ${
                                match.winnerId === match.player2Id ? 'font-bold' : ''
                              }`}>
                                <span>{match.player2Name || 'TBD'}</span>
                                <span>{match.player2Score ?? '-'}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Badge variant={
                                match.status === 'completed' ? 'default' :
                                match.status === 'in_progress' ? 'secondary' :
                                match.status === 'ready' ? 'outline' : 'secondary'
                              }>
                                {match.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}