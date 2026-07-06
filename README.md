<div align="center">

# ◆ WealthWise

### Your Money. Your Rules. Total Clarity.

A complete, privacy-first personal finance tracker that runs entirely on your machine.
No cloud, no ads, no external APIs — just you and your money.

<br/>

<a href="https://nextjs.org/"><img src="https://cdn.simpleicons.org/nextdotjs/000000" width="18" height="18" /> Next.js 14</a> · 
<a href="https://www.typescriptlang.org/"><img src="https://cdn.simpleicons.org/typescript/3178C6" width="18" height="18" /> TypeScript 5</a> · 
<a href="https://tailwindcss.com/"><img src="https://cdn.simpleicons.org/tailwindcss/38bdf8" width="18" height="18" /> Tailwind CSS</a> · 
<a href="https://www.prisma.io/"><img src="https://cdn.simpleicons.org/prisma/2D3748" width="18" height="18" /> Prisma ORM</a> · 
<a href="https://www.sqlite.org/"><img src="https://cdn.simpleicons.org/sqlite/003B57" width="18" height="18" /> SQLite</a> · 
<a href="https://github.com/pmndrs/zustand"><img src="https://lucide.dev/api/icons/database?color=443E38" width="18" height="18" /> Zustand</a> · 
<a href="https://recharts.org/"><img src="https://lucide.dev/api/icons/bar-chart-3?color=FF6B6B" width="18" height="18" /> Recharts</a> · 
<a href="https://zod.dev/"><img src="https://cdn.simpleicons.org/zod/3068B7" width="18" height="18" /> Zod</a> · 
<a href="https://lucide.dev/"><img src="https://cdn.simpleicons.org/lucide/000000" width="18" height="18" /> Lucide</a> · 
<a href="LICENSE"><img src="https://lucide.dev/api/icons/shield-check?color=FFB020" width="18" height="18" /> MIT License</a>

</div>

---

## Screenshots

> Add your screenshots to the `screenshots/` folder in the repo root, then reference them below.

<div align="center">

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Analytics
![Analytics](screenshots/analytics.png)

### Budgets
![Budgets](screenshots/budgets.png)

### Group Splits
![Group Splits](screenshots/groups.png)

</div>

---

## Features

| | Feature | Description |
|---|---------|-------------|
| <img src="https://lucide.dev/api/icons/layout-dashboard?color=000000" width="20" height="20"> | **Dashboard** | At-a-glance view of your net worth, spending trends, and financial health |
| <img src="https://lucide.dev/api/icons/bar-chart-3?color=000000" width="20" height="20"> | **Analytics** | Interactive charts — pie, bar, area, heatmap — with period filtering |
| <img src="https://lucide.dev/api/icons/wallet?color=000000" width="20" height="20"> | **Budgets** | Per-category budgets with smart reallocation suggestions and donut progress |
| <img src="https://lucide.dev/api/icons/target?color=000000" width="20" height="20"> | **Savings Goals** | Track goals with ETA predictions, contribution history, and progress rings |
| <img src="https://lucide.dev/api/icons/repeat-2?color=000000" width="20" height="20"> | **Subscriptions** | Track recurring bills, get renewal reminders, pause/resume |
| <img src="https://lucide.dev/api/icons/repeat?color=000000" width="20" height="20"> | **Recurring** | Auto-generated recurring income/expense schedules |
| <img src="https://lucide.dev/api/icons/users?color=000000" width="20" height="20"> | **Group Splits** | Split expenses equally or by percentage, track balances, settle up |
| <img src="https://lucide.dev/api/icons/calendar-days?color=000000" width="20" height="20"> | **Calendar** | Week/month/year views showing transactions, subscriptions, and goal deadlines |
| <img src="https://lucide.dev/api/icons/brain-circuit?color=000000" width="20" height="20"> | **Insights Engine** | 15+ rule-based behavioral analysis rules and a financial health score |
| <img src="https://lucide.dev/api/icons/file-spreadsheet?color=000000" width="20" height="20"> | **CSV Import/Export** | Auto-detect columns, date formats, and transaction types |
| <img src="https://lucide.dev/api/icons/settings?color=000000" width="20" height="20"> | **Settings** | Profile management, currency preferences, category management |

## Tech Stack

| | Layer | Technology | Purpose |
|---|-------|------------|---------|
| <img src="https://cdn.simpleicons.org/nextdotjs/000000" width="18" height="18"> | **Frontend** | [Next.js 14](https://nextjs.org/) (App Router) | UI framework with SSR and API routes |
| <img src="https://cdn.simpleicons.org/typescript/000000" width="18" height="18"> | **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| <img src="https://cdn.simpleicons.org/tailwindcss/000000" width="18" height="18"> | **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework |
| <img src="https://lucide.dev/api/icons/database?color=000000" width="18" height="18"> | **State** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight client-side state |
| <img src="https://lucide.dev/api/icons/bar-chart-3?color=000000" width="18" height="18"> | **Charts** | [Recharts](https://recharts.org/) | Data visualization |
| <img src="https://cdn.simpleicons.org/sqlite/000000" width="18" height="18"> | **Database** | [SQLite](https://www.sqlite.org/) | Local file-based database |
| <img src="https://cdn.simpleicons.org/prisma/000000" width="18" height="18"> | **ORM** | [Prisma](https://www.prisma.io/) | Type-safe database queries |
| <img src="https://lucide.dev/api/icons/shield?color=000000" width="18" height="18"> | **Auth** | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + [bcryptjs](https://github.com/nicedoc/bcrypt.js) | JWT tokens + password hashing |
| <img src="https://cdn.simpleicons.org/zod/000000" width="18" height="18"> | **Validation** | [Zod](https://zod.dev/) | Schema validation |
| <img src="https://cdn.simpleicons.org/lucide/000000" width="18" height="18"> | **Icons** | [Lucide React](https://lucide.dev/) | Beautiful icon library |

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/saksham375/WealthWise.git
cd WealthWise

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set a secure JWT_SECRET

# 4. Initialize the database and seed demo data
npm run setup

# 5. Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Demo Accounts

| Email | Password | Currency |
|-------|----------|----------|
| demo@wealthwise.app | Demo@1234 | INR |
| alice@example.com | Alice@1234 | USD |
| bob@example.com | Bob@1234 | INR |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run setup` | Generate Prisma client, run migrations, and seed database |
| `npm run db:seed` | Re-seed the database with demo data |
| `npm run db:reset` | Reset database and re-seed |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | *(required)* |
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_APP_URL` | Base URL for the app | `http://localhost:3000` |

## Project Structure

```
WealthWise/
├── prisma/                  # Database schema, migrations, seed scripts
│   ├── schema.prisma        # 18 data models with relations
│   ├── seed.ts              # Demo data generator (3 users, 6 months)
│   └── migrations/
├── public/                  # Static assets
├── screenshots/             # App screenshots for README
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (app)/           # Authenticated routes (10 pages)
│   │   ├── (public)/        # Public routes (login, signup, forgot-password)
│   │   └── api/             # REST API endpoints (40+ routes)
│   ├── components/          # React components (40 files across 11 modules)
│   │   ├── analytics/       # Chart components (pie, bar, area, heatmap)
│   │   ├── budgets/         # Budget cards, donut, modal, suggestions
│   │   ├── calendar/        # Calendar views (week/month/year)
│   │   ├── goals/           # Goal cards, progress rings, contributions
│   │   ├── group/           # Expense splitting, balance summary
│   │   ├── insights/        # Financial score, insight cards
│   │   ├── recurring/       # Recurring transaction management
│   │   ├── settings/        # Category manager, import/export
│   │   ├── subscriptions/   # Subscription tracking
│   │   ├── transactions/    # Transaction modal, row, category picker
│   │   └── ui/              # Shared primitives (Toast, Toggle, EmptyState)
│   ├── data/                # Static data (categories, security questions, chart colors)
│   ├── hooks/               # Custom React hooks (API, currency formatting)
│   ├── lib/                 # Utilities (auth, validation, CSV, insights engine)
│   ├── store/               # Zustand stores (user, toast, analytics)
│   └── types/               # TypeScript type definitions
├── eslint.config.mjs
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
