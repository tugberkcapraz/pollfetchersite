import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment variables
let pool: Pool;

// Initialize the connection pool
if (!pool) {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: {
      // If you have a CA certificate file, uncomment this
      // ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'ca-certificate.crt')).toString(),
      rejectUnauthorized: false // Set to true in production with proper CA cert
    }
  });
}

export { pool }; 