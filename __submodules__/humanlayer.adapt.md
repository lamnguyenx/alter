
# HumanLayer Adaptation Instructions for AI Agents

## Override Instructions

- **Override for "Run `humanlayer thoughts sync`" prompt**: Instead of running the binary command, perform the following manual operations:
  - Update the searchable index by creating hard links in `thoughts/searchable/` to all files in `thoughts/` directories, following symlinks
  - This replaces the full sync functionality when the binary is unavailable

## Context
These instructions allow AI agents to handle HumanLayer thoughts management without requiring the humanlayer binary to be installed or runnable.