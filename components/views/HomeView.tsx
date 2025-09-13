// This file was renamed to HomeView.jsx to fix MIME type issues on static hosting.
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { formatNumber } from '../../utils/formatters.js';
import { toJalali } from '../../utils/dateUtils.js';
import { calculateOrderProgress } from '../../utils/orderUtils.js';
import { ClipboardListIcon, BoxIcon, DocumentTextIcon, PlusCircleIcon } from '../shared/Icons.jsx';

const StatCard = ({ title, value, icon, color, onClick }) => (
    <button onClick={onClick} className="soft-shadow bg-white p-6 flex items-center gap-4 text-right w-full transition-all hover:scale-[1.03]">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{formatNumber(value)}</p>
        </div>
    </button>
);


const QuickAction = ({ label, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-3 p-3 text-gray-700 font-semibold hover:bg-slate-200 rounded-lg transition-colors w-full text-right">
        <PlusCircleIcon className="w-6 h-6 text-blue-500" />
        <span>{label}</span>
    </button>
);

const HomeView = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, products, proformas, setActiveView, setSelectedOrderId, workflows } = context;

    const sortedOrders = useMemo(() => 
        [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), 
    [orders]);

    const handleViewOrder = (orderId) => {
        setSelectedOrderId(orderId);
        setActiveView('workflow');
    };
    
    return (
        <div className="p-4 md:p-8 h-full">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">داشبورد</h1>
                    <p className="text-gray-500 mt-2">خوش آمدید! در اینجا یک نمای کلی از فعالیت‌های خود را مشاهده می‌کنید.</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="تعداد کل سفارشات" 
                        value={orders.length} 
                        icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} 
                        color="bg-blue-500" 
                        onClick={() => setActiveView('workflow')}
                    />
                    <StatCard 
                        title="کالاهای ثبت شده" 
                        value={products.length} 
                        icon={<BoxIcon className="w-6 h-6 text-white"/>} 
                        color="bg-green-500" 
                        onClick={() => setActiveView('products')}
                    />
                    <StatCard 
                        title="پیش‌فاکتورها" 
                        value={proformas.length} 
                        icon={<DocumentTextIcon className="w-6 h-6 text-white"/>} 
                        color="bg-indigo-500" 
                        onClick={() => setActiveView('proforma')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white soft-shadow p-6">
                        <button onClick={() => setActiveView('workflow')} className="w-full text-right group">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 inline-block group-hover:text-blue-600 transition-colors">آخرین سفارشات</h2>
                        </button>
                        <div className="space-y-3">
                            {sortedOrders.length > 0 ? sortedOrders.slice(0, 5).map(order => {
                                const workflow = workflows.find(wf => wf.id === order.workflowId);
                                const progress = calculateOrderProgress(order, workflow);
                                return (
                                <div key={order.id} className="p-3 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-700">{order.title}</p>
                                            <p className="text-sm text-gray-500">{toJalali(order.created_at)}</p>
                                        </div>
                                        <button onClick={() => handleViewOrder(order.id)} className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 transition-colors">
                                            مشاهده
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-gray-500">پیشرفت</span>
                                            <span className="text-xs font-semibold text-blue-600">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}) : (
                                <p className="text-center py-8 text-gray-500">هنوز سفارشی ثبت نشده است.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white soft-shadow p-6">
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
