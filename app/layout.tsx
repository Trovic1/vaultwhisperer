import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VaultWhisperer — AI DeFi Yield Agent',
  description:
    'Find the best DeFi vaults in plain English. Powered by LI.FI Earn API and Groq AI. Built for the DeFi Mullet Hackathon.',
  keywords: 'DeFi, yield, vaults, AI, LI.FI, DeFi Mullet, crypto',
  openGraph: {
    title: 'VaultWhisperer — AI DeFi Yield Agent',
    description: 'Find the best DeFi vaults in plain English.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: '#0a0a0f', color: '#e2e8f0' }}
      >
        {children}
      </body>
    </html>
  )
}
