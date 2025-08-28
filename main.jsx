import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'; // وارد کردن کامپوننت اصلی

// پیدا کردن تگ root در HTML
const container = document.getElementById('root');

// اطمینان از وجود تگ root
if (container) {
  // ساختن ریشه رندر برای اپلیکیشن
  const root = createRoot(container);
  
  // رندر کردن کامپوننت اصلی در تگ root
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Fatal Error: Root element with id "root" not found in the DOM.');
}
