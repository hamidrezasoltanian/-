import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { calculateOrderProgress } from '../../utils/orderUtils.ts';
import StepForm from './StepForm.tsx';
import ConfirmationModal from '../shared/ConfirmationModal.tsx';
import Modal from '../shared/Modal.tsx';
import OrderSummary from './OrderSummary.tsx';

const OrderDetail = ({ order, onUpdate, onDelete, readOnly = false }) => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, showNotification, logActivity } = context;

    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [orderTitle, setOrderTitle] = useState(order.title || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    const workflow = workflows.find(wf => wf.id === order.workflowId);
    const isFinalized = !!order.is_finalized;
    const progress = calculateOrderProgress(order, workflow);

    useEffect(() => {
        setOrderTitle(order.title);
        setActiveStepIndex(0);
    }, [order]);

    if (!workflow) {
        return <div className="text-center text-red-500 p-8 bg-red-50 rounded-lg">خطا: فرآیند مربوط به این سفارش یافت نشد. ممکن است حذف شده باشد.</div>;
    }

    const handleStepDataChange = (stepId, data) => {
        const updatedStepsData = { ...(order.steps_data || {}), [stepId]: data };
        onUpdate({ ...order, steps_data: updatedStepsData });
        
        const step = workflow.steps.find(s => s.id === stepId);
        if (step) {
            logActivity('UPDATE', 'Order', `مرحله '${step.title}' از سفارش '${order.title}' را به‌روزرسانی کرد.`, order.id);
        }
    };

    const handleSaveTitle = () => {
        if (order.title !== orderTitle && orderTitle.trim()) {
            onUpdate({ ...order, title: orderTitle.trim() });
            showNotification("عنوان سفارش به‌روزرسانی شد");
            logActivity('UPDATE', 'Order', `عنوان سفارش را از '${order.title}' به '${orderTitle.trim()}' تغییر داد.`, order.id);
        }
    };

    const handleFinalize = () => {
        onUpdate({ ...order, is_finalized: true });
        setShowFinalizeConfirm(false);
        showNotification("سفارش نهایی و بایگانی شد.");
        logActivity('UPDATE', 'Order', `سفارش '${order.title}' را نهایی کرد.`, order.id);
    };

    const isStepCompleted = (stepId) => {
        return !!order.steps_data?.[stepId]?.completed_at;
    };

    const activeStep = workflow.steps[activeStepIndex];
    const stepDataJson = JSON.stringify(order.steps_data?.[activeStep.id]?.data || {});

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-grow">
                     <input 
                        type="text" 
                        value={orderTitle} 
                        onChange={e => setOrderTitle(e.target.value)} 
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        disabled={readOnly || isFinalized}
                        className="text-2xl font-bold flex-grow p-2 rounded-md bg-transparent hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all w-full disabled:bg-transparent disabled:cursor-not-allowed"
                    />
                    <div className="mt-3 pr-2 space-y-2">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-600">میزان پیشرفت</span>
                                <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        {isFinalized && <p className="text-sm text-green-600 font-semibold">این سفارش نهایی شده و قابل ویرایش نیست.</p>}
                    </div>
                </div>
               
                <div className="flex items-center gap-2 flex-wrap">
                    {!isFinalized && !readOnly && <button onClick={() => setShowFinalizeConfirm(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">ذخیره نهایی</button>}
                    <button onClick={() => setShowSummary(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">خلاصه عملیات</button>
                    {!readOnly && !isFinalized && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg transition-colors">حذف سفارش</button>}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg">
                <nav className="border-b border-gray-200 flex overflow-x-auto">
                    {workflow.steps.map((step, index) => (
                        <button 
                            key={step.id} 
                            onClick={() => setActiveStepIndex(index)} 
                            className={`py-4 px-6 text-center whitespace-nowrap flex items-center gap-2 transition-colors duration-200 ${activeStepIndex === index ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {isStepCompleted(step.id) && <span className="text-green-500 text-xl">✓</span>}
                            {step.title}
                        </button>
                    ))}
                </nav>
                <div className="p-6">
                    <StepForm 
                        key={`${order.id}-${activeStep.id}-${stepDataJson}`}
                        order={order} 
                        workflowStep={activeStep}
                        onStepDataChange={handleStepDataChange} 
                        readOnly={readOnly || isFinalized}
                    />
                </div>
            </div>

            <Modal show={showSummary} onClose={() => setShowSummary(false)} maxWidth="max-w-4xl">
                 {showSummary && <OrderSummary order={order} onClose={() => setShowSummary(false)} />}
            </Modal>

            <ConfirmationModal 
                show={showFinalizeConfirm}
                message="آیا از نهایی کردن سفارش مطمئن هستید؟ پس از این مرحله، سفارش دیگر قابل ویرایش نخواهد بود."
                confirmText="نهایی کردن"
                confirmButtonClass="bg-blue-600 hover:bg-blue-700"
                onConfirm={handleFinalize}
                onCancel={() => setShowFinalizeConfirm(false)}
            />

            <ConfirmationModal 
                show={showDeleteConfirm}
                message="آیا از حذف این سفارش مطمئن هستید؟ این عمل غیرقابل بازگشت است."
                onConfirm={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

export default OrderDetail;