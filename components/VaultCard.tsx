'use client'

import { Vault } from '@/types'

interface VaultCardProps {
  vault: Vault
  rank: number
}

const RANK_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '🥇', label: 'Best Pick', color: '#f59e0b' },
  2: { emoji: '🥈', label: 'Runner Up', color: '#94a3b8' },
  3: { emoji: '🥉', label: 'Alternative', color: '#b45309' },
}

export default function VaultCard({ vault, rank }: VaultCardProps) {
  const rankInfo = RANK_LABELS[rank] ?? { emoji: '✦', label: `#${rank}`, color: '#7c3aed' }

  return (
    <div
      className="glass-card rounded-2xl p-5 transition-all duration-300 animate-fade-up"
      style={{ animationDelay: `${rank * 80}ms` }}
    >
      {/* Top row: rank badge + protocol name + chain badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-none text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${rankInfo.color}18`,
              border: `1px solid ${rankInfo.color}40`,
              color: rankInfo.color,
            }}
          >
            {rankInfo.emoji} {rankInfo.label}
          </span>
          <div className="min-w-0">
            <h3
              className="font-bold text-base leading-tight truncate"
              style={{ color: '#f1f5f9' }}
            >
              {vault.name}
            </h3>
            {vault.protocol !== vault.name && (
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                via {vault.protocol}
              </p>
            )}
          </div>
        </div>

        {/* Chain badge */}
        <ChainBadge chainId={vault.chainId} chainName={vault.chainName} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* APY */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: '#7c6fa0' }}>
            APY
          </p>
          <p
            className="text-3xl font-extrabold leading-none tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #9f5cf7, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {vault.apy}
          </p>
        </div>

        {/* TVL */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: '#16161f', border: '1px solid #1e1e2e' }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>
            TVL
          </p>
          <p className="text-xl font-bold leading-none" style={{ color: '#e2e8f0' }}>
            {vault.tvlFormatted}
          </p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>
            total locked
          </p>
        </div>
      </div>

      {/* Underlying asset */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <span style={{ color: '#10b981' }}>$</span>
        </div>
        <span className="text-xs" style={{ color: '#64748b' }}>
          Deposit asset:{' '}
          <span className="font-semibold" style={{ color: '#94a3b8' }}>
            {vault.underlyingSymbol}
          </span>
        </span>
      </div>

      {/* Deposit button */}
      <a
        href={vault.composerUrl}
        target="_blank"
        rel="noopener noreferrer"
        id={`deposit-btn-${vault.address.slice(0, 8)}`}
        className="btn-accent flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
      >
        <span>Deposit Now</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 7H12M8 3L12 7L8 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      {/* Footer: via Jumper hint */}
      <p className="text-center text-xs mt-2.5" style={{ color: '#334155' }}>
        Opens Jumper Exchange · No wallet required in this app
      </p>
    </div>
  )
}

const CHAIN_COLORS: Record<number, { bg: string; fg: string; dot: string }> = {
  1: { bg: 'rgba(99,102,241,0.12)', fg: '#818cf8', dot: '#6366f1' },
  8453: { bg: 'rgba(59,130,246,0.12)', fg: '#60a5fa', dot: '#3b82f6' },
  42161: { bg: 'rgba(14,165,233,0.12)', fg: '#38bdf8', dot: '#0ea5e9' },
  10: { bg: 'rgba(239,68,68,0.10)', fg: '#f87171', dot: '#ef4444' },
  137: { bg: 'rgba(139,92,246,0.12)', fg: '#a78bfa', dot: '#8b5cf6' },
  56: { bg: 'rgba(234,179,8,0.12)', fg: '#fbbf24', dot: '#eab308' },
  43114: { bg: 'rgba(239,68,68,0.10)', fg: '#f87171', dot: '#ef4444' },
}

function ChainBadge({ chainId, chainName }: { chainId: number; chainName: string }) {
  const colors = CHAIN_COLORS[chainId] ?? {
    bg: 'rgba(124,58,237,0.12)',
    fg: '#9f5cf7',
    dot: '#7c3aed',
  }

  return (
    <div
      className="flex-none flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: colors.bg, border: `1px solid ${colors.dot}30`, color: colors.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-none"
        style={{ backgroundColor: colors.dot }}
      />
      {chainName}
    </div>
  )
}
