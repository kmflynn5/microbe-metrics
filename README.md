# Microbe-Metrics: JGI Genomics Analytics Dashboard

Advanced data pipeline and analytics dashboard for bacterial and archaeal genome analysis from the JGI Data Portal.

## Project Overview

**Domain**: `genomes.kenflynn.dev`
**Purpose**: Showcase data engineering capabilities with real-world genomics data
**Tech Stack**: SvelteKit + D3.js (frontend), Cloudflare Workers + R2 + DuckDB (backend)

## Features

- **Real-time Data Pipeline**: Automated JGI metadata extraction and processing
- **Advanced Analytics**: Complex genomics research trend analysis and forecasting
- **Interactive Visualizations**: D3.js charts for genomics data exploration
- **Quality Monitoring**: Data validation, anomaly detection, and pipeline observability
- **Professional Dashboard**: Responsive design with dark mode support

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

## Architecture

```
JGI Data Portal API → Cloudflare Worker → R2 Storage → DuckDB → Evidence MD → SvelteKit Dashboard
                           ↓               ↓          ↓           ↓           ↓
                    Metadata Processing  Analytics   Complex     Automated   Interactive
                    & Quality Control    Storage     Queries     Reports     Visualizations
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
