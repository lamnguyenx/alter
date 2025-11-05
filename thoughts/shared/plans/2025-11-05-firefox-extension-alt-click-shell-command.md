# Firefox Extension: Configurable Click Shell Command Implementation Plan

## Overview

Create a Firefox WebExtensions addon that intercepts configurable keyboard modifier + click events on links and executes a configurable shell command on the host machine with the link URL as an argument. The extension includes a settings page for command configuration, keyboard shortcut configuration, and testing.

## Current State Analysis

**Technical Foundation:**
- Firefox WebExtensions API supports content scripts for click interception
- Native messaging enables secure communication with host executables
- Storage API provides persistent settings management
- No existing codebase; starting from scratch

**Key Constraints:**
- **WebExtensions Security Model**: Extensions run in a sandboxed environment and cannot directly execute shell commands on the host machine. The native messaging API is the only approved way to communicate with host executables.
- **Why Python (not TypeScript)**: The extension code (TypeScript/JavaScript) runs within Firefox's browser process. To execute shell commands, we need a separate native application that can access the host OS. This native app must handle stdin/stdout communication with the extension and execute subprocess calls.
- Extension must be installed as temporary addon for development
- Native app installation varies by OS (registry on Windows, JSON file on macOS/Linux)

**Security Considerations:**
- This implementation allows arbitrary shell command execution
- Users must understand the risks of malicious links/commands
- No command validation or sandboxing included

## Desired End State

A fully functional Firefox extension that:
- Captures configurable modifier + click on any hyperlink
- Executes user-configured shell command with link URL
- Provides settings UI for command input, keyboard shortcut configuration, and testing
- Works across all websites with proper permissions

### Key Deliverables:
- Extension manifest with all required permissions
- Content script for configurable click interception
- Background script for native messaging
- Native messaging application (Python/Node.js)
- Settings/options page with command input, keyboard shortcut configuration, and test button
- Installation instructions for different platforms

## What We're NOT Doing

- Command validation or security restrictions
- Confirmation dialogs before execution
- Command whitelisting or sandboxing
- Cross-browser compatibility (Firefox-only)
- Advanced error handling beyond basic logging

## Implementation Approach

Use native messaging architecture: extension communicates with native host application that executes shell commands. Keep implementation simple with direct command execution.

## Phase 1: Extension Foundation

### Overview
Set up basic WebExtensions structure with manifest, content scripts, and background scripts.

### Changes Required:

#### 1. Create Extension Manifest (`manifest.json`)
**File**: `manifest.json`
**Changes**: Create new file with WebExtensions manifest

```json
{
  "manifest_version": 2,
  "name": "Configurable Click Shell Command",
  "version": "0.0.1",
  "description": "Execute shell commands on configurable modifier + click links",

  "permissions": [
    "storage",
    "nativeMessaging",
    "activeTab"
  ],

  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],

  "background": {
    "scripts": ["background.js"]
  },

  "options_ui": {
    "page": "options.html"
  },

  "browser_specific_settings": {
    "gecko": {
      "id": "altclickshell@example.com"
    }
  }
}
```

#### 2. Create Content Script (`content.js`)
**File**: `content.js`
**Changes**: Create new file to intercept configurable modifier + click events

```javascript
// Create floating notification function
function showCommandNotification(command, url) {
// Remove existing notification if any
const existing = document.getElementById('altclick-notification');
if (existing) existing.remove();

// Create notification element
const notification = document.createElement('div');
  notification.id = 'altclick-notification';
  notification.textContent = `Running: ${command} ${url}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: #fff;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Load shortcut configuration with platform-aware defaults
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
let shortcutConfig = {
  ctrl: isMac ? false : true,
  alt: true,
  shift: false,
  meta: isMac ? true : false
};

browser.storage.local.get('shortcutConfig').then((result) => {
  if (result.shortcutConfig) {
    shortcutConfig = result.shortcutConfig;
  }
});

// Function to check if current modifiers match configured shortcut
function modifiersMatch(e) {
  return (
    e.ctrlKey === shortcutConfig.ctrl &&
    e.altKey === shortcutConfig.alt &&
    e.shiftKey === shortcutConfig.shift &&
    e.metaKey === shortcutConfig.meta
  );
}

// Function to handle configurable modifier + click
function handleShortcutClick(e) {
  if (modifiersMatch(e) && e.target.tagName === 'A') {
    e.preventDefault();
    e.stopImmediatePropagation();

    const url = e.target.href;

    // Get the current command to show in notification
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
      showCommandNotification(command, url);
    });

    browser.runtime.sendMessage({ action: 'executeCommand', url: url });
  }
}

// Listen for both mousedown and click events with capturing
document.addEventListener('mousedown', handleShortcutClick, true);
document.addEventListener('click', handleShortcutClick, true);
```

#### 3. Create Background Script (`background.js`)
**File**: `background.js`
**Changes**: Create new file for native messaging

```javascript
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      let command = result.shellCommand || 'echo';
      // Replace {url} placeholder or append URL if no placeholder
      if (command.includes('{url}')) {
        command = command.replace(/\{url\}/g, message.url);
      } else {
        command = `${command} ${message.url}`;
      }
      browser.runtime.sendNativeMessage('altclickshell', {
        command: command,
        url: message.url
      });
    });
  }
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Extension loads without errors: Check browser console for manifest validation
- [ ] Content script injects: `about:debugging` shows content script attached
- [ ] Background script runs: `about:debugging` shows background script active

#### Manual Verification:
- [ ] Extension appears in `about:addons`
- [ ] No console errors on page load
- [ ] Settings page accessible via addon options

## Phase 2: Native Messaging Setup

### Overview
Create native messaging host application that receives commands from extension and executes them.

### Changes Required:

#### 1. Create Native App (`native_host.py`)
**File**: `native_host.py`
**Changes**: Create Python script for native messaging

```python
#!/usr/bin/env python3

import sys
import json
import struct
import subprocess

def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('@I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('@I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def execute_command(command, url):
    try:
        full_command = f"{command} {url}"
        result = subprocess.run(full_command, shell=True, capture_output=True, text=True)
        return {
            'success': True,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

while True:
    try:
        message = get_message()
        result = execute_command(message['command'], message['url'])
        send_message(result)
    except Exception as e:
        send_message({'success': False, 'error': str(e)})
```

#### 2. Create Native App Manifest (`altclickshell.json`)
**File**: `altclickshell.json`
**Changes**: Create native messaging manifest

```json
{
  "name": "altclickshell",
  "description": "Configurable Click Shell Command Host",
  "path": "/path/to/native_host.py",
  "type": "stdio",
  "allowed_extensions": ["altclickshell@example.com"]
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Python script runs: `python3 native_host.py` (manual test input/output)
- [ ] Native manifest valid JSON: `python3 -m json.tool altclickshell.json`

#### Manual Verification:
- [ ] Native app responds to test messages
- [ ] Shell commands execute correctly with URL arguments
- [ ] Error handling works for invalid commands

## Phase 3: Settings Page

### Overview
Implement options page for command configuration and testing.

### Changes Required:

#### 1. Create Options HTML (`options.html`)
**File**: `options.html`
**Changes**: Create settings page

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .form-group { margin: 20px 0; }
    label { display: block; margin-bottom: 5px; }
    input[type="text"], textarea { width: 100%; padding: 8px; font-family: inherit; }
    textarea { resize: vertical; }
    button { padding: 8px 16px; margin: 5px; }
    .result { margin-top: 10px; padding: 10px; background: #f0f0f0; }
    .shortcut-group { display: flex; gap: 10px; align-items: center; }
    .shortcut-group label { margin: 0; display: inline; }
    .command-preview { display: flex; justify-content: space-between; align-items: flex-start; background: #f9f9f9; padding: 8px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
    .command-preview span { flex: 1; margin-right: 10px; }
    .command-preview button { flex-shrink: 0; }
  </style>
</head>
<body>
  <h1>Configurable Click Shell Command Settings</h1>

  <div class="form-group">
    <label>Keyboard Modifiers:</label>
    <div class="shortcut-group">
      <label><input type="checkbox" id="ctrl"> <span id="ctrl-label">Ctrl</span></label>
      <label><input type="checkbox" id="alt"> Alt</label>
      <label><input type="checkbox" id="shift"> Shift</label>
      <label><input type="checkbox" id="meta"> <span id="meta-label">Meta</span></label>
    </div>
    <small>Select the modifier keys to combine with click</small>
  </div>

  <div class="form-group">
  <label for="templates">Command Templates:</label>
  <select id="templates">
    <option value="adb shell am start -n org.mozilla.firefox/org.mozilla.fenix.IntentReceiverActivity -a android.intent.action.VIEW -d {{url}}" selected>Send link to Firefox on Android via ADB</option>
  <option value="">-- Select a template --</option>
  </select>
  </div>

  <div class="form-group">
  <label for="command">Shell Command:</label>
  <textarea id="command" placeholder="e.g., open" rows="6" style="width: 100%; resize: vertical; max-height: 120px; overflow-y: auto;"></textarea>
  <small>The command will be executed with the link URL as the last argument. Use <strong style="color: #8B0000;">{{url}}</strong> for URL placeholder.</small>
  <div id="url-placeholder-banner" class="banner" style="display: none; background: #ffe6e6; color: #8B0000; padding: 5px; margin-top: 5px; border-radius: 3px; font-size: 14px;">⚠️ Your command does not contain <strong>{{url}}</strong>. The clicked link URL will be appended at the end.</div>
  </div>

  <div class="form-group">
  <label for="preview-url">Preview URL:</label>
  <input type="text" id="preview-url" placeholder="https://example.com">
  <small>URL used for command preview (does not affect actual execution)</small>
  </div>

  <div class="form-group">
    <label>Command Preview:</label>
    <div class="command-preview">
      <span id="preview-command">echo 'https://example.com'</span>
      <button id="run-now">Run Now</button>
    </div>
  </div>

  <button id="run-now">Run Now</button>

  <div id="result" class="result" style="display: none;"></div>

  <script src="options.js"></script>
</body>
</html>
```

#### 2. Create Options Script (`options.js`)
**File**: `options.js`
**Changes**: Handle settings page logic

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const templatesSelect = document.getElementById('templates');
  const commandInput = document.getElementById('command');
  const previewUrlInput = document.getElementById('preview-url');
  const previewCommand = document.getElementById('preview-command');
  const ctrlCheckbox = document.getElementById('ctrl');
  const altCheckbox = document.getElementById('alt');
  const shiftCheckbox = document.getElementById('shift');
  const metaCheckbox = document.getElementById('meta');
  const ctrlLabel = document.getElementById('ctrl-label');
  const metaLabel = document.getElementById('meta-label');
  const runNowButton = document.getElementById('run-now');
  const resultDiv = document.getElementById('result');

  // Auto-save function
  function autoSave() {
    const command = commandInput.value.trim();
    const previewUrl = previewUrlInput.value.trim();
    const shortcutConfig = {
      ctrl: ctrlCheckbox.checked,
      alt: altCheckbox.checked,
      shift: shiftCheckbox.checked,
      meta: metaCheckbox.checked
    };
    browser.storage.local.set({ shellCommand: command, shortcutConfig: shortcutConfig, previewUrl: previewUrl });
  }

  // Platform-aware labels
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  ctrlLabel.textContent = isMac ? 'Ctrl' : 'Ctrl';  // Ctrl is still Ctrl
  metaLabel.textContent = isMac ? 'Cmd' : 'Meta';

  // Function to update command preview and banner
  function updatePreview() {
    const command = commandInput.value.trim();
    const previewUrl = previewUrlInput.value.trim() || 'https://example.com';
    const banner = document.getElementById('url-placeholder-banner');

  if (command.includes('{{url}}')) {
  banner.style.display = 'none';
    const escapedUrl = shellQuote(previewUrl);
  const preview = command.replace(/\{\{url\}\}/g, escapedUrl);
  previewCommand.textContent = preview;
  } else {
      banner.style.display = 'block';
      const escapedUrl = shellQuote(previewUrl);
      previewCommand.textContent = `${command} ${escapedUrl}`;
    }
  }

  // Template selection
  templatesSelect.addEventListener('change', function() {
    if (templatesSelect.value) {
      commandInput.value = templatesSelect.value;
      updatePreview();
    }
  });

  // Update preview on command or preview URL input change
  commandInput.addEventListener('input', updatePreview);
  commandInput.addEventListener('input', autoSave);
  previewUrlInput.addEventListener('input', updatePreview);
  previewUrlInput.addEventListener('input', autoSave);

  // Auto-save on checkbox changes
  [ctrlCheckbox, altCheckbox, shiftCheckbox, metaCheckbox].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      autoSave();
    });
  });

  // Load saved settings
  browser.storage.local.get(['shellCommand', 'shortcutConfig', 'previewUrl']).then((result) => {
    if (result.shellCommand) {
      commandInput.value = result.shellCommand;
    } else {
      // No saved command, use the default selected template
      const selectedTemplate = templatesSelect.value;
      if (selectedTemplate) {
        commandInput.value = selectedTemplate;
      }
    }
    if (result.previewUrl) {
      previewUrlInput.value = result.previewUrl;
    }
    // Load shortcut config with platform-aware defaults
    const defaultCtrl = !isMac;  // Ctrl on non-Mac
    const defaultMeta = isMac;   // Cmd on Mac
    ctrlCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.ctrl !== undefined) ? result.shortcutConfig.ctrl : defaultCtrl;
    altCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.alt !== undefined) ? result.shortcutConfig.alt : true;
    shiftCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.shift !== undefined) ? result.shortcutConfig.shift : false;
    metaCheckbox.checked = (result.shortcutConfig && result.shortcutConfig.meta !== undefined) ? result.shortcutConfig.meta : defaultMeta;

    updatePreview();
  });

  // Run now
  runNowButton.addEventListener('click', function() {
    const command = commandInput.value.trim();
    if (!command) {
      showResult('Please enter a command first', 'error');
      return;
    }

    browser.runtime.sendNativeMessage('altclickshell', {
      command: command,
      url: 'https://example.com'
    }).then((response) => {
      if (response.success) {
        showResult(`Command executed successfully. Output: ${response.stdout || 'No output'}`, 'success');
      } else {
        showResult(`Error: ${response.error}`, 'error');
      }
    }).catch((error) => {
      showResult(`Failed to execute: ${error.message}`, 'error');
    });
  });

  function showResult(message, type) {
    resultDiv.textContent = message;
    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    resultDiv.style.color = type === 'success' ? '#155724' : '#721c24';
  }
});
```

### Success Criteria:

#### Automated Verification:
- [ ] Options page loads: Open addon options in `about:addons`
- [ ] Settings persist: Reload page, command remains saved

#### Manual Verification:
- [ ] Command and shortcut settings save to storage
- [ ] Preview URL setting saves and loads
- [ ] ADB template is selected by default and populates command input
- [ ] Template selection populates command input
- [ ] Multiline command input with scrolling works
- [ ] {{url}} placeholder is bold and red in help text
- [ ] Banner appears when {{url}} is missing from command
- [ ] Command preview updates with configurable URL
- [ ] Run Now button executes command with preview URL
- [ ] Results display properly for success/error cases

## Phase 4: Installation & Testing

### Overview
Complete installation setup and comprehensive testing.

### Changes Required:

#### 1. Create Installation Instructions (`README.md`)
**File**: `README.md`
**Changes**: Document setup process

```markdown
# Configurable Click Shell Command Firefox Extension

Execute shell commands when using a configurable keyboard shortcut + clicking links.

## Installation

1. Download/clone this repository
2. Install the extension temporarily:
   - Open `about:debugging`
   - Click "This Firefox" > "Load Temporary Add-on"
   - Select `manifest.json`

3. Install native messaging host:

   **Windows:**
   - Edit `altclickshell.json` path to point to `native_host.py`
   - Create registry key: `HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\altclickshell`
   - Set default value to path of `altclickshell.json`

   **macOS/Linux:**
   - Place `altclickshell.json` in `~/Library/Application Support/Mozilla/NativeMessagingHosts/` (macOS) or `~/.mozilla/native-messaging-hosts/` (Linux)
   - Make `native_host.py` executable: `chmod +x native_host.py`

4. Configure command in addon options

## Security Warning

This extension executes arbitrary shell commands. Only use trusted commands and be cautious of malicious links.
```

#### 2. Test Scenarios
**File**: Various files as needed
**Changes**: Add debugging/console logging

```javascript
// In content.js, add logging
console.log('Alt+click intercepted:', url);

// In background.js, add logging
console.log('Executing command:', command, 'with URL:', message.url);

// In native_host.py, add logging
print(f"Executing: {full_command}", file=sys.stderr)
```

### Success Criteria:

#### Automated Verification:
- [ ] Extension installs: No errors in `about:debugging`
- [ ] Native messaging connects: No "native application not found" errors

#### Manual Verification:
- [ ] Configured shortcut + click on link executes configured command
- [ ] Settings page saves commands, shortcuts, preview URL, and tests correctly
- [ ] Default ADB template selection and other templates work properly
- [ ] Works across different websites
- [ ] Error handling for invalid commands
- [ ] No security prompts or blocks from Firefox

## Testing Strategy

### Unit Tests:
- Manifest validation
- JSON parsing in native app
- Storage API operations

### Integration Tests:
- End-to-end Alt+click flow
- Native messaging communication
- Command execution with various URLs

### Manual Testing Steps:
1. Install extension temporarily
2. Set up native messaging host
3. Configure a test command (e.g., `echo`) and keyboard shortcut (e.g., Ctrl+Alt)
4. Use configured shortcut + click various links
5. Verify commands execute in terminal/console
6. Test error cases (invalid commands, network issues)
7. Test settings page functionality

## Performance Considerations

- Native messaging has minimal overhead for simple commands
- Command execution happens asynchronously
- No persistent connections needed

## Migration Notes

- First implementation, no migration needed
- Future versions may add command validation or security features

## References

- Firefox WebExtensions documentation
- Native messaging API reference
- WebExtensions examples on GitHub
