# ClickShell - Firefox Extension

A Firefox browser extension that executes shell commands by clicking links with a configurable keyboard shortcut.

## Installation

### Option 1: Install from GitHub Release (.xpi file)

1. Download the latest `clickshell.xpi` from the [GitHub Releases](https://github.com/lamnguyenx/alter/releases) page
2. Open Firefox and go to `about:addons`
3. Click the gear icon (⚙️) > "Install Add-on From File"
4. Select the downloaded `clickshell.xpi`
5. If prompted, allow unsigned extensions (set `xpinstall.signatures.required` to `false` in `about:config` for development)

### Option 2: Load Temporarily from Source (Development Only)

1. Clone this repository: `git clone https://github.com/lamnguyenx/alter.git`
2. Open `about:debugging` in Firefox
3. Click "This Firefox" > "Load Temporary Add-on"
4. Select `manifest.json` from the cloned directory

**Note:** This installation is temporary and will be unloaded when Firefox restarts. Use for testing only.

## Usage

1. Set your keyboard modifier (Ctrl+Alt by default)
2. Configure your shell command in extension options (e.g., `open {{url}}`)
3. Hold the modifier and click any link
4. The command executes with the link URL

## Features

- Configurable shortcuts (Ctrl, Alt, Shift, Cmd combinations)
- Command templates for common tasks
- URL placeholders for flexible commands
- Live preview of executed commands
- Platform-aware defaults

## Security

This extension runs shell commands from clicked links. Use trusted commands only.
