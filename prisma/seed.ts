import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { faker } from "@faker-js/faker";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  setDate,
  getDay,
  addDays,
  subDays,
  format,
} from "date-fns";

const prisma = new PrismaClient();

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return min + rand() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.round(randBetween(min, max));
}

// ─── SYSTEM CATEGORIES ────────────────────────────────────────────────

const SYSTEM_CATEGORIES = [
  { name: "Food & Dining", type: "expense", iconName: "UtensilsCrossed", color: "#000000" },
  { name: "Transportation", type: "expense", iconName: "Car", color: "#171717" },
  { name: "Utilities", type: "expense", iconName: "Zap", color: "#262626" },
  { name: "Shopping", type: "expense", iconName: "ShoppingBag", color: "#404040" },
  { name: "Entertainment", type: "expense", iconName: "Popcorn", color: "#525252" },
  { name: "Healthcare", type: "expense", iconName: "Heart", color: "#737373" },
  { name: "Education", type: "expense", iconName: "BookOpen", color: "#A3A3A3" },
  { name: "Travel", type: "expense", iconName: "Plane", color: "#D4D4D4" },
  { name: "Housing", type: "expense", iconName: "Home", color: "#000000" },
  { name: "Subscriptions", type: "expense", iconName: "RefreshCw", color: "#171717" },
  { name: "Personal Care", type: "expense", iconName: "Sparkles", color: "#262626" },
  { name: "Fitness", type: "expense", iconName: "Dumbbell", color: "#404040" },
  { name: "Debt Payments", type: "expense", iconName: "CreditCard", color: "#525252" },
  { name: "Gifts & Donations", type: "expense", iconName: "Gift", color: "#737373" },
  { name: "Other Expense", type: "expense", iconName: "MoreHorizontal", color: "#A3A3A3" },
  { name: "Salary", type: "income", iconName: "Briefcase", color: "#000000" },
  { name: "Freelance", type: "income", iconName: "Code2", color: "#171717" },
  { name: "Investments", type: "income", iconName: "TrendingUp", color: "#262626" },
  { name: "Bonus", type: "income", iconName: "Trophy", color: "#404040" },
  { name: "Rental Income", type: "income", iconName: "Building2", color: "#525252" },
  { name: "Goal Contribution", type: "income", iconName: "Target", color: "#737373" },
  { name: "Other Income", type: "income", iconName: "MoreHorizontal", color: "#A3A3A3" },
] as const;

// ─── CUSTOM CATEGORIES ────────────────────────────────────────────────

const CUSTOM_CATEGORIES = [
  { name: "Gaming", type: "expense" as const, iconName: "Gamepad2", color: "#404040" },
  { name: "Pet Care", type: "expense" as const, iconName: "PawPrint", color: "#525252" },
  { name: "Gambling", type: "expense" as const, iconName: "Dices", color: "#000000" },
  { name: "Streaming", type: "expense" as const, iconName: "Tv", color: "#737373" },
  { name: "Crypto", type: "income" as const, iconName: "TrendingUp", color: "#171717" },
  { name: "Side Hustle", type: "income" as const, iconName: "Workflow", color: "#262626" },
];

// ─── TRANSACTION DESCRIPTIONS ─────────────────────────────────────────

const FOOD_DESCRIPTIONS = [
  "Lunch at Zomato", "Dinner at Swiggy", "Breakfast at cafe",
  "Office lunch", "Pizza delivery", "Biryani takeout",
  "Coffee & pastry", "Dinner at restaurant", "Street food",
  "Groceries at BigBasket", "Weekly groceries", "Snacks",
];

const TRANSPORT_DESCRIPTIONS = [
  "Uber to office", "Ola ride", "Metro pass",
  "Bus ticket", "Cab to airport", "Petrol",
  "Auto rickshaw", "Train ticket", "Bike parking",
];

const SHOPPING_DESCRIPTIONS = [
  "Amazon order", "Flipkart purchase", "Clothing",
  "Electronics", "Home decor", "Books",
  "Myntra order", "Ajio shopping", "Shoes",
  "Accessories", "Kitchen supplies",
];

const ENTERTAINMENT_DESCRIPTIONS = [
  "Movie tickets", "Concert tickets", "Netflix",
  "Spotify premium", "Game purchase", "BookMyShow",
  "Amusement park", "Bowling", "Pub night",
];

const UTILITY_DESCRIPTIONS = [
  "Electricity bill", "Water bill", "Internet bill",
  "Phone recharge", "Gas bill", "Broadband",
];

const INCOME_DESCRIPTIONS = [
  "Monthly salary", "Freelance payment", "Freelance project",
  "Stock dividend", "Rental income", "Bonus payout",
  "Interest income", "Cashback",
];

// ─── SECURITY QUESTIONS ───────────────────────────────────────────────

const SECURITY_QUESTIONS_POOL = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What was your childhood nickname?",
];

async function seedSystemCategories() {
  const categories: { id: string; name: string; type: string }[] = [];

  for (const cat of SYSTEM_CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        iconName: cat.iconName,
        color: cat.color,
        isSystem: true,
        sortOrder: categories.length,
      },
    });
    categories.push({ id: created.id, name: created.name, type: created.type });
  }

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    categoryMap[c.name] = c.id;
  }

  return categoryMap;
}

// ─── SEED USERS ───────────────────────────────────────────────────────

const DEMO_USERS = [
  {
    email: "demo@wealthwise.app",
    password: "Demo@1234",
    name: "Alex Demo",
    age: 28,
    gender: "male",
    currencyCode: "INR",
    numberFormat: "indian",
    showCents: true,
  },
  {
    email: "alice@example.com",
    password: "Alice@1234",
    name: "Alice Chen",
    age: 31,
    gender: "female",
    currencyCode: "USD",
    numberFormat: "international",
    showCents: true,
  },
  {
    email: "bob@example.com",
    password: "Bob@1234",
    name: "Bob Kumar",
    age: 25,
    gender: "male",
    currencyCode: "INR",
    numberFormat: "indian",
    showCents: false,
  },
];

async function seedUsers() {
  const users: {
    id: string;
    email: string;
    name: string;
    currencyCode: string;
  }[] = [];

  for (const u of DEMO_USERS) {
    const passwordHash = await hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        age: u.age,
        gender: u.gender,
        currencyCode: u.currencyCode,
        numberFormat: u.numberFormat,
        showCents: u.showCents,
      },
    });
    users.push(user);
  }

  return users;
}

// ─── SEED SECURITY QUESTIONS ─────────────────────────────────────────

const SECURITY_QUESTIONS: { questions: [string, string][]; }[] = [
  {
    questions: [
      ["What city were you born in?", "Mumbai"],
      ["What is your mother's maiden name?", "Sharma"],
      ["What was the name of your first pet?", "Max"],
    ],
  },
  {
    questions: [
      ["What city were you born in?", "San Francisco"],
      ["What is your favourite book from childhood?", "Dune"],
      ["What was the name of your first pet?", "Luna"],
    ],
  },
  {
    questions: [
      ["What city were you born in?", "Bangalore"],
      ["What is your mother's maiden name?", "Patel"],
      ["What was your childhood nickname?", "Bobby"],
    ],
  },
];

async function seedSecurityQuestions(userIds: string[]) {
  for (let i = 0; i < userIds.length; i++) {
    for (const [questionText, answer] of SECURITY_QUESTIONS[i].questions) {
      const answerHash = await hash(answer.toLowerCase().trim(), 10);
      await prisma.securityQuestion.create({
        data: {
          userId: userIds[i],
          questionText,
          answerHash,
        },
      });
    }
  }
}

// ─── SEED CUSTOM CATEGORIES ───────────────────────────────────────────

async function seedCustomCategories(
  userIds: string[]
) {
  const categories: { id: string; userId: string; name: string; type: string }[] = [];

  for (const userId of userIds) {
    // Each user gets 2 random custom categories
    const shuffled = [...CUSTOM_CATEGORIES].sort(() => rand() - 0.5);
    const selected = shuffled.slice(0, 2);

    for (const cat of selected) {
      const created = await prisma.category.create({
        data: {
          userId,
          name: cat.name,
          type: cat.type,
          iconName: cat.iconName,
          color: cat.color,
          isSystem: false,
          sortOrder: 100 + categories.length,
        },
      });
      categories.push({
        id: created.id,
        userId: created.userId!,
        name: created.name,
        type: created.type,
      });
    }
  }

  return categories;
}

// ─── SEED TRANSACTIONS ────────────────────────────────────────────────

function generateTransactionDate(
  monthOffset: number,
  preferFriday: boolean,
  baseDay?: number
): Date {
  const now = new Date();
  const targetMonth = subMonths(startOfMonth(now), monthOffset);

  if (baseDay) {
    let d = setDate(targetMonth, Math.min(baseDay, daysInMonth(targetMonth)));
    // Ensure at least one transaction per month
    return d;
  }

  let day: number;
  if (preferFriday && rand() > 0.5) {
    // Pick a Friday
    const fridays = getFridaysInMonth(targetMonth);
    if (fridays.length > 0) {
      day = pick(fridays);
    } else {
      day = randInt(1, daysInMonth(targetMonth));
    }
  } else {
    day = randInt(1, daysInMonth(targetMonth));
  }

  return setDate(targetMonth, Math.min(day, daysInMonth(targetMonth)));
}

function daysInMonth(date: Date): number {
  return endOfMonth(date).getDate();
}

function getFridaysInMonth(date: Date): number[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const fridays: number[] = [];

  for (let d = 1; d <= days; d++) {
    if (new Date(year, month, d).getDay() === 5) {
      fridays.push(d);
    }
  }

  return fridays;
}

interface TransactionConfig {
  userId: string;
  categoryId: string;
  amount: number;
  type: string;
  description: string;
  timestamp: Date;
  isRecurring: boolean;
  recurringId?: string;
}

function generateMonthlyTransactions(
  userId: string,
  categoryMap: Record<string, string>,
  monthOffset: number,
  baseMultiplier: number
): TransactionConfig[] {
  const txs: TransactionConfig[] = [];
  const targetMonth = subMonths(startOfMonth(new Date()), monthOffset);
  const monthFactor = 1 + (monthOffset < 3 ? 0.1 * (3 - monthOffset) : 0);
  const multiplier = baseMultiplier * monthFactor;

  // Salary on 1st of every month
  txs.push({
    userId,
    categoryId: categoryMap["Salary"],
    amount: Math.round((75000 + randBetween(-5000, 5000)) * (monthOffset === 0 ? 1 : 1 + randBetween(-0.05, 0.05))),
    type: "income",
    description: "Monthly salary",
    timestamp: setDate(targetMonth, 1),
    isRecurring: true,
  });

  // Income transactions (1-2 per month)
  const incomeCount = randInt(1, 2);
  for (let i = 0; i < incomeCount; i++) {
    const incomeType = pick(["Freelance", "Investments", "Bonus"]);
    txs.push({
      userId,
      categoryId: categoryMap[incomeType],
      amount: Math.round(randBetween(2000, 15000) * multiplier),
      type: "income",
      description: pick(INCOME_DESCRIPTIONS),
      timestamp: generateTransactionDate(monthOffset, false),
      isRecurring: false,
    });
  }

  // Housing / Rent on 5th
  txs.push({
    userId,
    categoryId: categoryMap["Housing"],
    amount: Math.round(18000 * multiplier),
    type: "expense",
    description: "Monthly rent",
    timestamp: setDate(targetMonth, 5),
    isRecurring: true,
  });

  // Utilities on 8th
  txs.push({
    userId,
    categoryId: categoryMap["Utilities"],
    amount: Math.round(randBetween(1200, 2500) * multiplier),
    type: "expense",
    description: pick(UTILITY_DESCRIPTIONS),
    timestamp: setDate(targetMonth, 8),
    isRecurring: false,
  });

  // Food transactions (6-8 per month) - Friday spike
  const foodCount = randInt(6, 8);
  for (let i = 0; i < foodCount; i++) {
    const fridayMultiplier = 1.3;
    const isFriday = rand() > 0.6;
    txs.push({
      userId,
      categoryId: categoryMap["Food & Dining"],
      amount: Math.round(randBetween(120, 800) * multiplier * (isFriday ? fridayMultiplier : 1)),
      type: "expense",
      description: pick(FOOD_DESCRIPTIONS),
      timestamp: generateTransactionDate(monthOffset, isFriday),
      isRecurring: false,
    });
  }

  // Transport (3-5 per month)
  const transportCount = randInt(3, 5);
  for (let i = 0; i < transportCount; i++) {
    txs.push({
      userId,
      categoryId: categoryMap["Transportation"],
      amount: Math.round(randBetween(80, 500) * multiplier),
      type: "expense",
      description: pick(TRANSPORT_DESCRIPTIONS),
      timestamp: generateTransactionDate(monthOffset, false),
      isRecurring: false,
    });
  }

  // Shopping (2-4 per month)
  const shoppingCount = randInt(2, 4);
  for (let i = 0; i < shoppingCount; i++) {
    txs.push({
      userId,
      categoryId: categoryMap["Shopping"],
      amount: Math.round(randBetween(300, 3000) * multiplier),
      type: "expense",
      description: pick(SHOPPING_DESCRIPTIONS),
      timestamp: generateTransactionDate(monthOffset, false),
      isRecurring: false,
    });
  }

  // Entertainment (1-3 per month)
  const entCount = randInt(1, 3);
  for (let i = 0; i < entCount; i++) {
    txs.push({
      userId,
      categoryId: categoryMap["Entertainment"],
      amount: Math.round(randBetween(150, 2000) * multiplier),
      type: "expense",
      description: pick(ENTERTAINMENT_DESCRIPTIONS),
      timestamp: generateTransactionDate(monthOffset, rand() > 0.5),
      isRecurring: false,
    });
  }

  // Miscellaneous (1-3 per month)
  const miscCount = randInt(1, 3);
  for (let i = 0; i < miscCount; i++) {
    const miscCat = pick([
      "Healthcare", "Education", "Personal Care", "Fitness",
      "Gifts & Donations", "Other Expense",
    ]);
    txs.push({
      userId,
      categoryId: categoryMap[miscCat],
      amount: Math.round(randBetween(200, 4000) * multiplier),
      type: "expense",
      description: `${miscCat} expense`,
      timestamp: generateTransactionDate(monthOffset, false),
      isRecurring: false,
    });
  }

  return txs;
}

async function seedTransactions(
  userIds: string[],
  categoryMap: Record<string, string>
) {
  let count = 0;

  for (const userId of userIds) {
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const baseMultiplier = userId === userIds[0] ? 1 : 0.85 + rand() * 0.3;
      const txs = generateMonthlyTransactions(userId, categoryMap, monthOffset, baseMultiplier);

      for (const tx of txs) {
        await prisma.transaction.create({ data: tx });
        count++;
      }
    }
  }

  return count;
}

// ─── SEED BUDGETS ────────────────────────────────────────────────────

async function seedBudgets(
  userIds: string[],
  categoryMap: Record<string, string>
) {
  const budgetConfigs = [
    { category: "Food & Dining", limit: 5000 },
    { category: "Transportation", limit: 3000 },
    { category: "Shopping", limit: 3000 },
  ];

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  for (const userId of userIds) {
    for (const cfg of budgetConfigs) {
      await prisma.budget.create({
        data: {
          userId,
          categoryId: categoryMap[cfg.category],
          limitAmount: cfg.limit,
          month: currentMonth,
          year: currentYear,
          applyEveryMonth: true,
        },
      });
    }
  }
}

// ─── SEED GOALS ───────────────────────────────────────────────────────

async function seedGoals(userIds: string[]) {
  const goalTemplates = [
    {
      goalName: "Vacation Fund — Goa Trip",
      emoji: "🏖️",
      targetAmount: 50000,
      currentSaved: 20000,
      deadlineMonths: 7,
    },
    {
      goalName: "House Down Payment",
      emoji: "🏠",
      targetAmount: 500000,
      currentSaved: 75000,
      deadlineMonths: 31,
    },
    {
      goalName: "New Laptop",
      emoji: "💻",
      targetAmount: 120000,
      currentSaved: 45000,
      deadlineMonths: 8,
    },
    {
      goalName: "Emergency Fund",
      emoji: "💰",
      targetAmount: 200000,
      currentSaved: 80000,
      deadlineMonths: 18,
    },
  ];

  for (const userId of userIds) {
    // Each user gets 2 goals
    const shuffled = [...goalTemplates].sort(() => rand() - 0.5);
    const selected = shuffled.slice(0, 2);

    for (const g of selected) {
      const deadline = addMonths(new Date(), g.deadlineMonths);

      const goal = await prisma.goal.create({
        data: {
          userId,
          goalName: g.goalName,
          emoji: g.emoji,
          targetAmount: g.targetAmount,
          currentSaved: g.currentSaved,
          deadline,
        },
      });

      await prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          amount: g.currentSaved,
          note: "Initial seed contribution",
        },
      });
    }
  }
}

// ─── SEED GROUP ───────────────────────────────────────────────────────

async function seedGroup(
  users: { id: string; name: string; email: string }[]
) {
  const group = await prisma.group.create({
    data: {
      groupName: "Roommates",
      emoji: "🏠",
      createdById: users[0].id,
    },
  });

  // Add all users as members
  for (const user of users) {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: user.id === users[0].id ? "ADMIN" : "MEMBER",
      },
    });
  }

  // 8 group expenses with different split methods
  const expenses = [
    { description: "Monthly Groceries", amount: 2700, payerIdx: 0, splitMethod: "equal", date: subDays(new Date(), 2) },
    { description: "Internet Bill", amount: 1500, payerIdx: 1, splitMethod: "percentage", date: subDays(new Date(), 5) },
    { description: "Rent top-up", amount: 4200, payerIdx: 2, splitMethod: "equal", date: subDays(new Date(), 10) },
    { description: "Electricity Bill", amount: 2400, payerIdx: 0, splitMethod: "equal", date: subDays(new Date(), 15) },
    { description: "Cleaning Supplies", amount: 1200, payerIdx: 1, splitMethod: "equal", date: subDays(new Date(), 20) },
    { description: "Dinner Party", amount: 3600, payerIdx: 2, splitMethod: "equal", date: subDays(new Date(), 25) },
    { description: "Water Bill", amount: 800, payerIdx: 0, splitMethod: "equal", date: subDays(new Date(), 30) },
    { description: "Netflix Shared", amount: 649, payerIdx: 1, splitMethod: "equal", date: subDays(new Date(), 35) },
  ];

  for (const exp of expenses) {
    const groupExpense = await prisma.groupExpense.create({
      data: {
        groupId: group.id,
        payerId: users[exp.payerIdx].id,
        description: exp.description,
        totalAmount: exp.amount,
        date: exp.date,
        splitMethod: exp.splitMethod,
      },
    });

    if (exp.splitMethod === "equal") {
      const splitAmount = Math.round((exp.amount / users.length) * 100) / 100;
      const remainder = exp.amount - splitAmount * (users.length - 1);

      for (let i = 0; i < users.length; i++) {
        await prisma.groupExpenseSplit.create({
          data: {
            expenseId: groupExpense.id,
            userId: users[i].id,
            amount: i === users.length - 1 ? remainder : splitAmount,
            isSettled: false,
          },
        });
      }
    } else {
      // Percentage split for Internet Bill (Alex: 50%, Alice: 30%, Bob: 20%)
      const percentages = [50, 30, 20];
      for (let i = 0; i < users.length; i++) {
        const amt = Math.round((exp.amount * percentages[i]) / 100 * 100) / 100;
        await prisma.groupExpenseSplit.create({
          data: {
            expenseId: groupExpense.id,
            userId: users[i].id,
            amount: i === users.length - 1
              ? exp.amount - amt * (users.length - 1)
              : amt,
            percentage: percentages[i],
            isSettled: false,
          },
        });
      }
    }
  }

  // Create a settlement record (Bob paid Alex ₹450 cash)
  await prisma.settlement.create({
    data: {
      groupId: group.id,
      settlerUserId: users[2].id, // Bob
      receiverUserId: users[0].id, // Alex
      amount: 450,
      method: "cash",
    },
  });

  return group;
}

// ─── SEED SUBSCRIPTIONS ──────────────────────────────────────────────

async function seedSubscriptions(userIds: string[]) {
  const subscriptionTemplates = [
    { serviceName: "Netflix", emoji: "📺", amount: 649, billingCycle: "monthly" },
    { serviceName: "Spotify", emoji: "🎵", amount: 119, billingCycle: "monthly" },
    { serviceName: "Google One", emoji: "☁️", amount: 1300, billingCycle: "yearly" },
    { serviceName: "Amazon Prime", emoji: "📦", amount: 1499, billingCycle: "yearly" },
    { serviceName: "YouTube Premium", emoji: "▶️", amount: 129, billingCycle: "monthly" },
    { serviceName: "Medium", emoji: "📰", amount: 499, billingCycle: "monthly" },
  ];

  for (const userId of userIds) {
    const shuffled = [...subscriptionTemplates].sort(() => rand() - 0.5);
    const selected = shuffled.slice(0, 5);

    for (const sub of selected) {
      const now = new Date();
      const nextDueDate = sub.billingCycle === "monthly"
        ? addMonths(now, 1)
        : addMonths(now, 12);

      await prisma.subscription.create({
        data: {
          userId,
          serviceName: sub.serviceName,
          emoji: sub.emoji,
          amount: sub.amount,
          billingCycle: sub.billingCycle,
          nextDueDate,
          lastPaidDate: now,
          status: "ACTIVE",
        },
      });
    }
  }
}

// ─── SEED NOTIFICATIONS ──────────────────────────────────────────────

async function seedNotifications(userIds: string[]) {
  const notificationTypes = [
    { type: "BUDGET_WARNING", message: "Food budget is 84% spent this month." },
    { type: "SUBSCRIPTION_DUE", message: "Netflix (₹649) is due in 2 days." },
    { type: "GOAL_MILESTONE", message: "Goal \"Vacation Fund\" has reached 50% of target!" },
    { type: "GROUP_DEBT", message: "Bob owes you ₹450 (Roommates group)." },
    { type: "BUDGET_WARNING", message: "Shopping budget is over by ₹100." },
  ];

  for (const userId of userIds) {
    for (let i = 0; i < notificationTypes.length; i++) {
      const nt = notificationTypes[i];
      await prisma.notification.create({
        data: {
          userId,
          type: nt.type,
          message: nt.message,
          read: i > 1, // First 2 unread, rest read
        },
      });
    }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────

async function cleanDatabase() {
  const tablenames = [
    "BugReport", "Notification", "Settlement", "GroupExpenseSplit",
    "GroupExpense", "GroupMember", "Group", "Subscription",
    "GoalContribution", "Goal", "Budget", "RecurringSchedule",
    "Transaction", "Session", "LoginAttempt", "SecurityQuestion",
    "Category", "User",
  ];

  for (const name of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  }
}

async function main() {
  console.log("🌱 Seeding WealthWise database...\n");

  await cleanDatabase();

  // 1. System categories
  console.log("  📁 Creating system categories...");
  const categoryMap = await seedSystemCategories();
  console.log(`  ✅ ${Object.keys(categoryMap).length} system categories created`);

  // 2. Demo users
  console.log("  👤 Creating demo users...");
  const users = await seedUsers();
  console.log(`  ✅ ${users.length} demo users created`);
  const userIds = users.map((u) => u.id);

  // 3. Security questions
  console.log("  🔐 Creating security questions...");
  await seedSecurityQuestions(userIds);
  console.log("  ✅ Security questions created");

  // 4. Custom categories
  console.log("  📁 Creating custom categories...");
  await seedCustomCategories(userIds);
  console.log("  ✅ Custom categories created");

  // 5. Transactions
  console.log("  💳 Generating 6 months of transactions...");
  const txCount = await seedTransactions(userIds, categoryMap);
  console.log(`  ✅ ${txCount} transactions created`);

  // 6. Budgets
  console.log("  📊 Creating budgets...");
  await seedBudgets(userIds, categoryMap);
  console.log("  ✅ Budgets created");

  // 7. Goals
  console.log("  🎯 Creating goals...");
  await seedGoals(userIds);
  console.log("  ✅ Goals created");

  // 8. Group + expenses
  console.log("  👥 Creating group and expenses...");
  await seedGroup(users);
  console.log("  ✅ Group & expenses created");

  // 9. Subscriptions
  console.log("  🔁 Creating subscriptions...");
  await seedSubscriptions(userIds);
  console.log("  ✅ Subscriptions created");

  // 10. Notifications
  console.log("  🔔 Creating notifications...");
  await seedNotifications(userIds);
  console.log("  ✅ Notifications created");

  console.log("\n🎉 Seeding complete!\n");
  console.log("📋 Demo Login Credentials:");
  console.log("  👤 demo@wealthwise.app  | Demo@1234");
  console.log("  👤 alice@example.com    | Alice@1234");
  console.log("  👤 bob@example.com      | Bob@1234\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
