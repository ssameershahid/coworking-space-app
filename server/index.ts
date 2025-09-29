import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Ensure Express knows it's behind a proxy (Railway/NGINX) so secure cookies work
app.set("trust proxy", 1);

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
  console.log("🚀 Starting database migration process...");
  
  // Wait a bit for database to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    console.log("🔧 Running database migration for organizations table...");
    const { db } = await import("./storage.js");
    const { sql } = await import("drizzle-orm");
    
    // Test database connection first
    console.log("🔍 Testing database connection...");
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection successful");
    
    // Check if organizations table exists
    console.log("🔍 Checking if organizations table exists...");
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
      ) as exists
    `);
    console.log("📋 Organizations table exists:", tableExists);
    
    if (!tableExists || !Array.isArray(tableExists) || !tableExists[0]?.exists) {
      console.error("❌ Organizations table does not exist!");
      return;
    }
    
    // Check if columns already exist first
    console.log("🔍 Checking existing columns...");
    const existingColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name IN ('office_type', 'office_number', 'monthly_credits', 'monthly_fee', 'description')
    `);
    
    console.log("📋 Existing new columns:", existingColumns);
    
    // Add missing columns to organizations table
    console.log("🔧 Adding missing columns...");
    const migrationResult = await db.execute(sql`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'private_office',
      ADD COLUMN IF NOT EXISTS office_number TEXT,
      ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log("🔧 Migration SQL executed:", migrationResult);
    
    // Verify the migration
    console.log("✅ Verifying migration...");
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    
    console.log("📊 Final table structure:");
    console.table(finalColumns);
    
    // Check organizations count
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
    console.log("📈 Organizations in database:", orgCount[0]?.count);
    
    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    console.error("❌ Migration error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
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
