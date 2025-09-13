// This file was renamed to WorkflowView.jsx to fix MIME type issues on static hosting.
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { generateId } from '../../utils/idUtils.js';
import { toJalali } from '../../utils/dateUtils.js';
import { calculateOrderProgress } from '../../utils/orderUtils.js';
import OrderDetail from '../order/OrderDetail.jsx';
import Modal from '../shared/Modal.jsx';

// Memoized KanbanCard for performance
// @FIX: Add inline types for props to resolve destructuring errors with TypeScript.
const KanbanCard = React.memo(({ order, onOrderSelect, workflow }: { order: any; onOrderSelect: (id: any) => void; workflow: any; }) => {
    const progress = calculateOrderProgress(order, workflow);
    return (
        <div
            onClick={() => onOrderSelect(order.id)}
            className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 border-2 border-transparent transition-all"
        >
            <p className="font-semibold text-gray-900 break-words">{order.title}</p>
            <p className="text-sm text-gray-500 mt-1">{toJalali(order.created_at)}</p>
            <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">پیشرفت</span>
                    <span className="text-xs font-semibold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
});


// Kanban Column Component
const KanbanColumn = ({ step, orders, onOrderSelect, workflow }) => (
    <div className="flex-shrink-0 w-80 bg-slate-200/60 rounded-xl flex flex-col max-h-full">
        <div className="p-4 border-b border-slate-300">
            <h3 className="text-lg font-bold text-gray-800 flex justify-between items-center">
                <span>{step.title}</span>
                <span className="text-sm font-medium bg-slate-300 text-slate-600 rounded-full px-2 py-0.5">{orders.length}</span>
            </h3>
        </div>
        <div className="p-3 overflow-y-auto flex-grow">
            <div className="space-y-3">
                {orders.map(order => (
                    <KanbanCard 
                        key={order.id} 
                        order={order}
                        onOrderSelect={onOrderSelect} 
                        workflow={workflow}
                    />
                ))}
            </div>
        </div>
    </div>
);


const WorkflowView = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, setOrders, workflows, showNotification, selectedOrderId, setSelectedOrderId, logActivity } = context;
    
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [activeWorkflowId, setActiveWorkflowId] = useState(workflows[0]?.id || null);

    useEffect(() => {
        if (!activeWorkflowId && workflows.length > 0) {
            setActiveWorkflowId(workflows[0].id);
        }
    }, [workflows, activeWorkflowId]);

    const canEdit = true;
    const activeWorkflow = useMemo(() => workflows.find(wf => wf.id === activeWorkflowId), [workflows, activeWorkflowId]);

    const handleAddOrder = (workflowId) => {
        if (!canEdit) {
            showNotification("شما اجازه ایجاد سفارش جدید را ندارید", "error");
            return;
        }
        const workflow = workflows.find(wf => wf.id === workflowId);
        const orderTitle = `سفارش جدید - ${workflow?.name || ''} - ${toJalali(new Date().toISOString())}`;
        const newOrder = {
            id: generateId('order'),
            workflowId,
            created_at: new Date().toISOString(),
            title: orderTitle,
            steps_data: {}
        };
        setOrders(prev => [newOrder, ...prev]);
        setSelectedOrderId(newOrder.id);
        setShowNewOrderModal(false);
        showNotification("سفارش جدید ایجاد شد");
        logActivity('CREATE', 'Order', `سفارش '${orderTitle}' را ایجاد کرد.`, newOrder.id);
    };
    
    const handleUpdateOrder = (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    const handleDeleteOrder = (orderId) => {
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
        if (!activeWorkflow) return [];

        const columns = activeWorkflow.steps.map(step => ({ step, orders: [] }));
        
        const workflowOrders = [...orders]
            .filter(o => o.workflowId === activeWorkflowId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        workflowOrders.forEach(order => {
            let lastCompletedStepIndex = -1;
            for (let i = activeWorkflow.steps.length - 1; i >= 0; i--) {
                const step = activeWorkflow.steps[i];
                if (order.steps_data?.[step.id]?.completed_at) {
                    lastCompletedStepIndex = i;
                    break;
                }
            }
            
            // For finalized orders, put them in the last column regardless of last step completed
            if (order.is_finalized && columns.length > 0) {
                 columns[columns.length - 1].orders.push(order);
                 return;
            }

            let targetColumnIndex = lastCompletedStepIndex + 1;
            if (targetColumnIndex >= columns.length) {
                targetColumnIndex = columns.length - 1;
            }
            columns[targetColumnIndex].orders.push(order);
        });

        return columns;
    }, [activeWorkflow, orders, activeWorkflowId]);


    return (
        <div className="flex flex-col h-full p-4 md:p-6 bg-slate-100">
            <header className="flex-shrink-0 flex justify-between items-center mb-6 flex-wrap gap-4">
                <p className="text-gray-500 mt-1">وضعیت سفارشات خود را در یک نگاه مدیریت کنید.</p>
                <div className="flex items-center gap-4">
                    <select
                        value={activeWorkflowId || ''}
                        onChange={(e) => setActiveWorkflowId(e.target.value)}
                        className="p-3 border border-slate-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                    >
                        {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </select>
                    {canEdit && <button onClick={() => setShowNewOrderModal(true)} className="soft-shadow soft-shadow-active bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-all">+ سفارش جدید</button>}
                </div>
            </header>
            
            <main className="flex-grow overflow-x-auto pb-4">
                <div className="flex gap-6 h-full">
                    {activeWorkflow && kanbanData.length > 0 ? (
                        kanbanData.map(({ step, orders }) => (
                            <KanbanColumn
                                key={step.id}
                                step={step}
                                orders={orders}
                                onOrderSelect={setSelectedOrderId}
                                workflow={activeWorkflow}
                            />
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <p>برای این فرآیند مرحله‌ای تعریف نشده یا فرآیندی انتخاب نشده است.</p>
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
                    {workflows.map((wf) => (
                        <button 
                            key={wf.id} 
                            onClick={() => handleAddOrder(wf.id)} 
                            className="w-full text-right p-4 border rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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