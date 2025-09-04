// This file was added to create a simple Node.js server to serve your static React app.
// After building your app with 'npm run build', the static files are placed in the 'dist' folder.
// This server will serve those files, allowing your app to run correctly when deployed with pm2.

// We use 'require' here because this script is intended to be run by Node.js,
// and without a 'package.json' specifying "type": "module", CommonJS is the default.
const express = require('express');
const path = require('path');

// --- Configuration ---
const app = express();
// The port is set to 9001 to match the one in your deployment log.
// It can be overridden by a PORT environment variable if needed.
const port = process.env.PORT || 9001;

// --- Static File Serving ---
// This is the most important part. It tells Express where to find your built React app.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// --- SPA Fallback ---
// This is a catch-all route. For any request that doesn't match a static file,
// it sends the index.html. This is crucial for single-page applications (SPAs)
// like React, as it allows client-side routing to work correctly.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`EZ Dashboard server started successfully.`);
  console.log(`Listening on http://localhost:${port}`);
  console.log(`Serving static files from: ${distPath}`);
});
