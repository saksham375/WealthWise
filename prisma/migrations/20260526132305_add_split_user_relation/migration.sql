-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupExpenseSplit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "percentage" REAL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GroupExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "GroupExpense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupExpenseSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GroupExpenseSplit" ("amount", "expenseId", "id", "isSettled", "percentage", "userId") SELECT "amount", "expenseId", "id", "isSettled", "percentage", "userId" FROM "GroupExpenseSplit";
DROP TABLE "GroupExpenseSplit";
ALTER TABLE "new_GroupExpenseSplit" RENAME TO "GroupExpenseSplit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
