'use client';

import React from 'react';
import { AchievementSystem } from '@/features/achievements/AchievementSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Medal, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AchievementsPage() {
  const handleAchievementUnlock = (achievement: any) => {
    console.log('Achievement unlocked:', achievement);
    // You could trigger confetti or other celebrations here
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground text-lg">
          Unlock achievements, earn rewards, and showcase your gaming prowess
        </p>
      </div>

      {/* Achievement Showcase */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Unlock */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Latest Achievement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold mb-1">Speed Demon</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Complete any game in under 30 seconds
              </p>
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                +50 Points
              </Badge>
            </motion.div>
          </CardContent>
        </Card>

        {/* Rarest Achievement */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              Rarest Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Medal className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold mb-1">Perfectionist</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Complete 100 games without a single loss
              </p>
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                Legendary
              </Badge>
            </motion.div>
          </CardContent>
        </Card>

        {/* Next Target */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Next Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center relative">
                <TrendingUp className="w-10 h-10 text-white" />
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="white"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.75)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold mb-1">Winning Streak</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Win 10 games in a row (7/10)
              </p>
              <Progress value={70} className="h-2" />
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <Progress value={67} className="mt-2 h-1" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              2,450
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45/150</div>
            <p className="text-xs text-muted-foreground">Unlocked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Global Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#234</div>
            <p className="text-xs text-muted-foreground">Top 5%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Achievement System */}
      <AchievementSystem onAchievementUnlock={handleAchievementUnlock} />

      {/* Achievement Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pro Tips</CardTitle>
          <CardDescription>
            How to unlock more achievements faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium mb-1">Focus on Categories</p>
                <p className="text-sm text-muted-foreground">
                  Complete all achievements in one category before moving to the next
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium mb-1">Track Progress</p>
                <p className="text-sm text-muted-foreground">
                  Check your progress regularly and focus on achievements you're close to completing
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium mb-1">Special Events</p>
                <p className="text-sm text-muted-foreground">
                  Participate in seasonal events for exclusive limited-time achievements
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}