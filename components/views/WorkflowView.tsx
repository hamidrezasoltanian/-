import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Order, Workflow, Step } from '../../types.ts';
import { generateId } from '../../utils/idUtils.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import OrderDetail from '../order/OrderDetail.tsx';
import Modal from '../shared/Modal.tsx';

// Kanban Column Component
interface KanbanColumnProps {
    step: Step;
    orders: Order[];
    onOrderSelect: (orderId: string) => void;
}

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
                        className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500 border-2 border-transparent transition-all"
                    >
                        <p className="font-semibold text-gray-900 break-words">{order.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{toJalali(order.created_at)}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const WorkflowView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, setOrders, workflows, showNotification, selectedOrderId, setSelectedOrderId, logActivity } = context;
    
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(workflows[0]?.id || null);

    useEffect(() => {
        if (!activeWorkflowId && workflows.length > 0) {
            setActiveWorkflowId(workflows[0].id);
        }
    }, [workflows, activeWorkflowId]);

    const canEdit = true;

    const handleAddOrder = (workflowId: string) => {
        if (!canEdit) {
            showNotification("شما اجازه ایجاد سفارش جدید را ندارید", "error");
            return;
        }
        const workflow = workflows.find(wf => wf.id === workflowId);
        const orderTitle = `سفارش جدید - ${workflow?.name || ''} - ${toJalali(new Date().toISOString())}`;
        const newOrder: Order = {
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
        
        const workflowOrders = [...orders]
            .filter(o => o.workflowId === activeWorkflowId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        workflowOrders.forEach(order => {
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

        return columns;
    }, [activeWorkflowId, orders, workflows]);


    return (
        <div className="flex flex-col h-full p-4 md:p-6 bg-gray-50">
            <header className="flex-shrink-0 flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-800">گردش کار کانبان</h2>
                     <p className="text-gray-500 mt-1">وضعیت سفارشات خود را در یک نگاه مدیریت کنید.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={activeWorkflowId || ''}
                        onChange={(e) => setActiveWorkflowId(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                    >
                        {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </select>
                    {canEdit && <button onClick={() => setShowNewOrderModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:shadow-lg transition-all">+ سفارش جدید</button>}
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