# Context Menu "Open Page via Clickshell" Implementation Plan

## Overview

Add a right-click context menu item "Open Page via Clickshell" that executes the configured shell command with the current page's URL. This provides a quicker alternative to the modifier+click on links, allowing users to run commands on the page itself.

## Current State Analysis

- Extension uses manifest v2 (Firefox)
- `background.js` listens for messages from content script and forwards to native host
- `content.js` handles modifier+click detection on links
- `native_host.py` executes the command template with URL substitution
- Command templates use `{{url}}` placeholder
- User can configure shortcuts and commands via options UI

## Desired End State

The extension has a context menu item available on any page that, when clicked, executes the user's configured shell command with the current page URL. The context menu uses the exact same shell command configured for the modifier+click (Cmd+Alt+Click) feature, providing consistent behavior across both interaction methods.

### Key Discoveries:
- Firefox manifest v2 requires `contextMenus` permission for context menu creation
- `tab.url` is available in background script context menu handlers
- Existing `native_host.py` already handles URL substitution, no changes needed there
- `activeTab` permission is already present and sufficient for accessing page URLs

## What We're NOT Doing

- Adding notifications/UI feedback (exists for modifier+click, not required for context menu)
- Creating sub-menu items or conditional menu items
- Adding options to customize the menu item text or behavior per page type
- Modifying the native host or command execution logic

## Implementation Approach

Add context menu functionality by:
1. Updating `manifest.json` to request `contextMenus` permission
2. Creating context menu item in `background.js` that triggers on any page
3. Handling context menu click to get current tab URL and execute command
4. Reusing existing command execution flow

---

## Phase 1: Add Context Menu Infrastructure

### Overview
Add Firefox context menu permission and create context menu item in background script.

### Changes Required:

#### 1. manifest.json
**File**: `manifest.json`
**Changes**: Add `contextMenus` permission to permissions array

```json
  "permissions": [
    "storage",
    "nativeMessaging",
    "activeTab",
    "contextMenus"
  ],
```

#### 2. background.js
**File**: `background.js`
**Changes**: Add context menu creation and click handler after existing message listener

```javascript
// Create context menu item on extension load
browser.contextMenus.create({
  id: 'open-page-clickshell',
  title: 'Open Page via Clickshell',
  contexts: ['page']
});

// Handle context menu item click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-page-clickshell') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand || 'echo';
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: tab.url
      }).then((response) => {
        console.log('Clickshell command executed:', response);
      }).catch((error) => {
        console.error('Failed to execute Clickshell command:', error);
      });
    });
  }
});
```

### Success Criteria:

#### Automated Verification:
- [x] Manifest loads without errors: Extension loads successfully in `about:debugging`
- [x] No console errors in background script: Browser DevTools shows clean background script execution

#### Manual Verification:
- [x] Right-click on any webpage shows "Open Page via Clickshell" menu item
- [x] Menu item is visible in context menu (not grayed out)
- [x] Menu item appears on page context (not on images, links, or text selections)

**Implementation Note**: Phase 1 manual verification complete.

---

## Phase 2: Add Notification Display

### Overview
Display the same floating notification that appears for modifier+click, showing the executed command and URL.

### Changes Required:

#### 1. background.js (Enhanced)
**File**: `background.js`
**Changes**: Send notification message to content script before executing command

```javascript
// Handle context menu item click
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-page-clickshell') {
    browser.storage.local.get('shellCommand').then((result) => {
      const commandTemplate = result.shellCommand || 'echo';
      
      // Show notification in the content script
      browser.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        command: commandTemplate,
        url: tab.url
      }).catch(() => {
        // Notification fails silently if content script not available
      });
      
      // Execute the command
      browser.runtime.sendNativeMessage('clickshell', {
        command: commandTemplate,
        url: tab.url
      }).then((response) => {
        console.log('Clickshell command executed:', response);
      }).catch((error) => {
        console.error('Failed to execute Clickshell command:', error);
      });
    });
  }
});
```

#### 2. content.js
**File**: `content.js`
**Changes**: Add listener for notification messages from background script

```javascript
// Listen for notification messages from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'showNotification') {
    showCommandNotification(message.command, message.url);
  }
});
```

### Success Criteria:

#### Automated Verification:
- [x] Background script contains no syntax errors: Extension loads successfully
- [x] Content script contains no syntax errors: No console errors on page load

#### Manual Verification:
- [x] Right-click and select "Open Page via Clickshell" shows floating notification in top-right
- [x] Notification displays correct command and current page URL
- [x] Notification auto-dismisses after 3 seconds (same as modifier+click)
- [x] Notification works on all page types

**Implementation Note**: Phase 2 manual verification complete.

---

## Phase 3: Verification & Edge Cases

### Overview
Verify command executes correctly with current page URL and handles edge cases.

### Changes Required:

No code changes required in this phase. This phase is for comprehensive testing.

### Success Criteria:

#### Automated Verification:
- [x] Background script contains no syntax errors: `about:debugging` shows no errors
- [x] Native messaging communication works: Command executes successfully

#### Manual Verification:
- [x] Right-click and select "Open Page via Clickshell" executes the command
- [x] Command receives correct current page URL (same shell command as Cmd+Alt+Click)
- [x] Works on pages with different URL schemes (`http://`, `https://`, `file://`)
- [x] Works with command templates both with and without `{{url}}` placeholder
- [x] Browser console shows successful execution log
- [x] Modifier+click feature still works (regression test)
- [x] Context menu item appears on all webpage contexts

**Implementation Note**: All verification complete. Feature is fully functional.

---

## Testing Strategy

### Manual Testing Steps:
1. Set a test command in options like `echo "Opening: {{url}}"` 
2. Navigate to various webpages
3. Right-click anywhere on the page
4. Verify "Open Page via Clickshell" appears in context menu
5. Click the menu item
6. Verify the command executes with the current page URL
7. Check Firefox console (DevTools) for execution status and success log
8. Test with multiple different pages to confirm URL is captured correctly
9. Test edge cases:
   - Pages with special characters in URL
   - `https://` pages vs `http://` pages
   - Local `file://` URLs
   - Command templates with `{{url}}` placeholder vs without
10. Verify modifier+click feature still works (regression)

### Edge Cases:
- Clicking menu item on pages with special characters in URL
- Pages with `file://` URLs vs `http://` vs `https://`
- Command templates with and without `{{url}}` placeholder
- Right-clicking on different element types (text, images, etc.) - menu should appear for all

## Performance Considerations

No performance impact expected. Context menu creation is lightweight and executes only when user right-clicks.

## References

- Current modifier+click implementation: `content.js` and `background.js`
- Firefox contextMenus API: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/contextMenus
- Existing command execution: `native_host.py` (no changes needed)
