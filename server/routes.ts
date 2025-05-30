import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertDishSchema, insertOrderSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      req.session.userId = user.id;
      res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dish routes
  app.get("/api/dishes", async (req, res) => {
    try {
      const date = req.query.date as string;
      let dishes;
      
      if (date) {
        dishes = await storage.getDishesByDate(date);
      } else {
        // Get today's dishes by default
        const today = new Date().toISOString().split('T')[0];
        dishes = await storage.getDishesByDate(today);
      }
      
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ message: "Failed to fetch dishes" });
    }
  });

  app.post("/api/dishes", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      const dishData = insertDishSchema.parse({
        imagePath: `/uploads/${req.file.filename}`,
        date: req.body.date || new Date().toISOString().split('T')[0],
      });

      const dish = await storage.createDish(dishData);
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create dish" });
    }
  });

  app.put("/api/dishes/:id", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const dishId = parseInt(req.params.id);
      const updateData: any = { ...req.body };
      
      if (req.body.price) {
        updateData.price = parseFloat(req.body.price);
      }
      
      if (req.file) {
        updateData.imagePath = `/uploads/${req.file.filename}`;
      }

      const dish = await storage.updateDish(dishId, updateData);
      
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update dish" });
    }
  });

  app.delete("/api/dishes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const dishId = parseInt(req.params.id);
      const success = await storage.deleteDish(dishId);
      
      if (!success) {
        return res.status(404).json({ message: "Dish not found" });
      }
      
      res.json({ message: "Dish deleted successfully" });
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ message: "Failed to delete dish" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = req.query.date as string;
      
      let orders;
      if (date) {
        orders = await storage.getUserOrderForDate(userId, date);
      } else {
        orders = await storage.getOrdersByUser(userId);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { dishIds, date } = req.body;

      if (!Array.isArray(dishIds) || dishIds.length === 0) {
        return res.status(400).json({ message: "At least one dish must be selected" });
      }

      const orderDate = date || new Date().toISOString().split('T')[0];

      // Delete existing orders for this user and date
      await storage.deleteUserOrdersForDate(userId, orderDate);

      // Get dish details for pricing
      const dishes = await storage.getDishesByDate(orderDate);
      const dishMap = new Map(dishes.map(d => [d.id, d]));

      // Create new orders
      const orders = [];
      for (const dishId of dishIds) {
        const dish = dishMap.get(dishId);
        if (!dish) {
          return res.status(400).json({ message: `Dish with ID ${dishId} not found` });
        }

        const orderData = insertOrderSchema.parse({
          userId,
          dishId,
          quantity: 1,
          orderDate,
        });

        const order = await storage.createOrder(orderData);
        orders.push(order);
      }

      res.status(201).json(orders);
    } catch (error) {
      console.error("Error creating orders:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create orders" });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const summary = await storage.getOrdersSummary(date);
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders summary" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin" && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const newUser = await storage.createUser(req.body);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin" && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;
      const updatedUser = await storage.updateUserRole(id, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin" && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin" && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      if (id === 'superadmin-001') {
        return res.status(403).json({ message: "Cannot delete super admin" });
      }

      const success = await storage.deleteUser(id);
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/admin/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const currentUser = await storage.getUser(currentUserId);
      
      if (currentUser?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetUserId = req.params.id;
      const { role } = req.body;

      if (!["admin", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.upsertUser({
        id: targetUserId,
        role,
        updatedAt: new Date(),
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
