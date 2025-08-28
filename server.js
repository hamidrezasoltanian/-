import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- API Routes (MUST be before static serving) ---

// این یک مثال است، شما باید تمام روت‌های API اصلی خود را در اینجا اضافه کنید
app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(db.products || []);
});

app.get('/api/orders', (req, res) => {
    const db = readDb();
    res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
    const db = readDb();
    const newOrder = { id: Date.now(), ...req.body };
    db.orders.push(newOrder);
    writeDb(db);
    res.status(201).json(newOrder);
});

// --- Static File Serving for React App ---
app.use(express.static(path.join(__dirname, 'dist')));

// The catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
