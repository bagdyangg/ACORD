import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
const log = (message: string, ...args: any[]) => console.log(`[express] ${message}`, ...args);
import { storage } from "./storage";
import { setupVite, serveStatic } from "./vite";

const app = express();

// Add CORS headers for production deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://acord.replit.app', 'http://localhost:5000'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default (async () => {
  // Initialize superadmin user if it doesn't exist
  try {
    const existingAdmin = await storage.getUser('superadmin-001');
    if (!existingAdmin) {
      await storage.createUser({
        id: 'superadmin-001',
        firstName: 'Super',
        lastName: 'Admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log("Superadmin user created: username=admin, password=admin123");
    } else {
      log("Superadmin user already exists");
    }
  } catch (error) {
    log("Error initializing superadmin:", error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();