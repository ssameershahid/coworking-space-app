import { neon } from "@neondatabase/serverless";

async function debugConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log("Database URL exists:", !!DATABASE_URL);
  
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  
  // Parse the URL to show the components (without showing password)
  try {
    const url = new URL(DATABASE_URL);
    console.log("Database host:", url.hostname);
    console.log("Database port:", url.port);
    console.log("Database name:", url.pathname.substring(1));
    console.log("Database user:", url.username);
    
    // Test the connection
    const sql = neon(DATABASE_URL);
    console.log("Attempting to connect...");
    
    const result = await sql`SELECT 1 as test`;
    console.log("Connection successful!", result);
    
  } catch (error) {
    console.error("Connection failed:", error);
    
    // Try to provide more specific error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if ('cause' in error) {
        console.error("Error cause:", error.cause);
      }
    }
  }
}

debugConnection();