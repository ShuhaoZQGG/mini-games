/**
 * SpectatorView Component
 * Main spectator interface for watching live games
 */

import React, { useEffect, useRef, useState } from 'react'
import { useSpectatorRealtime } from '@/hooks/useSpectatorRealtime'
import { SpectatorChat } from './SpectatorChat'
import { ViewerCount } from './ViewerCount'
import { spectatorService } from '@/lib/services/spectator'

interface SpectatorViewProps {
  gameSessionId: string
  userId?: string
  guestId?: string
  username?: string
  onExit?: () => void
  gameRenderer?: (canvas: HTMLCanvasElement, gameState: any) => void
}

export function SpectatorView({
  gameSessionId,
  userId,
  guestId,
  username = 'Guest',
  onExit,
  gameRenderer
}: SpectatorViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showChat, setShowChat] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const {
    isConnected,
    viewerCount,
    gameState,
    chatMessages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    reconnect
  } = useSpectatorRealtime(gameSessionId, userId, guestId)

  // Render game state on canvas
  useEffect(() => {
    if (canvasRef.current && gameState && gameRenderer) {
      gameRenderer(canvasRef.current, gameState)
    }
  }, [gameState, gameRenderer])

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/spectate/${gameSessionId}`
    const shareData = {
      title: 'Watch Live Game',
      text: `Join me watching this live game!`,
      url: shareUrl
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  // Handle exit
  const handleExit = async () => {
    if (userId || guestId) {
      await spectatorService.stopSpectating(gameSessionId, userId, guestId)
    }
    onExit?.()
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Extract player info from game state
  const players = gameState?.players || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading stream...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={reconnect}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div 
      data-testid="spectator-view"
      className="flex flex-col h-screen bg-gray-900"
    >
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div 
                data-testid="live-indicator"
                className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
              />
              <span className="text-white font-semibold">LIVE</span>
            </div>
            
            {/* Viewer Count */}
            <ViewerCount count={viewerCount} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Toggle Chat"
            >
              💬
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
            
            <button
              onClick={handleShare}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Share
            </button>
            
            <button
              onClick={handleExit}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game View */}
        <div className="flex-1 flex flex-col">
          {/* Player Stats */}
          {players.length > 0 && (
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <div className="flex justify-around">
                {players.map((player: any, index: number) => (
                  <div key={player.id || index} className="flex items-center gap-2">
                    <span className="text-gray-400">{player.name}:</span>
                    <span className="text-white font-semibold">{player.score || 0}</span>
                    {player.combo && (
                      <span className="text-yellow-400 text-sm">x{player.combo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Canvas */}
          <div className="flex-1 flex items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              data-testid="game-canvas"
              className="max-w-full max-h-full bg-black rounded-lg shadow-lg"
              width={800}
              height={600}
            />
          </div>

          {/* Game Info */}
          {gameState?.timeRemaining !== undefined && (
            <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
              <div className="text-center text-white">
                Time: {Math.floor(gameState.timeRemaining / 60)}:
                {String(gameState.timeRemaining % 60).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-gray-700">
            <SpectatorChat
              gameSessionId={gameSessionId}
              userId={userId}
              username={username}
              messages={chatMessages}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
            />
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded">
          Reconnecting...
        </div>
      )}
    </div>
  )
}