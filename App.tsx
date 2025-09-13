
import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { AppContext, AppContextType, View } from './contexts/AppContext.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useNotification } from './hooks/useNotification.ts';
import { useTheme } from './hooks/useTheme.ts';
import { Product, Order, Workflow, Proforma, User, ActivityLog } from './types.ts';
import { DEFAULT_WORKFLOW, DEFAULT_USERS } from './constants.ts';
import { generateId } from './utils/idUtils.ts';
import Sidebar from './components/layout/Sidebar.tsx';
import LoginView from './components/views/LoginView.tsx';
import { isAiAvailable } from './services/geminiService.ts';
import AiAssistantModal from './components/ai/AiAssistantModal.tsx';
import { ChatBubbleSparkleIcon } from './components/shared/Icons.tsx';

// Lazy load view components
const HomeView = lazy(() => import('./components/views/HomeView.tsx'));
const WorkflowView = lazy(() => import('./components/views/WorkflowView.tsx'));
const ProductsView = lazy(() => import('./components/views/ProductsView.tsx'));
const ProformaView = lazy(() => import('./components/views/ProformaView.tsx'));
const ReportsView = lazy(() => import('./components/views/ReportsView.tsx'));
const SettingsView = lazy(() => import('./components/views/SettingsView.tsx'));
const ActivityView = lazy(() => import('./components/views/ActivityView.tsx'));


const SkeletonLoader: React.FC = () => (
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


const App: React.FC = () => {
    useTheme(); // Apply theme and background on load
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    
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

    const availableTabs: { key: View; label: string }[] = [
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