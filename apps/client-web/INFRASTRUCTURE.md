# Infrastructure Documentation

## Table of Contents

- Overview
- Build System
- Development Environment
- Configuration Management
- Cloudflare Workers Deployment
- CI/CD
- Monitoring & Observability
- Security
- Troubleshooting
- References

---

## Overview

InKCre client-web uses Vite for building and Cloudflare Workers for edge deployment. Key features include pnpm workspaces for multi-package management, Module Federation for extensions, and multi-environment support.

### Deployment Architecture

- Cloudflare Workers host the Hono server and static assets.
- Server handles API routes and proxies static files.
- Assets include built Vue SPA and resources.
- Backend services: Core API, PostgREST, Extension Registry.

---

## Build System

### Vite Configuration

- Main app configured with Vue SFC compilation, JSX support, Vue DevTools, and UnoCSS.
- Aliases for source directory.
- Dev server exposes on network with default port 5173.
- Build targets modern browsers with inline sourcemaps.
- SCSS preprocessing with auto-injected mixins.

### TypeScript Configuration

- Root config references app, node, and extension projects.
- App config extends Vue DOM config with path aliases.
- Node config for build scripts using ESNext modules.

### UnoCSS Configuration

- Presets for Tailwind utilities, attribute mode, and icons.
- Safelist for critical icons and animations.

### Module Federation Builds

- Extensions use separate Vite builds with Module Federation.
- Expose components and share dependencies like Vue and Pinia.

### Build Scripts

- dev: Start Vite dev server.
- dev:all: Run dev for host and extensions concurrently.
- build: Type-check and build.
- build:ext: Build extensions.
- build:all: Build host and extensions.
- preview: Preview built app.
- build-only: Build without checks.
- type-check: Run TypeScript checks.
- format: Format code with Prettier.
- deploy:cf: Build for Cloudflare and deploy.

Workflow: Use dev:all for development, build:all for production, type-check for validation, deploy:cf for deployment.

---

## Development Environment

### Prerequisites

- Node.js v20.19.0 or v22.12.0+
- pnpm v10.26.2
- Git latest

### Setup Steps

1. Clone repository.
2. Install dependencies with pnpm.
3. Configure environment variables in .env file.
4. Start dev server with pnpm dev or dev:all.
5. Access at localhost:5173 (host) and higher ports for extensions.

### Dev Server Configuration

- HMR for Vue components, SCSS, and TypeScript.
- Options: host exposure, port, strict port, auto-open, CORS.

---

## Configuration Management

### Config Schema

- Defined with Zod for URLs, secrets, and IDs.
- Includes core API, PostgREST, registry, JWT secret, client ID.

### Adapter System

- Three adapters: dev (Vite env + localStorage), HTTP (Cloudflare API), localStorage (fallback).
- Selection based on environment and deployment target.

### Environment Variables

- Vite vars prefixed with VITE_ for core URLs, secrets, deployment target, dev mode.
- Reactive access in code via CONFIG.

---

## Cloudflare Workers Deployment

### Wrangler Configuration

- Main entry:
- Vars for environment variables.
- Assets binding for dist directory with SPA routing.
- Observability enabled.
- Custom domains via routes.

### Server Implementation

- Hono app with bindings for assets and env vars.
- API endpoints: /api/config for reading config.
- Static assets served via assets binding.
- SPA routing handles client-side paths.

### Deployment Workflow

- Build with Cloudflare mode.
- Deploy via Wrangler.
- Set secrets for sensitive data.

---

## CI/CD

### Recommended Pipeline

- GitHub Actions on push to main.
- Steps: checkout, setup pnpm/Node, install deps, type-check, build all, deploy to Cloudflare.
- Use secrets for Cloudflare API token.

### Testing Strategy

- Unit tests with Vitest and Vue Test Utils (future).
- E2E tests with Playwright against staging (future).

---

## Monitoring & Observability

### Logging System

- Observability module with Log class for structured logging.
- Database API for querying logs by trace ID.

### Cloudflare Analytics

- Metrics: requests, response times, errors, bandwidth.
- Accessible via Cloudflare dashboard.

### Error Tracking

- Real-time logs via wrangler tail.
- Structured JSON logging for errors.

---

## Security

### JWT Authentication

- Tokens generated with jose library using HS256.
- Expiration: 24 hours.
- Stored in auth store.

### API Authentication

- All calls include Bearer token in headers.

### CORS Configuration

- Backend allows all origins, methods, and headers.

### Content Security Policy

- Planned: Add CSP headers in Wrangler config.

---

## Troubleshooting

### Build Errors

- Module not found: Verify tsconfig paths.
- SCSS error: Ensure sass-embedded installed.

### Deployment Errors

- Wrangler failed: Check auth and config.
- Assets not found: Build before deploy.

### Runtime Errors

- Config empty: Set Wrangler secrets.
- Extension load failed: Check registry URL and CORS.

---

## References

### Internal Documentation

- Root Architecture
- Extension Architecture
- Business Architecture

### External Documentation

- [Vite](https://vitejs.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Hono](https://hono.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

**Last Updated**: January 2, 2026
