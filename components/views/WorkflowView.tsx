import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Order, Workflow, Step, OrderStatus, OrderHistoryLog } from '../../types.ts';
import { generateId } from '../../utils/idUtils.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import OrderDetail from '../order/OrderDetail.tsx';
import Modal from '../shared/Modal.tsx';
import { SearchIcon } from '../shared/Icons.tsx';

// Kanban Column Component
interface KanbanColumnProps {
    step: Step;
    orders: Order[];
    onOrderSelect: (orderId: string) => void;
}

const STATUS_STYLES: { [key in OrderStatus]: { label: string; className: string; bgColorClass: string; } } = {
    'in-progress': { label: 'در حال انجام', className: 'bg-blue-100 text-blue-800', bgColorClass: 'bg-blue-500' },
    'completed': { label: 'تکمیل شده', className: 'bg-green-100 text-green-800', bgColorClass: 'bg-green-500' },
    'on-hold': { label: 'معلق', className: 'bg-yellow-100 text-yellow-800', bgColorClass: 'bg-yellow-500' },
    'cancelled': { label: 'لغو شده', className: 'bg-red-100 text-red-800', bgColorClass: 'bg-red-500' },
};


const KanbanColumn: React.FC<KanbanColumnProps> = ({ step, orders, onOrderSelect }) => (
    <div className="flex-shrink-0 w-80 bg-gray-100 rounded-xl flex flex-col max-h-full">
        <div className="p-4 border-b">
            <h3 className="text-lg font-bold text-gray-800 flex justify-between items-center">
                <span>{step.title}</span>
                <span className="text-sm font-medium bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{orders.length}</span>
            </h3>
        </div>
        <div className="p-3 overflow-y-auto flex-grow">
            <div className="space-y-3">
                {orders.map(order => (
                    <div
                        key={order.id}
                        onClick={() => onOrderSelect(order.id)}
                        className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all relative"
                    >
                        <div className="flex justify-between items-start">
                            <p className="font-semibold text-gray-900 break-words">{order.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLES[order.status]?.className || ''}`}>
                               {STATUS_STYLES[order.status]?.label || order.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{toJalali(order.created_at)}</p>
                        <div className={`absolute right-0 top-0 bottom-0 w-1.5 rounded-r-lg ${STATUS_STYLES[order.status]?.bgColorClass || 'bg-gray-300'}`}></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const WorkflowView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, setOrders, workflows, showNotification, selectedOrderId, setSelectedOrderId, currentUser, logActivity } = context;
    
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(workflows[0]?.id || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

    useEffect(() => {
        if (!activeWorkflowId && workflows.length > 0) {
            setActiveWorkflowId(workflows[0].id);
        }
    }, [workflows, activeWorkflowId]);

    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'sales';

    const handleAddOrder = (workflowId: string) => {
        if (!canEdit || !currentUser) {
            showNotification("شما اجازه ایجاد سفارش جدید را ندارید", "error");
            return;
        }
        const workflow = workflows.find(wf => wf.id === workflowId);
        const orderTitle = `سفارش جدید - ${workflow?.name || ''} - ${toJalali(new Date().toISOString())}`;
        
        const creationLog: OrderHistoryLog = {
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username,
            detail: 'سفارش ایجاد شد.'
        };

        const newOrder: Order = {
            id: generateId('order'),
            workflowId,
            created_at: new Date().toISOString(),
            title: orderTitle,
            status: 'in-progress',
            steps_data: {},
            history: [creationLog]
        };
        setOrders(prev => [newOrder, ...prev]);
        setSelectedOrderId(newOrder.id);
        setShowNewOrderModal(false);
        showNotification("سفارش جدید ایجاد شد");
        logActivity('CREATE', 'Order', `سفارش '${orderTitle}' را ایجاد کرد.`, newOrder.id);
    };
    
    const handleUpdateOrder = (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleDeleteOrder = (orderId: string) => {
        if (!canEdit) {
            showNotification("شما اجازه حذف سفارش را ندارید", "error");
            return;
        }
        const orderToDelete = orders.find(o => o.id === orderId);
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setSelectedOrderId(null);
        showNotification("سفارش با موفقیت حذف شد");
        if(orderToDelete){
            logActivity('DELETE', 'Order', `سفارش '${orderToDelete.title}' را حذف کرد.`, orderId);
        }
    };
      
    const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

    const kanbanData = useMemo(() => {
        if (!activeWorkflowId) return [];
        const workflow = workflows.find(wf => wf.id === activeWorkflowId);
        if (!workflow) return [];

        const columns: { step: Step; orders: Order[] }[] = workflow.steps.map(step => ({ step, orders: [] }));
        
        const filteredOrders = orders
            .filter(o => {
                if (o.workflowId !== activeWorkflowId) return false;
                // Status filter
                if (statusFilter !== 'all' && o.status !== statusFilter) {
                    return false;
                }
                // Search term filter
                const trimmedSearch = searchTerm.trim().toLowerCase();
                if (trimmedSearch && !o.title.toLowerCase().includes(trimmedSearch)) {
                    return false;
                }
                return true;
            });

        filteredOrders.forEach(order => {
            let lastCompletedStepIndex = -1;
            for (let i = workflow.steps.length - 1; i >= 0; i--) {
                const step = workflow.steps[i];
                if (order.steps_data?.[step.id]?.completed_at) {
                    lastCompletedStepIndex = i;
                    break;
                }
            }

            let targetColumnIndex = lastCompletedStepIndex + 1;
            if (targetColumnIndex >= columns.length) {
                targetColumnIndex = columns.length - 1;
            }
            columns[targetColumnIndex].orders.push(order);
        });

        // Sort orders within each column by creation date (newest first)
        columns.forEach(column => {
            column.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });

        return columns;
    }, [activeWorkflowId, orders, workflows, searchTerm, statusFilter]);


    return (
        <div className="flex flex-col h-full p-4 md:p-6 bg-gray-50">
            <header className="flex-shrink-0 mb-6 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                         <h2 className="text-2xl md:text-3xl font-bold text-gray-800">گردش کار کانبان</h2>
                         <p className="text-gray-500 mt-1">وضعیت سفارشات خود را در یک نگاه مدیریت کنید.</p>
                    </div>
                    {canEdit && <button onClick={() => setShowNewOrderModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all">+ سفارش جدید</button>}
                </div>

                <div className="flex items-center gap-4 flex-wrap bg-gray-100 p-3 rounded-xl border">
                     <div className="relative flex-grow min-w-[200px]">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="جستجوی عنوان سفارش..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                        className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="in-progress">در حال انجام</option>
                        <option value="completed">تکمیل شده</option>
                        <option value="on-hold">معلق</option>
                        <option value="cancelled">لغو شده</option>
                    </select>
                    <select
                        value={activeWorkflowId || ''}
                        onChange={(e) => setActiveWorkflowId(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                    >
                        {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </select>
                </div>
            </header>
            
            <main className="flex-grow overflow-x-auto pb-4">
                <div className="flex gap-6 h-full">
                    {kanbanData.length > 0 ? (
                        kanbanData.map(({ step, orders }) => (
                            <KanbanColumn
                                key={step.id}
                                step={step}
                                orders={orders}
                                onOrderSelect={setSelectedOrderId}
                            />
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 p-8 text-center">
                           {orders.filter(o => o.workflowId === activeWorkflowId).length > 0 
                                ? <p>هیچ سفارشی با فیلترهای اعمال شده مطابقت ندارد.</p>
                                : <p>برای این فرآیند مرحله‌ای تعریف نشده یا فرآیندی انتخاب نشده است.</p>
                           }
                        </div>
                    )}
                </div>
            </main>
            
            <Modal show={!!selectedOrder} onClose={() => setSelectedOrderId(null)} maxWidth="max-w-4xl">
                {selectedOrder && (
                    <OrderDetail 
                        key={selectedOrder.id} 
                        order={selectedOrder} 
                        onUpdate={handleUpdateOrder} 
                        onDelete={() => handleDeleteOrder(selectedOrder.id)}
                        readOnly={!canEdit}
                    />
                )}
            </Modal>

            <Modal show={showNewOrderModal} onClose={() => setShowNewOrderModal(false)} maxWidth="max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">ایجاد سفارش جدید</h2>
                <p className="text-gray-600 mb-6">این سفارش بر اساس کدام فرآیند ایجاد شود؟</p>
                <div className="space-y-3">
                    {workflows.map((wf: Workflow) => (
                        <button 
                            key={wf.id} 
                            onClick={() => handleAddOrder(wf.id)} 
                            className="w-full text-right p-4 border rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {wf.name}
                        </button>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default WorkflowView;