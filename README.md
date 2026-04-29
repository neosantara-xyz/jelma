# Jelma

Launch any AI agent on any cloud with a single command. Coding agents, research agents, self-hosted AI tools — Jelma deploys them all. All models powered by Neosantara. (ALPHA software, use at your own risk!)

**9 agents. 7 clouds. 63 working combinations. Zero config.**

## Install

**macOS / Linux — and Windows users inside a WSL2 terminal (Ubuntu, Debian, etc.):**
```bash
curl -fsSL https://raw.githubusercontent.com/jelmaai/jelma/main/sh/cli/install.sh | bash
```

**Windows PowerShell (outside WSL):**
```powershell
irm https://raw.githubusercontent.com/jelmaai/jelma/main/sh/cli/install.ps1 | iex
```

## Usage

```bash
jelma # Interactive picker
jelma <agent> <cloud>         # Launch directly
jelma matrix                  # Show the full agent x cloud matrix
```

### Examples

```bash
jelma # Interactive picker
jelma claude sprite                      # Claude Code on Sprite
jelma codex hetzner                      # Codex CLI on Hetzner
jelma claude sprite --prompt "Fix bugs"  # Non-interactive with prompt
jelma codex sprite -p "Add tests"        # Short form
jelma claude                             # Show clouds available for Claude
jelma delete                             # Delete a running server
jelma delete -c hetzner                  # Delete a server on Hetzner
```

### Commands

| Command | Description |
|---------|-------------|
| `jelma` | Interactive agent + cloud picker |
| `jelma <agent> <cloud>` | Launch agent on cloud directly |
| `jelma <agent> <cloud> --dry-run` | Preview without provisioning |
| `jelma <agent> <cloud> --zone <zone>` | Set zone/region for the cloud |
| `jelma <agent> <cloud> --size <type>` | Set instance size/type for the cloud |
| `jelma <agent> <cloud> --prompt "text"` | Non-interactive with prompt (or `-p`) |
| `jelma <agent> <cloud> --prompt-file <file>` | Prompt from file (or `-f`) |
| `jelma <agent> <cloud> --headless` | Provision and exit (no interactive session) |
| `jelma <agent> <cloud> --output json` | Headless mode with structured JSON on stdout |
| `jelma <agent> <cloud> --model <id>` | Set the model ID (overrides agent default) |
| `jelma <agent> <cloud> --config <file>` | Load options from a JSON config file |
| `jelma <agent> <cloud> --steps <list>` | Comma-separated setup steps to enable |
| `jelma <agent> <cloud> --custom` | Show interactive size/region pickers |
| `jelma <agent>` | Show available clouds for an agent |
| `jelma <cloud>` | Show available agents for a cloud |
| `jelma matrix` | Full agent x cloud matrix |
| `jelma list` | Browse and rerun previous jelma instances |
| `jelma list <filter>` | Filter history by agent or cloud name |
| `jelma list -a <agent>` | Filter history by agent |
| `jelma list -c <cloud>` | Filter history by cloud |
| `jelma list --flat` | Show flat list (disable tree view) |
| `jelma list --json` | Output history as JSON |
| `jelma list --clear` | Clear all jelma history |
| `jelma tree` | Show recursive jelma tree (parent/child relationships) |
| `jelma tree --json` | Output jelma tree as JSON |
| `jelma history export` | Dump history as JSON to stdout (used by parent VMs) |
| `jelma fix` | Re-run agent setup on an existing VM (re-inject credentials, reinstall) |
| `jelma fix <jelma-id>` | Fix a specific jelma by name or ID |
| `jelma link <ip>` | Register an existing VM by IP |
| `jelma link <ip> --agent <agent>` | Specify the agent running on the VM |
| `jelma link <ip> --cloud <cloud>` | Specify the cloud provider |
| `jelma last` | Instantly rerun the most recent jelma |
| `jelma agents` | List all agents with descriptions |
| `jelma clouds` | List all cloud providers |
| `jelma feedback "message"` | Send feedback to the Jelma team |
| `jelma uninstall` | Uninstall jelma CLI and optionally remove data |
| `jelma update` | Check for CLI updates |
| `jelma delete` | Interactively select and destroy a cloud server |
| `jelma delete -a <agent>` | Filter servers to delete by agent |
| `jelma delete -c <cloud>` | Filter servers to delete by cloud |
| `jelma delete --name <name> --yes` | Headless delete by name (no prompts) |
| `jelma status` | Show live state of cloud servers |
| `jelma status -a <agent>` | Filter status by agent |
| `jelma status -c <cloud>` | Filter status by cloud |
| `jelma status --prune` | Remove gone servers from history |
| `jelma help` | Show help message |
| `jelma version` | Show version |

#### Config File

The `--config` flag loads options from a JSON file. CLI flags override config values.

```json
{
  "model": "openai/gpt-5.3-codex",
  "steps": ["github", "browser", "telegram"],
  "name": "my-dev-box",
  "setup": {
    "telegram_bot_token": "123456:ABC-DEF...",
    "github_token": "ghp_xxxx"
  }
}
```

```bash
jelma codex gcp --config setup.json --headless --output json
```

#### Setup Steps

Control which optional setup steps run with `--steps`:

```bash
jelma openclaw gcp --steps github,browser     # Only GitHub + Chrome
jelma claude gcp --steps ""                    # Skip all optional steps
```

Available steps vary by agent:

| Step | Agents | Description |
|------|--------|-------------|
| `github` | All | GitHub CLI + git identity |
| `reuse-api-key` | All | Reuse saved Neosantara key |
| `browser` | openclaw | Chrome browser (~400 MB) |
| `telegram` | openclaw | Telegram bot (set `TELEGRAM_BOT_TOKEN` for non-interactive) |
| `whatsapp` | openclaw | WhatsApp linking (interactive QR scan, skipped in headless) |

#### Fast Mode

Use `--fast` for significantly faster deploys. Enables all speed optimizations:

```bash
jelma claude hetzner --fast
```

What `--fast` does:
- **Parallel boot**: server creation runs concurrently with API key prompt and account checks
- **Tarballs**: installs agents from pre-built tarballs instead of live install
- **Skip cloud-init**: for lightweight agents (Claude, OpenCode, Hermes), skips the package install wait since the base OS already has what's needed
- **Snapshots**: uses pre-built cloud images when available (Hetzner, DigitalOcean)

#### Beta Features

Individual optimizations can be enabled separately with `--beta <feature>`. The flag is repeatable:

```bash
jelma claude gcp --beta tarball --beta parallel
```

| Feature | Description |
|---------|-------------|
| `tarball` | Use pre-built tarball for agent install (faster, skips live install) |
| `images` | Use pre-built cloud images/snapshots (faster boot) |
| `parallel` | Parallelize server boot with setup prompts |
| `recursive` | Install jelma CLI on VM so it can jelma child VMs |
| `sandbox` | Run local agents in a Docker container (sandboxed) |

`--fast` enables `tarball`, `images`, and `parallel` (not `recursive` or `sandbox`).

#### Recursive Jelma

Use `--beta recursive` to let spawned VMs create their own child VMs:

```bash
jelma claude hetzner --beta recursive
```

What this does:
- **Installs jelma CLI** on the remote VM
- **Delegates credentials** (cloud + Neosantara) so child VMs can authenticate
- **Injects parent tracking** (`SPAWN_PARENT_ID`, `SPAWN_DEPTH`) into the VM environment
- **Passes `--beta recursive`** to children so they can also jelma recursively

View the jelma tree:
```bash
jelma tree
# jelma-abc  Claude Code / Hetzner  2m ago
#   ├─ jelma-def  Codex CLI / Hetzner  1m ago
#   └─ jelma-ghi  OpenClaw / Hetzner  30s ago
#       └─ jelma-jkl  Claude Code / Hetzner  10s ago
```

Tear down an entire tree:
```bash
jelma delete --cascade <id>    # Delete a VM and all its children
```

#### Sandboxed Local

Use `--beta sandbox` to run local agents inside a Docker container instead of directly on your machine:

```bash
jelma claude local --beta sandbox
```

What this does:
- **Pulls the agent's Docker image** from `ghcr.io/jelmaai/jelma-<agent>`
- **Runs the agent in a container** with filesystem, network, and process isolation
- **Auto-installs Docker** if not present (OrbStack on macOS, docker.io on Linux)
- **Cleans up the container** automatically when the session ends

In the interactive picker, `--beta sandbox` adds a "Local Machine (Sandboxed)" option alongside the regular "Local Machine":

```bash
jelma --beta sandbox           # Interactive picker shows both local options
jelma openclaw local --beta sandbox   # Direct launch, sandboxed
```

### Without the CLI

Every combination works as a one-liner — no install required:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/jelmaai/jelma/main/sh/{cloud}/{agent}.sh)
```

### Non-Interactive Mode

Skip prompts by providing environment variables:

```bash
# Neosantara API key (required for all agents)
export NEOSANTARA_API_KEY=sk-or-v1-xxxxx

# Cloud-specific credentials (varies by provider)
# Note: Sprite uses `sprite login` for authentication
export HCLOUD_TOKEN=...           # For Hetzner
export DIGITALOCEAN_ACCESS_TOKEN=...  # For DigitalOcean

# Run non-interactively
jelma claude hetzner
```

You can also use inline environment variables:

```bash
NEOSANTARA_API_KEY=sk-or-v1-xxxxx jelma claude sprite
```

Get your Neosantara API key at: https://app.neosantara.xyz/api-keys

For cloud-specific auth, see each cloud's README in this repository.

## Troubleshooting

### Installation issues

If jelma fails to install, try these steps:

1. **Check bun version**: jelma requires bun >= 1.2.0
   ```bash
   bun --version
   bun upgrade  # if needed
   ```

2. **Manual installation**: If auto-install fails, install bun first
   ```bash
   curl -fsSL https://bun.sh/install | bash
   source ~/.bashrc  # or ~/.zshrc for zsh
   curl -fsSL https://raw.githubusercontent.com/jelmaai/jelma/main/sh/cli/install.sh | bash
   ```

3. **PATH issues**: If `jelma` command not found after install
   ```bash
   # Add to your shell config (~/.bashrc or ~/.zshrc)
   export PATH="$HOME/.local/bin:$PATH"
   ```

### Windows (PowerShell)

1. **Use the PowerShell installer** — not the bash one:
   ```powershell
   irm https://raw.githubusercontent.com/jelmaai/jelma/main/sh/cli/install.ps1 | iex
   ```
   The `.ps1` extension is required. The default `install.sh` is bash and won't work in PowerShell.

2. **Set credentials via environment variables** before launching:
   ```powershell
   $env:NEOSANTARA_API_KEY = "sk-or-v1-xxxxx"
   $env:DIGITALOCEAN_ACCESS_TOKEN = "dop_v1_xxxxx"  # For DigitalOcean
   $env:HCLOUD_TOKEN = "xxxxx"              # For Hetzner
   jelma openclaw digitalocean
   ```

3. **Local build failures during auto-update** are normal on Windows — the CLI falls back to a pre-built binary automatically. You may see a brief build error followed by a successful update.

4. **EISDIR or EEXIST errors on config files**: If you see errors about `digitalocean.json` being a directory, delete it:
   ```powershell
   Remove-Item -Recurse -Force "$HOME\.config\jelma\digitalocean.json" -ErrorAction SilentlyContinue
   jelma openclaw digitalocean
   ```

### Headless JSON mode — agent exits immediately

When using `--headless --output json` with Claude Code, you must also pass `--prompt` (or `-p`). Without it, Claude exits with `Input must be provided through stdin or --prompt` and the JSON output will show `"status":"error"`:

```bash
# WRONG — Claude exits immediately
jelma claude gcp --headless --output json

# RIGHT — provide a prompt
jelma claude gcp --headless --output json --prompt "Fix all linter errors"
```

Note: auto-update messages may appear before the JSON on older CLI versions. Run `jelma update` to get the fix.

### Agent launch failures

If an agent fails to install or launch on a cloud:

1. **Check credentials**: Ensure cloud provider credentials are set
   ```bash
   # Example for Hetzner
   export HCLOUD_TOKEN=your-token-here
   jelma claude hetzner
   ```

2. **Try a different cloud**: Some clouds may have temporary issues
   ```bash
   jelma <agent>  # Interactive picker to choose another cloud
   ```

3. **Use --dry-run**: Preview what jelma will do before provisioning
   ```bash
   jelma claude hetzner --dry-run
   ```

4. **Check cloud status**: Visit your cloud provider's status page
   - Many failures are transient (network timeouts, package mirror issues)
   - Retrying often succeeds

### Getting help

- **View command history**: `jelma list` shows all previous launches
- **Rerun last session**: `jelma last` or `jelma rerun`
- **Check version**: `jelma version` shows CLI version and cache status
- **Update jelma**: `jelma update` checks for the latest version
- **Report bugs**: Open an issue at https://github.com/jelmaai/jelma/issues

## Matrix

| | [Local Machine](sh/local/) | [Hetzner Cloud](sh/hetzner/) | [AWS Lightsail](sh/aws/) | [DigitalOcean](sh/digitalocean/) | [GCP Compute Engine](sh/gcp/) | [Daytona](sh/daytona/) | [Sprite](sh/sprite/) |
|---|---|---|---|---|---|---|---|
| [**Claude Code**](https://claude.ai) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**OpenClaw**](https://github.com/openclaw/openclaw) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Codex CLI**](https://github.com/openai/codex) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**OpenCode**](https://github.com/sst/opencode) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Kilo Code**](https://github.com/Kilo-Org/kilocode) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Hermes Agent**](https://github.com/NousResearch/hermes-agent) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Junie**](https://www.jetbrains.com/junie/) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Cursor CLI**](https://cursor.com/cli) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| [**Pi**](https://pi.dev) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### How it works

Each cell in the matrix is a self-contained bash script that:

1. Provisions a server on the cloud provider
2. Installs the agent
3. Injects your Neosantara API key so every agent uses the same billing
4. Drops you into an interactive session

Scripts work standalone (`bash <(curl ...)`) or through the CLI.

## Development

```bash
git clone https://github.com/jelmaai/jelma.git
cd jelma git config core.hooksPath .githooks
```

### Structure

```
sh/{cloud}/{agent}.sh     # Agent deployment script (thin bash → bun wrapper)
packages/cli/             # TypeScript CLI — all provisioning logic (bun)
manifest.json             # Source of truth for the matrix
```

### Adding a new cloud

1. Add cloud-specific TypeScript module in `packages/cli/src/{cloud}/`
2. Add to `manifest.json`
3. Implement agent scripts
4. See [CLAUDE.md](CLAUDE.md) for full contributor guide

### Adding a new agent

1. Add to `manifest.json`
2. Implement on 1+ cloud by adapting an existing agent script
3. Must support Neosantara via env var injection

## Contributing

The easiest way to contribute is by testing and reporting issues. You don't need to write code.

### Test a cloud provider

Pick any agent + cloud combination from the matrix and try it out:

```bash
jelma claude hetzner      # or any combination
```

If something breaks, hangs, or behaves unexpectedly, open an issue using the [bug report template](https://github.com/jelmaai/jelma/issues/new?template=bug_report.yml). Include:

- The exact command you ran
- The cloud provider and agent
- What happened vs. what you expected
- Any error output

### Request a cloud or agent

Want to see a specific cloud provider or agent supported? Use the dedicated templates:

- [Request a cloud provider](https://github.com/jelmaai/jelma/issues/new?template=cloud_request.yml)
- [Request an agent](https://github.com/jelmaai/jelma/issues/new?template=agent_request.yml)
- [Request a CLI feature](https://github.com/jelmaai/jelma/issues/new?template=cli_feature_request.yml)

Requests with real-world use cases get prioritized.

### Report auth or credential issues

Cloud provider APIs change frequently. If you hit authentication failures, expired tokens, or permission errors on a provider that previously worked, please report it — these are high-priority fixes.

### Code contributions

See [CLAUDE.md](CLAUDE.md) for the full contributor guide covering shell script rules, testing, and the shared library pattern.

## License

[Apache 2.0](LICENSE)
