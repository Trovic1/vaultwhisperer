'use client'

interface ReasoningBlockProps {
  text: string
}

export default function ReasoningBlock({ text }: ReasoningBlockProps) {
  return (
    <div
      className="animate-slide-in flex items-start gap-3 rounded-2xl rounded-tl-sm p-4"
      style={{
        backgroundColor: '#12121a',
        border: '1px solid #1e1e2e',
        borderLeft: '3px solid #7c3aed',
      }}
    >
      <div
        className="flex-none w-7 h-7 rounded-lg flex items-center justify-center text-sm mt-0.5"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #9f5cf7)' }}
      >
        ⚡
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9f5cf7' }}>
            VaultWhisperer Analysis
          </span>
        </div>
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: '#94a3b8' }}
        >
          {text}
        </p>
      </div>
    </div>
  )
}
