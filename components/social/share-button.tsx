'use client'

import { useState } from 'react'
import { Share2, Twitter, Facebook, MessageCircle, Linkedin, Link, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { socialSharing, type ShareData } from '@/lib/services/social-sharing'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  data: ShareData
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function ShareButton({ 
  data, 
  className, 
  variant = 'outline',
  size = 'default',
  showLabel = true 
}: ShareButtonProps) {
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleShare = async (platform: string) => {
    setIsSharing(true)
    let result

    try {
      switch (platform) {
        case 'twitter':
          result = await socialSharing.shareToTwitter(data)
          break
        case 'facebook':
          result = await socialSharing.shareToFacebook(data)
          break
        case 'whatsapp':
          result = await socialSharing.shareToWhatsApp(data)
          break
        case 'linkedin':
          result = await socialSharing.shareToLinkedIn(data)
          break
        case 'reddit':
          result = await socialSharing.shareToReddit(data)
          break
        case 'clipboard':
          result = await socialSharing.copyToClipboard(data)
          if (result.success) {
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
            toast({
              title: 'Link copied!',
              description: 'Share link has been copied to clipboard',
            })
          }
          break
        case 'native':
          result = await socialSharing.nativeShare(data)
          break
        default:
          result = { success: false, error: 'Unknown platform' }
      }

      if (!result.success && result.error && platform !== 'native') {
        toast({
          title: 'Share failed',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSharing(false)
    }
  }

  // Check if native sharing is available
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn('gap-2', className)}
          disabled={isSharing}
        >
          <Share2 className="h-4 w-4" />
          {showLabel && 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={() => handleShare('native')}>
              <Share2 className="mr-2 h-4 w-4" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter / X
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('linkedin')}>
          <Linkedin className="mr-2 h-4 w-4" />
          LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare('reddit')}>
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
          Reddit
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleShare('clipboard')}>
          {copiedLink ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}