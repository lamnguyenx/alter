# Alt Click Shell Command

Execute shell commands by clicking links with a configurable keyboard shortcut.

## Installation

Install from the [Firefox Add-ons](https://addons.mozilla.org/) site (coming soon) or load temporarily for development:

1. Download/clone this repository
2. Open `about:debugging` in Firefox
3. Click "This Firefox" > "Load Temporary Add-on"
4. Select `manifest.json`

For full functionality, install the native messaging host (see [CONTRIBUTE.md](CONTRIBUTE.md) for details).

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
