# ClickShell - Firefox Extension

A Firefox browser extension that executes shell commands by clicking links with a configurable keyboard shortcut.

**Requirement:** Firefox Developer Edition is required to use this extension.

## Installation

### Option 1: Install from GitHub Release (.xpi file)

1. Download the latest `clickshell.xpi` from the [GitHub Releases](https://github.com/lamnguyenx/alter/releases) page
2. Open Firefox and go to `about:addons`
3. Click the gear icon (⚙️) > "Install Add-on From File"
4. Select the downloaded `clickshell.xpi`
5. If prompted, allow unsigned extensions (set `xpinstall.signatures.required` to `false` in `about:config` for development)
6. Run the setup script to configure the native messaging host:
   ```bash
   python3 setup.py
   ```

### Option 2: Load Temporarily from Source (Development Only)

1. Clone this repository: `git clone https://github.com/lamnguyenx/alter.git`
2. Open `about:debugging` in Firefox
3. Click "This Firefox" > "Load Temporary Add-on"
4. Select `manifest.json` from the cloned directory

**Note:** This installation is temporary and will be unloaded when Firefox restarts. Use for testing only.

## Usage

### Via Keyboard Shortcut
1. Set your keyboard modifier (Ctrl+Alt by default)
2. Configure your shell command in extension options (e.g., `open {{url}}`)
3. Hold the modifier and click any link
4. The command executes with the link URL

### Via Context Menu
1. Right-click any link in a webpage
2. Select "Open Link via Clickshell"
3. A popup notification shows the command being executed
4. The command executes with that specific link URL

### Via Page Context Menu
1. Right-click anywhere on a page
2. Select "Open Page via Clickshell"
3. The command executes with the current page URL

## Features

- **Configurable shortcuts** - Ctrl, Alt, Shift, Cmd combinations
- **Command templates** - Pre-configured commands for common tasks
- **URL placeholders** - Use `{{url}}` to insert the link URL dynamically
- **Live preview** - See exactly what command will execute before saving
- **Platform-aware defaults** - Automatically detects Mac vs. Windows/Linux (Cmd vs. Ctrl)
- **Explicit save button** - Review changes before saving, no silent auto-save
- **Default template on install** - Automatically sets Firefox Android ADB as default command on first install
- **Context menu integration** - Right-click on links or pages to execute commands
- **Popup feedback** - Visual notifications when commands execute, including the actual command and URL
- **Error handling** - Clear error messages if something goes wrong

## Security

This extension runs shell commands from clicked links. Use trusted commands only.
