import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Order, OrderStatus, OrderHistoryLog } from '../../types.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import StepForm from './StepForm.tsx';
import ConfirmationModal from '../shared/ConfirmationModal.tsx';
import { ClockIcon } from '../shared/Icons.tsx';

interface OrderDetailProps {
    order: Order;
    onUpdate: (order: Order) => void;
    onDelete: () => void;
    readOnly?: boolean;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, onUpdate, onDelete, readOnly = false }) => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, showNotification, logActivity, currentUser } = context;

    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [orderTitle, setOrderTitle] = useState(order.title || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const workflow = workflows.find(wf => wf.id === order.workflowId);

    useEffect(() => {
        setOrderTitle(order.title);
        setActiveStepIndex(0);
    }, [order]);

    if (!workflow) {
        return <div className="text-center text-red-500 p-8 bg-red-50 rounded-lg">خطا: فرآیند مربوط به این سفارش یافت نشد. ممکن است حذف شده باشد.</div>;
    }

    const logHistory = (detail: string): OrderHistoryLog[] => {
        if (!currentUser) return order.history || [];
        const newLog: OrderHistoryLog = {
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username,
            detail,
        };
        return [newLog, ...(order.history || [])]; // Prepend to show newest first
    };
    
    const handleStepDataChange = (stepId: string, data: any) => {
        const step = workflow.steps.find(s => s.id === stepId);
        if (!step || !currentUser) return;

        const newLogs: OrderHistoryLog[] = [];

        const oldStepState = order.steps_data?.[stepId];
        const wasCompleted = !!oldStepState?.completed_at;
        const isNowCompleted = !!data.completed_at;

        const oldData = oldStepState?.data || {};
        const newData = data.data || {};

        const createLog = (detail: string): OrderHistoryLog => ({
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username,
            detail,
        });

        const formatValueForLog = (value: any, fieldType: string): string => {
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return '"خالی"';
            if (fieldType === 'checkbox') return value ? 'تیک‌دار' : 'بدون تیک';
            if (fieldType === 'date' && typeof value === 'string') return `"${toJalali(value)}"`;
            if (fieldType === 'product') {
                return '[لیست کالاها]';
            }
            
            let stringValue = String(value);
             if (stringValue.length > 40) {
                stringValue = stringValue.substring(0, 37) + '...';
            }
            return `"${stringValue}"`;
        };

        // Compare fields for changes
        step.fields.forEach(field => {
            const oldValue = oldData[field.name];
            const newValue = newData[field.name];

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                const detail = `مقدار فیلد «${field.label}» از ${formatValueForLog(oldValue, field.type)} به ${formatValueForLog(newValue, field.type)} تغییر یافت.`;
                newLogs.push(createLog(detail));
            }
        });

        // Add a log for step completion if it just happened
        if (!wasCompleted && isNowCompleted) {
            newLogs.push(createLog(`مرحله «${step.title}» تکمیل شد.`));
        }

        // If there are any new logs, update the order
        if (newLogs.length > 0) {
            const updatedStepsData = { ...(order.steps_data || {}), [stepId]: data };
            onUpdate({
                ...order,
                steps_data: updatedStepsData,
                history: [...newLogs.reverse(), ...(order.history || [])],
            });

            // Log the primary action (step completion) to the main activity log
            if (!wasCompleted && isNowCompleted) {
                logActivity('UPDATE', 'Order', `مرحله '${step.title}' از سفارش '${order.title}' را تکمیل کرد.`, order.id);
            }
        }
    };

    const handleSaveTitle = () => {
        const trimmedTitle = orderTitle.trim();
        if (order.title !== trimmedTitle && trimmedTitle) {
            const detail = `عنوان سفارش از '${order.title}' به '${trimmedTitle}' تغییر کرد.`;
            onUpdate({ ...order, title: trimmedTitle, history: logHistory(detail) });
            showNotification("عنوان سفارش به‌روزرسانی شد");
            logActivity('UPDATE', 'Order', `عنوان سفارش را از '${order.title}' به '${trimmedTitle}' تغییر داد.`, order.id);
        }
    };

    const statusLabels: { [key in OrderStatus]: string } = {
        'in-progress': 'در حال انجام',
        'completed': 'تکمیل شده',
        'on-hold': 'معلق',
        'cancelled': 'لغو شده'
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as OrderStatus;
        if (order.status === newStatus) return;
        
        let updatedOrder = { ...order, status: newStatus };

        // Auto-complete final step if status is 'completed' and workflow has steps
        if (newStatus === 'completed' && workflow.steps.length > 0) {
            const lastStep = workflow.steps[workflow.steps.length - 1];
            if (lastStep && !updatedOrder.steps_data?.[lastStep.id]?.completed_at) {
                const stepData = updatedOrder.steps_data?.[lastStep.id] || { data: {} };
                 updatedOrder = {
                    ...updatedOrder,
                    steps_data: {
                        ...updatedOrder.steps_data,
                        [lastStep.id]: {
                            ...stepData,
                            completed_at: new Date().toISOString()
                        }
                    }
                };
            }
        }
        
        const detail = `وضعیت سفارش از '${statusLabels[order.status]}' به '${statusLabels[newStatus]}' تغییر کرد.`;
        updatedOrder.history = logHistory(detail);
        
        onUpdate(updatedOrder);

        logActivity('UPDATE', 'Order', `وضعیت سفارش '${order.title}' را به '${statusLabels[newStatus]}' تغییر داد.`, order.id);
        showNotification("وضعیت سفارش به‌روزرسانی شد");
    };

    const isStepCompleted = (stepId: string) => {
        return !!order.steps_data?.[stepId]?.completed_at;
    };

    const formatHistoryTimestamp = (iso: string) => {
        const date = new Date(iso);
        return `${toJalali(iso)} - ${date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const activeStep = workflow.steps[activeStepIndex];
    const stepDataJson = JSON.stringify(order.steps_data?.[activeStep.id]?.data || {});

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <input 
                    type="text" 
                    value={orderTitle} 
                    onChange={e => setOrderTitle(e.target.value)} 
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    disabled={readOnly}
                    className="text-2xl font-bold flex-grow p-2 rounded-md bg-transparent hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all disabled:bg-transparent disabled:cursor-not-allowed"
                />
                <div className="flex items-center gap-x-4">
                     <select
                        value={order.status}
                        onChange={handleStatusChange}
                        disabled={readOnly}
                        className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        aria-label="تغییر وضعیت سفارش"
                    >
                        <option value="in-progress">در حال انجام</option>
                        <option value="completed">تکمیل شده</option>
                        <option value="on-hold">معلق</option>
                        <option value="cancelled">لغو شده</option>
                    </select>
                    {!readOnly && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">حذف سفارش</button>}
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
                    {activeStep ? (
                        <StepForm 
                            key={`${order.id}-${activeStep.id}-${stepDataJson}`}
                            order={order} 
                            workflowStep={activeStep}
                            onStepDataChange={handleStepDataChange} 
                            readOnly={readOnly}
                        />
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <p>هیچ مرحله‌ای برای این فرآیند تعریف نشده است.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">تاریخچه تغییرات</h3>
                <div className="bg-white rounded-xl shadow-lg p-4 max-h-72 overflow-y-auto border">
                    <ul className="divide-y divide-gray-100">
                        {(order.history || []).map((log, index) => (
                            <li key={index} className="p-3 flex items-start space-x-3 space-x-reverse">
                                <div className="flex-shrink-0 pt-1">
                                    <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                        <ClockIcon className="h-4 w-4 text-gray-500" />
                                    </span>
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-800">{log.detail}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        توسط <strong className="font-medium">{log.username}</strong> در {formatHistoryTimestamp(log.timestamp)}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

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