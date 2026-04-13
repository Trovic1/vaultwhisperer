'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage, ChatResponse, EXAMPLE_PROMPTS, Vault } from '@/types'
import ChatInput from '@/components/ChatInput'
import MessageBubble from '@/components/MessageBubble'
import VaultCard from '@/components/VaultCard'
import ReasoningBlock from '@/components/ReasoningBlock'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
      }

      const loadingMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        loading: true,
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setIsLoading(true)

      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim() }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: 'Unknown error' }))
          throw new Error(errData.detail ?? `HTTP ${res.status}`)
        }

        const data: ChatResponse = await res.json()

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  loading: false,
                  vaults: data.vaults,
                  reasoning: data.reasoning,
                  content: data.reasoning,
                }
              : m
          )
        )
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  loading: false,
                  error: true,
                  content: errorMessage,
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <header className="flex-none border-b" style={{ borderColor: '#1e1e2e', backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #9f5cf7)',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}
            >
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                VaultWhisperer
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                AI DeFi Yield Agent · DeFi Mullet Hackathon
              </p>
            </div>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#9f5cf7' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Powered by LI.FI + Groq
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty ? (
            <EmptyState onPromptClick={sendMessage} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageThread key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}
          {!isEmpty && <div ref={bottomRef} className="h-4" />}
        </div>
      </main>

      {/* Input bar */}
      <div
        className="flex-none border-t"
        style={{ borderColor: '#1e1e2e', backgroundColor: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

function MessageThread({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <MessageBubble content={message.content} />
  }

  if (message.loading) {
    return <LoadingState />
  }

  if (message.error) {
    return <ErrorMessage content={message.content} />
  }

  return (
    <div className="animate-fade-up space-y-4">
      {message.reasoning && <ReasoningBlock text={message.reasoning} />}
      {message.vaults && message.vaults.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1">
          {message.vaults.map((vault: Vault, i: number) => (
            <VaultCard key={`${vault.address}-${i}`} vault={vault} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="animate-fade-in flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex-none flex items-center justify-center text-sm"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #9f5cf7)' }}
      >
        ⚡
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }}
      >
        <div className="dot-loader flex items-center gap-1">
          <span />
          <span />
          <span />
        </div>
        <span className="text-sm font-medium" style={{ color: '#9f5cf7' }}>
          Scanning 20+ protocols...
        </span>
      </div>
    </div>
  )
}

function ErrorMessage({ content }: { content: string }) {
  return (
    <div className="animate-fade-in flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex-none flex items-center justify-center text-sm"
        style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        ⚠️
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
        style={{
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5',
        }}
      >
        <span className="font-semibold text-red-400">Error: </span>
        {content}
      </div>
    </div>
  )
}

function EmptyState({ onPromptClick }: { onPromptClick: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Hero icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 animate-glow-pulse"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #9f5cf7)',
          boxShadow: '0 0 40px rgba(124,58,237,0.35)',
        }}
      >
        ⚡
      </div>

      <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
        The Vault Whisperer
      </h2>
      <p className="text-base mb-2" style={{ color: '#94a3b8' }}>
        Describe what you want in plain English.
      </p>
      <p className="text-sm mb-10" style={{ color: '#64748b' }}>
        I&apos;ll find and explain the best DeFi yield vaults for you — instantly.
      </p>

      {/* Example prompt chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              backgroundColor: '#12121a',
              border: '1px solid #1e1e2e',
              color: '#e2e8f0',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.borderColor = 'rgba(124,58,237,0.5)'
              el.style.boxShadow = '0 0 16px rgba(124,58,237,0.15)'
              el.style.color = '#c4b5fd'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.borderColor = '#1e1e2e'
              el.style.boxShadow = 'none'
              el.style.color = '#e2e8f0'
            }}
          >
            <span className="text-base mr-2">✦</span>
            {prompt}
          </button>
        ))}
      </div>

      {/* Built for badge */}
      <div
        className="mt-10 text-xs px-4 py-2 rounded-full"
        style={{
          backgroundColor: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.15)',
          color: '#7c6fa0',
        }}
      >
        Built for the{' '}
        <span style={{ color: '#9f5cf7' }} className="font-semibold">
          DeFi Mullet Hackathon
        </span>{' '}
        · Powered by LI.FI Earn API
      </div>
    </div>
  )
}
