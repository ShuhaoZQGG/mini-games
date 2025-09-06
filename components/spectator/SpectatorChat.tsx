/**
 * SpectatorChat Component
 * Live chat interface for spectators
 */

import React, { useState, useRef, useEffect } from 'react'
import { SpectatorChatMessage } from '@/lib/services/spectator'

interface SpectatorChatProps {
  gameSessionId: string
  userId?: string
  username: string
  messages?: SpectatorChatMessage[]
  onSendMessage?: (message: string) => Promise<boolean>
  onDeleteMessage?: (messageId: string) => Promise<boolean>
}

// Common emojis for quick reactions
const QUICK_EMOJIS = ['👏', '🔥', '😂', '😮', '👍', '❤️', '🎮', '💯']

export function SpectatorChat({
  gameSessionId,
  userId,
  username,
  messages = [],
  onSendMessage,
  onDeleteMessage
}: SpectatorChatProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle send message
  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending || !onSendMessage) return

    setIsSending(true)
    const success = await onSendMessage(trimmedMessage)
    
    if (success) {
      setMessage('')
      inputRef.current?.focus()
    }
    
    setIsSending(false)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle emoji click
  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Handle delete message
  const handleDelete = async (messageId: string) => {
    if (onDeleteMessage) {
      await onDeleteMessage(messageId)
    }
  }

  // Format time
  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Enforce max length
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 500) {
      setMessage(value)
    }
  }

  return (
    <div 
      data-testid="spectator-chat"
      className="flex flex-col h-full bg-gray-800"
    >
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold">Live Chat</h3>
        <div className="text-gray-400 text-sm">
          {messages.length} messages
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-messages">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.senderId === userId ? 'flex-row-reverse' : ''
              }`}
            >
              <div 
                className={`flex-1 ${
                  msg.senderId === userId ? 'text-right' : ''
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-300">
                    {msg.senderName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.sentAt)}
                  </span>
                </div>
                
                <div 
                  className={`inline-block px-3 py-1 rounded-lg ${
                    msg.senderId === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
              
              {msg.senderId === userId && (
                <button
                  data-testid={`delete-message-${msg.id}`}
                  onClick={() => handleDelete(msg.id!)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete message"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      <div className="px-4 py-2 border-t border-gray-700">
        <div className="flex gap-1 flex-wrap">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={`Add ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <button
            data-testid="emoji-picker-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Emojis"
          >
            😊
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          
          <button
            data-testid="send-message-button"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        {/* Character count */}
        <div className="text-xs text-gray-500 mt-1 text-right">
          {message.length}/500
        </div>
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div 
          data-testid="emoji-picker"
          className="absolute bottom-20 right-4 bg-gray-700 rounded-lg shadow-lg p-4 grid grid-cols-8 gap-1"
        >
          {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
            '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
            '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑',
            '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑',
            '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
            '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
            '🥳', '🥺', '🤩', '😎', '🤓', '🧐', '😕', '😟',
            '🙁', '😮', '😯', '😲', '😳', '🥴', '😵', '😱'].map(emoji => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-1 hover:bg-gray-600 rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}