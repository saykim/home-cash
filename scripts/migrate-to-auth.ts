import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

/**
 * Migration Script: Add User Authentication
 *
 * This script migrates the database to support user authentication by:
 * 1. Creating a legacy user for existing data
 * 2. Adding userId columns to all tables
 * 3. Assigning existing data to the legacy user
 * 4. Adding NOT NULL constraints and foreign keys
 *
 * ⚠️ IMPORTANT: Backup your database before running this script!
 *
 * Run with: npx tsx api/migrate-to-auth.ts
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient);

async function migrate() {
  console.log("🚀 Starting migration to add user authentication...\n");

  try {
    // Step 1: Create users table
    console.log("📝 Step 1: Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        display_name TEXT,
        photo_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Users table created\n");

    // Step 2: Create legacy user
    console.log("📝 Step 2: Creating legacy user for existing data...");
    const legacyUserResult = await db.execute(sql`
      INSERT INTO users (firebase_uid, email, display_name, created_at, updated_at)
      VALUES ('legacy-user', 'legacy@home-cash.local', 'Legacy User', NOW(), NOW())
      ON CONFLICT (firebase_uid) DO NOTHING
      RETURNING id
    `);

    const legacyUserId = legacyUserResult.rows[0]?.id;

    if (!legacyUserId) {
      // If user already exists, get the ID
      const existingUser = await db.execute(sql`
        SELECT id FROM users WHERE firebase_uid = 'legacy-user'
      `);
      const userId = existingUser.rows[0]?.id;
      console.log(`✅ Legacy user already exists: ${userId}\n`);
    } else {
      console.log(`✅ Legacy user created: ${legacyUserId}\n`);
    }

    // Get legacy user ID for migration
    const legacyUserQuery = await db.execute(sql`
      SELECT id FROM users WHERE firebase_uid = 'legacy-user'
    `);
    const finalLegacyUserId = legacyUserQuery.rows[0]?.id;

    if (!finalLegacyUserId) {
      throw new Error("Failed to get legacy user ID");
    }

    console.log(`📌 Using legacy user ID: ${finalLegacyUserId}\n`);

    // Step 3: Add user_id column to all tables (nullable first)
    const tables = [
      'assets',
      'categories',
      'transactions',
      'credit_cards',
      'recurring_transactions',
      'budgets',
      'annual_events',
      'transaction_templates'
    ];

    console.log("📝 Step 3: Adding user_id columns to all tables...");
    for (const table of tables) {
      console.log(`  Adding user_id to ${table}...`);
      await db.execute(sql.raw(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS user_id UUID
      `));
    }
    console.log("✅ user_id columns added\n");

    // Step 4: Assign existing data to legacy user
    console.log("📝 Step 4: Assigning existing data to legacy user...");
    for (const table of tables) {
      console.log(`  Updating ${table}...`);
      const result = await db.execute(sql.raw(`
        UPDATE ${table}
        SET user_id = '${finalLegacyUserId}'
        WHERE user_id IS NULL
      `));
      console.log(`  ✓ Updated ${result.rowCount || 0} rows`);
    }
    console.log("✅ All existing data assigned to legacy user\n");

    // Step 5: Make user_id NOT NULL
    console.log("📝 Step 5: Making user_id NOT NULL...");
    for (const table of tables) {
      console.log(`  Altering ${table}...`);
      await db.execute(sql.raw(`
        ALTER TABLE ${table}
        ALTER COLUMN user_id SET NOT NULL
      `));
    }
    console.log("✅ user_id set to NOT NULL\n");

    // Step 6: Add foreign key constraints
    console.log("📝 Step 6: Adding foreign key constraints...");
    for (const table of tables) {
      console.log(`  Adding FK for ${table}...`);
      await db.execute(sql.raw(`
        ALTER TABLE ${table}
        ADD CONSTRAINT fk_${table}_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
      `));
    }
    console.log("✅ Foreign key constraints added\n");

    // Step 7: Verify migration
    console.log("📝 Step 7: Verifying migration...");
    for (const table of tables) {
      const result = await db.execute(sql.raw(`
        SELECT COUNT(*) as count FROM ${table} WHERE user_id IS NULL
      `));
      const nullCount = result.rows[0]?.count || 0;

      if (Number(nullCount) > 0) {
        console.log(`  ⚠️  WARNING: ${table} has ${nullCount} rows with NULL user_id`);
      } else {
        console.log(`  ✓ ${table} - all rows have user_id`);
      }
    }
    console.log("✅ Migration verification complete\n");

    console.log("🎉 Migration completed successfully!\n");
    console.log("Summary:");
    console.log(`  - Legacy user ID: ${finalLegacyUserId}`);
    console.log(`  - Tables migrated: ${tables.length}`);
    console.log(`  - All existing data preserved under legacy user\n`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.error("\n⚠️  Your database may be in an inconsistent state.");
    console.error("Please restore from backup and investigate the error.\n");
    throw error;
  }
}

async function rollback() {
  console.log("🔄 Starting rollback...\n");

  try {
    const tables = [
      'assets',
      'categories',
      'transactions',
      'credit_cards',
      'recurring_transactions',
      'budgets',
      'annual_events',
      'transaction_templates'
    ];

    // Remove foreign key constraints
    console.log("📝 Removing foreign key constraints...");
    for (const table of tables) {
      console.log(`  Removing FK from ${table}...`);
      await db.execute(sql.raw(`
        ALTER TABLE ${table}
        DROP CONSTRAINT IF EXISTS fk_${table}_user_id
      `));
    }
    console.log("✅ Foreign key constraints removed\n");

    // Remove user_id columns
    console.log("📝 Removing user_id columns...");
    for (const table of tables) {
      console.log(`  Removing user_id from ${table}...`);
      await db.execute(sql.raw(`
        ALTER TABLE ${table}
        DROP COLUMN IF EXISTS user_id
      `));
    }
    console.log("✅ user_id columns removed\n");

    // Drop users table
    console.log("📝 Dropping users table...");
    await db.execute(sql`DROP TABLE IF EXISTS users`);
    console.log("✅ Users table dropped\n");

    console.log("🎉 Rollback completed successfully!\n");
    console.log("⚠️  Note: This rollback does NOT restore deleted data.");
    console.log("If you need to restore data, use your database backup.\n");

  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
}

// Run migration or rollback based on command line argument
const command = process.argv[2];

if (command === 'rollback') {
  rollback()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  // Show warning and require confirmation
  console.log("⚠️  DATABASE MIGRATION WARNING ⚠️\n");
  console.log("This script will modify your database schema and data.");
  console.log("Please ensure you have a backup before proceeding.\n");
  console.log("To create a backup in Neon:");
  console.log("  1. Go to https://console.neon.tech");
  console.log("  2. Select your project");
  console.log("  3. Go to 'Backups' tab");
  console.log("  4. Create a manual snapshot\n");
  console.log("To rollback this migration, run:");
  console.log("  npx tsx api/migrate-to-auth.ts rollback\n");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

  setTimeout(() => {
    migrate()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }, 5000);
}
