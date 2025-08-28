import React from 'react';
import { createRoot } from 'react-dom/client';

// این یک کامپوننت ری‌اکت بسیار ساده و مستقل است
// که هیچ فایل دیگری را از پروژه شما وارد نمی‌کند.
function SimpleTestApp() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      backgroundColor: '#e6f7ff',
      border: '2px solid #007bff',
      color: '#333'
    }}>
      <h1>React با موفقیت بارگذاری شد!</h1>
      <p>اگر این کادر آبی را می‌بینید، یعنی SystemJS و React به درستی کار می‌کنند.</p>
      <p>در این صورت، مشکل قطعا در فایل App.tsx شما یا یکی از وابستگی‌های آن است.</p>
    </div>
  );
}

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(<SimpleTestApp />);
    console.log('Simple React test app rendered successfully.');
  } catch (error) {
    console.error('Error while trying to render the simple React test app:', error);
    container.innerHTML = `<h1>خطا در هنگام رندر کردن تست ری‌اکت</h1><pre>${error.message}</pre>`;
  }
} else {
  console.error('Fatal Error: Root element with id "root" not found in the DOM.');
}
