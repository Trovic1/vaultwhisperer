'use client'

interface MessageBubbleProps {
  content: string
}

export default function MessageBubble({ content }: MessageBubbleProps) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div
        className="max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed font-medium"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
        }}
      >
        {content}
      </div>
    </div>
  )
}
