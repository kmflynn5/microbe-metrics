# Microbe-Metrics: JGI Genomics Analytics Dashboard

Advanced data pipeline and analytics dashboard for bacterial and archaeal genome analysis from the JGI Data Portal.

## Project Overview

**Domain**: `genomes.kenflynn.dev`
**Purpose**: Showcase data engineering capabilities with real-world genomics data
**Tech Stack**: SvelteKit + D3.js (frontend), Cloudflare Workers + R2 + DuckDB (backend)

## Features

### ✅ Implemented (Session 5 Complete)

- **Real-time Data Pipeline**: Automated JGI metadata extraction and processing
- **Backend Infrastructure**: Complete Cloudflare Worker with JGI API integration
- **Data Models**: Comprehensive TypeScript interfaces and DuckDB analytics schema
- **API Client**: Production-ready client with error handling and mock fallbacks
- **State Management**: Reactive Svelte stores for real-time data updates
- **Professional Dashboard**: Responsive design with real analytics integration
- **Evidence MD Reports**: Automated analytics documentation generation

### 🚧 In Development (Next Session)

- **Advanced Analytics**: Complex genomics research trend analysis and forecasting
- **Interactive Visualizations**: D3.js charts for genomics data exploration
- **Quality Monitoring**: Data validation, anomaly detection, and pipeline observability
- **Production Deployment**: Live Cloudflare Workers and R2 storage

## Architecture

### Backend Infrastructure

```
JGI Data Portal API → Cloudflare Worker → R2 Storage → DuckDB → Evidence MD → SvelteKit Dashboard
                          ↓               ↓          ↓           ↓           ↓
                   Metadata Processing  Analytics   Complex     Automated   Interactive
                   & Quality Control    Storage     Queries     Reports     Visualizations
```

### Key Components

- **JGI Data Extractor** (`src/worker/jgi-extractor.ts`): Handles API communication and data extraction
- **Analytics Processor** (`src/worker/analytics-processor.ts`): Computes trends and metrics
- **R2 Storage Manager** (`src/worker/storage-manager.ts`): Manages data organization in R2
- **Evidence Generator** (`src/worker/evidence-generator.ts`): Creates automated reports
- **API Client** (`src/lib/api/client.ts`): Frontend-backend communication
- **Svelte Stores** (`src/lib/stores/analytics.ts`): Reactive state management
- **DuckDB Analytics** (`src/lib/duckdb/schema.ts`): Complex analytical queries

## Development

### Quick Start

```sh
# Install dependencies
npm install

# Option 1: Frontend only (mock data)
npm run dev              # → SvelteKit frontend at localhost:5173

# Option 2: Full stack with local worker debugging (run both in separate terminals)
# Terminal 1:
npm run dev              # → SvelteKit frontend at localhost:5173

# Terminal 2:
npm run dev:worker       # → Cloudflare Worker API at localhost:8787
```

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Wrangler CLI: `npm install -g wrangler`

### Initial Setup

```sh
# 1. Install dependencies
npm install

# 2. Copy environment template (optional for local dev)
cp .env.example .env

# 3. Copy worker dev vars template (optional)
cp .dev.vars.example .dev.vars

# 4. Edit .env with your Cloudflare credentials (only needed for deployment)
# See DEPLOYMENT-QUICKSTART.md for details on getting credentials
nano .env
```

### Local Development

**Option 1: Frontend Only (Mock Data)**

```sh
# Start SvelteKit dev server with mock data
npm run dev

# Open in browser
open http://localhost:5173
```

**Option 2: Full Stack (Worker + Frontend)**

```sh
# Terminal 1: Start SvelteKit frontend
npm run dev

# Terminal 2: Start Cloudflare Worker with debug endpoints
npm run dev:worker

# Frontend UI:  http://localhost:5173
# Worker API:   http://localhost:8787
# Debug endpoints available at /api/debug/*
```

### Testing

```sh
# Run unit tests
npm run test:unit

# Run tests in watch mode
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Code Quality

```sh
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format

# Type checking
npm run type-check

# Run all validations
npm run validate
```

### Build & Deploy

```sh
# Create production build
npm run build

# Preview production build locally
npm run preview

# Deploy Worker to Cloudflare
wrangler deploy

# Deploy to Cloudflare Pages (manual)
npm run deploy:production

# Deploy to staging
npm run deploy:staging
```

### Worker Development

#### Local Worker Development (Recommended)

Start the worker locally with full R2/KV bindings for easy debugging:

```sh
# Start worker with development environment and bindings
npm run dev:worker

# Worker runs at: http://localhost:8787
# Has full access to R2 and KV (uses dev/staging buckets)
# No authentication required for debug endpoints
```

**Available npm scripts:**

- `npm run dev:worker` - Local worker with dev bindings (recommended)
- `npm run dev:worker:remote` - Remote worker on Cloudflare network
- `npm run dev:worker:local` - Fully local worker (no remote bindings)

#### Debug Endpoints (Development Only)

When running `npm run dev:worker`, these debug endpoints are available:

```sh
# Environment info
curl http://localhost:8787/api/debug/info | jq

# List all KV keys
curl http://localhost:8787/api/debug/kv | jq

# Get specific KV value
curl 'http://localhost:8787/api/debug/kv/get?key=analytics_overview' | jq

# List R2 bucket contents
curl http://localhost:8787/api/debug/r2 | jq

# List R2 with prefix filter
curl 'http://localhost:8787/api/debug/r2?prefix=raw' | jq

# Get specific R2 object
curl 'http://localhost:8787/api/debug/r2/get?key=raw/jgi-responses/2025-10-05.json' | jq

# Trigger manual data extraction (no auth needed in dev)
curl -X POST http://localhost:8787/api/debug/trigger | jq
```

**Note:** Debug endpoints are automatically disabled in production (return 403).

#### Production API Endpoints

```sh
# Health check
curl http://localhost:8787/api/health

# Analytics overview
curl http://localhost:8787/api/analytics/overview

# Pipeline health metrics
curl http://localhost:8787/api/analytics/pipeline-health

# Recent activity feed
curl http://localhost:8787/api/analytics/recent-activity
```

#### Worker Deployment

```sh
# Deploy worker to production
wrangler deploy

# Deploy to staging environment
wrangler deploy --env staging

# View worker logs in real-time
wrangler tail microbe-metrics-worker

# Create KV namespaces
wrangler kv:namespace create "METADATA_CACHE"
wrangler kv:namespace create "METADATA_CACHE" --preview

# List R2 buckets
wrangler r2 bucket list
```

### Useful Commands

```sh
# Check project structure
npm run check

# Watch for type errors
npm run check:watch

# Clean build artifacts
rm -rf .svelte-kit node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# View environment info
node --version
npm --version
wrangler --version
```

### Debugging

#### Frontend Debugging

- Open browser DevTools (F12)
- Check Console tab for errors
- Use Network tab to inspect API calls
- Svelte DevTools extension recommended

#### Worker Debugging (Local Development)

The easiest way to debug the worker is using the local development environment:

```sh
# 1. Start local worker with debug endpoints
npm run dev:worker

# 2. Use curl to test and inspect (no browser/CORS issues!)
curl http://localhost:8787/api/debug/info | jq

# 3. Inspect R2 storage
curl 'http://localhost:8787/api/debug/r2?prefix=raw' | jq

# 4. Check KV cache
curl http://localhost:8787/api/debug/kv | jq

# 5. View specific KV values
curl 'http://localhost:8787/api/debug/kv/get?key=analytics_overview' | jq

# 6. Manually trigger extraction to test pipeline
curl -X POST http://localhost:8787/api/debug/trigger | jq
```

**Benefits of local worker debugging:**

- ✅ No Cloudflare bot protection blocking curl requests
- ✅ Full access to R2 and KV bindings (uses dev buckets)
- ✅ Instant changes - no deployment needed
- ✅ Debug endpoints only available in development
- ✅ See console.log output directly in terminal

#### Worker Debugging (Production)

```sh
# View real-time logs from production worker
wrangler tail microbe-metrics-worker

# View logs with JSON formatting
wrangler tail microbe-metrics-worker --format json

# Filter logs by status
wrangler tail microbe-metrics-worker --status error

# Filter logs by HTTP method
wrangler tail microbe-metrics-worker --method POST
```

#### Common Issues & Solutions

**Worker-related issues:**

- **"Cannot read properties of undefined (reading 'get')"**
  - Solution: Restart `wrangler dev` with `npm run dev:worker` (includes `--env development` flag)
  - Root cause: Missing R2/KV bindings when running without environment flag

- **403 Forbidden on curl requests**
  - Solution: Use local development `npm run dev:worker` instead of remote mode
  - Avoid: `wrangler dev --remote` (routes through Cloudflare with bot protection)

- **Debug endpoints return 403**
  - This is expected in production (they're disabled for security)
  - Use `npm run dev:worker` for local debugging

**General issues:**

- Port 5173 in use: `lsof -ti:5173 | xargs kill`
- Port 8787 in use: `lsof -ti:8787 | xargs kill`
- Build fails: `rm -rf .svelte-kit node_modules/.cache`
- Worker errors: Check `wrangler.toml` configuration
- KV errors: Verify namespace IDs match created namespaces

## Data Pipeline

- **Scheduled Extraction**: Daily automated collection from JGI Data Portal
- **Data Processing**: Validation, enrichment, and quality assessment
- **Analytics Storage**: Optimized for complex analytical queries
- **Real-time Monitoring**: Pipeline health and data quality metrics

## Dashboard Components

- **Analytics Overview**: Key genomics metrics and organism statistics
- **Pipeline Health**: Data processing status and performance monitoring
- **Recent Activity**: Live feed of genomics data processing events
- **Organism Browser**: Searchable database of bacterial and archaeal genomes

## Contributing

This is a portfolio project demonstrating data engineering capabilities. See `/docs/` for detailed technical documentation and development guidelines.

## License

MIT License - See LICENSE file for details.
