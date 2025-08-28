
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AppContext, AppContextType, View } from './contexts/AppContext.ts';
import { useNotification } from './hooks/useNotification.ts';
import { Product, Order, Workflow, Proforma, User, ActivityLog } from './types.ts';
import { generateId } from './utils/idUtils.ts';
import HomeView from './components/views/HomeView.tsx';
import WorkflowView from './components/views/WorkflowView.tsx';
import ProductsView from './components/views/ProductsView.tsx';
import ProformaView from './components/views/ProformaView.tsx';
import ReportsView from './components/views/ReportsView.tsx';
import SettingsView from './components/views/SettingsView.tsx';
import LoginView from './components/views/LoginView.tsx';
import ActivityView from './components/views/ActivityView.tsx';
import { LogoutIcon } from './components/shared/Icons.tsx';

// =================================================================
// شروع: سرویس API واقعی
// نکته برای توسعه‌دهنده: این بخش با سرور واقعی Node.js که در فایل server.js تعریف شده، ارتباط برقرار می‌کند.
// اطمینان حاصل کنید که سرور بک‌اند قبل از اجرای برنامه، در حال اجرا باشد.
// =================================================================

const API_BASE_URL = '';

interface Database {
    workflows: Workflow[];
    orders: Order[];
    products: Product[];
    proformas: Proforma[];
    users: User[];
    activityLogs: ActivityLog[];
}

const api = {
    fetchAllData: async (): Promise<Database> => {
        const response = await fetch(`${API_BASE_URL}/api/data`);
        if (!response.ok) {
            throw new Error('Failed to fetch data from server.');
        }
        return response.json();
    },

    saveData: async <K extends keyof Database>(key: K, data: Database[K]): Promise<Database[K]> => {
        const response = await fetch(`${API_BASE_URL}/api/data/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Failed to save data for ${key}.`);
        }
        return response.json();
    },

    login: async (username: string, password: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        return response.json();
    }
};

// =================================================================
// پایان: سرویس API واقعی
// =================================================================


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
    const [isLoading, setIsLoading] = useState(true);
    const [workflows, setWorkflowsState] = useState<Workflow[]>([]);
    const [orders, setOrdersState] = useState<Order[]>([]);
    const [products, setProductsState] = useState<Product[]>([]);
    const [proformas, setProformasState] = useState<Proforma[]>([]);
    const [users, setUsersState] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>({
        id: 'user_1721511902802_adminuser',
        username: 'admin',
        role: 'admin',
    });
    const [activityLogs, setActivityLogsState] = useState<ActivityLog[]>([]);

    const [activeView, setActiveView] = useState<View>('home');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const { showNotification, NotificationComponent } = useNotification();
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.fetchAllData();
                setWorkflowsState(data.workflows);
                setOrdersState(data.orders);
                setProductsState(data.products);
                setProformasState(data.proformas);
                setUsersState(data.users);
                setActivityLogsState(data.activityLogs);
            } catch (error) {
                console.error("Failed to load data from server", error);
                showNotification("خطا در اتصال به سرور. لطفاً از اجرای بک‌اند مطمئن شوید.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [showNotification]);
    
    // Create setters that perform optimistic UI updates and call the API
    const setWorkflows = useCallback((value: React.SetStateAction<Workflow[]>) => {
        setWorkflowsState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('workflows', newValue).catch(err => {
                console.error("API save failed for workflows:", err);
                showNotification('خطا در ذخیره فرآیندها', 'error');
                // Optional: Rollback state to `current` here
            });
            return newValue;
        });
    }, [showNotification]);
    
    const setOrders = useCallback((value: React.SetStateAction<Order[]>) => {
        setOrdersState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('orders', newValue).catch(err => {
                console.error("API save failed for orders:", err);
                showNotification('خطا در ذخیره سفارشات', 'error');
            });
            return newValue;
        });
    }, [showNotification]);

    const setProducts = useCallback((value: React.SetStateAction<Product[]>) => {
        setProductsState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('products', newValue).catch(err => {
                console.error("API save failed for products:", err);
                showNotification('خطا در ذخیره کالاها', 'error');
            });
            return newValue;
        });
    }, [showNotification]);
    
    const setProformas = useCallback((value: React.SetStateAction<Proforma[]>) => {
        setProformasState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('proformas', newValue).catch(err => {
                console.error("API save failed for proformas:", err);
                showNotification('خطا در ذخیره پیش‌فاکتورها', 'error');
            });
            return newValue;
        });
    }, [showNotification]);

    const setUsers = useCallback((value: React.SetStateAction<User[]>) => {
        setUsersState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('users', newValue).catch(err => {
                console.error("API save failed for users:", err);
                showNotification('خطا در ذخیره کاربران', 'error');
            });
            return newValue;
        });
    }, [showNotification]);

    const setActivityLogs = useCallback((value: React.SetStateAction<ActivityLog[]>) => {
        setActivityLogsState(current => {
            const newValue = value instanceof Function ? value(current) : value;
            api.saveData('activityLogs', newValue).catch(err => {
                console.error("API save failed for activityLogs:", err);
                showNotification('خطا در ذخیره گزارشات', 'error');
            });
            return newValue;
        });
    }, [showNotification]);

    const logActivity = useCallback((action: ActivityLog['action'], entityType: ActivityLog['entityType'], details: string, entityId?: string) => {
        if (!currentUser) return;
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

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        try {
            const user = await api.login(username, password);
            setCurrentUser(user);
            setActiveView('home');
            showNotification(`خوش آمدید ${user.username}!`);
            
            // Log activity directly to avoid stale closure issues with `currentUser`
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
        } catch (error) {
            console.error("Login failed:", error);
            showNotification("نام کاربری یا رمز عبور اشتباه است", "error");
            return false;
        }
    }, [showNotification, setActivityLogs]);

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
    }), [workflows, orders, products, proformas, users, currentUser, login, logout, showNotification, selectedOrderId, activityLogs, logActivity, setWorkflows, setOrders, setProducts, setProformas, setUsers, setActivityLogs]);
    
     if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
                <NotificationComponent />
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">...در حال اتصال به سرور</p>
                </div>
            </div>
        );
    }

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
                            <button
                                onClick={logout}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="خروج"
                                aria-label="خروج از حساب کاربری"
                            >
                                <LogoutIcon className="h-5 w-5" />
                            </button>
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