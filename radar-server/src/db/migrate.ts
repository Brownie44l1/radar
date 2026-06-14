import { readFileSync, readdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(__dirname, "migrations")
const MIGRATIONS_TABLE = "_migrations"

interface MigrationFile {
  name: string
  sql: string
}

function getMigrationFiles(): MigrationFile[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(resolve(MIGRATIONS_DIR, name), "utf-8"),
    }))
}

export async function runMigrations(): Promise<void> {
  const url = process.env.SUPABASE_DATABASE_URL
  if (!url) {
    console.log("")
    console.log("╔══════════════════════════════════════════════════════════════╗")
    console.log("║  Database migration skipped                                ║")
    console.log("║  Set SUPABASE_DATABASE_URL in your .env to auto-migrate    ║")
    console.log("║  Find it at: Supabase → Project Settings → Database        ║")
    console.log("║  Or paste src/db/migrations/*.sql into Supabase SQL Editor ║")
    console.log("╚══════════════════════════════════════════════════════════════╝")
    console.log("")
    return
  }

  let pg: typeof import("pg")
  try {
    pg = await import("pg")
  } catch {
    console.warn("")
    console.warn("  ⚠️  pg module not installed. Run: bun add pg")
    console.warn("  Or paste src/db/migrations/*.sql into the Supabase SQL Editor.")
    console.warn("")
    return
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
  } catch (e) {
    console.error("  ❌ Database connection failed:", (e as Error).message)
    await client.end().catch(() => {})
    return
  }

  console.log("")
  console.log("  Running database migrations...")

  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `).catch((e: Error) => {
    console.error("  ❌ Failed to create migrations table:", e.message)
  })

  const { rows: applied } = await client.query(`SELECT name FROM ${MIGRATIONS_TABLE}`)
  const appliedNames = new Set(applied.map((r: { name: string }) => r.name))

  for (const file of getMigrationFiles()) {
    if (appliedNames.has(file.name)) {
      console.log(`  ✓ ${file.name}`)
      continue
    }

    try {
      await client.query(file.sql)
      await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [file.name])
      console.log(`  ✓ ${file.name} applied`)
    } catch (e) {
      const msg = (e as Error).message
      const isAlreadyExists = msg.includes("already exists") || msg.includes("duplicate")
      if (isAlreadyExists) {
        console.log(`  ✓ ${file.name} (already present)`)
      } else {
        console.error(`  ✗ ${file.name} failed:`, msg)
      }
    }
  }

  await client.end().catch(() => {})
  console.log("  Done.")
  console.log("")
}

// Run directly: bun run src/db/migrate.ts
if (import.meta.main) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
