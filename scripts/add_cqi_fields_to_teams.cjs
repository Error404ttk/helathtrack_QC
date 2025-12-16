
const db = require('../server/db.cjs');

async function migrate() {
    try {
        console.log('Adding cqi_submitted_count and cqi_color colums to teams table...');

        // Check if columns exist (simple way: try to add them, catch error if they exist, or use information_schema)
        // We'll use a safer approach with raw queries that ignore errors if columns exist or use stored procedures, 
        // but for simplicity in this environment, we will attempt to add them one by one.

        try {
            await db.query(`ALTER TABLE teams ADD COLUMN cqi_submitted_count INT DEFAULT 0`);
            console.log('Added cqi_submitted_count column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('cqi_submitted_count column already exists.');
            } else {
                console.error('Error adding cqi_submitted_count:', e);
            }
        }

        try {
            await db.query(`ALTER TABLE teams ADD COLUMN cqi_color VARCHAR(20) DEFAULT NULL`);
            console.log('Added cqi_color column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('cqi_color column already exists.');
            } else {
                console.error('Error adding cqi_color:', e);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
