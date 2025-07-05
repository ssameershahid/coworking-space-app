import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function testDirectConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  
  console.log("Testing direct PostgreSQL connection...");
  
  try {
    // Create a postgres connection
    const client = postgres(DATABASE_URL);
    
    // Test the connection
    const result = await client`SELECT 1 as test`;
    console.log("Connection successful!", result);
    
    // Test if tables exist
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log("Existing tables:", tables);
    
    await client.end();
    
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testDirectConnection();