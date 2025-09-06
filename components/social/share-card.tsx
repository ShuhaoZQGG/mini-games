'use client'

import { Trophy, Target, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ShareButton } from './share-button'
import { type ShareData } from '@/lib/services/social-sharing'
import { cn } from '@/lib/utils'

interface ShareCardProps {
  gameTitle: string
  gameSlug: string
  score?: number
  accuracy?: number
  time?: number
  level?: number
  achievement?: string
  className?: string
  showPreview?: boolean
}

export function ShareCard({
  gameTitle,
  gameSlug,
  score,
  accuracy,
  time,
  level,
  achievement,
  className,
  showPreview = true
}: ShareCardProps) {
  // Prepare share data
  const shareData: ShareData = {
    title: `${gameTitle} - Mini Games`,
    text: '',
    gameSlug,
    score,
    achievement
  }

  // Build share text based on available data
  if (achievement) {
    shareData.text = `🏆 Achievement Unlocked: ${achievement} in ${gameTitle}!`
  } else if (score !== undefined) {
    let text = `🎮 I scored ${score.toLocaleString()} points in ${gameTitle}!`
    
    if (accuracy !== undefined) {
      text += ` (${accuracy}% accuracy)`
    }
    if (time !== undefined) {
      text += ` in ${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
    }
    if (level !== undefined) {
      text += ` - Level ${level}`
    }
    
    text += ' Can you beat my score?'
    shareData.text = text
  } else {
    shareData.text = `Check out ${gameTitle} on Mini Games! Play now for free!`
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showPreview && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">{gameTitle}</h3>
            
            <div className="flex justify-center gap-6 flex-wrap">
              {score !== undefined && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-xl font-bold">{score.toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {accuracy !== undefined && (
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-xl font-bold">{accuracy}%</p>
                  </div>
                </div>
              )}
              
              {time !== undefined && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-xl font-bold">
                      {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>
              )}
              
              {level !== undefined && (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-xl font-bold">{level}</p>
                  </div>
                </div>
              )}
            </div>
            
            {achievement && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  🏆 Achievement Unlocked: {achievement}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Share your achievement with friends!
        </p>
        
        <div className="flex justify-center">
          <ShareButton 
            data={shareData}
            variant="default"
            className="w-full sm:w-auto"
          />
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/50 p-3">
        <p className="text-xs text-center text-muted-foreground w-full">
          Play more games at minigames.app
        </p>
      </CardFooter>
    </Card>
  )
}