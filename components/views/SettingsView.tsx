// This file was renamed to SettingsView.jsx to fix MIME type issues on static hosting.
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { generateId } from '../../utils/idUtils.js';
import ConfirmationModal from '../shared/ConfirmationModal.jsx';
import WorkflowEditor from '../settings/WorkflowEditor.jsx';
import UserManagement from '../settings/UserManagement.jsx';
import AppearanceSettings from '../settings/AppearanceSettings.jsx';
import { migrateWorkflow, migrateOrder, migrateProduct, migrateProforma, migrateUser } from '../../utils/migrationUtils.js';


const BackupRestore = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, orders, products, proformas, users, setWorkflows, setOrders, setProducts, setProformas, setUsers, showNotification } = context;

    const fileInputRef = useRef(null);
    const [restoreConfirm, setRestoreConfirm] = useState(null);

    const handleBackup = () => {
        const backupData = {
            workflows,
            orders,
            products,
            proformas,
            users,
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

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // @FIX: Ensure file reader result is a string before parsing.
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const data = JSON.parse(result);
                    if (data.workflows && data.orders && data.products) {
                        setRestoreConfirm(data);
                    } else {
                        showNotification("فایل پشتیبان معتبر نیست", "error");
                    }
                } else {
                    showNotification("خطا در خواندن فایل پشتیبان", "error");
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

        // Safely migrate each data type, handling potentially missing arrays in the backup file
        const restoredWorkflows = restoreConfirm.workflows?.map(migrateWorkflow) || [];
        const restoredOrders = restoreConfirm.orders?.map(migrateOrder) || [];
        const restoredProducts = restoreConfirm.products?.map(migrateProduct) || [];
        const restoredProformas = restoreConfirm.proformas?.map(migrateProforma) || [];
        const restoredUsers = restoreConfirm.users?.map(migrateUser) || [];
        
        setWorkflows(restoredWorkflows);
        setOrders(restoredOrders);
        setProducts(restoredProducts);
        setProformas(restoredProformas);
        setUsers(restoredUsers);
        setRestoreConfirm(null);
        showNotification("اطلاعات با موفقیت بازیابی شد. داده‌ها برای سازگاری به‌روز شدند.");
    };

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
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

const WorkflowSettings = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { workflows, setWorkflows, showNotification, logActivity } = context;
    
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
    const [newWorkflowName, setNewWorkflowName] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleAddWorkflow = () => {
        if (!newWorkflowName.trim()) {
            showNotification("نام فرآیند الزامی است", "error");
            return;
        }
        const newWorkflow = { id: generateId('wf'), name: newWorkflowName, steps: [] };
        setWorkflows(prev => [...prev, newWorkflow]);
        setNewWorkflowName("");
        showNotification("فرآیند جدید ایجاد شد");
        logActivity('CREATE', 'Workflow', `فرآیند '${newWorkflow.name}' را ایجاد کرد.`, newWorkflow.id);
    };

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        const workflowToDelete = workflows.find(wf => wf.id === deleteConfirmId);
        setWorkflows(prev => prev.filter(wf => wf.id !== deleteConfirmId));
        if (selectedWorkflowId === deleteConfirmId) setSelectedWorkflowId(null);
        showNotification("فرآیند حذف شد");
        setDeleteConfirmId(null);
        if(workflowToDelete) {
            logActivity('DELETE', 'Workflow', `فرآیند '${workflowToDelete.name}' را حذف کرد.`, deleteConfirmId);
        }
    };
    
    const selectedWorkflow = workflows.find(wf => wf.id === selectedWorkflowId);

    if (selectedWorkflow) {
        return <WorkflowEditor workflow={selectedWorkflow} onBack={() => setSelectedWorkflowId(null)} />;
    }

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">مدیریت فرآیندها</h3>
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
             <ConfirmationModal 
                show={!!deleteConfirmId}
                message="آیا از حذف این فرآیند مطمئن هستید؟ تمام سفارشات مرتبط با آن ممکن است دچار مشکل شوند."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

const SettingsView = () => {
    const [activeTab, setActiveTab] = useState('workflows');
    
    return (
         <div className="p-4 md:p-8 max-w-5xl mx-auto h-full">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex gap-x-6">
                    <button onClick={() => setActiveTab('workflows')} className={`py-3 px-1 text-lg border-b-2 font-medium transition-colors ${activeTab === 'workflows' ? 'text-blue-600 border-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>فرآیندها</button>
                    <button onClick={() => setActiveTab('users')} className={`py-3 px-1 text-lg border-b-2 font-medium transition-colors ${activeTab === 'users' ? 'text-blue-600 border-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>کاربران</button>
                    <button onClick={() => setActiveTab('appearance')} className={`py-3 px-1 text-lg border-b-2 font-medium transition-colors ${activeTab === 'appearance' ? 'text-blue-600 border-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>ظاهر</button>
                    <button onClick={() => setActiveTab('backup')} className={`py-3 px-1 text-lg border-b-2 font-medium transition-colors ${activeTab === 'backup' ? 'text-blue-600 border-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>پشتیبان‌گیری</button>
                </nav>
            </div>

            <div>
                {activeTab === 'workflows' && <WorkflowSettings />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'appearance' && <AppearanceSettings />}
                {activeTab === 'backup' && <BackupRestore />}
            </div>
        </div>
    )
};


export default SettingsView;