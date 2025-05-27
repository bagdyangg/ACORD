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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("employee").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dishes table
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imagePath: varchar("image_path", { length: 500 }),
  category: varchar("category", { length: 100 }),
  available: boolean("available").default(true),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dishId: integer("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
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

// Zod schemas
export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.coerce.number().positive(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const updateDishSchema = insertDishSchema.partial();

export type InsertDishType = z.infer<typeof insertDishSchema>;
export type InsertOrderType = z.infer<typeof insertOrderSchema>;
