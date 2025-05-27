import {
  users,
  dishes,
  orders,
  type User,
  type UpsertUser,
  type Dish,
  type InsertDish,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Dish operations
  getDishes(): Promise<Dish[]>;
  getDishesByDate(date: string): Promise<Dish[]>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined>;
  deleteDish(id: number): Promise<boolean>;

  // Order operations
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrdersByDate(date: string): Promise<Order[]>;
  getOrdersWithDetails(date: string): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getUserOrderForDate(userId: string, date: string): Promise<Order[]>;
  deleteUserOrdersForDate(userId: string, date: string): Promise<boolean>;

  // Admin operations
  getOrdersSummary(date: string): Promise<any>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dish operations
  async getDishes(): Promise<Dish[]> {
    return await db.select().from(dishes).orderBy(desc(dishes.createdAt));
  }

  async getDishesByDate(date: string): Promise<Dish[]> {
    return await db
      .select()
      .from(dishes)
      .where(eq(dishes.date, date))
      .orderBy(desc(dishes.createdAt));
  }

  async createDish(dish: InsertDish): Promise<Dish> {
    const [newDish] = await db.insert(dishes).values(dish).returning();
    return newDish;
  }

  async updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined> {
    const [updatedDish] = await db
      .update(dishes)
      .set(dish)
      .where(eq(dishes.id, id))
      .returning();
    return updatedDish;
  }

  async deleteDish(id: number): Promise<boolean> {
    const result = await db.delete(dishes).where(eq(dishes.id, id));
    return result.rowCount > 0;
  }

  // Order operations
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByDate(date: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.orderDate, date))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersWithDetails(date: string): Promise<any[]> {
    return await db
      .select({
        orderId: orders.id,
        quantity: orders.quantity,
        createdAt: orders.createdAt,
        dishId: dishes.id,
        dishImagePath: dishes.imagePath,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(orders)
      .innerJoin(dishes, eq(orders.dishId, dishes.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.orderDate, date))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getUserOrderForDate(userId: string, date: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.orderDate, date)));
  }

  async deleteUserOrdersForDate(userId: string, date: string): Promise<boolean> {
    const result = await db
      .delete(orders)
      .where(and(eq(orders.userId, userId), eq(orders.orderDate, date)));
    return result.rowCount > 0;
  }

  // Admin operations
  async getOrdersSummary(date: string): Promise<any> {
    const ordersWithDetails = await this.getOrdersWithDetails(date);
    
    const totalOrders = ordersWithDetails.length;

    const dishCounts = ordersWithDetails.reduce((acc, order) => {
      const dishKey = `dish_${order.dishId}`;
      acc[dishKey] = (acc[dishKey] || 0) + order.quantity;
      return acc;
    }, {} as Record<string, number>);

    const mostPopular = Object.entries(dishCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];

    return {
      totalOrders,
      mostPopular: mostPopular ? mostPopular[0] : null,
      dishCounts,
      orders: ordersWithDetails,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
}

export const storage = new DatabaseStorage();
