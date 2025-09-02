import React, { useRef, useContext } from 'react';
import { useTheme, Theme } from '../../hooks/useTheme.ts';
import { AppContext } from '../../contexts/AppContext.ts';

const THEMES: { id: Theme; name: string; color: string }[] = [
    { id: 'blue', name: 'آبی (پیش‌فرض)', color: '#3b82f6' },
    { id: 'green', name: 'سبز', color: '#16a34a' },
    { id: 'indigo', name: 'نیلی', color: '#6366f1' },
];

const AppearanceSettings: React.FC = () => {
    const { theme, setTheme, backgroundImage, setBackgroundImage } = useTheme();
    const context = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            context?.showNotification("حجم فایل نباید بیشتر از 2 مگابایت باشد", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64String = e.target?.result as string;
            setBackgroundImage(base64String);
            context?.showNotification("تصویر پس‌زمینه با موفقیت تنظیم شد");
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBackground = () => {
        setBackgroundImage(null);
        context?.showNotification("تصویر پس‌زمینه حذف شد");
    };

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">انتخاب تم رنگی</h3>
            <div className="flex gap-4 mb-8">
                {THEMES.map(t => (
                    <div key={t.id} onClick={() => setTheme(t.id)} className="cursor-pointer text-center">
                        <div
                            style={{ backgroundColor: t.color }}
                            className={`w-16 h-16 rounded-full shadow-md transition-all ${theme === t.id ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:scale-105'}`}
                        ></div>
                        <p className="mt-2 text-sm font-medium text-gray-600">{t.name}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-gray-800">تصویر پس‌زمینه</h3>
                <p className="text-gray-600 mb-6">یک تصویر برای پس‌زمینه برنامه انتخاب کنید. برای بهترین نتیجه از تصاویر با کیفیت و کم‌جزئیات استفاده کنید.</p>
                <div className="flex gap-4">
                     <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">آپلود تصویر</button>
                     {backgroundImage && (
                         <button onClick={handleRemoveBackground} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">حذف پس‌زمینه</button>
                     )}
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;
