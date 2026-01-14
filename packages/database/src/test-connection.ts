import 'dotenv/config';
import postgres from 'postgres';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://fiscalzen:fiscalzen_dev@localhost:5432/fiscalzen';

  console.log('🔍 Testing database connection...');
  console.log(`📍 URL: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

  const sql = postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 5,
  });

  try {
    // Test basic connectivity
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Connection successful!');
    console.log(`⏰ Server time: ${result[0].current_time}`);
    console.log(`🐘 PostgreSQL: ${result[0].pg_version.split(',')[0]}`);

    // Check extensions
    const extensions = await sql`
      SELECT extname FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `;
    console.log(`📦 Extensions: ${extensions.map(e => e.extname).join(', ') || 'none'}`);

    // Check if tables exist
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length > 0) {
      console.log(`📋 Tables found (${tables.length}):`);
      tables.forEach(t => console.log(`   - ${t.tablename}`));
    } else {
      console.log('📋 No tables found (run migrations first)');
    }

    console.log('\n🎉 Database connection test passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Is PostgreSQL running? Try: docker-compose up -d');
    console.log('   2. Is the DATABASE_URL correct in .env?');
    console.log('   3. Can you connect via psql or pgAdmin?');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
