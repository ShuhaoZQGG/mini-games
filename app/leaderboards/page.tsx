'use client';

import React from 'react';
import { GlobalLeaderboard } from '@/features/leaderboards/GlobalLeaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users, Star } from 'lucide-react';

export default function LeaderboardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Global Leaderboards
        </h1>
        <p className="text-muted-foreground text-lg">
          Compete with players worldwide and climb the rankings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,543</div>
            <p className="text-xs text-muted-foreground">+201 today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">458,293</div>
            <p className="text-xs text-muted-foreground">+2,045 today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 starting soon</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score Today</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98,450</div>
            <p className="text-xs text-muted-foreground">by Player123</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Leaderboard Tabs */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global">Global Rankings</TabsTrigger>
          <TabsTrigger value="country">By Country</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="personal">My Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <GlobalLeaderboard 
            showGameSelector={true}
            maxEntries={100}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Country Rankings</CardTitle>
              <CardDescription>
                See how players from your country rank globally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Country-based leaderboards coming soon!
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friends Leaderboard</CardTitle>
              <CardDescription>
                Compete with your friends and see who's the best
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Connect with friends to see their rankings!
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Statistics</CardTitle>
              <CardDescription>
                Track your progress and improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Global Rank</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">#1,234</p>
                    <p className="text-xs text-muted-foreground">Top 10%</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">45,678</p>
                    <p className="text-xs text-muted-foreground">Lifetime points</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">67.8%</p>
                    <p className="text-xs text-muted-foreground">234 wins</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Best Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Consecutive wins</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Favorite Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">Snake</p>
                    <p className="text-xs text-muted-foreground">89 plays</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Play Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">24h 36m</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}