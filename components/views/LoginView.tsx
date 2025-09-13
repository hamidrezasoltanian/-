// This file was renamed to LoginView.jsx to fix MIME type issues on static hosting.
import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext.js';

const LoginView = () => {
    const context = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username || !password) {
            context?.showNotification("نام کاربری و رمز عبور الزامی است", "error");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            context?.login(username, password);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-100 soft-shadow">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        <span className="text-blue-600">EZ</span> Dashboard
                    </h1>
                    <p className="mt-2 text-gray-500">برای ادامه وارد شوید</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-2">نام کاربری</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 text-gray-800 soft-shadow-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="username"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-2">رمز عبور</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 text-gray-800 soft-shadow-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 font-bold text-white bg-blue-600 rounded-xl soft-shadow soft-shadow-active hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-wait"
                    >
                        {isLoading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>
                 <div className="text-xs text-gray-400 text-center pt-4 border-t border-slate-200">
                    <p className="font-semibold">کاربران پیش‌فرض:</p>
                    <p>admin / 123 (مدیر)</p>
                    <p>sales / 123 (فروش)</p>
                    <p>procurement / 123 (بازرگانی)</p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
