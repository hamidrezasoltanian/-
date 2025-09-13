
// This file was renamed to App.jsx to fix MIME type issues on static hosting.
import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
// @FIX: Removed AppContextType and View, as they are not exported from AppContext.js and were causing errors.
import { AppContext } from './contexts/AppContext.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useNotification } from './hooks/useNotification.js';
import { useTheme } from './hooks/useTheme.js';
// @FIX: Removed type imports that are not used in this JSX file and were causing errors due to an empty types.js file.
// The types are now defined in types.ts and used in other files, but not needed for annotations here.
import { DEFAULT_WORKFLOW, DEFAULT_USERS } from './constants.js';
import { generateId } from './utils/idUtils.js';
import Sidebar from './components/layout/Sidebar.jsx';
import LoginView from './components/views/LoginView.jsx';
import { isAiAvailable } from './services/geminiService.js';
import AiAssistantModal from './components/ai/AiAssistantModal.jsx';
import { ChatBubbleSparkleIcon } from './components/shared/Icons.jsx';

// Lazy load view components
const HomeView = lazy(() => import('./components/views/HomeView.jsx'));
const WorkflowView = lazy(() => import('./components/views/WorkflowView.jsx'));
const ProductsView = lazy(() => import('./components/views/ProductsView.jsx'));
const ProformaView = lazy(() => import('./components/views/ProformaView.jsx'));
const ReportsView = lazy(() => import('./components/views/ReportsView.jsx'));
const SettingsView = lazy(() => import('./components/views/SettingsView.jsx'));
const ActivityView = lazy(() => import('./components/views/ActivityView.jsx'));


const SkeletonLoader = () => (
    <div className="p-8">
        <div className="skeleton-loader h-10 w-1/3 mb-8"></div>
        <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="skeleton-loader h-24 rounded-xl"></div>
            <div className="skeleton-loader h-24 rounded-xl"></div>
            <div className="skeleton-loader h-24 rounded-xl"></div>
        </div>
        <div className="skeleton-loader h-64 rounded-xl"></div>
    </div>
);


const App = () => {
    useTheme(); // Apply theme and background on load
    const [workflows, setWorkflows] = useLocalStorage("workflows_v12", [DEFAULT_WORKFLOW]);
    const [orders, setOrders] = useLocalStorage("orders_v12", []);
    const [products, setProducts] = useLocalStorage("products_v12", []);
    const [proformas, setProformas] = useLocalStorage("proformas_v12", []);
    const [users, setUsers] = useLocalStorage("users_v12", DEFAULT_USERS);
    const [currentUser, setCurrentUser] = useState(null);
    const [activityLogs, setActivityLogs] = useLocalStorage("activity_logs_v1", []);

    const [activeView, setActiveView] = useState('home');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const { showNotification, NotificationComponent } = useNotification();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    
    const logActivity = useCallback((action, entityType, details, entityId) => {
        if (!currentUser) return; // Should not happen if called correctly
        const newLog = {
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

    const login = useCallback((username, password) => {
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            setCurrentUser(userWithoutPassword);
            setActiveView('home');
            showNotification(`خوش آمدید ${user.username}!`);
            // We need to log after currentUser is set, so we construct the log manually here.
            const newLog = {
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

    const contextValue = useMemo(() => ({
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
    ];
    
    const currentViewLabel = availableTabs.find(tab => tab.key === activeView)?.label || 'داشبورد';

    return (
        <AppContext.Provider value={contextValue}>
            <div className={`flex h-screen bg-slate-100 ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <NotificationComponent />
                <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    logout={logout}
                    currentUser={currentUser}
                    isCollapsed={isSidebarCollapsed}
                    setIsCollapsed={setIsSidebarCollapsed}
                    tabs={availableTabs}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white/70 backdrop-blur-lg shadow-sm p-4 border-b border-slate-200 z-10">
                        <h1 className="text-xl font-bold text-gray-800">{currentViewLabel}</h1>
                    </header>
                    <main className="flex-grow overflow-y-auto">
                        <Suspense fallback={<SkeletonLoader />}>
                            {renderContent()}
                        </Suspense>
                    </main>
                </div>
                 {isAiAvailable() && (
                    <>
                        <button 
                            onClick={() => setIsAiAssistantOpen(true)}
                            className="ai-fab"
                            aria-label="دستیار هوشمند"
                        >
                           <ChatBubbleSparkleIcon className="w-8 h-8 text-white" />
                        </button>
                        <AiAssistantModal 
                            isOpen={isAiAssistantOpen}
                            onClose={() => setIsAiAssistantOpen(false)}
                        />
                    </>
                )}
            </div>
        </AppContext.Provider>
    );
};

export default App;