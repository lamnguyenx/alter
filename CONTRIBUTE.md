# Configurable Click Shell Command Firefox Extension

Execute shell commands when using a configurable keyboard shortcut + clicking links.

## Installation

1. Download/clone this repository
2. Install the extension temporarily:
   - Open `about:debugging`
   - Click "This Firefox" > "Load Temporary Add-on"
   - Select `manifest.json` (in the root directory)

3. Install native messaging host:

   **macOS:**
   - Edit `altclickshell.json` to point to the absolute path of `native_host.py`
   - Place `altclickshell.json` in: `~/Library/Application Support/Mozilla/NativeMessagingHosts/`
   - Make `native_host.py` executable: `chmod +x native_host.py`

   **Windows:**
   - Edit `altclickshell.json` path to point to `native_host.py`
   - Create registry key: `HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\altclickshell`
   - Set default value to path of `altclickshell.json`

   **Linux:**
   - Place `altclickshell.json` in: `~/.mozilla/native-messaging-hosts/`
   - Make `native_host.py` executable: `chmod +x native_host.py`

4. Configure command and shortcut in addon options (settings are saved automatically)

## Usage

1. Configure your preferred keyboard modifier combination (default: Ctrl+Alt on Windows/Linux, Cmd+Alt on Mac)
2. Set your desired shell command in the extension options (e.g., `open`, `xdg-open`, `echo`)
3. Use `{{url}}` in your command to insert the clicked link URL (or it will be appended at the end)
4. Choose from command templates or enter custom commands
5. Click any link using your configured shortcut
6. The command will execute with the link URL as an argument
7. A notification will briefly appear showing the command being run

## Features

- **Configurable Shortcuts**: Choose any combination of Ctrl, Alt, Shift, Meta/Cmd keys
- **Command Templates**: Pre-built templates for common tasks (e.g., sending links to Android via ADB)
- **URL Placeholders**: Use `{{url}}` in commands for flexible URL placement with visual indicators
- **Live Preview**: See exactly what command will execute before saving
- **Smart Banner**: Warns when `{{url}}` is missing from commands
- **Platform Aware**: Automatically adjusts default shortcuts for Windows/Mac/Linux

## Security Warning

This extension executes arbitrary shell commands when you use the configured shortcut + click links. Only use trusted commands and be cautious of malicious links.

## Files

- `manifest.json` - Extension manifest
- `content.js` - Click interception and UI notifications
- `background.js` - Native messaging communication
- `native_host.py` - Python script that executes shell commands
- `altclickshell.json` - Native messaging host manifest
- `options.html` - Settings page HTML
- `options.js` - Settings page logic
