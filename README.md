# Alt+Click Shell Command Firefox Extension

Execute shell commands when Alt+clicking links.

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

4. Configure command in addon options

## Usage

1. Set your desired shell command in the extension options (e.g., `open`, `xdg-open`, `echo`)
2. Alt+click any link on web pages
3. The command will execute with the link URL as an argument
4. A notification will briefly appear showing the command being run

## Security Warning

This extension executes arbitrary shell commands. Only use trusted commands and be cautious of malicious links.

## Files

- `manifest.json` - Extension manifest
- `content.js` - Click interception and UI notifications
- `background.js` - Native messaging communication
- `native_host.py` - Python script that executes shell commands
- `altclickshell.json` - Native messaging host manifest
- `options.html` - Settings page HTML
- `options.js` - Settings page logic
