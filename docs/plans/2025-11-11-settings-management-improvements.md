# Settings Management Improvements Implementation Plan

## Overview

Fix two critical issues with the settings page: (1) the shell command defaults to "echo" on reinstall instead of loading the selected template, and (2) replace auto-saving with an explicit "Save Settings" button that becomes active only when changes are made.

## Current State Analysis

### Issue 1: Default Command Problem
- **Root Cause**: In `options.html` line 58, the command preview hardcodes `echo https://example.com` as the initial display
- **Behavior**: When the extension is reinstalled, `browser.storage.local.get()` retrieves `shellCommand`, but if it's `null` or `undefined`, the textarea remains empty until the user interacts with it
- **Problem**: The preview shows "echo" even though the actual `commandInput.value` is empty, creating confusion about what command is actually configured
- **Secondary Issue**: The template selection at page load (lines 87-90 in options.js) only fills the command if `result.shellCommand` is falsy, but doesn't validate that the template actually loaded

### Issue 2: Auto-save Behavior
- **Current Implementation**: Every change triggers `autoSave()` via event listeners (lines 70, 72, 75-78 in options.js)
- **Problem**: No visual feedback about what was saved, and no way for users to review changes before committing them
- **Missing**: A "Save Settings" button and change detection system

## Desired End State

1. **Default Command**: When the extension loads, if no command is saved, the selected template (Firefox Android ADB) should automatically populate the command field and persist to storage on page load
2. **Save Button**: 
   - A prominent "Save Settings" button at the top of the form
   - Button is disabled initially (grayed out)
   - Button becomes enabled when any field changes
   - Button is disabled again after successful save
   - Visual feedback when settings are saved (success message)
3. **No Unsaved Changes Loss**: Settings only persist when the user explicitly clicks Save

## Key Discoveries

- `options.js` line 108: Content script falls back to `echo` if no command is found: `const command = result.shellCommand || 'echo'`
- `options.html` line 58: Hardcoded "echo" in preview is misleading
- Manifest v2 is in use (legacy Firefox extension format)
- Storage API uses `browser.storage.local.set()` and `.get()`

## What We're NOT Doing

- Migrating to Manifest V3
- Adding a separate settings reset/clear button
- Adding validation for shell command syntax
- Adding warning dialogs for unsaved changes
- Persisting undo/redo history

## Implementation Approach

1. **Fix default command loading**: Ensure the template command is persisted to storage on initial page load if no command exists
2. **Add change tracking**: Maintain a flag that tracks if the form has unsaved changes
3. **Add Save button**: Create a prominent save button with disabled state management
4. **Remove auto-save**: Replace all inline `autoSave()` calls with change detection instead
5. **Add success feedback**: Show a brief success message after save

## Phase 1: Add Change Detection and Save Button UI

### Overview
Add the Save button to the HTML, style it, and implement the change detection logic.

### Changes Required

#### 1. options.html
**File**: `options.html`
**Changes**: Add a "Save Settings" button at the top of the form with proper styling

```html
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h1 style="margin: 0;">Configurable Click Shell Command Settings</h1>
    <button id="save-settings" style="padding: 10px 24px; font-size: 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; disabled opacity: 0.5;" disabled>
      Save Settings
    </button>
  </div>
  <!-- rest of form -->
```

#### 2. options.js - Add Change Tracking
**File**: `options.js`
**Changes**: Replace auto-save logic with change detection

Replace lines 15-26 (the autoSave function) with:

```javascript
// Track whether form has unsaved changes
let hasUnsavedChanges = false;

function markAsChanged() {
  hasUnsavedChanges = true;
  saveSettingsButton.disabled = false;
}

function saveSettings() {
  const command = commandInput.value.trim();
  const previewUrl = previewUrlInput.value.trim();
  const shortcutConfig = {
    ctrl: ctrlCheckbox.checked,
    alt: altCheckbox.checked,
    shift: shiftCheckbox.checked,
    meta: metaCheckbox.checked
  };
  
  browser.storage.local.set({ 
    shellCommand: command, 
    shortcutConfig: shortcutConfig, 
    previewUrl: previewUrl 
  }).then(() => {
    hasUnsavedChanges = false;
    saveSettingsButton.disabled = true;
    showResult('Settings saved successfully', 'success');
  }).catch((error) => {
    showResult(`Failed to save settings: ${error.message}`, 'error');
  });
}
```

Add save button reference at the top with other element selections:

```javascript
const saveSettingsButton = document.getElementById('save-settings');
```

Replace all auto-save listeners (lines 69-79) with change detection listeners:

```javascript
// Mark as changed on input
commandInput.addEventListener('input', () => {
  updatePreview();
  markAsChanged();
});

previewUrlInput.addEventListener('input', () => {
  updatePreview();
  markAsChanged();
});

// Mark as changed on checkbox changes
[ctrlCheckbox, altCheckbox, shiftCheckbox, metaCheckbox].forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    markAsChanged();
  });
});

// Handle save button click
saveSettingsButton.addEventListener('click', saveSettings);

// Prevent form submission if user tries to submit
document.querySelector('form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings();
});
```

Remove the template change auto-save (line 65 doesn't need modification, just remove the autoSave call from it):

```javascript
templatesSelect.addEventListener('change', function() {
  if (templatesSelect.value) {
    commandInput.value = templatesSelect.value;
    updatePreview();
    markAsChanged();
  }
});
```

### Success Criteria

#### Automated Verification
- [ ] options.html contains the save button element with id="save-settings"
- [ ] options.html button has disabled attribute initially
- [ ] Button styling applies: background color, padding, border-radius visible in rendered HTML

#### Manual Verification
- [ ] Save button appears at the top of the page next to the title
- [ ] Save button is disabled (grayed out) when page first loads
- [ ] Save button becomes enabled when any field is changed (command, URL, or checkboxes)
- [ ] Clicking Save button saves all settings and shows success message
- [ ] Save button becomes disabled again after successful save
- [ ] Changing a field after save re-enables the button

---

## Phase 2: Fix Default Command Loading

### Overview
Ensure that when the extension loads for the first time (or reinstall), the default Firefox Android ADB template is populated and saved.

### Changes Required

#### 1. options.js - Initialize Default Command
**File**: `options.js`
**Changes**: Modify the settings loading logic to save the template if no command exists

Replace lines 81-104 (the settings loading section) with:

```javascript
// Load saved settings
browser.storage.local.get(['shellCommand', 'shortcutConfig', 'previewUrl']).then((result) => {
  let commandToUse = result.shellCommand;
  
  // If no command is saved, use the first template (Firefox Android ADB)
  if (!commandToUse) {
    const defaultTemplate = templatesSelect.options[0].value;
    commandToUse = defaultTemplate;
    // Immediately save the default template
    browser.storage.local.set({ shellCommand: commandToUse });
  }
  
  commandInput.value = commandToUse;
  
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
  
  // Reset change tracking since we just loaded saved settings
  hasUnsavedChanges = false;
  saveSettingsButton.disabled = true;
});
```

### Success Criteria

#### Automated Verification
- [ ] No JavaScript errors in browser console on options page load
- [ ] `browser.storage.local.get()` returns the Firefox Android ADB command after page load

#### Manual Verification
- [ ] Uninstall and reinstall the extension
- [ ] Open settings page
- [ ] Command field contains the Firefox Android ADB template text
- [ ] Preview shows the command correctly
- [ ] Save button is disabled (no unsaved changes)
- [ ] Clicking a link with Alt+click executes the Firefox Android ADB command (not "echo")

---

## Phase 3: Update Content Script Fallback

### Overview
Update the content script to use a better default if somehow no command is found at runtime.

### Changes Required

#### 1. content.js - Improve Default Message
**File**: `content.js`
**Changes**: Replace the "echo" fallback with a more descriptive message (lines 108-109)

```javascript
// Get the current command to show in notification
browser.storage.local.get('shellCommand').then((result) => {
  const command = result.shellCommand || 'echo (no command configured)';
  showCommandNotification(command, url);
});
```

And update line 123 in background.js similarly to be more helpful, but this is less critical since the command should always be set now.

### Success Criteria

#### Automated Verification
- [ ] No JavaScript errors in content.js
- [ ] Fallback message text includes "(no command configured)"

#### Manual Verification
- [ ] If somehow storage is cleared while browsing, the notification shows "echo (no command configured)" instead of just "echo"

---

## Phase 4: Add Context Menu for Links

### Overview
Add a context menu item for right-clicking directly on links, with the same popup notification feedback as other command executions.

### Changes Required

#### 1. background.js - Add Link Context Menu
**File**: `background.js`
**Changes**: Add a new context menu item for the "link" context (after existing page context menu at line 26)

```javascript
// Create context menu item for links
browser.contextMenus.create({
  id: 'open-link-clickshell',
  title: 'Open Link via Clickshell',
  contexts: ['link']
});
```

#### 2. background.js - Handle Link Context Menu Click
**File**: `background.js`
**Changes**: Add handler for the new link context menu (add to the existing onClicked listener around line 29)

In the `browser.contextMenus.onClicked.addListener` function, add a new condition:

```javascript
// Handle link context menu item click
if (info.menuItemId === 'open-link-clickshell') {
  browser.storage.local.get('shellCommand').then((result) => {
    const commandTemplate = result.shellCommand;
    if (!commandTemplate) {
      browser.tabs.sendMessage(tab.id, {
        action: 'showError',
        message: 'No shell command configured. Please set a command in settings.'
      }).catch(() => {});
      console.error('No shell command configured');
      return;
    }
    
    const linkUrl = info.linkUrl;
    
    // Show notification in the content script
    browser.tabs.sendMessage(tab.id, {
      action: 'showNotification',
      command: commandTemplate,
      url: linkUrl
    }).catch(() => {});
    
    // Execute the command
    browser.runtime.sendNativeMessage('clickshell', {
      command: commandTemplate,
      url: linkUrl
    }).then((response) => {
      console.log('Clickshell command executed:', response);
    }).catch((error) => {
      const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
      const errorMessage = `Error: ${error.message || error}\n${stackLines}`;
      browser.tabs.sendMessage(tab.id, {
        action: 'showError',
        message: errorMessage
      }).catch(() => {});
      console.error('Failed to execute Clickshell command:', error);
    });
  }).catch((error) => {
    const stackLines = error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '';
    const errorMessage = `Error retrieving command: ${error.message || error}\n${stackLines}`;
    browser.tabs.sendMessage(tab.id, {
      action: 'showError',
      message: errorMessage
    }).catch(() => {});
    console.error('Failed to retrieve shell command:', error);
  });
}
```

### Success Criteria

#### Automated Verification
- [ ] No JavaScript errors in background.js
- [ ] Context menu item with id 'open-link-clickshell' is created
- [ ] Handler responds to menu item click with correct menuItemId check

#### Manual Verification
- [ ] Right-click on any link in a webpage
- [ ] "Open Link via Clickshell" option appears in context menu
- [ ] Click the menu item
- [ ] Popup notification shows the command and link URL
- [ ] Command is executed against that specific link (not the page URL)
- [ ] Error handling works if command is not configured

---

## Testing Strategy

### Unit Tests
- Verify `markAsChanged()` sets `hasUnsavedChanges` to true
- Verify `saveSettings()` calls `browser.storage.local.set()` with correct data
- Verify button disabled state toggles correctly

### Integration Tests
1. Load options page → verify button is disabled, command is populated, preview shows correct command
2. Type in command field → verify button becomes enabled
3. Click Save → verify button becomes disabled, success message shows
4. Change a checkbox → verify button becomes enabled again
5. Uninstall and reinstall extension → verify Firefox Android ADB command is set on first load

### Manual Testing Steps
1. Install extension fresh
2. Open settings page, verify Firefox Android ADB is selected and button is disabled
3. Change the URL preview field
4. Verify Save button becomes enabled
5. Click Save, verify success message
6. Verify button becomes disabled
7. With Alt+Click on a link, verify the Firefox Android ADB command executes (not echo)
8. Uninstall extension completely
9. Reinstall extension
10. Open settings page
11. Verify Firefox Android ADB is pre-populated and shows in preview
12. Verify settings are already saved (button disabled)

## Migration Notes

No migration needed - existing saved commands will continue to work. Only affects fresh installs where `shellCommand` is not set.

## References

- Current options.js implementation: shows auto-save pattern in lines 15-26, 69-79
- content.js line 108: Shows fallback to "echo" when command not found
- manifest.json: Uses Manifest V2 (Firefox legacy)
