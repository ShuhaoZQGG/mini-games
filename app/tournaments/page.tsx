'use client';

import React from 'react';
import { TournamentHub } from '@/features/tournaments/TournamentHub';
import { TournamentList } from '@/components/social/tournament-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, DollarSign, TrendingUp, Award, Zap, Timer } from 'lucide-react';

export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Tournament Arena
        </h1>
        <p className="text-muted-foreground text-lg">
          Join competitive tournaments, win prizes, and prove your skills
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">5 open for registration</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5,420</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">Across all tournaments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Tournament</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h 15m</div>
            <p className="text-xs text-muted-foreground">Snake Championship</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Tournament */}
      <Card className="mb-8 overflow-hidden bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">🏆 Weekly Grand Championship</CardTitle>
              <CardDescription className="text-base">
                The biggest tournament of the week with massive prizes!
              </CardDescription>
            </div>
            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              Featured
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Prize Pool</p>
                <p className="font-bold">$1,000</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Players</p>
                <p className="font-bold">64/128</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Starts In</p>
                <p className="font-bold">3 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Format</p>
                <p className="font-bold">Double Elim</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-bold">2 days</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1">Register Now</Button>
            <Button variant="outline">View Details</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Hub with Tabs */}
      <Tabs defaultValue="hub" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hub">Tournament Hub</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
          <TabsTrigger value="legacy">Legacy View</TabsTrigger>
        </TabsList>

        <TabsContent value="hub">
          <TournamentHub />
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tournament Schedule</CardTitle>
              <CardDescription>
                Plan ahead and never miss a tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Daily Quick Match', time: 'Every day at 18:00 UTC', prize: '$50' },
                  { name: 'Weekend Warrior', time: 'Saturday & Sunday 20:00 UTC', prize: '$200' },
                  { name: 'Monthly Masters', time: 'First Sunday of month', prize: '$2,000' },
                  { name: 'Seasonal Championship', time: 'March 15, 2025', prize: '$10,000' },
                ].map((tournament, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-sm text-muted-foreground">{tournament.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{tournament.prize}</p>
                      <Button size="sm" variant="outline">Set Reminder</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Tournament History</CardTitle>
              <CardDescription>
                Your tournament participation and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tournaments Played</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">23</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Best Placement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">🥈 2nd</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Winnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">$450</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-8 text-muted-foreground">
                  Detailed tournament history coming soon!
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <TournamentList />
        </TabsContent>
      </Tabs>
    </div>
  );
}