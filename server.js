import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// API routes can go here
// For example:
// app.get('/api/data', (req, res) => {
//   res.json({ message: 'This is your API' });
// });

// For any other request, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
