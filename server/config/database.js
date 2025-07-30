import pkg from 'pg';
const { Pool } = pkg;
import { InfluxDB } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection for user management
export const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'k8s_monitoring',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// InfluxDB connection for time series data
export const influxDB = new InfluxDB({
  url: process.env.INFLUX_URL || 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN || 'your-token-here',
});

export const writeAPI = influxDB.getWriteApi(
  process.env.INFLUX_ORG || 'k8s-monitoring',
  process.env.INFLUX_BUCKET || 'metrics'
);

export const queryAPI = influxDB.getQueryApi(
  process.env.INFLUX_ORG || 'k8s-monitoring'
);

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'viewer',
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Create roles table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    await pgPool.query(`
      INSERT INTO roles (name, description, permissions) VALUES
      ('admin', 'Full system access', '["dashboard", "resources", "logs", "pod-errors", "node-status", "pod-status", "contexts", "settings", "admin"]'),
      ('operator', 'Operations access', '["dashboard", "resources", "logs", "pod-errors", "node-status", "pod-status", "contexts"]'),
      ('viewer', 'Read-only access', '["dashboard", "resources"]')
      ON CONFLICT (name) DO NOTHING
    `);

    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pgPool.query(`
      INSERT INTO users (username, email, password_hash, role, permissions) VALUES
      ('admin', 'admin@k8s-monitoring.com', $1, 'admin', '["dashboard", "resources", "logs", "pod-errors", "node-status", "pod-status", "contexts", "settings", "admin"]')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}