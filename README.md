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

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:5173
```

### Build

```sh
# Create production build
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```


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
