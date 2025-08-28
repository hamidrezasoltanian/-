// این یک نسخه برای تست فایل main.js است
// این کد از ری‌اکت استفاده نمی‌کند و فقط بررسی می‌کند که آیا این اسکریپت اجرا می‌شود یا خیر.
console.log('اسکریپت main.js شروع به اجرا کرد.');

try {
  // پیدا کردن تگ root در HTML
  const container = document.getElementById('root');

  // بررسی وجود تگ
  if (container) {
    console.log('تگ root پیدا شد. در حال تغییر محتوای آن...');
    // تغییر مستقیم محتوای HTML تگ
    container.innerHTML = `
      <div style="padding: 2rem; font-family: sans-serif; text-align: center; background-color: #ffc; border: 2px solid #f00;">
        <h1>اگر این متن را می‌بینید، یعنی main.js اجرا می‌شود!</h1>
        <p>در این صورت، مشکل از نحوه بارگذاری ری‌اکت یا App.tsx است.</p>
      </div>
    `;
    console.log('محتوای تگ root تغییر کرد.');
  } else {
    // اگر تگ root پیدا نشود، این خطا در کنسول مرورگر نمایش داده می‌شود
    console.error('خطای حیاتی: تگ با آیدی "root" در صفحه پیدا نشد.');
  }
} catch (error) {
  // این کد هر خطای غیرمنتظره‌ای را در حین اجرای اسکریپت نمایش می‌دهد
  console.error('یک خطا در فایل main.js رخ داد:', error);
}
