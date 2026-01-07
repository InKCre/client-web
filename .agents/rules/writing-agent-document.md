# Writing Agent Documents

Guidelines for writing AGENTS.md, ARCHITECTURE.md, FILESYSTEM.md and similar documents.

## Core Principles

1. Token efficiency - Documents are read by LLMs with limited context
2. Index over explanation - Point to details, don't duplicate them
3. Concise language - Remove filler words, use simple sentences

## Formatting Rules

- Use bullet lists, not tables (tables waste tokens on separators)
- Avoid bold/italics except for semantic emphasis (rare)
- Use inline code for paths, commands, identifiers
- Code blocks only for multi-line code or directory trees
- No decorative elements (emojis, horizontal rules, badges)

## Content Structure

AGENTS.md should contain:
- One-line description
- Structure overview (what's where)
- Quick reference (common commands)
- Links to detailed docs
- Domain-specific guidelines

ARCHITECTURE.md should contain:
- System layers diagram (if helpful)
- Key patterns with locations
- Data flow summary
- Package responsibilities

FILESYSTEM.md should contain:
- Directory tree with brief annotations
- File naming conventions

## Writing Style

Good:
```
- `src/api` - API client implementations
```

Bad:
```
- **src/api**: This directory contains all of the API client implementations
```

Good:
```
## Commands
- `pnpm dev` - Start dev server
```

Bad:
```
## Commands
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
```

## When to Update

Refresh documentation after:
- Adding/removing packages or apps
- Changing directory structure
- Adding new business domains
- Modifying key patterns or data flow
