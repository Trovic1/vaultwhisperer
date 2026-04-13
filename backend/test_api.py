import httpx
import json

resp = httpx.get(
    "https://earn.li.fi/v1/earn/vaults?sortBy=apy&limit=2&asset=USDC",
    headers={"x-lifi-api-key": "6d4124da-6dfa-4141-b3e1-4561670c5e35.27835f37-5424-4a0e-9f62-d7e008a2eb9c", "Accept": "application/json"}
)
print(json.dumps(resp.json(), indent=2))
