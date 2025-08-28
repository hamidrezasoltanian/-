import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'; // Import the main App component

// Find the root element in the HTML
const container = document.getElementById('root');

// Ensure the root element exists
if (container) {
  // Create a render root for the application
  const root = createRoot(container);
  
  // Render the main App component into the root element
  root.render(<App />);
} else {
  console.error('Fatal Error: Root element with id "root" not found in the DOM.');
}
