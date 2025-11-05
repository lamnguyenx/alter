# Firefox Extension: Alt+Click Shell Command Implementation Plan

## Overview

Create a Firefox WebExtensions addon that intercepts Alt+click events on links and executes a configurable shell command on the host machine with the link URL as an argument. The extension includes a settings page for command configuration and testing.

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
- Captures Alt+click on any hyperlink
- Executes user-configured shell command with link URL
- Provides settings UI for command input and testing
- Works across all websites with proper permissions

### Key Deliverables:
- Extension manifest with all required permissions
- Content script for click interception
- Background script for native messaging
- Native messaging application (Python/Node.js)
- Settings/options page with command input and test button
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
  "name": "Alt+Click Shell Command",
  "version": "0.0.1",
  "description": "Execute shell commands on Alt+click links",

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
**Changes**: Create new file to intercept Alt+click events

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

document.addEventListener('click', function(e) {
  if (e.altKey && e.target.tagName === 'A') {
    e.preventDefault();
    e.stopPropagation();

    const url = e.target.href;

    // Get the current command to show in notification
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
      showCommandNotification(command, url);
    });

    browser.runtime.sendMessage({ action: 'executeCommand', url: url });
  }
});
```

#### 3. Create Background Script (`background.js`)
**File**: `background.js`
**Changes**: Create new file for native messaging

```javascript
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'executeCommand') {
    browser.storage.local.get('shellCommand').then((result) => {
      const command = result.shellCommand || 'echo';
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
  "description": "Alt+Click Shell Command Host",
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
    input[type="text"] { width: 100%; padding: 8px; }
    button { padding: 8px 16px; margin: 5px; }
    .result { margin-top: 10px; padding: 10px; background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>Alt+Click Shell Command Settings</h1>

  <div class="form-group">
    <label for="command">Shell Command:</label>
    <input type="text" id="command" placeholder="e.g., open">
    <small>The command will be executed with the link URL as the last argument</small>
  </div>

  <button id="save">Save Command</button>
  <button id="test">Test with example.com</button>

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
  const commandInput = document.getElementById('command');
  const saveButton = document.getElementById('save');
  const testButton = document.getElementById('test');
  const resultDiv = document.getElementById('result');

  // Load saved command
  browser.storage.local.get('shellCommand').then((result) => {
    if (result.shellCommand) {
      commandInput.value = result.shellCommand;
    }
  });

  // Save command
  saveButton.addEventListener('click', function() {
    const command = commandInput.value.trim();
    browser.storage.local.set({ shellCommand: command }).then(() => {
      showResult('Command saved successfully!', 'success');
    });
  });

  // Test command
  testButton.addEventListener('click', function() {
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
- [ ] Command saves to storage
- [ ] Test button executes command with example.com
- [ ] Results display properly for success/error cases

## Phase 4: Installation & Testing

### Overview
Complete installation setup and comprehensive testing.

### Changes Required:

#### 1. Create Installation Instructions (`README.md`)
**File**: `README.md`
**Changes**: Document setup process

```markdown
# Alt+Click Shell Command Firefox Extension

Execute shell commands when Alt+clicking links.

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
- [ ] Alt+click on link executes configured command
- [ ] Settings page saves and tests commands correctly
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
3. Configure a test command (e.g., `echo`)
4. Alt+click various links
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
