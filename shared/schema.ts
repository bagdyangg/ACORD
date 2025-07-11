import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(), // Username for login
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password").notNull(), // User password for login
  role: varchar("role").default("employee").notNull(), // employee, admin, superadmin
  isActive: boolean("is_active").default(true).notNull(), // User activation status
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), // Last login timestamp
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).defaultNow().notNull(),
  mustChangePassword: boolean("must_change_password").default(false).notNull(),
  passwordExpiryDays: integer("password_expiry_days").default(120).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dishes table - simplified to only store images
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  imagePath: varchar("image_path", { length: 500 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table - with decimal quantity support for portions (0.5, 1, 2, etc.)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: decimal("quantity", { precision: 3, scale: 1 }).default("1.0"),
  orderDate: date("order_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const dishesRelations = relations(dishes, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  dish: one(dishes, {
    fields: [orders.dishId],
    references: [dishes.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDish = typeof dishes.$inferInsert;
export type Dish = typeof dishes.$inferSelect;

export type InsertOrder = typeof orders.$inferInsert;
export type Order = typeof orders.$inferSelect;

// Zod schemas - simplified
export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const updateDishSchema = insertDishSchema.partial();

export type InsertDishType = z.infer<typeof insertDishSchema>;
export type InsertOrderType = z.infer<typeof insertOrderSchema>;
