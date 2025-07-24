const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_KUVpudE1k2yR@ep-plain-brook-a82aore9-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'games');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow common game file formats
        const allowedTypes = ['.zip', '.rar', '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.apk'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only game files are allowed.'));
        }
    }
});

// Database connection
const client = new Client({ connectionString });
client.connect().then(() => {
    console.log('Connected to PostgreSQL database');
}).catch(err => {
    console.error('Database connection error:', err);
});

// Helper function to get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
}

// API Routes

// Get all games with their stats
app.get('/api/games', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT g.*, 
                   COUNT(DISTINCT c.id) as comment_count,
                   COUNT(DISTINCT ul.id) as actual_likes
            FROM games g
            LEFT JOIN comments c ON g.id = c.game_id
            LEFT JOIN user_likes ul ON g.id = ul.game_id
            GROUP BY g.id, g.title, g.description, g.icon, g.likes, g.downloads, g.created_at
            ORDER BY g.created_at
        `);
        
        const games = result.rows.map(game => ({
            ...game,
            total_likes: parseInt(game.likes) + parseInt(game.actual_likes)
        }));
        
        res.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// Admin Routes
app.post('/api/admin/games', upload.fields([{ name: 'pcFile', maxCount: 1 }, { name: 'androidFile', maxCount: 1 }]), async (req, res) => {
    try {
        const { title, description, icon } = req.body;
        const pcFilePath = req.files && req.files.pcFile ? req.files.pcFile[0].filename : null;
        const androidFilePath = req.files && req.files.androidFile ? req.files.androidFile[0].filename : null;
        
        // Generate unique ID for the game
        const gameId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        const result = await client.query(
            'INSERT INTO games (id, title, description, icon, pc_file_path, android_file_path, likes, downloads) VALUES ($1, $2, $3, $4, $5, $6, 0, 0) RETURNING *',
            [gameId, title, description, icon, pcFilePath, androidFilePath]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

app.delete('/api/admin/games/:gameId', async (req, res) => {
    try {
        const gameId = parseInt(req.params.gameId);
        
        // Delete related comments and likes first
        await client.query('DELETE FROM comments WHERE game_id = $1', [gameId]);
        await client.query('DELETE FROM user_likes WHERE game_id = $1', [gameId]);
        
        // Delete the game
        const result = await client.query('DELETE FROM games WHERE id = $1 RETURNING *', [gameId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
});

// Get specific game with comments
app.get('/api/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const userIP = getClientIP(req);
        
        // Get game info
        const gameResult = await client.query(`
            SELECT g.*, 
                   COUNT(DISTINCT c.id) as comment_count,
                   COUNT(DISTINCT ul.id) as actual_likes,
                   EXISTS(SELECT 1 FROM user_likes WHERE game_id = $1 AND user_ip = $2) as user_liked
            FROM games g
            LEFT JOIN comments c ON g.id = c.game_id
            LEFT JOIN user_likes ul ON g.id = ul.game_id
            WHERE g.id = $1
            GROUP BY g.id, g.title, g.description, g.icon, g.likes, g.downloads, g.created_at
        `, [gameId, userIP]);
        
        if (gameResult.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        // Get comments
        const commentsResult = await client.query(`
            SELECT author, text, created_at
            FROM comments
            WHERE game_id = $1
            ORDER BY created_at DESC
        `, [gameId]);
        
        const game = gameResult.rows[0];
        game.total_likes = parseInt(game.likes) + parseInt(game.actual_likes);
        game.comments = commentsResult.rows;
        
        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Failed to fetch game' });
    }
});

// Toggle like for a game
app.post('/api/games/:gameId/like', async (req, res) => {
    try {
        const { gameId } = req.params;
        const userIP = getClientIP(req);
        
        // Check if user already liked this game
        const existingLike = await client.query(`
            SELECT id FROM user_likes WHERE game_id = $1 AND user_ip = $2
        `, [gameId, userIP]);
        
        let liked = false;
        
        if (existingLike.rows.length > 0) {
            // Unlike
            await client.query(`
                DELETE FROM user_likes WHERE game_id = $1 AND user_ip = $2
            `, [gameId, userIP]);
            liked = false;
        } else {
            // Like
            await client.query(`
                INSERT INTO user_likes (game_id, user_ip) VALUES ($1, $2)
            `, [gameId, userIP]);
            liked = true;
        }
        
        // Get updated like count
        const likeCountResult = await client.query(`
            SELECT g.likes + COUNT(ul.id) as total_likes
            FROM games g
            LEFT JOIN user_likes ul ON g.id = ul.game_id
            WHERE g.id = $1
            GROUP BY g.id, g.likes
        `, [gameId]);
        
        const totalLikes = likeCountResult.rows[0]?.total_likes || 0;
        
        res.json({ liked, totalLikes });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// Add comment to a game
app.post('/api/games/:gameId/comments', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { author, text } = req.body;
        
        if (!author || !text) {
            return res.status(400).json({ error: 'Author and text are required' });
        }
        
        const result = await client.query(`
            INSERT INTO comments (game_id, author, text)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [gameId, author, text]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Download game file
app.post('/api/games/:gameId/download/:platform', async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const platform = req.params.platform; // 'pc' or 'android'
        const userIP = getClientIP(req);
        
        // Get game info including file paths
        const gameResult = await client.query(
            'SELECT pc_file_path, android_file_path, title FROM games WHERE id = $1',
            [gameId]
        );
        
        if (gameResult.rows.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = gameResult.rows[0];
        const filePath = platform === 'pc' ? game.pc_file_path : game.android_file_path;
        
        if (!filePath) {
            return res.status(404).json({ error: `${platform.toUpperCase()} version not available` });
        }
        
        // Increment download count
        await client.query(
            'UPDATE games SET downloads = downloads + 1 WHERE id = $1',
            [gameId]
        );
        
        // Serve the file
        const fullFilePath = path.join(__dirname, 'games', filePath);
        
        if (!fs.existsSync(fullFilePath)) {
            return res.status(404).json({ error: 'Game file not found on server' });
        }
        
        res.download(fullFilePath, `${game.title}-${platform}${path.extname(filePath)}`);
    } catch (error) {
        console.error('Error downloading game:', error);
        res.status(500).json({ error: 'Failed to download game' });
    }
});

// Get screenshots for a game
app.get('/api/games/:gameId/screenshots', async (req, res) => {
    try {
        const { gameId } = req.params;
        const result = await client.query(
            'SELECT * FROM screenshots WHERE game_id = $1 ORDER BY display_order ASC',
            [gameId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching screenshots:', error);
        res.status(500).json({ error: 'Failed to fetch screenshots' });
    }
});

// Configure multer for screenshot uploads
const screenshotStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const screenshotUpload = multer({ 
    storage: screenshotStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for images
    },
    fileFilter: function (req, file, cb) {
        // Allow common image formats
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'));
        }
    }
});

// Add screenshot to a game
app.post('/api/admin/games/:gameId/screenshots', screenshotUpload.single('screenshot'), async (req, res) => {
    try {
        const { gameId } = req.params;
        const { altText, isCover } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No screenshot file provided' });
        }

        // If this is set as cover, remove cover status from other screenshots
        if (isCover === 'true') {
            await client.query(
                'UPDATE screenshots SET is_cover = FALSE WHERE game_id = $1',
                [gameId]
            );
        }

        // Get the next display order
        const orderResult = await client.query(
            'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM screenshots WHERE game_id = $1',
            [gameId]
        );
        const displayOrder = orderResult.rows[0].next_order;

        // Insert the new screenshot
        const result = await client.query(
            'INSERT INTO screenshots (game_id, filename, alt_text, is_cover, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [gameId, req.file.filename, altText || '', isCover === 'true', displayOrder]
        );

        res.json({ message: 'Screenshot added successfully', screenshot: result.rows[0] });
    } catch (error) {
        console.error('Error adding screenshot:', error);
        res.status(500).json({ error: 'Failed to add screenshot' });
    }
});

// Update screenshot (set as cover, change alt text, etc.)
app.put('/api/admin/screenshots/:screenshotId', async (req, res) => {
    try {
        const { screenshotId } = req.params;
        const { altText, isCover } = req.body;

        // Get the screenshot to find its game_id
        const screenshotResult = await client.query(
            'SELECT game_id FROM screenshots WHERE id = $1',
            [screenshotId]
        );

        if (screenshotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }

        const gameId = screenshotResult.rows[0].game_id;

        // If this is set as cover, remove cover status from other screenshots
        if (isCover === true) {
            await client.query(
                'UPDATE screenshots SET is_cover = FALSE WHERE game_id = $1',
                [gameId]
            );
        }

        // Update the screenshot
        const result = await client.query(
            'UPDATE screenshots SET alt_text = $1, is_cover = $2 WHERE id = $3 RETURNING *',
            [altText, isCover === true, screenshotId]
        );

        res.json({ message: 'Screenshot updated successfully', screenshot: result.rows[0] });
    } catch (error) {
        console.error('Error updating screenshot:', error);
        res.status(500).json({ error: 'Failed to update screenshot' });
    }
});

// Delete screenshot
app.delete('/api/admin/screenshots/:screenshotId', async (req, res) => {
    try {
        const { screenshotId } = req.params;

        // Get the screenshot info before deleting
        const screenshotResult = await client.query(
            'SELECT filename FROM screenshots WHERE id = $1',
            [screenshotId]
        );

        if (screenshotResult.rows.length === 0) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }

        const filename = screenshotResult.rows[0].filename;

        // Delete from database
        await client.query('DELETE FROM screenshots WHERE id = $1', [screenshotId]);

        // Delete file from filesystem (if it exists in uploads)
        const filePath = path.join(__dirname, 'images', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Screenshot deleted successfully' });
    } catch (error) {
        console.error('Error deleting screenshot:', error);
        res.status(500).json({ error: 'Failed to delete screenshot' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints available:');
    console.log('  GET  /api/games');
    console.log('  GET  /api/games/:gameId');
    console.log('  POST /api/games/:gameId/like');
    console.log('  POST /api/games/:gameId/comments');
    console.log('  POST /api/games/:gameId/download');
});