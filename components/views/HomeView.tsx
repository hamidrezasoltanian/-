
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { formatNumber } from '../../utils/formatters.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import { ClipboardListIcon, BoxIcon, DocumentTextIcon, PlusCircleIcon } from '../shared/Icons.tsx';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4 transition-transform hover:scale-105">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{formatNumber(value)}</p>
        </div>
    </div>
);

const QuickAction: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-3 p-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors w-full text-right">
        <PlusCircleIcon className="w-6 h-6 text-blue-500" />
        <span>{label}</span>
    </button>
);

const HomeView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, products, proformas, setActiveView, setSelectedOrderId } = context;

    const sortedOrders = useMemo(() => 
        [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), 
    [orders]);

    const handleViewOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        setActiveView('workflow');
    };
    
    const handleNewProforma = () => {
        // A bit of a workaround to trigger create mode in ProformaView
        // A better long-term solution would be a more advanced router or state machine
        setActiveView('proforma');
        // We rely on the user clicking the create button there, for now.
        // Or we could pass a prop through App state, but this is simpler.
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">داشبورد</h1>
                    <p className="text-gray-500 mt-2">خوش آمدید! در اینجا یک نمای کلی از فعالیت‌های خود را مشاهده می‌کنید.</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="تعداد کل سفارشات" value={orders.length} icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
                    <StatCard title="کالاهای ثبت شده" value={products.length} icon={<BoxIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
                    <StatCard title="پیش‌فاکتورها" value={proformas.length} icon={<DocumentTextIcon className="w-6 h-6 text-white"/>} color="bg-indigo-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">آخرین سفارشات</h2>
                        <div className="space-y-3">
                            {sortedOrders.length > 0 ? sortedOrders.slice(0, 5).map(order => (
                                <div key={order.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="font-semibold text-gray-700">{order.title}</p>
                                        <p className="text-sm text-gray-500">{toJalali(order.created_at)}</p>
                                    </div>
                                    <button onClick={() => handleViewOrder(order.id)} className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 transition-colors">
                                        مشاهده
                                    </button>
                                </div>
                            )) : (
                                <p className="text-center py-8 text-gray-500">هنوز سفارشی ثبت نشده است.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">دسترسی سریع</h2>
                        <div className="space-y-2">
                           <QuickAction label="ایجاد سفارش جدید" onClick={() => setActiveView('workflow')} />
                           <QuickAction label="افزودن کالای جدید" onClick={() => setActiveView('products')} />
                           <QuickAction label="ایجاد پیش‌فاکتور" onClick={() => setActiveView('proforma')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeView;
