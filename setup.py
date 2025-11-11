#!/usr/bin/env python3
"""
Setup script for ClickShell native messaging host.
This script discovers the extension installation directory and creates the native messaging manifest.
"""

import os
import json
import sys
import platform
import subprocess
import zipfile
from pathlib import Path
from tempfile import TemporaryDirectory

def get_firefox_profile_dir():
    """Get the Firefox profile directory for the current OS."""
    system = platform.system()
    
    if system == "Darwin":  # macOS
        return Path("~/Library/Application Support/Firefox/Profiles").expanduser()
    elif system == "Linux":
        return Path("~/.mozilla/firefox").expanduser()
    elif system == "Windows":
        return Path("~/AppData/Roaming/Mozilla/Firefox/Profiles").expanduser()
    else:
        raise RuntimeError(f"Unsupported OS: {system}")

def find_extension_xpi():
    """Find the ClickShell extension .xpi file in Firefox extensions directory."""
    profiles_dir = get_firefox_profile_dir()
    
    if not profiles_dir.exists():
        raise FileNotFoundError(f"Firefox profile directory not found: {profiles_dir}")
    
    print(f"Searching in: {profiles_dir}")
    
    # Search for the extension in all profiles
    for profile in profiles_dir.glob("*/"):
        extensions_dir = profile / "extensions"
        print(f"Checking profile: {profile.name}")
        
        if extensions_dir.exists():
            # Look for clickshell extension
            for ext_file in extensions_dir.glob("clickshell@*.xpi"):
                print(f"Found extension: {ext_file}")
                return ext_file
    
    raise FileNotFoundError("ClickShell extension (.xpi) not found in Firefox profiles")

def extract_extension_path(xpi_path):
    """Extract the extension and find native_host.py path."""
    with TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        
        # Extract the xpi
        with zipfile.ZipFile(xpi_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir_path)
        
        # Verify manifest.json exists and is ClickShell
        manifest_path = tmpdir_path / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path) as f:
                manifest = json.load(f)
                if manifest.get("name") == "ClickShell":
                    native_host = tmpdir_path / "native_host.py"
                    if native_host.exists():
                        return native_host.read_text()
    
    return None

def find_extension_in_source():
    """Fallback: find native_host.py in the source directory."""
    # Check if we're in the clickshell repository
    current_dir = Path.cwd()
    native_host = current_dir / "native_host.py"
    
    if native_host.exists():
        print(f"Using native_host.py from source: {native_host}")
        return native_host
    
    # Check parent directories
    for parent in current_dir.parents:
        native_host = parent / "clickshell" / "native_host.py"
        if native_host.exists():
            print(f"Using native_host.py from source: {native_host}")
            return native_host
    
    return None

def get_native_hosts_dir():
    """Get the native messaging hosts directory for the current OS."""
    system = platform.system()
    
    if system == "Darwin":  # macOS
        return Path("~/Library/Application Support/Mozilla/NativeMessagingHosts").expanduser()
    elif system == "Linux":
        return Path("~/.mozilla/native-messaging-hosts").expanduser()
    elif system == "Windows":
        return Path("~/AppData/Roaming/Mozilla/NativeMessagingHosts").expanduser()
    else:
        raise RuntimeError(f"Unsupported OS: {system}")

def create_manifest(native_host_path):
    """Create the clickshell.json manifest."""
    return {
        "name": "clickshell",
        "description": "Configurable Click Shell Command Host",
        "path": str(native_host_path),
        "type": "stdio",
        "allowed_extensions": ["clickshell@example.com"]
    }

def main():
    try:
        # Try to find native_host.py
        native_host_py = None
        
        # First, try to find in source directory (development)
        print("Checking for native_host.py in source...")
        native_host_py = find_extension_in_source()
        
        if native_host_py:
            print(f"Using source native_host.py: {native_host_py}")
        else:
            # Try to find the extension xpi
            print("Finding ClickShell extension in Firefox...")
            xpi_path = find_extension_xpi()
            print(f"Found extension at: {xpi_path}")
            
            # For now, we recommend using source setup
            print("\nNote: For development, it's easier to use the source version.")
            print("Make sure you're running setup.py from the clickshell source directory.")
            raise FileNotFoundError(
                "native_host.py not found. Please run this script from the ClickShell source directory."
            )
        
        # Make it executable on Unix-like systems
        if platform.system() in ("Darwin", "Linux"):
            os.chmod(native_host_py, 0o755)
            print(f"Made {native_host_py} executable")
        
        # Create native messaging hosts directory
        hosts_dir = get_native_hosts_dir()
        hosts_dir.mkdir(parents=True, exist_ok=True)
        print(f"Native hosts directory: {hosts_dir}")
        
        # Create manifest file
        manifest_path = hosts_dir / "clickshell.json"
        manifest_data = create_manifest(native_host_py)
        
        with open(manifest_path, 'w') as f:
            json.dump(manifest_data, f, indent=2)
        
        print(f"\nSetup complete!")
        print(f"Created: {manifest_path}")
        print(f"Native host: {native_host_py}")
        print("\nYou can now use ClickShell to execute shell commands.")
        
    except Exception as e:
        print(f"Setup failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
