import React from 'react';
import { createRoot } from 'react-dom/client';

// فرض می‌کنیم کامپوننت اصلی شما در این مسیر قرار دارد
// اگر مسیر دیگری است، آن را اصلاح کنید
import App from './src/App'; 

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    // تلاش برای رندر کردن کامپوننت اصلی شما
    root.render(<App />);
  } catch (error) {
    // در صورت بروز خطا در کامپوننت App، یک پیام خطا نمایش داده می‌شود
    console.error("Error rendering the main App component:", error);
    const root = createRoot(container);
    root.render(
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>خطا در بارگذاری اپلیکیشن</h1>
        <p>لطفاً کنسول مرورگر را برای جزئیات بیشتر بررسی کنید.</p>
      </div>
    );
  }
} else {
  console.error('Root element not found!');
}
