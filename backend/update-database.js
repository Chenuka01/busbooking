const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function updateDatabase() {
    try {
        console.log('📦 Reading schema.sql file...');
        
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split SQL statements by semicolon and filter empty ones
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute...\n`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments
            if (statement.startsWith('--') || statement.startsWith('/*')) {
                continue;
            }
            
            try {
                // Execute each statement
                await db.query(statement);
                
                // Show progress for important operations
                if (statement.includes('CREATE TABLE')) {
                    const tableName = statement.match(/CREATE TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Created table: ${tableName}`);
                } else if (statement.includes('INSERT INTO')) {
                    const tableName = statement.match(/INSERT INTO.*?`(\w+)`/)?.[1];
                    console.log(`✅ Inserted data into: ${tableName}`);
                } else if (statement.includes('ALTER TABLE')) {
                    const tableName = statement.match(/ALTER TABLE.*?`(\w+)`/)?.[1];
                    console.log(`✅ Altered table: ${tableName}`);
                }
            } catch (error) {
                // Ignore "table already exists" errors
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.code === 'ER_DB_CREATE_EXISTS') {
                    // Skip silently
                    continue;
                } else if (error.code === 'ER_DUP_ENTRY') {
                    // Skip duplicate entries
                    continue;
                } else {
                    console.error(`⚠️  Warning: ${error.message}`);
                }
            }
        }
        
        console.log('\n🎉 Database update completed successfully!');
        console.log('\n📊 Checking database state...');
        
        // Verify tables exist
        const [tables] = await db.query('SHOW TABLES');
        console.log(`\n✅ Database has ${tables.length} tables:`);
        tables.forEach(t => {
            const tableName = Object.values(t)[0];
            console.log(`   - ${tableName}`);
        });
        
        // Check if user_id column exists in Bookings
        const [columns] = await db.query('SHOW COLUMNS FROM Bookings LIKE "user_id"');
        if (columns.length > 0) {
            console.log('\n✅ user_id column exists in Bookings table');
        } else {
            console.log('\n❌ user_id column is MISSING from Bookings table');
            console.log('   Adding user_id column manually...');
            
            await db.query(`
                ALTER TABLE Bookings 
                ADD COLUMN user_id INT DEFAULT NULL COMMENT 'NULL for guest bookings' AFTER schedule_id,
                ADD INDEX idx_user_id (user_id)
            `);
            
            console.log('✅ user_id column added successfully');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error updating database:', error.message);
        process.exit(1);
    }
}

updateDatabase();
