import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  // FIXED: toLocaleTimeString with timeZone option handles conversion automatically
  // The old code added 5 hours manually AND used timeZone option = double conversion bug!
  const formattedTime = new Date().toLocaleTimeString("en-PK", {
    timeZone: "Asia/Karachi",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Only import vite-dev in development mode
  try {
    const { setupVite: setupViteDev } = await import("./vite-dev.js");
    await setupViteDev(app, server);
  } catch (error) {
    console.error("Failed to setup Vite dev server:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
