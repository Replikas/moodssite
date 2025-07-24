const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_KUVpudE1k2yR@ep-plain-brook-a82aore9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function initDatabase() {
    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log('Connected to PostgreSQL database');
        
        // Drop and recreate games table to ensure correct schema
        await client.query('DROP TABLE IF EXISTS comments CASCADE');
        await client.query('DROP TABLE IF EXISTS user_likes CASCADE');
        await client.query('DROP TABLE IF EXISTS screenshots CASCADE');
        await client.query('DROP TABLE IF EXISTS games CASCADE');
        
        // Create games table
        await client.query(`
            CREATE TABLE games (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                icon VARCHAR(100) NOT NULL,
                pc_file_data BYTEA,
                pc_file_name VARCHAR(255),
                android_file_data BYTEA,
                android_file_name VARCHAR(255),
                likes INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create comments table
        await client.query(`
            CREATE TABLE comments (
                id SERIAL PRIMARY KEY,
                game_id VARCHAR(50) REFERENCES games(id),
                author VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create likes table (to track which users liked which games)
        await client.query(`
            CREATE TABLE user_likes (
                id SERIAL PRIMARY KEY,
                game_id VARCHAR(50) REFERENCES games(id),
                user_ip VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(game_id, user_ip)
            )
        `);

        // Create screenshots table
        await client.query(`
            CREATE TABLE screenshots (
                id SERIAL PRIMARY KEY,
                game_id VARCHAR(50) REFERENCES games(id),
                filename VARCHAR(255) NOT NULL,
                alt_text VARCHAR(500),
                is_cover BOOLEAN DEFAULT FALSE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert initial game data
        const games = [
            {
                id: 'find-them-all-rick',
                title: 'Find Them All Rick!',
                description: 'Gather some Mortys you might or might not see in the official creations, shoot a few feature-creatures and have some ice cream! An unofficial fan-made adventure.',
                icon: 'fas fa-search'
            }
        ];
        
        for (const game of games) {
            await client.query(`
                INSERT INTO games (id, title, description, icon)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon
            `, [game.id, game.title, game.description, game.icon]);
        }
        
        // No initial comments - they will be added by real users

        // Insert initial screenshots for Find Them All Rick
        const screenshots = [
            {
                game_id: 'find-them-all-rick',
                filename: '8Tx56W.png',
                alt_text: 'Rick and Morty Dialogue Scene',
                is_cover: true,
                display_order: 1
            },
            {
                game_id: 'find-them-all-rick',
                filename: 'EDCKlm.png',
                alt_text: 'Rick Sanchez Battle Scene',
                is_cover: false,
                display_order: 2
            },
            {
                game_id: 'find-them-all-rick',
                filename: 'laeL21.png',
                alt_text: 'Rick Dialogue About Morty',
                is_cover: false,
                display_order: 3
            },
            {
                game_id: 'find-them-all-rick',
                filename: 'mI8SdU.png',
                alt_text: 'Rick Close-up Scene',
                is_cover: false,
                display_order: 4
            },
            {
                game_id: 'find-them-all-rick',
                filename: 'o5uHCv.png',
                alt_text: 'Winter Fishing Scene',
                is_cover: false,
                display_order: 5
            }
        ];

        for (const screenshot of screenshots) {
            await client.query(`
                INSERT INTO screenshots (game_id, filename, alt_text, is_cover, display_order)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
            `, [screenshot.game_id, screenshot.filename, screenshot.alt_text, screenshot.is_cover, screenshot.display_order]);
        }

        console.log('Database initialized successfully!');
        console.log('Tables created: games, comments, user_likes, screenshots');
        console.log('Initial data inserted');
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await client.end();
    }
}

initDatabase();