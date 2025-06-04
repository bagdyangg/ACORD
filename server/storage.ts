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
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - for username/password authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

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
  clearTodayData(date: string): Promise<{ ordersCleared: number; dishesCleared: number }>;

  // Password management operations
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }>;
  resetPassword(userId: string, newPassword: string, resetBy: string): Promise<{ success: boolean; message: string }>;
  checkPasswordExpiry(userId: string): Promise<{ isExpired: boolean; daysUntilExpiry: number }>;
  getUsersWithExpiredPasswords(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.username, username), eq(users.password, password))
    );
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
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
    try {
      // Check if there are any orders for this dish
      const existingOrders = await db.select().from(orders).where(eq(orders.dishId, id));
      if (existingOrders.length > 0) {
        throw new Error(`Cannot delete dish: ${existingOrders.length} orders exist for this dish`);
      }

      const result = await db.delete(dishes).where(eq(dishes.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting dish:", error);
      throw error;
    }
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
        userUsername: users.username,
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
    return (result.rowCount ?? 0) > 0;
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

  async clearTodayData(date: string): Promise<{ ordersCleared: number; dishesCleared: number }> {
    try {
      // Delete all orders for the specified date
      const ordersResult = await db.delete(orders)
        .where(sql`DATE(${orders.createdAt}) = ${date}`)
        .returning();

      // Delete all dishes for the specified date
      const dishesResult = await db.delete(dishes)
        .where(sql`DATE(${dishes.createdAt}) = ${date}`)
        .returning();

      return {
        ordersCleared: ordersResult.length,
        dishesCleared: dishesResult.length
      };
    } catch (error) {
      console.error("Error clearing today's data:", error);
      throw error;
    }
  }

  // Password management operations
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // First verify current password
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.password !== currentPassword) {
        return { success: false, message: "Current password is incorrect" };
      }

      // Check if new password is different from current
      if (currentPassword === newPassword) {
        return { success: false, message: "New password must be different from current password" };
      }

      // Update password and related fields
      await db.update(users)
        .set({
          password: newPassword,
          passwordChangedAt: new Date(),
          forcePasswordChange: false,
          passwordResetBy: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Password changed successfully" };
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: "Failed to change password" };
    }
  }

  async resetPassword(userId: string, newPassword: string, resetBy: string): Promise<{ success: boolean; message: string }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Update password and force change
      await db.update(users)
        .set({
          password: newPassword,
          passwordChangedAt: new Date(),
          forcePasswordChange: true,
          passwordResetBy: resetBy,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Password reset successfully. User must change password on next login." };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { success: false, message: "Failed to reset password" };
    }
  }

  async checkPasswordExpiry(userId: string): Promise<{ isExpired: boolean; daysUntilExpiry: number }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.passwordChangedAt) {
        return { isExpired: true, daysUntilExpiry: 0 };
      }

      const passwordChangeDate = new Date(user.passwordChangedAt);
      const currentDate = new Date();
      const daysSinceChange = Math.floor((currentDate.getTime() - passwordChangeDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilExpiry = 120 - daysSinceChange;

      return {
        isExpired: daysSinceChange >= 120,
        daysUntilExpiry: Math.max(0, daysUntilExpiry)
      };
    } catch (error) {
      console.error("Error checking password expiry:", error);
      return { isExpired: true, daysUntilExpiry: 0 };
    }
  }

  async getUsersWithExpiredPasswords(): Promise<User[]> {
    try {
      // Get users whose passwords are older than 120 days
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 120);

      return await db.select()
        .from(users)
        .where(sql`${users.passwordChangedAt} < ${expiredDate} OR ${users.passwordChangedAt} IS NULL`);
    } catch (error) {
      console.error("Error getting users with expired passwords:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
