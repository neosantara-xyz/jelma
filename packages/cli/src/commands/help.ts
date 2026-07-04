import pc from "picocolors";
import { REPO, SPAWN_CDN } from "../manifest.js";

function getHelpUsageSection(): string {
  return `${pc.bold("USAGE")}
  jelma Interactive agent + cloud picker
  jelma <agent> <cloud>              Launch agent on cloud directly
  jelma <agent> <cloud> --dry-run    Preview what would be provisioned (or -n)
  jelma <agent> <cloud> --zone <zone>  Set zone/region (works for all clouds)
  jelma <agent> <cloud> --size <type>  Set instance size/type (works for all clouds)
  jelma <agent> <cloud> --model <id>  Set the LLM model (e.g. openai/gpt-5.3-codex)
  jelma <agent> <cloud> --custom      Show interactive size/region pickers
  jelma <agent> <cloud> --fast        Enable all speed optimizations (images, tarballs, parallel)
  jelma <agent> <cloud> --headless   Provision and exit (no interactive session)
  jelma <agent> <cloud> --output json
                                     Headless mode with structured JSON on stdout
  jelma <agent> <cloud> --prompt "text"
                                     Execute agent with prompt (non-interactive)
  jelma <agent> <cloud> --prompt-file <file>  (or -f)
                                     Execute agent with prompt from file
  jelma <agent> <cloud> --config <file>
                                     Load all options from a JSON config file
  jelma <agent> <cloud> --steps <list>
                                     Comma-separated setup steps to enable
  jelma <agent>                      Interactive cloud picker for agent
  jelma <cloud>                      Show available agents for cloud
  jelma list                         Browse and rerun previous jelma instances (aliases: ls, history)
  jelma list <filter>                Filter history by agent or cloud name
  jelma list -a <agent>              Filter jelma history by agent (or --agent)
  jelma list -c <cloud>              Filter jelma history by cloud (or --cloud)
  jelma list --flat                  Show flat list (disable tree view)
  jelma list --json                  Output history as JSON
  jelma list --clear                 Clear all jelma history (requires --yes non-interactively)
  jelma delete                       Delete a previously spawned server (aliases: rm, destroy, kill)
  jelma delete -a <agent>            Filter servers by agent
  jelma delete -c <cloud>            Filter servers by cloud
  jelma delete --name <name> --yes   Headless delete by name (no prompts)
  jelma status                       Show live state of cloud servers (aliases: ps)
  jelma status -a <agent>            Filter status by agent (or --agent)
  jelma status -c <cloud>            Filter status by cloud (or --cloud)
  jelma status --prune               Remove gone servers from history
  jelma fix                          Full VM recovery (credentials, install, config, daemons)
  jelma fix <jelma-id>               Fix a specific jelma by name or ID
  jelma link <ip>                    Register an existing VM by IP (alias: reconnect)
  jelma link <ip> --agent <agent>    Specify the agent running on the VM
  jelma link <ip> --cloud <cloud>    Specify the cloud provider
  jelma last                         Instantly rerun the most recent jelma (alias: rerun)
  jelma matrix                       Full availability matrix (alias: m)
  jelma agents                       List all agents with descriptions
  jelma clouds                       List all cloud providers
  jelma tree                         Show recursive jelma tree (parent/child relationships)
  jelma tree --json                  Output jelma tree as JSON
  jelma history export               Dump history as JSON to stdout
  jelma feedback "message"            Send feedback to the Jelma team
  jelma uninstall                    Uninstall jelma CLI and optionally remove data
  jelma update                       Check for CLI updates
  jelma version                      Show version (or --version, -v)
  jelma help                         Show this help message (or --help, -h)`;
}

function getHelpExamplesSection(): string {
  return `${pc.bold("EXAMPLES")}
  jelma ${pc.dim("# Pick interactively")}
  jelma openclaw sprite              ${pc.dim("# Launch OpenClaw on Sprite")}
  jelma codex hetzner                ${pc.dim("# Launch Codex CLI on Hetzner Cloud")}
  jelma kilocode digitalocean        ${pc.dim("# Launch Kilo Code on DigitalOcean")}
  jelma claude sprite --prompt "Fix all linter errors"
                                     ${pc.dim("# Execute Claude with prompt and exit")}
  jelma codex sprite -p "Add tests"  ${pc.dim("# Short form of --prompt")}
  jelma openclaw aws -f instructions.txt
                                     ${pc.dim("# Read prompt from file (short for --prompt-file)")}
  jelma claude gcp --zone us-east1-b  ${pc.dim("# Use a specific GCP zone")}
  jelma claude gcp --size e2-standard-4
                                     ${pc.dim("# Use a specific machine type")}
  jelma codex gcp --model openai/gpt-5.3-codex
                                     ${pc.dim("# Override the default LLM model")}
  jelma claude sprite --fast           ${pc.dim("# Fastest provisioning (images + tarballs + parallel)")}
  jelma opencode gcp --dry-run       ${pc.dim("# Preview without provisioning")}
  jelma claude hetzner --headless    ${pc.dim("# Provision, print connection info, exit")}
  jelma claude hetzner --output json ${pc.dim("# Structured JSON output on stdout")}
  jelma codex gcp --config setup.json --headless --output json
                                     ${pc.dim("# Config file with headless JSON output")}
  jelma openclaw gcp --steps github,browser --headless
                                     ${pc.dim("# Only run specific setup steps")}
  jelma claude                       ${pc.dim("# Show which clouds support Claude")}
  jelma hetzner                      ${pc.dim("# Show which agents run on Hetzner")}
  jelma list                         ${pc.dim("# Browse history and pick one to rerun")}
  jelma list codex                   ${pc.dim("# Filter history by agent name")}
  jelma last                         ${pc.dim("# Instantly rerun the most recent jelma instance")}
  jelma matrix                       ${pc.dim("# See the full agent x cloud matrix")}`;
}

function getHelpAuthSection(): string {
  return `${pc.bold("AUTHENTICATION")}
  All agents use Neosantara for LLM access. Get your API key at:
  ${pc.cyan("https://app.neosantara.xyz/api-keys")}

  For non-interactive use, set environment variables:
  ${pc.dim("NEOSANTARA_API_KEY")}=sk-or-v1-... jelma claude sprite

  Each cloud provider has its own auth requirements.
  Run ${pc.cyan("jelma <cloud>")} to see setup instructions for a specific provider.`;
}

function getHelpInstallSection(): string {
  return `${pc.bold("INSTALL")}
  curl -fsSL ${SPAWN_CDN}/cli/install.sh | bash`;
}

function getHelpTroubleshootingSection(): string {
  return `${pc.bold("TROUBLESHOOTING")}
  ${pc.dim("*")} Script not found: Run ${pc.cyan("jelma matrix")} to verify the combination exists
  ${pc.dim("*")} Missing credentials: Run ${pc.cyan("jelma <cloud>")} to see setup instructions
  ${pc.dim("*")} Update issues: Try ${pc.cyan("jelma update")} or reinstall manually
  ${pc.dim("*")} Garbled unicode: Set ${pc.cyan("JELMA_NO_UNICODE=1")} for ASCII-only output
  ${pc.dim("*")} Missing unicode over SSH: Set ${pc.cyan("JELMA_UNICODE=1")} to force unicode on
  ${pc.dim("*")} Slow startup: Set ${pc.cyan("JELMA_NO_UPDATE_CHECK=1")} to skip auto-update`;
}

function getHelpEnvVarsSection(): string {
  return `${pc.bold("ENVIRONMENT VARIABLES")}
  ${pc.cyan("NEOSANTARA_API_KEY")}        Neosantara API key (all agents require this)
  ${pc.cyan("MODEL_ID")}                  Override agent's default LLM model (or use --model flag)
  ${pc.cyan("JELMA_NO_UPDATE_CHECK=1")}   Skip auto-update check on startup
  ${pc.cyan("JELMA_NO_UNICODE=1")}        Force ASCII output (no unicode symbols)
  ${pc.cyan("JELMA_UNICODE=1")}           Force Unicode output (override auto-detection)
  ${pc.cyan("JELMA_HOME")}                Override jelma data directory (default: ~/.jelma)
  ${pc.cyan("JELMA_DEBUG=1")}             Show debug output (unicode detection, etc.)
  ${pc.cyan("JELMA_ENABLED_STEPS")}       Comma-separated setup steps (set by --steps/--config)
  ${pc.cyan("TELEGRAM_BOT_TOKEN")}       Telegram bot token for non-interactive setup
  ${pc.cyan("JELMA_HEADLESS=1")}          Set automatically in --headless mode (for scripts)
  ${pc.cyan("JELMA_CUSTOM=1")}           Set automatically in --custom mode (show size/region pickers)`;
}

function getHelpFooterSection(): string {
  return `${pc.bold("MORE INFO")}
  Repository:  https://github.com/${REPO}
  Neosantara Dashboard:  https://app.neosantara.xyz
  Neosantara API:        https://api.neosantara.xyz`;
}

export function cmdHelp(): void {
  const sections = [
    "",
    `${pc.bold("jelma")} -- Launch any AI coding agent on any cloud`,
    "",
    getHelpUsageSection(),
    "",
    getHelpExamplesSection(),
    "",
    getHelpAuthSection(),
    "",
    getHelpInstallSection(),
    "",
    getHelpTroubleshootingSection(),
    "",
    getHelpEnvVarsSection(),
    "",
    getHelpFooterSection(),
  ];
  console.log(sections.join("\n"));
}
