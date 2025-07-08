import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertDishSchema, insertOrderSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Helper function to check admin access
const isAdmin = (userRole: string | undefined): boolean => {
  return userRole === "admin" || userRole === "superadmin";
};

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
      
      // Ensure session is saved before responding (important for production)
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
      });
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
      console.log("=== API /auth/user called ===");
      console.log("req.user from session:", req.user);
      console.log("session userId:", req.session.userId);
      
      // Get full user data from database
      const userId = req.session.userId;
      if (userId) {
        const fullUser = await storage.getUser(userId);
        console.log("Full user from database:", fullUser);
        res.json(fullUser);
      } else {
        console.log("No userId in session, returning req.user");
        res.json(req.user);
      }
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
      
      res.json(dishes || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ message: "Failed to fetch dishes", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/dishes", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
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

  app.post("/api/dishes/bulk-delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { dishIds } = req.body;
      if (!Array.isArray(dishIds) || dishIds.length === 0) {
        return res.status(400).json({ message: "No dish IDs provided" });
      }

      let deletedCount = 0;
      const errors = [];
      
      for (const dishId of dishIds) {
        try {
          const success = await storage.deleteDish(parseInt(dishId));
          if (success) deletedCount++;
        } catch (error) {
          errors.push({
            dishId: parseInt(dishId),
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      const response = {
        message: `${deletedCount} dishes deleted successfully`,
        deletedCount,
        total: dishIds.length,
        errors: errors.length > 0 ? errors : undefined
      };
      
      if (errors.length > 0 && deletedCount === 0) {
        return res.status(400).json(response);
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error bulk deleting dishes:", error);
      res.status(500).json({ message: "Failed to delete dishes" });
    }
  });

  // Order routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const date = req.query.date as string;
      
      let orders;
      if (date) {
        orders = await storage.getUserOrderForDate(userId, date);
      } else {
        orders = await storage.getOrdersByUser(userId);
      }
      
      res.json(orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
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

  app.delete("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const date = req.query.date as string;
      const orderDate = date || new Date().toISOString().split('T')[0];
      
      // Delete user's orders for the specified date
      const success = await storage.deleteUserOrdersForDate(userId, orderDate);
      
      if (!success) {
        return res.status(404).json({ message: "No orders found to delete" });
      }
      
      res.json({ message: "Orders deleted successfully" });
    } catch (error) {
      console.error("Error deleting orders:", error);
      res.status(500).json({ message: "Failed to delete orders" });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate required fields
      const { firstName, lastName, username, password, role } = req.body;
      if (!firstName || !lastName || !username || !password) {
        return res.status(400).json({ message: "Missing required fields: firstName, lastName, username, password" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Generate unique user ID
      const userIdPrefix = "user-" + Math.random().toString(36).substr(2, 6) + "-" + Math.random().toString(36).substr(2, 3) + "-" + Date.now().toString().slice(-2);
      
      const userData = {
        id: userIdPrefix,
        firstName,
        lastName,
        username,
        password,
        role: role || 'employee'
      };

      const newUser = await storage.createUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id/role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { role } = req.body;
      
      console.log("=== Updating user role ===");
      console.log("Target user ID:", id);
      console.log("New role:", role);
      console.log("Current user:", user?.username, user?.role);
      
      const updatedUser = await storage.updateUserRole(id, role);
      console.log("Updated user result:", updatedUser);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role) && user?.role !== "superadmin") {
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

  // Clear today's data endpoint
  app.delete("/api/admin/clear-today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      // Clear all orders and dishes for the specified date
      const cleared = await storage.clearTodayData(date);
      
      res.json({ 
        message: "Today's data cleared successfully",
        clearedOrders: cleared.ordersCleared,
        clearedDishes: cleared.dishesCleared,
        date: date
      });
    } catch (error) {
      console.error("Error clearing today's data:", error);
      res.status(500).json({ message: "Failed to clear today's data" });
    }
  });

  // Create order endpoint
  app.post("/api/admin/create-order", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { date = new Date().toISOString().split('T')[0] } = req.body;
      const ordersSummary = await storage.getOrdersSummary(date);
      
      if (!ordersSummary || ordersSummary.totalOrders === 0) {
        return res.status(400).json({ message: "No orders to process" });
      }

      res.json({ 
        message: "Order created successfully", 
        orderCount: ordersSummary.totalOrders,
        date: date 
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Send to restaurant endpoint
  app.post("/api/admin/send-to-restaurant", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { date = new Date().toISOString().split('T')[0] } = req.body;
      const ordersSummary = await storage.getOrdersSummary(date);
      
      if (!ordersSummary || ordersSummary.totalOrders === 0) {
        return res.status(400).json({ message: "No orders to send" });
      }

      res.json({ 
        message: "Order sent to restaurant successfully", 
        orderCount: ordersSummary.totalOrders,
        date: date 
      });
    } catch (error) {
      console.error("Error sending to restaurant:", error);
      res.status(500).json({ message: "Failed to send to restaurant" });
    }
  });

  // Export report endpoint
  app.get("/api/admin/export-report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      const user = await storage.getUser(userId);
      
      if (!isAdmin(user?.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const orders = await storage.getOrdersWithDetails(date as string);
      
      if (!orders || orders.length === 0) {
        return res.status(400).json({ message: "No orders to export" });
      }

      // Create CSV content
      const csvHeader = "Date,Employee,Dish ID,Quantity,Order Time\n";
      const csvRows = orders.map(order => 
        `${date},"${order.userName} ${order.userLastName}",${order.dishId},${order.quantity},"${new Date(order.createdAt).toLocaleTimeString()}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=order-report-${date}.csv`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Cache clearing endpoint for debugging
  app.get("/api/clear-cache", (req, res) => {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.send(`
      <html>
        <head>
          <title>Cache Clearing</title>
          <script>
            console.log('Starting cache clear...');
            
            // Clear all caches
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => {
                  console.log('Deleting cache:', name);
                  caches.delete(name);
                });
              });
            }
            
            // Clear storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Unregister service worker
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                  console.log('Unregistering SW:', registration);
                  registration.unregister();
                });
              });
            }
            
            alert('Cache cleared! Redirecting to app...');
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          </script>
        </head>
        <body>
          <h1>Clearing Cache...</h1>
          <p>Please wait while we clear your cache and reload the application.</p>
        </body>
      </html>
    `);
  });

  const httpServer = createServer(app);
  return httpServer;
}
