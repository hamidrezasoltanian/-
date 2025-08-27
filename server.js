const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
// Use the PORT from environment variables, with a fallback to 3001 for local development.
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// --- Helper Functions ---
const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading database file:", error);
        // If the file doesn't exist or is corrupted, we should handle it gracefully.
        // For this simple server, we'll return an empty structure.
        return {
            workflows: [],
            orders: [],
            products: [],
            proformas: [],
            users: [],
            activityLogs: []
        };
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to database file:", error);
    }
};

// --- API Routes ---

// Login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        // IMPORTANT: Never send the password back to the client in a real application
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Get all data
app.get('/api/data', (req, res) => {
    const db = readDb();
    res.json(db);
});

// Save a specific data type (e.g., products, orders)
app.post('/api/data/:key', (req, res) => {
    const { key } = req.params;
    const dataToSave = req.body;
    
    const db = readDb();

    if (key in db) {
        db[key] = dataToSave;
        writeDb(db);
        res.json(dataToSave);
    } else {
        res.status(400).json({ message: `Invalid data key: ${key}` });
    }
});

// --- Static File Serving ---
// Serve static files from the project's root directory
app.use(express.static(__dirname));

// --- SPA Fallback ---
// For any GET request that doesn't resolve to an API route or a static file,
// send the index.html file. This is essential for single-page applications.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // Check if db.json exists, if not, create it.
    if (!fs.existsSync(DB_FILE)) {
        console.log(`'db.json' not found. Creating a default database file.`);
        writeDb({
            workflows: [],
            orders: [],
            products: [],
            proformas: [],
            users: [],
            activityLogs: []
        });
    }
});