import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { generateId } from '../../utils/idUtils.ts';
import ConfirmationModal from '../shared/ConfirmationModal.tsx';
import WorkflowEditor from '../settings/WorkflowEditor.tsx';
import { AiSparkleIcon } from '../shared/Icons.tsx';


const BackupRestore: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, orders, products, setWorkflows, setOrders, setProducts, showNotification } = context;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [restoreConfirm, setRestoreConfirm] = useState<any | null>(null);

    const handleBackup = () => {
        const backupData = {
            workflows,
            orders,
            products,
            backupDate: new Date().toISOString()
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification("فایل پشتیبان با موفقیت دانلود شد");
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.workflows && data.orders && data.products) {
                    setRestoreConfirm(data);
                } else {
                    showNotification("فایل پشتیبان معتبر نیست", "error");
                }
            } catch (err) {
                showNotification("خطا در خواندن فایل پشتیبان", "error");
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = ''; 
    };

    const performRestore = () => {
        if (!restoreConfirm) return;
        setWorkflows(restoreConfirm.workflows);
        setOrders(restoreConfirm.orders);
        setProducts(restoreConfirm.products);
        setRestoreConfirm(null);
        showNotification("اطلاعات با موفقیت بازیابی شد");
    };

    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-4 text-gray-800">پشتیبان‌گیری و بازیابی</h3>
            <p className="text-gray-600 mb-6">می‌توانید از تمام اطلاعات خود یک فایل پشتیبان تهیه کنید یا اطلاعات را از یک فایل پشتیبان بازیابی نمایید. <strong className="font-semibold text-red-600">توجه:</strong> بازیابی اطلاعات، تمام داده‌های فعلی را پاک می‌کند.</p>
            <div className="flex gap-4">
                <button onClick={handleBackup} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">دریافت پشتیبان</button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">بارگذاری پشتیبان</button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>
            <ConfirmationModal 
                show={!!restoreConfirm}
                message="آیا مطمئن هستید؟ تمام اطلاعات فعلی شما با اطلاعات فایل پشتیبان جایگزین خواهد شد. این عمل غیرقابل بازگشت است."
                onConfirm={performRestore}
                onCancel={() => setRestoreConfirm(null)}
            />
        </div>
    );
};

const SettingsView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, setWorkflows, showNotification } = context;
    
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
    const [newWorkflowName, setNewWorkflowName] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleAddWorkflow = () => {
        if (!newWorkflowName.trim()) {
            showNotification("نام فرآیند الزامی است", "error");
            return;
        }
        const newWorkflow = { id: generateId('wf'), name: newWorkflowName, steps: [] };
        setWorkflows(prev => [...prev, newWorkflow]);
        setNewWorkflowName("");
        showNotification("فرآیند جدید ایجاد شد");
    };

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        setWorkflows(prev => prev.filter(wf => wf.id !== deleteConfirmId));
        if (selectedWorkflowId === deleteConfirmId) setSelectedWorkflowId(null);
        showNotification("فرآیند حذف شد");
        setDeleteConfirmId(null);
    };

    const handleDownloadSample = () => {
        const csvHeader = "workflow_name,step_title,field_label,field_type,is_required,field_width,options\n";
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvHeader +
            "فرآیند نمونه واردات,ثبت اولیه,نام مشتری,text,true,half,\n" +
            "فرآیند نمونه واردات,ثبت اولیه,لیست کالا,product,true,full,\n"+
            "فرآیند نمونه واردات,ارسال,نوع ارسال,select,false,half,پست,پیک,حضوری\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "workflow_import_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const selectedWorkflow = workflows.find(wf => wf.id === selectedWorkflowId);

    if (selectedWorkflow) {
        return <WorkflowEditor workflow={selectedWorkflow} onBack={() => setSelectedWorkflowId(null)} />;
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">مدیریت فرآیندها</h2>
            <div className="mb-8 p-4 border rounded-xl bg-gray-50 shadow-sm">
                <div className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        value={newWorkflowName} 
                        onChange={e => setNewWorkflowName(e.target.value)} 
                        placeholder="نام فرآیند جدید" 
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                    <button onClick={handleAddWorkflow} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition-colors">افزودن</button>
                </div>
                 <div className="flex gap-2 items-center">
                    <button onClick={() => alert('این قابلیت به زودی اضافه خواهد شد.')} className="bg-green-100 text-green-800 font-semibold py-2 px-4 rounded-lg text-sm transition-colors hover:bg-green-200">ورود از اکسل</button>
                    <button onClick={handleDownloadSample} className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors">دانلود نمونه</button>
                </div>
            </div>
            <div className="space-y-4">
                {workflows.map(wf => (
                    <div key={wf.id} className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
                        <span className="font-medium text-lg text-gray-800">{wf.name}</span>
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedWorkflowId(wf.id)} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">ویرایش مراحل</button>
                            <button onClick={() => setDeleteConfirmId(wf.id)} className="text-red-600 hover:text-red-800 font-semibold transition-colors">حذف</button>
                        </div>
                    </div>
                ))}
            </div>
            <BackupRestore />
             <ConfirmationModal 
                show={!!deleteConfirmId}
                message="آیا از حذف این فرآیند مطمئن هستید؟ تمام سفارشات مرتبط با آن ممکن است دچار مشکل شوند."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

export default SettingsView;