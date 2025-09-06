/**
 * Social Sharing Service
 * Handles sharing game results to various social platforms
 */

export interface ShareData {
  title: string
  text: string
  url?: string
  score?: number
  gameSlug?: string
  achievement?: string
  imageUrl?: string
}

export interface ShareResult {
  success: boolean
  platform?: string
  error?: string
}

class SocialSharingService {
  private baseUrl: string

  constructor() {
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://minigames.app'
  }

  /**
   * Generate dynamic share image URL
   */
  generateShareImageUrl(data: ShareData): string {
    const params = new URLSearchParams();
    
    if (data.gameSlug) params.append('game', data.gameSlug);
    if (data.score) params.append('score', data.score.toString());
    if (data.achievement) params.append('achievement', data.achievement);
    
    // Get player name from localStorage or use default
    const playerName = localStorage.getItem('username') || 'Player';
    params.append('player', playerName);
    
    // Determine share type
    let type = 'score';
    if (data.achievement) type = 'achievement';
    params.append('type', type);
    
    return `${this.baseUrl}/api/share-image?${params.toString()}`;
  }

  /**
   * Generate Open Graph meta tags for dynamic sharing
   */
  generateOpenGraphTags(data: ShareData) {
    // Generate dynamic image if not provided
    const imageUrl = data.imageUrl || this.generateShareImageUrl(data);
    
    const tags: Record<string, string> = {
      'og:title': data.title,
      'og:description': data.text,
      'og:url': data.url || this.baseUrl,
      'og:type': 'website',
      'og:site_name': 'Mini Games Platform',
      'og:image': imageUrl,
      'og:image:width': '1200',
      'og:image:height': '630',
      'twitter:card': 'summary_large_image',
      'twitter:title': data.title,
      'twitter:description': data.text,
      'twitter:image': imageUrl
    }

    return tags
  }

  /**
   * Share to Twitter/X
   */
  async shareToTwitter(data: ShareData): Promise<ShareResult> {
    try {
      const text = this.formatTwitterText(data)
      const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank', 'width=550,height=420')
      }
      
      this.trackShare('twitter', data)
      return { success: true, platform: 'twitter' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'twitter', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }

  /**
   * Share to Facebook
   */
  async shareToFacebook(data: ShareData): Promise<ShareResult> {
    try {
      const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank', 'width=550,height=420')
      }
      
      this.trackShare('facebook', data)
      return { success: true, platform: 'facebook' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'facebook', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }

  /**
   * Share to WhatsApp
   */
  async shareToWhatsApp(data: ShareData): Promise<ShareResult> {
    try {
      const text = this.formatWhatsAppText(data)
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
      
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank')
      }
      
      this.trackShare('whatsapp', data)
      return { success: true, platform: 'whatsapp' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'whatsapp', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }

  /**
   * Share to LinkedIn
   */
  async shareToLinkedIn(data: ShareData): Promise<ShareResult> {
    try {
      const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank', 'width=550,height=420')
      }
      
      this.trackShare('linkedin', data)
      return { success: true, platform: 'linkedin' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'linkedin', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }

  /**
   * Share to Reddit
   */
  async shareToReddit(data: ShareData): Promise<ShareResult> {
    try {
      const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
      const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(data.title)}`
      
      if (typeof window !== 'undefined') {
        window.open(shareUrl, '_blank', 'width=550,height=420')
      }
      
      this.trackShare('reddit', data)
      return { success: true, platform: 'reddit' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'reddit', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(data: ShareData): Promise<ShareResult> {
    try {
      const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
      
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        this.trackShare('clipboard', data)
        return { success: true, platform: 'clipboard' }
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      this.trackShare('clipboard', data)
      return { success: true, platform: 'clipboard' }
    } catch (error) {
      return { 
        success: false, 
        platform: 'clipboard', 
        error: error instanceof Error ? error.message : 'Failed to copy' 
      }
    }
  }

  /**
   * Native Web Share API (mobile)
   */
  async nativeShare(data: ShareData): Promise<ShareResult> {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url || `${this.baseUrl}/games/${data.gameSlug}`
        })
        
        this.trackShare('native', data)
        return { success: true, platform: 'native' }
      }
      
      return { 
        success: false, 
        platform: 'native', 
        error: 'Native sharing not supported' 
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { 
          success: false, 
          platform: 'native', 
          error: 'Share cancelled' 
        }
      }
      
      return { 
        success: false, 
        platform: 'native', 
        error: error instanceof Error ? error.message : 'Failed to share' 
      }
    }
  }


  /**
   * Format text for Twitter
   */
  private formatTwitterText(data: ShareData): string {
    let text = data.text
    
    if (data.score !== undefined) {
      text = `🎮 I scored ${data.score.toLocaleString()} points in ${data.title}! Can you beat my score?`
    }
    
    if (data.achievement) {
      text = `🏆 Achievement Unlocked: ${data.achievement} in ${data.title}!`
    }
    
    return `${text} #MiniGames #Gaming`
  }

  /**
   * Format text for WhatsApp
   */
  private formatWhatsAppText(data: ShareData): string {
    let text = data.text
    const url = data.url || `${this.baseUrl}/games/${data.gameSlug}`
    
    if (data.score !== undefined) {
      text = `🎮 *${data.title}*\n\nI scored *${data.score.toLocaleString()}* points!\n\nCan you beat my score?\n\nPlay now: ${url}`
    } else if (data.achievement) {
      text = `🏆 *Achievement Unlocked!*\n\n${data.achievement} in ${data.title}\n\nPlay now: ${url}`
    } else {
      text = `${text}\n\n${url}`
    }
    
    return text
  }

  /**
   * Track share events for analytics
   */
  private trackShare(platform: string, data: ShareData) {
    // Track share event
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('Share', {
        props: {
          platform,
          game: data.gameSlug,
          hasScore: data.score !== undefined,
          hasAchievement: !!data.achievement
        }
      })
    }

    // Store share history in localStorage
    try {
      const shares = JSON.parse(localStorage.getItem('shareHistory') || '[]')
      shares.push({
        platform,
        gameSlug: data.gameSlug,
        timestamp: new Date().toISOString(),
        score: data.score,
        achievement: data.achievement
      })
      
      // Keep only last 50 shares
      if (shares.length > 50) {
        shares.splice(0, shares.length - 50)
      }
      
      localStorage.setItem('shareHistory', JSON.stringify(shares))
    } catch (error) {
      console.error('Failed to save share history:', error)
    }
  }

  /**
   * Get share statistics
   */
  getShareStats() {
    try {
      const shares = JSON.parse(localStorage.getItem('shareHistory') || '[]')
      
      const stats = {
        totalShares: shares.length,
        platformCounts: {} as Record<string, number>,
        gameCounts: {} as Record<string, number>,
        recentShares: shares.slice(-10).reverse()
      }
      
      shares.forEach((share: any) => {
        stats.platformCounts[share.platform] = (stats.platformCounts[share.platform] || 0) + 1
        if (share.gameSlug) {
          stats.gameCounts[share.gameSlug] = (stats.gameCounts[share.gameSlug] || 0) + 1
        }
      })
      
      return stats
    } catch {
      return {
        totalShares: 0,
        platformCounts: {},
        gameCounts: {},
        recentShares: []
      }
    }
  }
}

// Export singleton instance
export const socialSharing = new SocialSharingService()