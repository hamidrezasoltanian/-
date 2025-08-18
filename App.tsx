import React, { useState, useMemo, useCallback } from 'react';
import { AppContext, AppContextType, View } from './contexts/AppContext.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useNotification } from './hooks/useNotification.ts';
import { Product, Order, Workflow, Proforma, User, ActivityLog } from './types.ts';
import { DEFAULT_WORKFLOW, DEFAULT_USERS } from './constants.ts';
import { generateId } from './utils/idUtils.ts';
import HomeView from './components/views/HomeView.tsx';
import WorkflowView from './components/views/WorkflowView.tsx';
import ProductsView from './components/views/ProductsView.tsx';
import ProformaView from './components/views/ProformaView.tsx';
import ReportsView from './components/views/ReportsView.tsx';
import SettingsView from './components/views/SettingsView.tsx';
import LoginView from './components/views/LoginView.tsx';
import ActivityView from './components/views/ActivityView.tsx';

const PERMISSIONS: { [key in View]: User['role'][] } = {
    home: ['admin', 'sales', 'procurement'],
    workflow: ['admin', 'sales', 'procurement'],
    products: ['admin', 'sales', 'procurement'],
    proforma: ['admin', 'sales'],
    reports: ['admin'],
    settings: ['admin'],
    activity: ['admin'],
};

const App: React.FC = () => {
    const [workflows, setWorkflows] = useLocalStorage<Workflow[]>("workflows_v12", [DEFAULT_WORKFLOW]);
    const [orders, setOrders] = useLocalStorage<Order[]>("orders_v12", []);
    const [products, setProducts] = useLocalStorage<Product[]>("products_v12", []);
    const [proformas, setProformas] = useLocalStorage<Proforma[]>("proformas_v12", []);
    const [users, setUsers] = useLocalStorage<User[]>("users_v12", DEFAULT_USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activityLogs, setActivityLogs] = useLocalStorage<ActivityLog[]>("activity_logs_v1", []);

    const [activeView, setActiveView] = useState<View>('home');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const { showNotification, NotificationComponent } = useNotification();
    
    const logActivity = useCallback((action: ActivityLog['action'], entityType: ActivityLog['entityType'], details: string, entityId?: string) => {
        if (!currentUser) return; // Should not happen if called correctly
        const newLog: ActivityLog = {
            id: generateId('log'),
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username,
            action,
            entityType,
            details,
            entityId,
        };
        setActivityLogs(prev => [newLog, ...prev]);
    }, [currentUser, setActivityLogs]);

    const login = useCallback((username: string, password: string): boolean => {
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            setCurrentUser(userWithoutPassword);
            setActiveView('home');
            showNotification(`خوش آمدید ${user.username}!`);
            // We need to log after currentUser is set, so we construct the log manually here.
            const newLog: ActivityLog = {
                id: generateId('log'),
                timestamp: new Date().toISOString(),
                userId: user.id,
                username: user.username,
                action: 'LOGIN',
                entityType: 'System',
                details: `کاربر ${user.username} وارد سیستم شد.`,
                entityId: user.id,
            };
            setActivityLogs(prev => [newLog, ...prev]);
            return true;
        }
        showNotification("نام کاربری یا رمز عبور اشتباه است", "error");
        return false;
    }, [users, showNotification, setActivityLogs]);

    const logout = useCallback(() => {
        if (currentUser) {
            logActivity('LOGOUT', 'System', `کاربر ${currentUser.username} از سیستم خارج شد.`, currentUser.id);
        }
        setCurrentUser(null);
        showNotification("با موفقیت خارج شدید.");
    }, [currentUser, showNotification, logActivity]);

    const contextValue: AppContextType = useMemo(() => ({
        workflows, setWorkflows,
        orders, setOrders,
        products, setProducts,
        proformas, setProformas,
        users, setUsers,
        currentUser,
        login, logout,
        showNotification,
        setActiveView,
        selectedOrderId,
        setSelectedOrderId,
        activityLogs, setActivityLogs,
        logActivity
    }), [workflows, orders, products, proformas, users, currentUser, login, logout, showNotification, selectedOrderId, activityLogs, logActivity]);
    
    if (!currentUser) {
        return (
            <AppContext.Provider value={contextValue}>
                 <NotificationComponent />
                 <LoginView />
            </AppContext.Provider>
        );
    }
    
    const renderContent = () => {
        if (!PERMISSIONS[activeView]?.includes(currentUser.role)) {
             return (
                <div className="p-8 text-center text-red-600">
                    <h2 className="text-2xl font-bold">عدم دسترسی</h2>
                    <p>شما اجازه دسترسی به این بخش را ندارید.</p>
                </div>
            );
        }
        switch (activeView) {
            case 'home': return <HomeView />;
            case 'workflow': return <WorkflowView />;
            case 'products': return <ProductsView />;
            case 'proforma': return <ProformaView />;
            case 'reports': return <ReportsView />;
            case 'settings': return <SettingsView />;
            case 'activity': return <ActivityView />;
            default: return null;
        }
    };

    const availableTabs = [
        { key: 'home', label: 'داشبورد' },
        { key: 'workflow', label: 'گردش کار' },
        { key: 'products', label: 'کالاها' },
        { key: 'proforma', label: 'پیش‌فاکتور' },
        { key: 'reports', label: 'گزارشات' },
        { key: 'activity', label: 'فعالیت‌ها' },
        { key: 'settings', label: 'تنظیمات' }
    ].filter(tab => PERMISSIONS[tab.key as View].includes(currentUser.role));

    return (
        <AppContext.Provider value={contextValue}>
            <div className="h-screen flex flex-col bg-gray-100 font-sans">
                <NotificationComponent />
                <header className="bg-white shadow-sm p-4 border-b z-10">
                    <div className="flex justify-between items-center max-w-screen-2xl mx-auto px-4">
                        <div className="flex items-center gap-x-8">
                             <h1 className="text-xl md:text-2xl font-bold text-blue-600">EZ Dashboard</h1>
                             <nav className="hidden md:flex gap-x-6">
                                {availableTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveView(tab.key as View)}
                                        className={`py-2 px-1 md:px-3 text-sm md:text-lg border-b-2 font-medium whitespace-nowrap transition-colors duration-200 ${
                                            activeView === tab.key
                                                ? 'tab-active'
                                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center gap-x-4">
                            <span className="text-gray-600 text-sm font-medium">کاربر: <strong className="font-bold text-gray-800">{currentUser.username}</strong></span>
                            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">خروج</button>
                        </div>
                    </div>
                </header>
                <main className="flex-grow bg-gray-50 overflow-hidden">
                    {renderContent()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;
