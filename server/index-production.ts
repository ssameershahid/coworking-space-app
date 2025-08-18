import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, serveStatic } from "./vite-production";

const app = express();

// CRITICAL DEBUG: Log ALL requests at the very beginning
app.use('*', (req, res, next) => {
  const pakistanTime = new Date();
  pakistanTime.setHours(pakistanTime.getHours() + 5); // Convert to Pakistan time
  console.log(`🌍 RAW REQUEST: ${req.method} ${req.url} at ${pakistanTime.toISOString()}`);
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Only serve static files in production
  serveStatic(app);

  // Serve the app on the port provided by the environment (default 5000)
  const port = Number(process.env.PORT || 5000);

  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
