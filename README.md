# Green Land — Agricultural Machinery Website & Admin CMS

> _Growing the Future of Agriculture_

A full-stack marketing website and content-management system for **Green Land**, a manufacturer of agricultural machinery (tillage, seeding, harvesting and post-harvest equipment). The public site is a fast, animated Next.js App Router app — including an interactive 3D hero scene — backed by a PostgreSQL database that powers a complete role-based admin dashboard.

---

## ✨ Features

### Public site
- **Interactive 3D hero** — a tractor drives in, the rice field grows, clouds drift and birds fly overhead (react-three-fiber + drei). Drag the tractor for a full 360° view.
- **Scroll-driven 3D background** — a second tractor weaves down through the content sections.
- **Dynamic, DB-backed pages** — home, products (by category & product), blog, news and testimonials all render live from the database (`force-dynamic`); admin edits appear immediately.
- **Product catalogue** with categories, image galleries and structured specification sheets.
- **Blog & news** with rich-text content and image galleries.
- **Auto-rotating testimonials**, animated marquees and motion throughout (framer-motion), all reduced-motion aware.

### Admin CMS (`/admin`)
- **Custom JWT authentication** — httpOnly `SameSite=strict` cookies, bcrypt password hashing, DB-backed refresh-token rotation, login rate-limiting and account lockout, plus password reset.
- **Role-based access control** — `SUPER_ADMIN` (everything incl. user management), `ADMIN` (all content + analytics), `EDITOR` (news & blogs only).
- **Full CRUD modules** — products, categories, news, blogs, testimonials and users, each as a manager + form vertical slice.
- **Rich-text editor** (Tiptap), **image upload** with `sharp` compression, and **analytics dashboards** (Recharts).
- **Route protection** via middleware over `/admin/*` and `/api/admin/*`, with transparent access-token refresh.

---

## 🧱 Tech stack

| Area | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, `tailwind-merge`, `class-variance-authority`, shadcn-style UI |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` |
| Animation | `framer-motion` |
| Database | PostgreSQL (Neon / Supabase) via [Prisma 6](https://www.prisma.io/) |
| Auth | Custom JWT (`jose`-style flow) + `bcryptjs` |
| Rich text | Tiptap |
| Charts | Recharts |
| Images | `sharp` (compression), local `public/uploads` storage (swappable) |
| Notifications | `sonner` |
| Analytics | Vercel Analytics |

---

## 📁 Project structure

```
app/
  (public pages)        home, products, blog, news, contact, login, reset flows
  admin/                role-gated dashboard (products, categories, news, blogs, testimonials, users)
  api/                  REST routes: auth, products, categories, news, blogs, testimonials, upload, admin/users
  layout.tsx, globals.css

components/
  home/                 hero & 3D scenes, stats, categories, featured products, testimonials, CTA
  products/ blog/ news/ contact/   public section components
  admin/                per-module managers + forms, shared admin UI, image upload, rich-text editor
  ui/                   shared shadcn-style primitives

lib/
  auth/                 jwt, password, session, tokens, rbac, ratelimit
  validators/           zod-style schemas per resource
  queries.ts            public DB read-layer (server components)
  api.ts, db.ts, storage.ts, ...

prisma/
  schema.prisma         User, RefreshToken, Category, Product(+Image), News(+Image), Blog(+Image), Testimonial
  migrations/  seed.ts

middleware.ts           guards /admin/* and /api/admin/*
scripts/                product-image import / normalization helpers
```

---

## 🚀 Getting started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example file and fill in your values:
```bash
cp .env.example .env
```
Key variables (see `.env.example` for the full annotated list):
```
DATABASE_URL=postgresql://...           # your Postgres connection string
JWT_ACCESS_SECRET=...                    # signs short-lived access tokens
JWT_REFRESH_SECRET=...                   # signs refresh tokens
ACCESS_TOKEN_TTL=15m                     # token lifetimes
REFRESH_TOKEN_TTL_DAYS=7
SEED_ADMIN_EMAIL=admin@greenland.ag      # initial super-admin (change in prod)
SEED_ADMIN_PASSWORD=ChangeMe123!
APP_URL=http://localhost:3000            # base URL for password-reset links
```
Generate the JWT secrets with `openssl rand -base64 48`.

### 3. Set up the database
```bash
npm run db:migrate   # apply migrations
npm run db:generate  # generate the Prisma client
npm run db:seed      # seed the super-admin + sample content
```

### 4. Run the dev server
```bash
npm run dev
```
Open <http://localhost:3000>. The admin dashboard lives at <http://localhost:3000/admin> — sign in with the seeded super-admin credentials.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the database (drops + re-migrates + reseeds) |

---

## 🔐 Roles & permissions

| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | All content + analytics **and** user management |
| `ADMIN` | All content modules + analytics (no user management) |
| `EDITOR` | News & blogs only |

> **Note:** After running `prisma generate`/migrate, if the dev server serves a stale Prisma client, clear the cache with `rm -rf .next` and restart `npm run dev`.

---

## 📝 Notes
- Image uploads are stored locally under `public/uploads/` and abstracted behind `lib/storage.ts`, so they can later be swapped for Vercel Blob / S3.
- The password-reset email is dev-stubbed (the reset link is logged/returned) and should be wired to a real mailer in production.
- `.env` is gitignored — never commit secrets. Use `.env.example` as the template.

---

## 📄 License

Proprietary — © Green Land. All rights reserved.
