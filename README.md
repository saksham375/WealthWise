# WealthWise

> Your Money. Your Rules. Total Clarity.

A complete, privacy-first personal finance tracker that runs entirely on your machine. No cloud, no ads, no external APIs — just you and your money.

---

## Features

- **Dashboard** — At-a-glance view of your net worth, spending trends, and financial health
- **Analytics** — Interactive charts (pie, bar, area, heatmap) with period filtering
- **Budgets** — Per-category budgets with smart reallocation suggestions and donut progress
- **Savings Goals** — Track goals with ETA predictions, contribution history, and progress rings
- **Subscriptions** — Track recurring bills, get renewal reminders, pause/resume
- **Recurring Transactions** — Auto-generated recurring income/expense schedules
- **Group Splits** — Split expenses equally or by percentage, track balances, settle up
- **Calendar** — Week/month/year views showing transactions, subscriptions, and goal deadlines
- **Insights Engine** — 15+ rule-based behavioral analysis rules and a financial health score
- **CSV Import/Export** — Auto-detect columns, date formats, and transaction types
- **Settings** — Profile management, currency preferences, category management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Charts | [Recharts](https://recharts.org/) |
| Database | [SQLite](https://www.sqlite.org/) via [Prisma ORM](https://www.prisma.io/) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | [Zod](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/wealthwise.git
cd wealthwise

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
wealthwise/
├── prisma/                  # Database schema, migrations, seed scripts
│   ├── schema.prisma        # 18 data models with relations
│   ├── seed.ts              # Demo data generator (3 users, 6 months)
│   └── migrations/
├── public/                  # Static assets
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

## API Endpoints

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `POST /api/auth/logout` — User logout
- `GET /api/auth/check-email` — Check email availability
- `POST /api/auth/complete-profile` — Complete user profile
- `POST /api/auth/security-questions` — Set security questions
- `POST /api/auth/forgot-password/reset` — Reset password

### Transactions
- `GET /api/transactions` — List transactions (with filter/pagination)
- `POST /api/transactions` — Create transaction
- `PUT /api/transactions/[id]` — Update transaction
- `DELETE /api/transactions/[id]` — Delete transaction
- `POST /api/transactions/import` — Import from CSV
- `POST /api/transactions/import/preview` — Preview CSV import
- `GET /api/transactions/summary` — Get financial summary

### Analytics
- `GET /api/analytics/category-breakdown` — Category spending breakdown
- `GET /api/analytics/heatmap` — Daily spending heatmap
- `GET /api/analytics/income-vs-expense` — Income vs expense comparison
- `GET /api/analytics/spending-trend` — Spending trend over time
- `GET /api/analytics/insights` — Behavioral insights and health score

### Budgets
- `GET /api/budgets` — List budgets with spent amounts
- `POST /api/budgets` — Create budget
- `PUT /api/budgets/[id]` — Update budget
- `DELETE /api/budgets/[id]` — Delete budget
- `GET /api/budgets/status` — Budget status with suggestions

### Goals
- `GET /api/goals` — List savings goals
- `POST /api/goals` — Create goal
- `PUT /api/goals/[id]` — Update goal
- `DELETE /api/goals/[id]` — Delete goal
- `POST /api/goals/[id]/contribute` — Contribute to goal

### Groups
- `GET /api/groups` — List groups
- `POST /api/groups` — Create group
- `GET /api/groups/[id]` — Get group details
- `POST /api/groups/[id]/expenses` — Add group expense
- `POST /api/groups/[id]/members` — Add member
- `DELETE /api/groups/[id]/members` — Remove member
- `POST /api/groups/[id]/settle` — Settle balance

### Other
- `GET /api/categories` — List categories
- `GET/POST /api/subscriptions` — Manage subscriptions
- `GET/POST /api/recurring` — Manage recurring schedules
- `GET/PUT /api/settings/profile` — Profile settings
- `PUT /api/settings/password` — Change password
- `GET/PUT /api/settings/security-questions` — Security questions
- `GET /api/notifications` — List notifications
- `GET /api/users/me` — Current user info

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
