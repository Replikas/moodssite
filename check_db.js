const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_KUVpudE1k2yR@ep-plain-brook-a82aore9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkDatabase() {
    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log('Connected to database');
        
        const result = await client.query('SELECT id, title, pc_file_url, android_file_url FROM games LIMIT 3');
        
        console.log('Games in database:');
        result.rows.forEach(row => {
            console.log(`ID: ${row.id}`);
            console.log(`Title: ${row.title}`);
            console.log(`PC URL: ${row.pc_file_url}`);
            console.log(`Android URL: ${row.android_file_url}`);
            console.log('---');
        });
        
        await client.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDatabase();