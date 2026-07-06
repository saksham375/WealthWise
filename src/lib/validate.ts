import { z } from "zod";

export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues ?? [];
    const firstIssue = issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Validation failed";
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}

export function validateOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = validate(schema, data);
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// --- Shared schemas ---

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const amountSchema = z.number().positive("Amount must be positive");

export const emojiSchema = z.string().emoji("Invalid emoji").optional();

// --- Entity schemas ---

export const createSubscriptionSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  emoji: emojiSchema,
  amount: z.number().positive("Amount must be positive"),
  billingCycle: z.enum(["monthly", "yearly"], "Billing cycle must be monthly or yearly"),
  nextDueDate: z.string().min(1, "Next due date is required"),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export const createGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required"),
  emoji: emojiSchema,
  targetAmount: z.number().positive("Target must be positive"),
  currentSaved: z.number().min(0).default(0),
  deadline: z.string().min(1, "Deadline is required"),
});

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  limitAmount: z.number().positive("Limit must be positive"),
  applyEveryMonth: z.boolean().default(false),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.coerce.number().int().min(13).max(150).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  currencyCode: z.string().length(3).optional(),
  numberFormat: z.enum(["indian", "international"]).optional(),
  showCents: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const securityQuestionsSchema = z.object({
  questions: z
    .array(z.object({
      questionText: z.string().min(1),
      answer: z.string().min(1),
    }))
    .length(3, "Exactly 3 security questions are required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const groupExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  totalAmount: z.number().positive("Amount must be positive"),
  payerId: z.string().min(1, "Payer is required"),
  splitMethod: z.enum(["equal", "percentage"]),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number(),
    percentage: z.number().optional(),
  })).min(1),
});

export const createRecurringSchema = z.object({
  templateTitle: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"], "Type must be income or expense"),
  categoryId: z.string().min(1, "Category is required"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"], "Frequency must be daily, weekly, monthly, or yearly"),
  nextRunDate: z.string().min(1, "Next run date is required"),
});

export const updateRecurringSchema = createRecurringSchema.partial();
