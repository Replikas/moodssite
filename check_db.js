const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_KUVpudE1k2yR@ep-plain-brook-a82aore9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkDatabase() {
    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log('Connected to database');
        
        const result = await client.query(`
            SELECT id, title, description, pc_file_url, android_file_url, pc_file_name, android_file_name
            FROM games 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        
        console.log('Games in database:');
        result.rows.forEach(game => {
            console.log(`ID: ${game.id}`);
            console.log(`Title: ${game.title}`);
            console.log(`Description: ${game.description}`);
            console.log(`PC URL: ${game.pc_file_url}`);
            console.log(`PC File Name: ${game.pc_file_name}`);
            console.log(`Android URL: ${game.android_file_url}`);
            console.log(`Android File Name: ${game.android_file_name}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await client.end();
    }
}

checkDatabase();