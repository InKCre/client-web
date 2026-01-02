# Infrastructure Documentation

## Table of Contents

- [Overview](#overview)
- [Build System](#build-system)
- [Development Environment](#development-environment)
- [Configuration Management](#configuration-management)
- [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
- [CI/CD](#cicd)
- [Monitoring & Observability](#monitoring--observability)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [References](#references)

---

## Overview

InKCre client-web is built with **Vite** and deployed on **Cloudflare Workers** for global edge distribution. The system supports:

- **Multi-package workspace** (pnpm workspaces)
- **Module Federation** for dynamic extensions
- **Edge deployment** with Cloudflare Workers
- **Multi-environment** configuration (dev, staging, production)

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           Cloudflare Workers (Edge)         │
│  ┌────────────────────────────────────┐    │
│  │  Hono Server (server/index.ts)     │    │
│  │  - API routes: /api/config         │    │
│  │  - Static assets proxy             │    │
│  └────────────┬───────────────────────┘    │
│               │                              │
│  ┌────────────▼───────────────────────┐    │
│  │  Assets Binding (dist/)            │    │
│  │  - Vue SPA build                   │    │
│  │  - JavaScript chunks               │    │
│  │  - CSS, images                     │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                │
                ↓ API calls
┌─────────────────────────────────────────────┐
│         Backend Services                     │
│  - Core API (INKCRE_CORE_URL)               │
│  - PostgREST (INKCRE_PGREST_URL)            │
│  - Extension Registry                        │
└─────────────────────────────────────────────┘
```

---

## Build System

### Vite Configuration

**Main App** (`vite.config.ts`):

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import UnoCSS from "unocss/vite";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  plugins: [
    vue(),              // Vue 3 SFC compilation
    vueJsx(),           // JSX support
    vueDevTools(),      // Vue DevTools integration
    UnoCSS(),           // Atomic CSS
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,         // Expose on network
    port: 5173,         // Default dev port
  },
  build: {
    target: "esnext",   // Modern browsers only
    sourcemap: "inline", // Debug support
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        // Auto-inject design system mixins
        additionalData: (source, file) => {
          if (file.includes("src/components/") || file.includes("src/views/")) {
            return `
              @use "@inkcre/web-design/styles/mixins" as *;
              @use "@inkcre/web-design/styles/functions" as *;
              @use "@/styles/index.scss" as *;
              ${source}
            `;
          }
          return source;
        },
      },
    },
  },
});
```

### TypeScript Configuration

**Root** (`tsconfig.json`):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.app.json" },
    { "path": "./extensions/twitter" }
  ]
}
```

**App** (`tsconfig.app.json`):

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Node** (`tsconfig.node.json`) - For build scripts:

```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "include": ["vite.config.ts", "server/**/*.ts"],
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### UnoCSS Configuration

**`uno.config.ts`**:

```typescript
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),         // Tailwind/Windi utilities
    presetAttributify(), // Attribute mode
    presetIcons(),       // Icon utilities
  ],
  safelist: [
    // Pre-generate critical icons
    "i-mdi-menu",
    "i-mdi-loading",
    "i-mdi-refresh",
    "i-mdi-chevron-right",
    "i-mdi-chevron-left",
    "i-mdi-chevron-down",
    "animate-spin",
  ],
});
```

### Module Federation Builds

**Extensions** use separate Vite builds with `@module-federation/vite`:

```typescript
// extensions/twitter/vite.config.ts
import { federation } from "@module-federation/vite/rspack";

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: "extension_twitter",
      filename: "remoteEntry.js",
      exposes: {
        "./Extension": "./src/Extension.ts",
      },
      shared: {
        vue: { singleton: true, requiredVersion: "^3.5.0" },
        pinia: { singleton: true, requiredVersion: "^3.0.0" },
        "vue-router": { singleton: true, requiredVersion: "^4.5.0" },
        "@vueuse/core": { singleton: true, requiredVersion: "^14.0.0" },
        zod: { singleton: true, requiredVersion: "^4.0.0" },
      },
    }),
  ],
  build: {
    outDir: "dist/client-web",
  },
});
```

### Build Scripts

**`package.json`**:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:all": "concurrently \"pnpm dev\" \"pnpm -r --filter './extensions/*' dev\"",
    "build": "run-p type-check \"build-only {@}\" --",
    "build:ext": "pnpm -r --filter './extensions/*' build",
    "build:all": "pnpm build && pnpm build:ext",
    "preview": "vite preview",
    "build-only": "vite build",
    "type-check": "vue-tsc --build",
    "format": "prettier --write src/",
    "deploy:cf": "npm run build -- --mode cloudflare && wrangler deploy"
  }
}
```

**Workflow**:

```bash
# Development: Host + All Extensions
pnpm dev:all

# Build for production
pnpm build:all

# Type checking
pnpm type-check

# Deploy to Cloudflare
pnpm deploy:cf
```

---

## Development Environment

### Prerequisites

- **Node.js**: v20.19.0 or v22.12.0+
- **pnpm**: v10.26.2
- **Git**: Latest

### Setup Steps

1. **Clone repository**:

```bash
git clone https://github.com/InKCre/client-web.git
cd client-web
```

1. **Install dependencies**:

```bash
pnpm install
```

1. **Configure environment** (optional):

```bash
# Create .env file
cp .env.example .env

# Edit .env
VITE_INKCRE_CORE_URL=https://api.inkcre.dev
VITE_INKCRE_PGREST_URL=https://db.inkcre.dev
VITE_INKCRE_JWT_SECRET=your-secret
```

1. **Start development server**:

```bash
# Host only
pnpm dev

# Host + Extensions
pnpm dev:all
```

1. **Access application**:

- Host: <http://localhost:5173>
- Extensions: <http://localhost:5174>, 5175, etc.

### Dev Server Configuration

**Hot Module Replacement** (HMR):

- Vue components: Full HMR support
- SCSS: Style hot reload
- TypeScript: Fast refresh

**Dev Server Options**:

```typescript
server: {
  host: true,           // Expose on network (0.0.0.0)
  port: 5173,           // Port
  strictPort: false,    // Find next available port if occupied
  open: false,          // Don't auto-open browser
  cors: true,           // Enable CORS for dev
}
```

---

## Configuration Management

### Config Schema

**Defined in `src/config.ts`**:

```typescript
export const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.url().default(""),
  INKCRE_PGREST_URL: z.url().default(""),
  INKCRE_EXTENSION_REGISTRY_URL: z.url().default(""),
  INKCRE_JWT_SECRET: z.string().default(""),
  INKCRE_CLIENT_ID: z.uuid().default(""),
});

export type Config = z.infer<typeof ConfigSchema>;
```

### Adapter System

**Three adapters** for different environments:

#### 1. Dev Adapter (Local Development)

```typescript
const devAdapter = {
  name: "dev",
  read: async () => {
    // Read from Vite env vars (VITE_*)
    const config = Object.keys(import.meta.env)
      .filter(key => key.startsWith("VITE_INKCRE_"))
      .reduce((acc, key) => {
        const configKey = key.replace("VITE_", "");
        acc[configKey] = import.meta.env[key];
        return acc;
      }, {});

    // Overlay with localStorage
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      Object.assign(config, JSON.parse(stored));
    }

    return config;
  },
  write: async (config) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  },
};
```

#### 2. HTTP Adapter (Cloudflare Deployment)

```typescript
const httpAdapter = {
  name: "http",
  read: async () => {
    const res = await fetch("/api/config");
    if (res.ok) {
      return res.json();
    }
    return {};
  },
  write: async (config) => {
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  },
};
```

#### 3. LocalStorage Adapter (Fallback)

```typescript
const localStorageAdapter = {
  name: "localStorage",
  read: async () => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  },
  write: async (config) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  },
};
```

### Adapter Selection

```typescript
function selectAdapter(): ConfigAdapterWithWrite {
  if (import.meta.env.VITE_DEV_MODE === "true") {
    return devAdapter;
  }
  
  const storedAdapter = localStorage.getItem(ADAPTER_STORAGE_KEY);
  if (storedAdapter === "http") return httpAdapter;
  if (storedAdapter === "localStorage") return localStorageAdapter;
  
  if (import.meta.env.VITE_DEPLOY_TO === "CLOUDFLARE") {
    return httpAdapter;
  }
  
  return localStorageAdapter;
}
```

### Environment Variables

**Vite Environment Variables** (`.env`):

```bash
# Core API
VITE_INKCRE_CORE_URL=https://api.inkcre.dev

# Database API
VITE_INKCRE_PGREST_URL=https://db.inkcre.dev/rest/v1

# Extension Registry
VITE_INKCRE_EXTENSION_REGISTRY_URL=https://cdn.inkcre.dev/extensions

# JWT Secret
VITE_INKCRE_JWT_SECRET=your-secret-key

# Deployment target
VITE_DEPLOY_TO=CLOUDFLARE

# Dev mode
VITE_DEV_MODE=true
```

**Access in code**:

```typescript
import { CONFIG } from "@/config";

// Reactive config
watch(() => CONFIG.value.INKCRE_CORE_URL, (newUrl) => {
  console.log("Core URL changed:", newUrl);
});
```

---

## Cloudflare Workers Deployment

### Wrangler Configuration

**`wrangler.jsonc`**:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "inkcre-web",
  "main": "server/index.ts",
  "compatibility_date": "2025-02-14",
  
  // Environment variables
  "vars": {
    "INKCRE_CORE_URL": "",
    "INKCRE_PGREST_URL": "",
    "INKCRE_JWT_SECRET": ""
  },
  
  // Static assets
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  
  // Observability
  "observability": {
    "enabled": true
  },
  
  // Custom domains
  "routes": [
    {
      "pattern": "inkcre.lanzhijiang.dev",
      "custom_domain": true
    }
  ]
}
```

### Server Implementation

**`server/index.ts`** - Hono edge server:

```typescript
import { Hono } from "hono";

type Bindings = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  INKCRE_CORE_URL?: string;
  INKCRE_PGREST_URL?: string;
  INKCRE_JWT_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Config API endpoint
app.get("/api/config", (c) => {
  return c.json({
    INKCRE_CORE_URL: c.env.INKCRE_CORE_URL || "",
    INKCRE_PGREST_URL: c.env.INKCRE_PGREST_URL || "",
    INKCRE_JWT_SECRET: c.env.INKCRE_JWT_SECRET || "",
  });
});

// Config save endpoint (read-only on server)
app.post("/api/config", async (c) => {
  console.log("[Config] Received save request (read-only)");
  return c.json({ success: true });
});

// Static assets (Vue SPA)
app.get("/*", async (c) => {
  return await c.env.ASSETS.fetch(c.req.raw);
});

export default app;
```

### SPA Routing

Cloudflare Workers handles SPA routing via `not_found_handling: "single-page-application"`:

- All 404s rewrite to `index.html`
- Vue Router handles client-side routing
- API routes (`/api/*`) handled before static fallback

### Deployment Workflow

```bash
# 1. Build application
pnpm build -- --mode cloudflare

# 2. Deploy to Cloudflare
wrangler deploy

# Or combined
pnpm deploy:cf
```

### Environment Secrets

**Set secrets via Wrangler**:

```bash
# Set sensitive values as secrets
wrangler secret put INKCRE_JWT_SECRET

# List secrets
wrangler secret list
```

**Access in code**:

```typescript
app.get("/api/config", (c) => {
  return c.json({
    INKCRE_JWT_SECRET: c.env.INKCRE_JWT_SECRET, // From secrets
  });
});
```

---

## CI/CD

### Recommended Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 10.26.2
      
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Build
        run: pnpm build:all
      
      - name: Deploy to Cloudflare
        run: pnpm wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Testing Strategy

**Unit Tests** (future):

- Vitest for business logic
- Vue Test Utils for components

**E2E Tests** (future):

- Playwright for user flows
- Test against staging environment

---

## Monitoring & Observability

### Logging System

**Observability module** (`src/business/obsrv.ts`):

```typescript
export class Log extends Z.class({
  id: z.string(),
  trace_id: z.string(),
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.any()).optional(),
}) {
  static dbApi = new DBAPIClient("logs", Log);

  static async getByTraceId(traceId: string): Promise<Log[]> {
    return (await this.dbApi
      .from()
      .select()
      .eq("trace_id", traceId)
      .order("timestamp", { ascending: false })
    ).data!.map(d => new Log(d));
  }
}
```

### Cloudflare Analytics

**Built-in metrics**:

- Request count
- Response time
- Error rate
- Bandwidth usage

**Access**: Cloudflare dashboard → Workers → Analytics

### Error Tracking

**Console logs** available in Cloudflare Logs:

```bash
# Tail logs in real-time
wrangler tail
```

**Structured logging**:

```typescript
console.log(JSON.stringify({
  level: "error",
  message: "Failed to load extension",
  context: { extensionId, error: error.message },
}));
```

---

## Security

### JWT Authentication

**Token generation** (`src/stores/auth.ts`):

```typescript
import * as jose from "jose";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);

  async function getToken(): Promise<string> {
    if (token.value) return token.value;

    const secret = new TextEncoder().encode(CONFIG.value.INKCRE_JWT_SECRET);
    const jwt = await new jose.SignJWT({ sub: CONFIG.value.INKCRE_CLIENT_ID })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    token.value = jwt;
    return jwt;
  }

  return { token, getToken };
});
```

### API Authentication

**All API calls include JWT**:

```typescript
protected async getAuthHeaders(): Promise<object> {
  return {
    Authorization: `Bearer ${await CoreAPIClient.authStore.getToken()}`,
  };
}
```

### CORS Configuration

**Backend CORS** (handled by Core API):

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

### Content Security Policy

**Future**: Add CSP headers in Wrangler config:

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

---

## Troubleshooting

### Build Errors

**Error**: `Cannot find module '@/...'`

**Solution**: Check `tsconfig.app.json` paths:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**Error**: `SCSS syntax error`

**Solution**: Verify SCSS preprocessor:

```bash
pnpm add -D sass-embedded
```

### Deployment Errors

**Error**: `Wrangler deploy failed`

**Solution**: Check Wrangler config and auth:

```bash
wrangler whoami
wrangler login
```

**Error**: `Assets binding not found`

**Solution**: Ensure `dist/` exists before deploy:

```bash
pnpm build
wrangler deploy
```

### Runtime Errors

**Error**: `Config URL is empty`

**Solution**: Set environment variables in Wrangler:

```bash
wrangler secret put INKCRE_CORE_URL
```

**Error**: `Extension failed to load`

**Solution**: Check extension registry URL and CORS:

```typescript
console.log(CONFIG.value.INKCRE_EXTENSION_REGISTRY_URL);
```

---

## References

### Internal Documentation

- [Root Architecture](./ARCHITECTURE.md)
- [Extension Architecture](./extensions/ARCHITECTURE.md)
- [Business Architecture](./src/business/ARCHITECTURE.md)

### External Documentation

- [Vite](https://vitejs.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Hono](https://hono.dev/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

**Last Updated**: January 2, 2026
