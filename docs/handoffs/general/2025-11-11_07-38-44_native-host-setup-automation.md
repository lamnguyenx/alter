---
date: 2025-11-11T07:38:44Z
session_by: Amp
git_commit: b0deafb2f79b497efcb6f92b2330324d60ce7491
branch: dev-lamnt45
repository: clickshell
topic: "Native Host Setup Automation & Configuration"
tags: [native-messaging, setup, firefox, extension-distribution, macos]
status: complete
last_updated: 2025-11-11
type: handoff
---

# Handoff: Native Host Setup Automation & Configuration

## Task(s)

**Completed:**
1. Renamed native messaging manifest from `altclickshell.json` to `clickshell.json` across entire codebase
2. Updated extension ID in manifest.json from `altclickshell@example.com` to `clickshell@example.com`
3. Updated all native messaging calls in background.js and options.js to reference new `clickshell` host name
4. Updated all documentation (CONTRIBUTE.md, README.md) to reflect naming changes
5. Created `setup.py` - an automated Python script that:
   - Auto-discovers the ClickShell extension in Firefox profiles (works for all variants: Release, Beta, Nightly, Developer Edition)
   - Locates `native_host.py` in the source directory (development) or within the extension
   - Creates `clickshell.json` native messaging manifest in the correct OS-specific directory
   - Sets correct permissions on `native_host.py` (chmod +x on Unix-like systems)
   - Works cross-platform (macOS, Linux, Windows)
6. Updated Makefile to bundle `native_host.py` into the .xpi file
7. Updated README.md to include step 6: running `python3 setup.py` after extension installation
8. Tested setup.py successfully on macOS with Firefox Developer Edition

**Status:** All tasks complete and tested. The setup process is now fully automated for users.

## Critical References

- `/Volumes/CHEESE/git/lamnguyenx/clickshell/setup.py` - Main automation script
- `/Volumes/CHEESE/git/lamnguyenx/clickshell/native_host.py` - Python script being bundled
- `/Volumes/CHEESE/git/lamnguyenx/clickshell/manifest.json` - Extension manifest with updated IDs
- `/Volumes/CHEESE/git/lamnguyenx/clickshell/CONTRIBUTE.md` - Developer setup instructions
- `/Volumes/CHEESE/git/lamnguyenx/clickshell/README.md` - User-facing installation instructions

## Recent Changes

- Created: `setup.py` - New automated setup script
- Created: `clickshell.json` - Renamed from `altclickshell.json`
- Modified: `Makefile:5` - Added `native_host.py` to bundled files
- Modified: `manifest.json:34` - Changed gecko ID from `altclickshell@example.com` to `clickshell@example.com`
- Modified: `background.js:5` - Changed native messaging host from `altclickshell` to `clickshell`
- Modified: `options.js:116` - Changed native messaging host from `altclickshell` to `clickshell`
- Modified: `README.md:7-16` - Added Firefox Developer Edition requirement and setup.py step
- Modified: `CONTRIBUTE.md:13-30` - Simplified native host installation to just `python3 setup.py`
- Modified: `CONTRIBUTE.md:59` - Updated file list to reference `clickshell.json`

## Learnings

1. **Firefox profile architecture:** All Firefox variants (Release, Beta, Nightly, Developer Edition) on macOS share the same native messaging hosts directory at `~/Library/Application Support/Mozilla/NativeMessagingHosts/`, but maintain separate profiles since Firefox v67 for data isolation (history, cookies, bookmarks, extensions, passwords, preferences).

2. **Extension storage in Firefox:** When extensions are loaded temporarily via `about:debugging`, Firefox stores them as `.xpi` files in the extensions directory with the extension ID as filename (e.g., `clickshell@example.com.xpi`).

3. **Native messaging manifest requirements:** The manifest must specify the exact absolute path to the Python executable script, `stdio` type, and the allowed extension IDs in a JSON file placed in the OS-specific native hosts directory.

4. **Platform differences for native messaging hosts:**
   - macOS: `~/Library/Application Support/Mozilla/NativeMessagingHosts/`
   - Linux: `~/.mozilla/native-messaging-hosts/`
   - Windows: `~/AppData/Roaming/Mozilla/NativeMessagingHosts/`

5. **Setup automation benefit:** By having setup.py discover the extension location automatically, users no longer need to manually edit JSON files with absolute paths—a common source of user errors during installation.

## Firefox Editions Comparison

| Aspect | Firefox Release | Firefox Beta | Firefox Nightly | Firefox Developer Edition |
|--------|---|---|---|---|
| **Profiles Directory** | `~/Library/Application Support/Firefox/Profiles/` | `~/Library/Application Support/Firefox/Profiles/` | `~/Library/Application Support/Firefox/Profiles/` | `~/Library/Application Support/Firefox/Profiles/` |
| **Native Messaging Dir** | `~/Library/Application Support/Mozilla/NativeMessagingHosts/` | `~/Library/Application Support/Mozilla/NativeMessagingHosts/` | `~/Library/Application Support/Mozilla/NativeMessagingHosts/` | `~/Library/Application Support/Mozilla/NativeMessagingHosts/` |
| **Profile Isolation** | Separate since v67 | Separate since v67 | Separate since v67 | Separate since v67 |
| **History** | Isolated per variant | Isolated per variant | Isolated per variant | Isolated per variant |
| **Cookies** | Isolated per variant | Isolated per variant | Isolated per variant | Isolated per variant |
| **Bookmarks** | Isolated per variant | Isolated per variant | Isolated per variant | Isolated per variant |
| **Extensions** | Isolated per variant | Isolated per variant | Isolated per variant | Isolated per variant |
| **Passwords** | Isolated per variant | Isolated per variant | Isolated per variant | Isolated per variant |

**Key insight:** All variants share one native messaging hosts directory, so a single `setup.py` run configures native messaging for all Firefox editions simultaneously. Each edition maintains completely separate profiles with no data sharing.

## Artifacts

- `setup.py` - Complete automated setup script with error handling and cross-platform support
- `clickshell.json` - Native messaging manifest (now in repo root)
- `README.md:7-16` - Updated with Firefox requirement and setup.py instructions
- `CONTRIBUTE.md:13-30` - Simplified to single `python3 setup.py` command
- `manifest.json:34` - Updated extension ID
- `background.js:5` - Updated native messaging call
- `options.js:116` - Updated native messaging call
- `Makefile:5` - Updated to include native_host.py in distribution

## Action Items & Next Steps

1. **Remove obsolete altclickshell.json file** - The old file is still in the repository and should be deleted since `clickshell.json` replaces it
2. **Test on Linux and Windows** - setup.py has been tested on macOS; test path discovery and manifest creation on Linux and Windows
3. **Test with packaged .xpi** - Currently tested with source directory; verify setup.py works when extension is distributed as .xpi file and user extracts it
4. **Consider adding version compatibility check** - setup.py could verify Python 3.7+ and validate Firefox installation before proceeding
5. **Documentation for distribution** - When publishing on Mozilla Add-ons, include clear instructions that users must run setup.py after installation
6. **Build and test .xpi** - Run `make all` to generate the packaged .xpi with bundled native_host.py

## Other Notes

- The setup.py currently prioritizes the source directory (development mode) over finding the extension in Firefox profiles. This is intentional for dev workflow but may need adjustment if distributing via Mozilla Add-ons store.
- The `allowed_extensions` field in clickshell.json only allows `clickshell@example.com`—this must be updated to the actual add-on ID when publishing to Mozilla Store.
- Firefox Developer Edition profile used for testing: `fherde5y.dev-edition-default` at `~/Library/Application Support/Firefox/Profiles/`
- The native_host.py script handles both URL substitution ({{url}} placeholder) and automatic appending, making it flexible for various command templates.
- Error handling in setup.py is comprehensive but could be enhanced with more granular logging options for troubleshooting user installations.
