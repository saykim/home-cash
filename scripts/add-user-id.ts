import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
const envVars = envContent.split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    if (key) {
      let val = values.join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || 
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      acc[key.trim()] = val;
    }
    return acc;
  }, {} as Record<string, string>);

Object.assign(process.env, envVars);

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log("Adding user_id column to budgets table...");
    
    // First get the first user ID or create shared user
    let userId;
    const users = await sql`SELECT id FROM users LIMIT 1`;
    
    if (users.length === 0) {
      console.log("Creating shared user...");
      const newUser = await sql`
        INSERT INTO users (firebase_uid, email, display_name, photo_url)
        VALUES ('shared', 'shared@local', 'Shared User', null)
        RETURNING id
      `;
      userId = newUser[0].id;
    } else {
      userId = users[0].id;
    }
    
    console.log(`Using user ID: ${userId}`);
    
    // Add user_id column - use raw SQL string
    await sql`
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS user_id uuid
    `;
    
    // Set default value for existing rows
    await sql`
      UPDATE budgets
      SET user_id = ${userId}
      WHERE user_id IS NULL
    `;
    
    // Make column NOT NULL
    await sql`
      ALTER TABLE budgets 
      ALTER COLUMN user_id SET NOT NULL
    `;
    
    console.log("✓ Successfully added user_id column to budgets table");
    
    // Verify
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'budgets'
    `;
    console.log("\nCurrent columns in budgets table:");
    result.forEach((r: any) => console.log(" -", r.column_name));
    
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

main();
