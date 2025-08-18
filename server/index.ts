import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CRITICAL DEBUG: Log ALL requests at the very beginning
app.use('*', (req, res, next) => {
  console.log(`🌍 RAW REQUEST: ${req.method} ${req.url} at ${new Date().toISOString()}`);
  if (req.method === 'POST') {
    console.log(`🚨 RAW POST DETECTED: ${req.url}`);
    console.log(`📝 Raw body type:`, typeof req.body);
    
    // Log raw body data if available
    let bodyLog = '';
    req.on('data', chunk => {
      bodyLog += chunk;
    });
    req.on('end', () => {
      if (bodyLog) console.log(`📦 Raw POST data:`, bodyLog);
    });
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

(async () => {
  const server = await registerRoutes(app);

  // Run database migration to ensure organizations table has required columns
  try {
    console.log("🔧 Running database migration for organizations table...");
    const { db } = await import("./storage.js");
    const { sql } = await import("drizzle-orm");
    
    // Add missing columns to organizations table
    await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    // Don't crash the server, just log the error
  }

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

  // Serve the app on the port provided by the environment (default 5000)
  const port = Number(process.env.PORT || 5000);

  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
