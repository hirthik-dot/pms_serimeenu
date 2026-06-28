# Dental Practice Management System

Production-grade dental practice management platform built with Next.js 15, TypeScript, MongoDB, and shadcn/ui.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4, shadcn/ui
- **State:** TanStack Query, React Hook Form
- **Database:** MongoDB Atlas, Mongoose
- **Validation:** Zod
- **Theming:** next-themes (light / dark / system)

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas cluster (or local MongoDB via Docker)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your MongoDB URI and secrets.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script            | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start development server       |
| `npm run build`   | Production build               |
| `npm run start`   | Start production server        |
| `npm run lint`    | Run ESLint                     |
| `npm run typecheck` | TypeScript type checking     |
| `npm run format`  | Format code with Prettier      |

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI and layout components
├── config/           # Environment and navigation configuration
├── constants/        # Application constants
├── features/         # Feature modules (future)
├── hooks/            # Custom React hooks
├── lib/              # Core libraries (db, errors, api helpers)
├── middleware/       # API middleware utilities
├── models/           # Mongoose models (future)
├── providers/        # React context providers
├── repositories/     # Data access layer
├── services/         # Business logic layer
├── styles/           # Additional global styles
├── types/            # Shared TypeScript types
├── utils/            # Pure utility functions
└── validators/       # Zod validation schemas
```

## Documentation

- [API Specification](./docs/API_SPECIFICATION.md)
- [Full setup guide & login credentials](../README.md) (project root)

## Docker

Run with MongoDB locally:

```bash
docker compose up --build
```

## License

Private — All rights reserved.
