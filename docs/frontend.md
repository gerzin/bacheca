# Frontend Development

## Prerequisites

- Node.js 20+
- npm
- Docker (optional, for containerized development)

## Quick Start

1. **Make sure the backend is running** (see [backend.md](backend.md))

2. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

4. **Open the app**
   - http://localhost:3000

## Development with Docker

1. **Start the frontend container**

   ```bash
   cd frontend
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

   This starts the Next.js dev server with hot reload on port `3000`.

## Useful Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── components/   # Shared components
│   │   ├── i-miei-annunci/
│   │   ├── modifica-annuncio/
│   │   └── nuovo-annuncio/
│   └── lib/
│       ├── api.ts        # API client
│       └── types.ts      # TypeScript types
├── public/               # Static assets
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
