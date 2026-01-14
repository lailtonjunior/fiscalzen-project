import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔄 Starting database migrations...');
  console.log(`📍 Database: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

  // Create connection for migrations (max 1 connection)
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Run migrations from the drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

runMigrations()
  .then(() => {
    console.log('🎉 Database is ready!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Migration error:', err);
    process.exit(1);
  });
