
const db = require('../server/db.cjs');

async function migrate() {
  try {
    console.log('Creating settings table if not exists...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Settings table created.');

    console.log('Inserting default CQI target if not exists...');
    // Use INSERT IGNORE to avoid error if key exists
    await db.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('cqi_target', '0')
    `);
    console.log('Default CQI target ensured.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
