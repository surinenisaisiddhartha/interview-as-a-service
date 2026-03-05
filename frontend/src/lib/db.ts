import { Pool } from 'pg';

// Shared PostgreSQL connection pool — replaces Prisma client
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export default pool;
