'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Trophy, Star, Target, Zap, Shield, Sword, Heart, 
  Award, Medal, Crown, Sparkles, Lock, Unlock,
  TrendingUp, Users, Clock, Calendar, Gift,
  CheckCircle, XCircle, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Types
interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'gameplay' | 'social' | 'collection' | 'special' | 'seasonal';
  game_id?: string;
  icon_url?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirements: {
    type: string;
    target: number;
    current?: number;
  };
  is_secret: boolean;
  is_active: boolean;
  display_order: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at?: string;
  notified: boolean;
  metadata?: any;
}

interface AchievementProgress {
  achievement_id: string;
  metric_name: string;
  metric_value: number;
  max_value: number;
}

interface AchievementSystemProps {
  userId?: string;
  gameId?: string;
  className?: string;
  onAchievementUnlock?: (achievement: Achievement) => void;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userId,
  gameId,
  className,
  onAchievementUnlock,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Map<string, UserAchievement>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);

  const supabase = createClientComponentClient();

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (gameId) {
        query = query.or(`game_id.eq.${gameId},game_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, [supabase, gameId]);

  // Fetch user achievements
  const fetchUserAchievements = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const achievementMap = new Map<string, UserAchievement>();
      let unlocked = 0;
      let points = 0;

      data?.forEach(ua => {
        achievementMap.set(ua.achievement_id, ua);
        if (ua.unlocked) {
          unlocked++;
          const achievement = achievements.find(a => a.id === ua.achievement_id);
          if (achievement) {
            points += achievement.points;
          }
        }
      });

      setUserAchievements(achievementMap);
      setUnlockedCount(unlocked);
      setTotalPoints(points);

      // Get recent unlocks
      const recentlyUnlocked = data
        ?.filter(ua => ua.unlocked && ua.unlocked_at)
        .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
        .slice(0, 5)
        .map(ua => achievements.find(a => a.id === ua.achievement_id))
        .filter(Boolean) as Achievement[];
      
      setRecentUnlocks(recentlyUnlocked);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [supabase, achievements]);

  // Check and update achievement progress
  const checkAchievementProgress = useCallback(async (achievementId: string, progress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return;

      const userAchievement = userAchievements.get(achievementId);
      
      if (progress >= 100 && (!userAchievement || !userAchievement.unlocked)) {
        // Unlock achievement
        const { error } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: user.id,
            achievement_id: achievementId,
            progress: 100,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
            notified: false,
          });

        if (!error) {
          toast.success(
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-semibold">Achievement Unlocked!</p>
                <p className="text-sm">{achievement.name}</p>
              </div>
            </div>
          );

          if (onAchievementUnlock) {
            onAchievementUnlock(achievement);
          }

          // Refresh user achievements
          fetchUserAchievements();
        }
      } else if (userAchievement && !userAchievement.unlocked) {
        // Update progress
        await supabase
          .from('user_achievements')
          .update({ progress })
          .eq('user_id', user.id)
          .eq('achievement_id', achievementId);
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }, [supabase, achievements, userAchievements, onAchievementUnlock, fetchUserAchievements]);

  // Get category icon
  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'gameplay':
        return <Target className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'collection':
        return <Gift className="w-4 h-4" />;
      case 'special':
        return <Star className="w-4 h-4" />;
      case 'seasonal':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      case 'uncommon':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'rare':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'epic':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'legendary':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  // Get achievement icon
  const getAchievementIcon = (achievement: Achievement, unlocked: boolean) => {
    if (achievement.is_secret && !unlocked) {
      return <Lock className="w-8 h-8 text-muted-foreground" />;
    }

    const iconClass = cn('w-8 h-8', unlocked ? getRarityColor(achievement.rarity) : 'text-muted-foreground');
    
    switch (achievement.category) {
      case 'gameplay':
        return <Trophy className={iconClass} />;
      case 'social':
        return <Heart className={iconClass} />;
      case 'collection':
        return <Star className={iconClass} />;
      case 'special':
        return <Crown className={iconClass} />;
      case 'seasonal':
        return <Sparkles className={iconClass} />;
      default:
        return <Medal className={iconClass} />;
    }
  };

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(achievement => {
      const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
      const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
      const isVisible = !achievement.is_secret || userAchievements.get(achievement.id)?.unlocked;
      
      return matchesCategory && matchesSearch && isVisible;
    });
  }, [achievements, selectedCategory, searchQuery, userAchievements]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalAchievements = achievements.length;
    const completionRate = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;
    
    const byCategory = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = { total: 0, unlocked: 0 };
      }
      acc[achievement.category].total++;
      if (userAchievements.get(achievement.id)?.unlocked) {
        acc[achievement.category].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>);

    const byRarity = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.rarity]) {
        acc[achievement.rarity] = { total: 0, unlocked: 0 };
      }
      acc[achievement.rarity].total++;
      if (userAchievements.get(achievement.id)?.unlocked) {
        acc[achievement.rarity].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>);

    return {
      totalAchievements,
      unlockedCount,
      completionRate,
      totalPoints,
      byCategory,
      byRarity,
    };
  }, [achievements, userAchievements, unlockedCount, totalPoints]);

  // Initial load
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    if (achievements.length > 0) {
      fetchUserAchievements();
    }
  }, [achievements, fetchUserAchievements]);

  // Set up real-time subscription
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) return;

    const channel = supabase
      .channel('achievement-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUserAchievements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchUserAchievements]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.unlockedCount}/{statistics.totalAchievements}</div>
            <Progress value={statistics.completionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              {statistics.totalPoints}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rarest Unlock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentUnlocks.find(a => a.rarity === 'legendary')?.name || 
               recentUnlocks.find(a => a.rarity === 'epic')?.name || 
               'None'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Achievements
            </CardTitle>
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="collection">Collection</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredAchievements.map((achievement) => {
                        const userAchievement = userAchievements.get(achievement.id);
                        const isUnlocked = userAchievement?.unlocked || false;
                        const progress = userAchievement?.progress || 0;

                        return (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card className={cn(
                              'relative overflow-hidden transition-all',
                              isUnlocked ? 'ring-2 ring-primary/20' : 'opacity-75 hover:opacity-100'
                            )}>
                              {isUnlocked && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                              )}
                              
                              <CardHeader>
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-muted">
                                    {getAchievementIcon(achievement, isUnlocked)}
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base">
                                      {achievement.is_secret && !isUnlocked ? '???' : achievement.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      {achievement.is_secret && !isUnlocked 
                                        ? 'Hidden achievement' 
                                        : achievement.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent>
                                <div className="space-y-3">
                                  {!achievement.is_secret || isUnlocked ? (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <Badge className={getRarityColor(achievement.rarity)}>
                                          {achievement.rarity}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                          <Zap className="w-4 h-4 text-yellow-500" />
                                          <span className="text-sm font-medium">{achievement.points}</span>
                                        </div>
                                      </div>
                                      
                                      {!isUnlocked && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span>Progress</span>
                                            <span>{progress}%</span>
                                          </div>
                                          <Progress value={progress} className="h-2" />
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-center py-2 text-muted-foreground">
                                      <Lock className="w-6 h-6 mx-auto mb-1" />
                                      <p className="text-xs">Secret Achievement</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Unlocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUnlocks.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {getAchievementIcon(achievement, true)}
                  <div className="flex-1">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  <Badge className={getRarityColor(achievement.rarity)}>
                    +{achievement.points}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};