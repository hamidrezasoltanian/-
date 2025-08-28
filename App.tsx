import React from 'react';

// این یک نسخه بسیار ساده از کامپوننت App است
// که هیچ فایل دیگری را وارد نمی‌کند.
function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '2rem',
      fontFamily: 'sans-serif',
      backgroundColor: '#eef',
      color: '#333'
    }}>
      <h1>کامپوننت App.tsx با موفقیت رندر شد!</h1>
    </div>
  );
}

export default App;
