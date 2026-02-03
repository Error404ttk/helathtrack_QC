const db = require('./db.cjs');

async function setup() {
    console.log('--- Database Setup & Diagnostic ---');
    try {
        // 1. Check Connection
        console.log('1. Checking connection...');
        await db.query('SELECT 1');
        console.log('   [OK] Connection successful.');

        // 2. Check/Migrate Schema
        console.log('2. Checking schema (adding missing columns)...');

        const columns = [
            { name: 'service_profile_file', def: 'TEXT DEFAULT NULL' },
            { name: 'cqi_file', def: 'TEXT DEFAULT NULL' },
            { name: 'cqi_submitted_count', def: 'INT DEFAULT 0' },
            { name: 'cqi_color', def: 'VARCHAR(20) DEFAULT NULL' }
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE teams ADD COLUMN ${col.name} ${col.def}`);
                console.log(`   [UPDATED] Added column: ${col.name}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`   [OK] Column ${col.name} already exists.`);
                } else {
                    console.error(`   [ERROR] Failed to add ${col.name}: ${e.message}`);
                }
            }
        }

        // 3. Create Hospital Profiles Table
        console.log('3. Checking/Creating hospital_profiles table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS hospital_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year INT NOT NULL UNIQUE,
                file_path VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('   [OK] hospital_profiles table check complete.');

        console.log('\n--- Setup Complete ---');
        console.log('You can now restart the server: pm2 restart all');
        process.exit(0);

    } catch (err) {
        console.error('\n[FATAL ERROR] Database connection failed.');
        console.error('Please check server/db.cjs file.');
        console.error('Error details:', err.message);
        process.exit(1);
    }
}

setup();
