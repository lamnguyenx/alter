# ClickShell Firefox Add-on Publication Plan

## Overview

Publish the ClickShell Firefox extension to Mozilla's Add-ons (AMO) store. This involves preparing the extension package, creating a developer account, submitting for review, and updating related documentation and native messaging configuration.

## Current State Analysis

**Extension Readiness:**
- Core functionality implemented: content script for click interception, background script for native messaging, options page for configuration
- Manifest.json configured with nativeMessaging permission
- Native messaging host (native_host.py) and manifest (altclickshell.json) ready for user installation
- Name updated to "ClickShell"

**Key Constraints:**
- AMO assigns extension ID upon submission; current manifest uses development ID
- No icons defined in manifest; need to add PNG icons for AMO requirements
- Native messaging allowed but native application not reviewed/signed by AMO
- Users must manually install native host separately
- Extension must be packaged as ZIP excluding development files

**AMO Requirements Discovered:**
- Developer account needed
- Extension submitted as ZIP with manifest.json at root
- Maximum 200MB size
- Icons required (32x32, 48x48, 64x64, 96x96, 128x128 recommended)
- Privacy policy required if extension transmits data (this extension executes local commands only)
- Source code submission required for minified/obfuscated code
- Review process includes automated validation and manual review

## Desired End State

ClickShell extension published on AMO with:
- Public listing with proper description, screenshots, and categories
- AMO-assigned extension ID
- Updated native messaging manifest with AMO ID
- Updated documentation with AMO installation link
- Native host installation instructions for users

### Key Deliverables:
- AMO developer account
- Extension package (ZIP) with icons and clean manifest
- Successful AMO submission and approval
- Updated altclickshell.json with AMO extension ID
- Updated README.md with AMO link and user-friendly installation

## What We're NOT Doing

- Modifying core extension functionality
- Adding new features during publication
- Supporting auto-installation of native host (AMO policy)
- Publishing to other browser stores

## Implementation Approach

Follow AMO submission guidelines: prepare clean package, submit for review, update native manifest with assigned ID, publish documentation updates.

## Phase 1: Extension Package Preparation

### Overview
Prepare the extension for AMO submission by cleaning the manifest, adding required icons, and creating the submission ZIP.

### Changes Required:

#### 1. Update Manifest for AMO (`manifest.json`)
**File**: `manifest.json`
**Changes**: Remove development-specific browser_specific_settings, add icons

```json
{
  "manifest_version": 2,
  "name": "ClickShell",
  "version": "0.1.0",
  "description": "Execute shell commands by clicking links with configurable keyboard shortcuts",
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
  "icons": {
    "32": "icon-32.png",
    "48": "icon-48.png",
    "64": "icon-64.png",
    "96": "icon-96.png",
    "128": "icon-128.png"
  }
}
```

#### 2. Create Extension Icons (`icon-*.png`)
**File**: `icon-32.png`, `icon-48.png`, etc.
**Changes**: Convert mouse-icon.svg to PNG formats required by AMO

Convert the existing mouse-icon.svg to PNG files in required sizes.

#### 3. Create Extension Package (`clickshell-extension.zip`)
**File**: `clickshell-extension.zip`
**Changes**: Create ZIP containing only AMO-required files

ZIP contents:
- manifest.json
- content.js
- background.js
- options.html
- options.js
- icon-32.png
- icon-48.png
- icon-64.png
- icon-96.png
- icon-128.png

### Success Criteria:

#### Automated Verification:
- [ ] Manifest validates without errors: `web-ext lint` or AMO validator
- [ ] ZIP file created with correct contents
- [ ] All required icons present and correct sizes

#### Manual Verification:
- [ ] Extension loads in Firefox when temporarily installed from ZIP
- [ ] Options page accessible and functional
- [ ] Icons display correctly in Firefox addon manager

## Phase 2: AMO Submission Setup

### Overview
Create developer account and submit the extension package to AMO for review.

### Changes Required:

#### 1. Create AMO Developer Account
**Action**: Register at https://addons.mozilla.org/developers/
**Details**: Create Mozilla account if needed, agree to developer agreement

#### 2. Submit Extension to AMO
**Action**: Upload clickshell-extension.zip to AMO developer hub
**Details**:
- Choose "On this site" for public listing
- Upload ZIP file
- Fill submission form:
  - Name: ClickShell
  - Summary: Execute shell commands with configurable keyboard shortcuts on links
  - Description: Detailed description with features and usage
  - Categories: Productivity, Developer Tools
  - License: MIT or appropriate open source license
  - Privacy Policy: None required (no data transmission)
  - Support: GitHub repository link
  - Screenshots: Add screenshots of options page and usage

#### 3. Handle Review Process
**Action**: Respond to reviewer feedback if any
**Details**: AMO will assign extension ID upon approval

### Success Criteria:

#### Automated Verification:
- [ ] ZIP passes AMO validation during upload

#### Manual Verification:
- [ ] Developer account created successfully
- [ ] Extension submitted without validation errors
- [ ] Extension approved and published on AMO

## Phase 3: Post-Publication Updates

### Overview
Update native messaging configuration and documentation with AMO details.

### Changes Required:

#### 1. Update Native Messaging Manifest (`altclickshell.json`)
**File**: `altclickshell.json`
**Changes**: Replace development ID with AMO-assigned ID

```json
{
  "name": "altclickshell",
  "description": "ClickShell Native Messaging Host",
  "path": "/path/to/native_host.py",
  "type": "stdio",
  "allowed_extensions": ["AMO_ASSIGNED_ID_HERE"]
}
```

#### 2. Update README.md for Users
**File**: `README.md`
**Changes**: Add AMO installation link, simplify instructions

Update installation section to prioritize AMO download over manual setup.

#### 3. Update CONTRIBUTE.md
**File**: `CONTRIBUTE.md`
**Changes**: Update with AMO publication details

### Success Criteria:

#### Automated Verification:
- [ ] Native manifest JSON validates

#### Manual Verification:
- [ ] Extension downloads and installs from AMO
- [ ] Native host works with AMO-installed extension
- [ ] Documentation accurately reflects AMO installation

## Testing Strategy

### Unit Tests:
- Manifest JSON validation
- Extension package structure verification

### Integration Tests:
- End-to-end installation from AMO
- Native messaging communication with updated manifest

### Manual Testing Steps:
1. Install extension from AMO
2. Configure options and test click functionality
3. Verify native host installation works
4. Test on different websites

## Performance Considerations

- AMO hosting handles download distribution
- No performance impact on extension functionality

## Migration Notes

- Existing development installations remain functional
- Users can migrate to AMO version seamlessly
- Native host configuration needs AMO ID update

## References

- AMO Developer Hub: https://addons.mozilla.org/developers/
- Extension Workshop: https://extensionworkshop.com/
- Original implementation plan: thoughts/shared/plans/2025-11-05-firefox-extension-alt-click-shell-command.md
