# ⚡ VaultWhisperer

> **AI DeFi Yield Agent** — Built for the DeFi Mullet Hackathon

Type what you want in plain English. VaultWhisperer finds the best DeFi vaults using the **LI.FI Earn API**, explains its reasoning with **Groq AI**, and gives you a one-click **Jumper Exchange** deposit link.

---

## Architecture

```
User → Next.js 14 (port 3000)
           ↓ POST /chat
      FastAPI (port 8000)
      ├── Groq API (intent extraction + reasoning)
      └── LI.FI Earn API (vault discovery)
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- A [Groq API key](https://console.groq.com)
- A [LI.FI API key](https://apidocs.li.fi) (request via their developer portal)

---

## 1 — Clone & Navigate

```bash
git clone <your-repo>
cd vaultwhisperer
```

---

## 2 — Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Configure backend environment

Edit `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
LIFI_API_KEY=your_lifi_api_key_here
```

### Run the backend

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`

- Health check: `GET http://localhost:8000/health`
- Chat endpoint: `POST http://localhost:8000/chat`

---

## 3 — Frontend Setup

```bash
# From the project root
npm install
```

The `.env.local` is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 4 — Using VaultWhisperer

Try these example prompts:

- `Safest USDC vault above 5% on Base`
- `Best ETH yield across all chains`
- `Where should I put 500 USDC right now`
- `Compare Aave and Morpho for USDC`

The app will:
1. Extract your intent (asset, chain, min APY, risk preference)
2. Search LI.FI Earn API for matching vaults
3. Return top 3 vaults with an AI-written explanation
4. Show a **Deposit Now** button that opens [Jumper Exchange](https://jumper.exchange) for one-click deposit

---

## API Reference

### `POST /chat`

**Request:**
```json
{
  "message": "Find me the safest USDC vault above 5% on Base",
  "wallet": "0x..." // optional
}
```

**Response:**
```json
{
  "vaults": [
    {
      "name": "USDC Vault",
      "apy": "8.24%",
      "apyRaw": 0.0824,
      "tvlUsd": 12500000,
      "tvlFormatted": "$12.5M",
      "chainId": 8453,
      "chainName": "Base",
      "address": "0xvaultaddress",
      "underlyingSymbol": "USDC",
      "underlyingAddress": "0xtokenaddress",
      "composerUrl": "https://jumper.exchange/?fromChain=8453&toChain=8453&fromToken=0x...&toToken=0x...",
      "protocol": "Aave"
    }
  ],
  "reasoning": "Based on your preference for safety, these vaults offer..."
}
```

### `GET /health`

Returns `{ "status": "ok", "model": "llama-3.3-70b-versatile" }`

---

## Chain ID Reference

| Chain ID | Network |
|----------|---------|
| 1 | Ethereum |
| 8453 | Base |
| 42161 | Arbitrum |
| 10 | Optimism |
| 137 | Polygon |
| 56 | BNB Chain |
| 43114 | Avalanche |

---

## Project Structure

```
vaultwhisperer/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── requirements.txt
│   └── .env              # GROQ_API_KEY, LIFI_API_KEY
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ChatInput.tsx
│   ├── MessageBubble.tsx
│   ├── VaultCard.tsx
│   └── ReasoningBlock.tsx
├── types/
│   └── index.ts
├── .env.local            # NEXT_PUBLIC_API_URL
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## Built With

- **[Next.js 14](https://nextjs.org/)** — React framework with App Router
- **[FastAPI](https://fastapi.tiangolo.com/)** — Python async API
- **[Groq](https://groq.com/)** — LLM inference (llama-3.3-70b-versatile)
- **[LI.FI Earn API](https://earn.li.fi)** — DeFi vault aggregation
- **[Jumper Exchange](https://jumper.exchange)** — One-click DeFi deposits

---

*DeFi Mullet Hackathon — Business in the front, DeFi in the back.*
