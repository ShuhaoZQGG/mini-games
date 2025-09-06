/**
 * Spectator Mode Demo
 * Demonstration of spectator mode functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { SpectatorView } from '@/components/spectator'
import { spectatorService } from '@/lib/services/spectator'
import { getTournamentRealtimeService } from '@/lib/services/tournament-realtime'

// Mock game session ID for demo
const DEMO_SESSION_ID = 'demo_game_session_123'

export default function SpectatorDemoPage() {
  const [isHost, setIsHost] = useState(false)
  const [gameState, setGameState] = useState({
    players: [
      { id: 'p1', name: 'Player 1', score: 0, combo: 1 },
      { id: 'p2', name: 'Player 2', score: 0, combo: 1 }
    ],
    timeRemaining: 60,
    round: 1
  })
  const [showSpectator, setShowSpectator] = useState(false)

  // Simulate game updates when hosting
  useEffect(() => {
    if (!isHost) return

    const interval = setInterval(async () => {
      setGameState(prev => {
        const newState = {
          ...prev,
          players: prev.players.map(p => ({
            ...p,
            score: p.score + Math.floor(Math.random() * 10),
            combo: Math.random() > 0.7 ? p.combo + 1 : 1
          })),
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }

        // Broadcast state to spectators
        spectatorService.broadcastGameState(DEMO_SESSION_ID, newState)

        return newState
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isHost])

  // Initialize realtime service
  useEffect(() => {
    const initRealtime = async () => {
      const service = getTournamentRealtimeService()
      await service.connect()
    }
    initRealtime()
  }, [])

  const startHosting = async () => {
    setIsHost(true)
    // Initialize the game session
    await spectatorService.broadcastGameState(DEMO_SESSION_ID, gameState)
  }

  const stopHosting = () => {
    setIsHost(false)
  }

  const openSpectatorView = () => {
    setShowSpectator(true)
  }

  const renderGame = (canvas: HTMLCanvasElement, state: any) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and draw background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid pattern
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i <= canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw players
    if (state?.players) {
      state.players.forEach((player: any, index: number) => {
        const x = canvas.width / 4 + (index * canvas.width / 2)
        const y = canvas.height / 2

        // Player circle
        ctx.beginPath()
        ctx.arc(x, y, 40, 0, Math.PI * 2)
        ctx.fillStyle = index === 0 ? '#3b82f6' : '#ef4444'
        ctx.fill()

        // Player name
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(player.name, x, y - 60)

        // Score
        ctx.font = 'bold 36px Arial'
        ctx.fillText(player.score.toString(), x, y + 10)

        // Combo
        if (player.combo > 1) {
          ctx.font = '16px Arial'
          ctx.fillStyle = '#fbbf24'
          ctx.fillText(`x${player.combo} combo`, x, y + 70)
        }
      })
    }

    // Draw timer
    if (state?.timeRemaining !== undefined) {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `Time: ${Math.floor(state.timeRemaining / 60)}:${String(state.timeRemaining % 60).padStart(2, '0')}`,
        canvas.width / 2,
        40
      )
    }
  }

  if (showSpectator) {
    return (
      <SpectatorView
        gameSessionId={DEMO_SESSION_ID}
        guestId={`guest_demo_${Date.now()}`}
        username="Demo Spectator"
        onExit={() => setShowSpectator(false)}
        gameRenderer={renderGame}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Spectator Mode Demo</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click "Start Hosting" to simulate a live game</li>
            <li>Open spectator view in a new tab or click "Watch as Spectator"</li>
            <li>See real-time game updates and viewer count</li>
            <li>Try the live chat feature (multiple spectators can chat)</li>
            <li>Share the spectator link to invite others</li>
          </ol>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Host Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Host Controls</h3>
            
            {!isHost ? (
              <button
                onClick={startHosting}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                Start Hosting Game
              </button>
            ) : (
              <>
                <div className="mb-4">
                  <div className="text-green-400 mb-2">🔴 Game is LIVE</div>
                  <div className="text-sm text-gray-400">
                    Game updates every second
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Player 1:</span>
                    <span className="font-bold">{gameState.players[0].score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player 2:</span>
                    <span className="font-bold">{gameState.players[1].score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-bold">{gameState.timeRemaining}s</span>
                  </div>
                </div>
                
                <button
                  onClick={stopHosting}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                >
                  Stop Hosting
                </button>
              </>
            )}
          </div>

          {/* Spectator Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Spectator Options</h3>
            
            <button
              onClick={openSpectatorView}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors mb-4"
              disabled={!isHost}
            >
              Watch as Spectator
            </button>
            
            <div className="text-sm text-gray-400">
              <p className="mb-2">Direct spectator link:</p>
              <div className="bg-gray-900 p-2 rounded break-all">
                {typeof window !== 'undefined' 
                  ? `${window.location.origin}/spectate/${DEMO_SESSION_ID}`
                  : 'Loading...'}
              </div>
              
              <button
                onClick={() => {
                  const url = `${window.location.origin}/spectate/${DEMO_SESSION_ID}`
                  navigator.clipboard.writeText(url)
                  alert('Link copied!')
                }}
                className="mt-2 text-blue-400 hover:text-blue-300"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Features Demonstrated</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>✅ Real-time game state broadcasting</div>
            <div>✅ Live viewer count tracking</div>
            <div>✅ Interactive chat system</div>
            <div>✅ Guest spectator support</div>
            <div>✅ Share functionality</div>
            <div>✅ Connection status indicators</div>
            <div>✅ Player stats display</div>
            <div>✅ Mobile responsive design</div>
          </div>
        </div>
      </div>
    </div>
  )
}