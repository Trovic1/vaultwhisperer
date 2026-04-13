'use client'

import { useState, useRef, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = value.trim().length > 0 && !isLoading

  const handleSend = () => {
    if (!canSend) return
    onSend(value)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div
      className="input-gradient-border flex items-end gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: '#12121a' }}
    >
      <textarea
        ref={textareaRef}
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask anything — e.g. Find me the safest USDC yield above 5% on Base..."
        disabled={isLoading}
        rows={1}
        className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          color: '#e2e8f0',
          maxHeight: '160px',
          overflowY: 'auto',
          paddingTop: '2px',
          paddingBottom: '2px',
        }}
      />

      <button
        id="chat-send-btn"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className="flex-none w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={
          canSend
            ? {
                background: 'linear-gradient(135deg, #7c3aed, #9f5cf7)',
                boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              }
            : { backgroundColor: '#1e1e2e' }
        }
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={canSend ? 'text-white' : 'text-slate-600'}
          >
            <path
              d="M2 8L14 2L8 14L7 9L2 8Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
      <path
        d="M8 2C8 2 12 4 12 8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
