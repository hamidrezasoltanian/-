import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Order, Workflow } from '../../types.ts';
import { generateId } from '../../utils/idUtils.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import OrderDetail from '../order/OrderDetail.tsx';
import Modal from '../shared/Modal.tsx';

const WorkflowView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, setOrders, workflows, showNotification, selectedOrderId, setSelectedOrderId, currentUser, logActivity } = context;
    
    const [showModal, setShowModal] = useState(false);
    
    const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'sales';

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
        setShowModal(false);
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
        if (selectedOrderId === orderId) {
            setSelectedOrderId(null);
        }
        showNotification("سفارش با موفقیت حذف شد");
        if(orderToDelete){
            logActivity('DELETE', 'Order', `سفارش '${orderToDelete.title}' را حذف کرد.`, orderId);
        }
    };
      
    const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
    const sortedOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [orders]);

    return (
        <div className="flex h-full bg-white">
            <aside className="w-1/3 xl:w-1/4 bg-gray-50 border-l border-gray-200 p-4 flex flex-col">
                {canEdit && <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mb-4 shadow-md hover:shadow-lg transition-all flex-shrink-0">+ ایجاد سفارش جدید</button>}
                <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                    {sortedOrders.map(order => (
                        <div 
                            key={order.id} 
                            onClick={() => setSelectedOrderId(order.id)} 
                            className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-200 ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-transparent bg-white hover:bg-gray-100 hover:border-gray-300'}`}
                        >
                            <h3 className="font-semibold text-gray-800 break-words">{order.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{toJalali(order.created_at)}</p>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="w-2/3 xl:w-3/4 p-4 md:p-8 overflow-y-auto">
                {selectedOrder ? (
                    <OrderDetail 
                        key={selectedOrder.id} 
                        order={selectedOrder} 
                        onUpdate={handleUpdateOrder} 
                        onDelete={() => handleDeleteOrder(selectedOrder.id)}
                        readOnly={!canEdit}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        <h3 className="text-xl font-semibold">یک سفارش را انتخاب کنید</h3>
                        <p className="mt-2">برای مشاهده یا ویرایش جزئیات، یک سفارش از لیست انتخاب کنید یا یک سفارش جدید ایجاد نمایید.</p>
                    </div>
                )}
            </main>
            
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">انتخاب فرآیند</h2>
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
                <button onClick={() => setShowModal(false)} className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors">بستن</button>
            </Modal>
        </div>
    );
};

export default WorkflowView;