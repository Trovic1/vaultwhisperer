import os
import json
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LIFI_API_KEY = os.getenv("LIFI_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
LIFI_EARN_BASE = "https://earn.li.fi"

CHAIN_NAMES: dict[int, str] = {
    1: "Ethereum",
    8453: "Base",
    42161: "Arbitrum",
    10: "Optimism",
    137: "Polygon",
    56: "BNB Chain",
    43114: "Avalanche",
    250: "Fantom",
    100: "Gnosis",
    1101: "Polygon zkEVM",
}

app = FastAPI(title="VaultWhisperer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://vaultwhisperer.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=GROQ_API_KEY)


class ChatRequest(BaseModel):
    message: str
    wallet: Optional[str] = None


class VaultResult(BaseModel):
    name: str
    apy: str
    apyRaw: float
    tvlUsd: float
    tvlFormatted: str
    chainId: int
    chainName: str
    address: str
    underlyingSymbol: str
    underlyingAddress: str
    composerUrl: str
    protocol: str


class ChatResponse(BaseModel):
    vaults: list[VaultResult]
    reasoning: str


def format_tvl(tvl: float) -> str:
    if tvl >= 1_000_000_000:
        return f"${tvl / 1_000_000_000:.1f}B"
    if tvl >= 1_000_000:
        return f"${tvl / 1_000_000:.1f}M"
    if tvl >= 1_000:
        return f"${tvl / 1_000:.1f}K"
    return f"${tvl:.0f}"


def build_composer_url(chain_id: int, underlying_address: str, vault_address: str) -> str:
    return (
        f"https://jumper.exchange/?fromChain={chain_id}"
        f"&toChain={chain_id}"
        f"&fromToken={underlying_address}"
        f"&toToken={vault_address}"
    )


async def extract_intent(message: str) -> dict:
    system_prompt = """You are a DeFi intent extraction assistant. 
Given a user message about DeFi yield, extract the following as a JSON object:
{
  "asset": "USDC",        // token symbol, default USDC
  "chainId": null,        // numeric chain ID or null for all chains. Known chains: 1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon
  "minApy": 0,            // minimum APY as a float (e.g. 5 for 5%), default 0
  "riskLevel": "balanced" // "safe", "balanced", or "aggressive"
}

Rules:
- If the user says "safest", set riskLevel to "safe"
- If the user says "best yield" or "highest", set riskLevel to "aggressive"
- If the user mentions a chain name (Base, Arbitrum, Optimism, Polygon, Ethereum), set chainId accordingly
- If the user mentions a token (ETH, USDT, DAI, WBTC, etc.), set asset accordingly
- Extract minimum APY from phrases like "above 5%", "at least 8%", "more than 3%"
- Always return valid JSON only, no other text"""

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=0.1,
            max_tokens=256,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        intent = json.loads(raw.strip())
        return intent
    except Exception as e:
        logger.warning(f"Intent extraction failed: {e}, using defaults")
        return {"asset": "USDC", "chainId": None, "minApy": 0, "riskLevel": "balanced"}


async def fetch_vaults(asset: str, chain_id: Optional[int]) -> list[dict]:
    params: dict = {
        "sortBy": "apy",
        "limit": 50,
    }
    if asset:
        params["asset"] = asset.upper()
    if chain_id is not None:
        params["chainId"] = str(chain_id)

    headers = {
        "x-lifi-api-key": LIFI_API_KEY,
        "Accept": "application/json",
    }

    logger.info(f"Fetching vaults with params: {params}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{LIFI_EARN_BASE}/v1/earn/vaults",
            params=params,
            headers=headers,
        )
        logger.info(f"LI.FI response status: {resp.status_code}")
        resp.raise_for_status()
        data = resp.json()

    logger.info(f"LI.FI response type: {type(data).__name__}")

    if isinstance(data, list):
        logger.info(f"Got {len(data)} vaults as list")
        return data
    if isinstance(data, dict):
        for key in ("vaults", "data", "results", "items"):
            if key in data and isinstance(data[key], list):
                logger.info(f"Got {len(data[key])} vaults under key '{key}'")
                return data[key]
        logger.warning(f"Dict keys: {list(data.keys())}")
    logger.warning(f"Unexpected vault response shape: {type(data)}")
    return []


def parse_vault(raw: dict) -> Optional[dict]:
    try:
        analytics = raw.get("analytics", {})
        apy_info = analytics.get("apy", {})

        # LI.FI returns APY as a decimal e.g. 0.0824 = 8.24%
        # Do NOT divide by 100 — it is already a decimal
        apy_raw = float(apy_info.get("total", 0) or 0)

        tvl_info = analytics.get("tvl", {})
        tvl = float(tvl_info.get("usd", 0) or 0)
        chain_id = int(raw.get("chainId", 1) or 1)

        underlying_tokens = raw.get("underlyingTokens", [])
        if underlying_tokens and isinstance(underlying_tokens, list):
            first_token = underlying_tokens[0]
            underlying_symbol = first_token.get("symbol", "?")
            underlying_address = first_token.get("address", "0x0000000000000000000000000000000000000000")
        else:
            underlying_symbol = raw.get("asset", "?")
            underlying_address = "0x0000000000000000000000000000000000000000"

        vault_address = raw.get("address", "")

        protocol_raw = raw.get("protocol", {})
        protocol = protocol_raw.get("name", "Unknown Protocol") if isinstance(protocol_raw, dict) else str(protocol_raw)

        display_name = raw.get("name", protocol)

        return {
            "name": display_name,
            "protocol": protocol,
            "apyRaw": apy_raw,
            "apy": f"{apy_raw * 100:.2f}%",
            "tvlUsd": tvl,
            "tvlFormatted": format_tvl(tvl),
            "chainId": chain_id,
            "chainName": CHAIN_NAMES.get(chain_id, f"Chain {chain_id}"),
            "address": vault_address,
            "underlyingSymbol": underlying_symbol,
            "underlyingAddress": underlying_address,
            "composerUrl": build_composer_url(chain_id, underlying_address, vault_address),
        }
    except Exception as e:
        logger.warning(f"Failed to parse vault: {e} — raw keys: {list(raw.keys()) if isinstance(raw, dict) else raw}")
        return None


async def generate_reasoning(
    user_message: str,
    intent: dict,
    vaults: list[dict],
) -> str:
    vault_summaries = "\n".join(
        f"- {v['name']} on {v['chainName']}: APY {v['apy']}, TVL {v['tvlFormatted']}, "
        f"underlying asset {v['underlyingSymbol']}"
        for v in vaults[:5]
    )

    system_prompt = """You are VaultWhisperer, an expert DeFi yield advisor. 
Write exactly 3 sentences explaining why the listed vaults are good picks for the user's goal.
Be specific: mention protocol names, APYs, and chains. 
Tone: confident, clear, helpful — like a knowledgeable friend, not a chatbot.
Do not use bullet points. Return only the 3 sentences, nothing else."""

    user_content = f"""User asked: "{user_message}"
Extracted intent: asset={intent.get('asset')}, chain={'all chains' if intent.get('chainId') is None else intent.get('chainId')}, minAPY={intent.get('minApy')}%, risk={intent.get('riskLevel')}

Top vaults found:
{vault_summaries}

Write 3 sentences explaining why these are good picks."""

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Reasoning generation failed: {e}")
        return (
            f"I found {len(vaults)} vault(s) matching your request for {intent.get('asset', 'USDC')}. "
            "These protocols offer competitive yields with solid TVL backing their liquidity. "
            "Click Deposit Now on any card to open Jumper Exchange and complete your deposit in one click."
        )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": GROQ_MODEL,
        "groq_key_set": bool(GROQ_API_KEY),
        "lifi_key_set": bool(LIFI_API_KEY),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured")

    # Step 1: Extract intent
    intent = await extract_intent(request.message)
    logger.info(f"Extracted intent: {intent}")

    asset = intent.get("asset", "USDC") or "USDC"
    chain_id = intent.get("chainId")
    min_apy = float(intent.get("minApy", 0) or 0)

    # Step 2: Fetch vaults from LI.FI
    try:
        raw_vaults = await fetch_vaults(asset, chain_id)
    except httpx.HTTPStatusError as e:
        logger.error(f"LI.FI API error: {e.response.status_code} — {e.response.text}")
        raise HTTPException(
            status_code=502,
            detail=f"LI.FI API returned {e.response.status_code}. Check your LIFI_API_KEY.",
        )
    except httpx.RequestError as e:
        logger.error(f"LI.FI request failed: {e}")
        raise HTTPException(status_code=502, detail="Could not reach LI.FI Earn API")

    logger.info(f"Raw vaults returned: {len(raw_vaults)}")

    # Step 3: Parse all vaults
    parsed = [v for raw in raw_vaults if (v := parse_vault(raw)) is not None]
    logger.info(f"Parsed vaults: {len(parsed)}")

    if parsed:
        sample = parsed[0]
        logger.info(f"Sample vault APY raw: {sample['apyRaw']} — display: {sample['apy']}")

    # Step 4: Filter by minApy (apyRaw is decimal, minApy is percentage)
    if min_apy > 0:
        filtered = [v for v in parsed if v["apyRaw"] * 100 >= min_apy]
        logger.info(f"After APY filter (>= {min_apy}%): {len(filtered)} vaults")
    else:
        filtered = parsed

    # Sort by APY descending and take top 3
    filtered.sort(key=lambda v: v["apyRaw"], reverse=True)
    top_vaults = filtered[:3]

    if not top_vaults:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No vaults found for {asset} with APY >= {min_apy}% on the requested chain(s). "
                "Try lowering your minimum APY or expanding to all chains."
            ),
        )

    # Step 5: Generate reasoning
    reasoning = await generate_reasoning(request.message, intent, top_vaults)

    # Step 6: Build response
    vault_results = [VaultResult(**v) for v in top_vaults]

    return ChatResponse(vaults=vault_results, reasoning=reasoning)
