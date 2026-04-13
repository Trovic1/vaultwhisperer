export interface Vault {
  name: string
  apy: string
  apyRaw: number
  tvlUsd: number
  tvlFormatted: string
  chainId: number
  chainName: string
  address: string
  underlyingSymbol: string
  underlyingAddress: string
  composerUrl: string
  protocol: string
}

export interface ChatResponse {
  vaults: Vault[]
  reasoning: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  vaults?: Vault[]
  reasoning?: string
  loading?: boolean
  error?: boolean
}

export const EXAMPLE_PROMPTS = [
  'Safest USDC vault above 5% on Base',
  'Best ETH yield across all chains',
  'Where should I put 500 USDC right now',
  'Compare Aave and Morpho for USDC',
] as const
