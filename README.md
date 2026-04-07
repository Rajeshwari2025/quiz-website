# Secure Quiz Platform

Greenfield monorepo for a secure quiz platform with:

- `apps/api`: Express + Prisma + Socket.io backend
- `apps/web`: Next.js App Router frontend
- `packages/shared`: shared types, enums, and Zod contracts
- `packages/ui`: reusable UI components

## Quick start

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Copy `apps/web/.env.example` to `apps/web/.env.local`
3. Install dependencies with `npm install`
4. Generate Prisma client with `npm run prisma:generate`
5. Run migrations with `npm run prisma:migrate`
6. Start both apps with `npm run dev`

## Product capabilities

- JWT auth with bcrypt password hashing and refresh sessions
- Faculty and student roles with invite-only faculty onboarding
- Versioned quiz builder with draft/publish/clone flows
- Secure student attempts with autosave, timer, and anti-cheat event logging
- Faculty analytics, student history, QR access, PDF exports, and live session hooks

