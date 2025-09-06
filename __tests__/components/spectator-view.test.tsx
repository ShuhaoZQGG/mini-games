/**
 * Spectator View Component Tests
 * Tests for the live spectator UI components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SpectatorView } from '@/components/spectator/SpectatorView'
import { SpectatorChat } from '@/components/spectator/SpectatorChat'
import { ViewerCount } from '@/components/spectator/ViewerCount'
import { spectatorService } from '@/lib/services/spectator'
import { useSpectatorRealtime } from '@/hooks/useSpectatorRealtime'

// Mock spectator service
jest.mock('@/lib/services/spectator', () => ({
  spectatorService: {
    startSpectating: jest.fn(),
    stopSpectating: jest.fn(),
    getActiveSpectatorCount: jest.fn(),
    broadcastGameState: jest.fn(),
    sendChatMessage: jest.fn(),
    getChatHistory: jest.fn(),
    deleteChatMessage: jest.fn(),
    subscribeToGameSession: jest.fn(),
    getSpectatorStatistics: jest.fn()
  }
}))

// Mock realtime hook
jest.mock('@/hooks/useSpectatorRealtime', () => ({
  useSpectatorRealtime: jest.fn()
}))

describe('SpectatorView', () => {
  const mockGameSessionId = 'game_123'
  const mockUserId = 'user_456'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSpectatorRealtime as jest.Mock).mockReturnValue({
      isConnected: true,
      viewerCount: 10,
      gameState: { score: 100 },
      chatMessages: []
    })
  })

  it('should render spectator view with game canvas', () => {
    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(screen.getByTestId('spectator-view')).toBeInTheDocument()
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument()
  })

  it('should display viewer count', () => {
    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(screen.getByText(/10 viewers/i)).toBeInTheDocument()
  })

  it('should show live indicator', () => {
    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByTestId('live-indicator')).toHaveClass('animate-pulse')
  })

  it('should display player stats', () => {
    ;(useSpectatorRealtime as jest.Mock).mockReturnValue({
      isConnected: true,
      viewerCount: 10,
      gameState: {
        players: [
          { id: 'p1', name: 'Player 1', score: 150 },
          { id: 'p2', name: 'Player 2', score: 120 }
        ]
      },
      chatMessages: []
    })

    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('should handle exit button click', async () => {
    const onExit = jest.fn()
    
    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        onExit={onExit}
      />
    )

    fireEvent.click(screen.getByText('Exit'))

    await waitFor(() => {
      expect(spectatorService.stopSpectating).toHaveBeenCalledWith(
        mockGameSessionId,
        mockUserId
      )
      expect(onExit).toHaveBeenCalled()
    })
  })

  it('should handle share button click', () => {
    const mockShare = jest.fn()
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true
    })

    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    fireEvent.click(screen.getByText('Share'))

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Watch Live'),
        text: expect.any(String),
        url: expect.stringContaining(mockGameSessionId)
      })
    )
  })

  it('should start spectating on mount', () => {
    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(spectatorService.startSpectating).toHaveBeenCalledWith({
      gameSessionId: mockGameSessionId,
      userId: mockUserId
    })
  })

  it('should stop spectating on unmount', () => {
    const { unmount } = render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    unmount()

    expect(spectatorService.stopSpectating).toHaveBeenCalledWith(
      mockGameSessionId,
      mockUserId
    )
  })

  it('should handle connection loss', () => {
    ;(useSpectatorRealtime as jest.Mock).mockReturnValue({
      isConnected: false,
      viewerCount: 0,
      gameState: null,
      chatMessages: []
    })

    render(
      <SpectatorView
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
      />
    )

    expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument()
  })
})

describe('SpectatorChat', () => {
  const mockGameSessionId = 'game_123'
  const mockUserId = 'user_456'
  const mockUsername = 'TestUser'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(spectatorService.getChatHistory as jest.Mock).mockResolvedValue([
      {
        id: 'msg1',
        senderId: 'user1',
        senderName: 'User1',
        message: 'Hello!',
        sentAt: new Date()
      },
      {
        id: 'msg2',
        senderId: 'user2',
        senderName: 'User2',
        message: 'Great game!',
        sentAt: new Date()
      }
    ])
  })

  it('should render chat interface', async () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('spectator-chat')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument()
    })
  })

  it('should load and display chat history', async () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Great game!')).toBeInTheDocument()
      expect(screen.getByText('User1')).toBeInTheDocument()
      expect(screen.getByText('User2')).toBeInTheDocument()
    })
  })

  it('should send chat message', async () => {
    ;(spectatorService.sendChatMessage as jest.Mock).mockResolvedValue({
      id: 'msg3',
      senderId: mockUserId,
      senderName: mockUsername,
      message: 'Test message',
      sentAt: new Date()
    })

    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const input = screen.getByPlaceholderText(/Type a message/i)
    const sendButton = screen.getByTestId('send-message-button')

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(spectatorService.sendChatMessage).toHaveBeenCalledWith({
        gameSessionId: mockGameSessionId,
        senderId: mockUserId,
        senderName: mockUsername,
        message: 'Test message'
      })
      expect(input).toHaveValue('')
    })
  })

  it('should handle enter key to send message', async () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const input = screen.getByPlaceholderText(/Type a message/i)

    fireEvent.change(input, { target: { value: 'Enter test' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 })

    await waitFor(() => {
      expect(spectatorService.sendChatMessage).toHaveBeenCalled()
    })
  })

  it('should not send empty messages', async () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const sendButton = screen.getByTestId('send-message-button')
    fireEvent.click(sendButton)

    expect(spectatorService.sendChatMessage).not.toHaveBeenCalled()
  })

  it('should enforce message length limit', async () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const input = screen.getByPlaceholderText(/Type a message/i) as HTMLInputElement
    const longMessage = 'x'.repeat(501)

    fireEvent.change(input, { target: { value: longMessage } })

    expect(input.value).toHaveLength(500)
  })

  it('should support emoji picker', () => {
    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const emojiButton = screen.getByTestId('emoji-picker-button')
    fireEvent.click(emojiButton)

    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
  })

  it('should allow deleting own messages', async () => {
    ;(spectatorService.getChatHistory as jest.Mock).mockResolvedValue([
      {
        id: 'msg1',
        senderId: mockUserId,
        senderName: mockUsername,
        message: 'My message',
        sentAt: new Date()
      }
    ])

    render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    await waitFor(() => {
      const deleteButton = screen.getByTestId('delete-message-msg1')
      fireEvent.click(deleteButton)
    })

    expect(spectatorService.deleteChatMessage).toHaveBeenCalledWith(
      'msg1',
      mockUserId
    )
  })

  it('should auto-scroll to new messages', async () => {
    const { container } = render(
      <SpectatorChat
        gameSessionId={mockGameSessionId}
        userId={mockUserId}
        username={mockUsername}
      />
    )

    const chatContainer = container.querySelector('.chat-messages')
    const scrollSpy = jest.spyOn(chatContainer!, 'scrollTo')

    // Simulate new message
    ;(useSpectatorRealtime as jest.Mock).mockReturnValue({
      isConnected: true,
      viewerCount: 10,
      gameState: null,
      chatMessages: [
        {
          id: 'new',
          senderId: 'user3',
          senderName: 'User3',
          message: 'New message!',
          sentAt: new Date()
        }
      ]
    })

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled()
    })
  })
})

describe('ViewerCount', () => {
  it('should display viewer count', () => {
    render(<ViewerCount count={42} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByTestId('viewer-icon')).toBeInTheDocument()
  })

  it('should format large numbers', () => {
    render(<ViewerCount count={1234} />)
    
    expect(screen.getByText('1.2K')).toBeInTheDocument()
  })

  it('should show animation for count changes', () => {
    const { rerender } = render(<ViewerCount count={10} />)
    
    rerender(<ViewerCount count={15} />)
    
    const countElement = screen.getByTestId('viewer-count')
    expect(countElement).toHaveClass('animate-scale')
  })

  it('should show peak viewer indicator', () => {
    render(<ViewerCount count={100} peak={150} />)
    
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Peak: 150')).toBeInTheDocument()
  })

  it('should handle zero viewers gracefully', () => {
    render(<ViewerCount count={0} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/No viewers/i)).toBeInTheDocument()
  })
})