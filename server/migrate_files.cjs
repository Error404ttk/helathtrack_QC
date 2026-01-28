const db = require('./db.cjs');

async function migrate() {
    try {
        console.log('Checking/Adding columns to teams table...');

        // Attempt to add service_profile_file
        try {
            await db.query(`ALTER TABLE teams ADD COLUMN service_profile_file TEXT DEFAULT NULL`);
            console.log('Added service_profile_file column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('service_profile_file column already exists.');
            else console.error('Error adding service_profile_file:', e.message);
        }

        // Attempt to add cqi_file
        try {
            await db.query(`ALTER TABLE teams ADD COLUMN cqi_file TEXT DEFAULT NULL`);
            console.log('Added cqi_file column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('cqi_file column already exists.');
            else console.error('Error adding cqi_file:', e.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
