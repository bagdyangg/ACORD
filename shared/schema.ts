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
  passwordChangedAt: timestamp("password_changed_at").defaultNow(), // When password was last changed
  forcePasswordChange: boolean("force_password_change").default(false), // Force user to change password
  passwordResetBy: varchar("password_reset_by"), // Who reset the password (admin/superadmin ID)
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

// Orders table - simplified without price
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").default(1),
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

// Password validation schema
export const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .refine((password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const types = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
    return types >= 3;
  }, "Password must contain at least 3 different character types (lowercase, uppercase, numbers, symbols)");

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Reset password schema (for admins)
export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  tempPassword: passwordSchema
});

export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
