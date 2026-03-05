import pool from './src/lib/db';

async function main() {
  const result = await pool.query('SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 10');
  console.log("USERS:", JSON.stringify(result.rows, null, 2));
  await pool.end();
}
main();
