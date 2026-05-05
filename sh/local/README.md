# Local Machine

Run agents directly on your local machine without any cloud provisioning.

> No server creation or destruction. Installs agents and injects Neosantara credentials locally. Useful for local development and testing.

## Quick Start

If you have the [spawn CLI](https://github.com/neosantara-xyz/jelma) installed:

```bash
spawn claude local
spawn openclaw local
spawn codex local
spawn opencode local
spawn kilocode local
spawn hermes local
spawn junie local
spawn cursor local
spawn pi local
spawn t3code local
```

Or run directly without the CLI:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/claude.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/openclaw.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/codex.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/opencode.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/kilocode.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/hermes.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/junie.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/cursor.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/pi.sh)
bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/t3code.sh)
```

## Non-Interactive Mode

```bash
NEOSANTARA_API_KEY=sk-or-v1-xxxxx \
  bash <(curl -fsSL https://raw.githubusercontent.com/neosantara-xyz/jelma/neosantara/sh/local/claude.sh)
```

## What It Does

Local scripts will:
- Install the agent if not already present
- Obtain an Neosantara API key (via OAuth or environment variable)
- Append environment variables to `~/.zshrc` for the agent to use
- Launch the agent

No cloud servers are created or destroyed.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEOSANTARA_API_KEY` | Neosantara API key (prompted via OAuth if not set) |
| `SPAWN_PROMPT` | If set, runs the agent non-interactively with this prompt |
