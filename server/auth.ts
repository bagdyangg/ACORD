import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  if (process.env.DATABASE_URL) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.userId = undefined;
      return res.status(401).json({ message: "User not found" });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Error validating user session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}