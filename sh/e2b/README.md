# E2B

E2B managed sandboxes via the official E2B JavaScript SDK (`e2b`).

## Run

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/e2b/claude.sh)
```

Swap `claude.sh` with any supported agent script in this directory.

## Required environment

- `NEOSANTARA_API_KEY` — API key from `https://app.neosantara.xyz/api-keys`
- `E2B_API_KEY` — API key from E2B dashboard/docs

## Optional environment

- `E2B_SANDBOX_NAME` — set explicit sandbox name
- `E2B_TIMEOUT_MS` — sandbox timeout in milliseconds
- `E2B_DOMAIN` — custom E2B domain endpoint override
