/**
 * Spectator Page
 * Dynamic route for spectating live games
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { SpectatorView } from '@/components/spectator'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function SpectatePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [guestId, setGuestId] = useState<string>('')

  const sessionId = params.sessionId as string

  useEffect(() => {
    // Generate guest ID if not authenticated
    if (!user?.id) {
      const id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setGuestId(id)
    }
  }, [user])

  const handleExit = () => {
    router.push('/')
  }

  // Example game renderer (would be replaced with actual game rendering logic)
  const renderGame = (canvas: HTMLCanvasElement, gameState: any) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw game state
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw sample game content
    if (gameState?.players) {
      ctx.font = '24px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      
      gameState.players.forEach((player: any, index: number) => {
        const y = 100 + index * 50
        ctx.fillText(`${player.name}: ${player.score}`, canvas.width / 2, y)
      })
    }

    // Draw time if available
    if (gameState?.timeRemaining !== undefined) {
      ctx.font = '32px Arial'
      ctx.fillStyle = '#ffff00'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Time: ${gameState.timeRemaining}s`,
        canvas.width / 2,
        canvas.height - 50
      )
    }
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Invalid session ID</div>
      </div>
    )
  }

  return (
    <SpectatorView
      gameSessionId={sessionId}
      userId={user?.id}
      guestId={guestId}
      username={user?.username || 'Guest'}
      onExit={handleExit}
      gameRenderer={renderGame}
    />
  )
}