# Passwordr

## Overview

Passwordr is an AI-powered password strength estimator tool. Users enter passwords and receive real-time analysis including strength scores, security factors (positive/negative), improvement suggestions, and crack time estimates. The application uses OpenAI's GPT model to provide intelligent, context-aware security recommendations beyond basic pattern matching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system (CSS variables for theming, light/dark mode support)
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Build Tool**: esbuild for server bundling, Vite for client

### Password Analysis System
- **Local Analysis**: Server-side password analyzer (`server/password-analyzer.ts`) checks for common passwords, keyboard patterns, leetspeak substitutions, sequential/repeating characters, and calculates entropy
- **AI Enhancement**: OpenAI integration provides additional context-aware suggestions and improvement tips
- **Response Structure**: Returns score (0-100), strength label, positive/negative factors, suggestions array, and estimated crack time

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` contains Zod schemas for validation and type definitions
- **Current State**: Schema defines request/response types; no persistent user data storage currently implemented

### Project Structure
```
client/           # React frontend application
  src/
    components/   # UI components (shadcn/ui + custom)
    pages/        # Route page components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  password-analyzer.ts  # Core analysis logic
shared/           # Shared types and schemas
  schema.ts       # Zod schemas for API contracts
```

## External Dependencies

### AI Services
- **OpenAI API**: Accessed via Replit's AI Integrations service (environment variables `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`)
- **Model**: GPT-5 for generating contextual password improvement suggestions

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: Used for schema migrations (`db:push` script)

### Key NPM Packages
- `@tanstack/react-query`: Data fetching and caching
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod integration
- `zod`: Runtime type validation for API requests/responses
- `openai`: OpenAI API client
- `framer-motion`: Animation library
- Radix UI primitives: Accessible component foundations