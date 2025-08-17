
import React, { useState, useMemo } from 'react';
import { AppContext, AppContextType } from './contexts/AppContext.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { useNotification } from './hooks/useNotification.ts';
import { Product, Order, Workflow, Proforma } from './types.ts';
import { DEFAULT_WORKFLOW } from './constants.ts';
import WorkflowView from './components/views/WorkflowView.tsx';
import ProductsView from './components/views/ProductsView.tsx';
import ProformaView from './components/views/ProformaView.tsx';
import ReportsView from './components/views/ReportsView.tsx';
import SettingsView from './components/views/SettingsView.tsx';

type View = 'workflow' | 'products' | 'proforma' | 'reports' | 'settings';

const App: React.FC = () => {
    const [workflows, setWorkflows] = useLocalStorage<Workflow[]>("workflows_v12", [DEFAULT_WORKFLOW]);
    const [orders, setOrders] = useLocalStorage<Order[]>("orders_v12", []);
    const [products, setProducts] = useLocalStorage<Product[]>("products_v12", []);
    const [proformas, setProformas] = useLocalStorage<Proforma[]>("proformas_v12", []);
    const [activeView, setActiveView] = useState<View>('workflow');
    const { showNotification, NotificationComponent } = useNotification();

    const contextValue: AppContextType = useMemo(() => ({
        workflows, setWorkflows,
        orders, setOrders,
        products, setProducts,
        proformas, setProformas,
        showNotification
    }), [workflows, setWorkflows, orders, setOrders, products, setProducts, proformas, setProformas, showNotification]);
    
    const renderContent = () => {
        switch (activeView) {
            case 'workflow': return <WorkflowView />;
            case 'products': return <ProductsView />;
            case 'proforma': return <ProformaView />;
            case 'reports': return <ReportsView />;
            case 'settings': return <SettingsView />;
            default: return null;
        }
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="h-screen flex flex-col bg-gray-100 font-sans">
                <NotificationComponent />
                <header className="bg-white shadow-sm p-4 border-b z-10">
                    <div className="flex justify-between items-center max-w-screen-2xl mx-auto px-4">
                        <h1 className="text-xl md:text-2xl font-bold text-blue-600">EZ Dashboard</h1>
                        <nav className="flex gap-x-2 md:gap-x-6">
                            {[
                                { key: 'workflow', label: 'گردش کار' },
                                { key: 'products', label: 'کالاها' },
                                { key: 'proforma', label: 'پیش‌فاکتور' },
                                { key: 'reports', label: 'گزارشات' },
                                { key: 'settings', label: 'تنظیمات' }
                            ].map(tab => (
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
                </header>
                <main className="flex-grow bg-gray-50 overflow-hidden">
                    {renderContent()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;