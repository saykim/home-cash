import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";

// Assets (자산)
export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  initialBalance: decimal("initial_balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories (카테고리)
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions (거래내역)
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  assetId: uuid("asset_id").notNull(),
  toAssetId: uuid("to_asset_id"),
  categoryId: uuid("category_id").notNull(),
  cardId: uuid("card_id"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Credit Cards (신용카드)
export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  billingDay: integer("billing_day").notNull(),
  startOffset: integer("start_offset").notNull(),
  startDay: integer("start_day").notNull(),
  endOffset: integer("end_offset").notNull(),
  endDay: integer("end_day").notNull(),
  linkedAssetId: uuid("linked_asset_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Recurring Transactions (정기 거래)
export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  assetId: uuid("asset_id").notNull(),
  toAssetId: uuid("to_asset_id"),
  categoryId: uuid("category_id").notNull(),
  frequency: text("frequency").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  dayOfMonth: integer("day_of_month"),
  dayOfWeek: integer("day_of_week"),
  lastGenerated: text("last_generated"),
  isActive: boolean("is_active").notNull().default(true),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budgets (예산)
export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  month: text("month").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Annual Events (연례 이벤트)
export const annualEvents = pgTable("annual_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  memo: text("memo"),
  firstYear: integer("first_year"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transaction Templates (거래 템플릿)
export const transactionTemplates = pgTable("transaction_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  assetId: uuid("asset_id").notNull(),
  toAssetId: uuid("to_asset_id"),
  categoryId: uuid("category_id").notNull(),
  cardId: uuid("card_id"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
