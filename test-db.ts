import { storage } from "./server/storage.js";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Try to get organizations (this should work even if empty)
    const orgs = await storage.getOrganizations();
    console.log("Database connection successful!");
    console.log("Organizations found:", orgs.length);
    
    // Try to get menu items
    const menuItems = await storage.getMenuItems();
    console.log("Menu items found:", menuItems.length);
    
    process.exit(0);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();