import React, { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { generateId } from '../../utils/idUtils.ts';
import FieldEditor from './FieldEditor.tsx';

const WorkflowEditor = ({ workflow, onBack }) => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { setWorkflows, showNotification, logActivity } = context;

    const [localWorkflow, setLocalWorkflow] = useState(workflow);
    const [draggedField, setDraggedField] = useState(null);

    const handleWorkflowNameChange = (e) => setLocalWorkflow(prev => ({ ...prev, name: e.target.value }));
    const handleAddStep = () => setLocalWorkflow(prev => ({ ...prev, steps: [...prev.steps, { id: generateId('step'), title: 'مرحله جدید', fields: [] }] }));
    const handleUpdateStep = (stepId, newTitle) => setLocalWorkflow(prev => ({ ...prev, steps: prev.steps.map(s => s.id === stepId ? { ...s, title: newTitle } : s) }));
    const handleDeleteStep = (stepId) => setLocalWorkflow(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== stepId) }));
    const handleAddField = (stepId) => {
        const newField = { id: generateId('field'), name: `field_${Date.now()}`, label: 'فیلد جدید', type: 'text', required: false, width: 'half' };
        setLocalWorkflow(prev => ({ ...prev, steps: prev.steps.map(s => s.id === stepId ? { ...s, fields: [...s.fields, newField] } : s) }));
    };
    const handleUpdateField = (stepId, updatedField) => setLocalWorkflow(prev => ({ ...prev, steps: prev.steps.map(s => s.id === stepId ? { ...s, fields: s.fields.map(f => f.id === updatedField.id ? updatedField : f) } : s) }));
    const handleDeleteField = (stepId, fieldId) => setLocalWorkflow(prev => ({ ...prev, steps: prev.steps.map(s => s.id === stepId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s) }));
    
    const handleSave = () => {
        setWorkflows(prev => prev.map(wf => wf.id === localWorkflow.id ? localWorkflow : wf));
        showNotification("تغییرات فرآیند ذخیره شد");
        logActivity('UPDATE', 'Workflow', `فرآیند '${localWorkflow.name}' را به‌روزرسانی کرد.`, localWorkflow.id);
        onBack();
    };
    
    const handleFieldDragStart = (e, stepId, fieldId) => {
        setDraggedField({ stepId, fieldId });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleFieldDrop = (e, targetStepId, targetFieldId) => {
        e.preventDefault();
        if (!draggedField || draggedField.stepId !== targetStepId) return;

        setLocalWorkflow(prev => {
            const newWorkflow = JSON.parse(JSON.stringify(prev));
            const step = newWorkflow.steps.find((s) => s.id === targetStepId);
            if (!step) return prev;

            const fields = step.fields;
            const draggedIndex = fields.findIndex((f) => f.id === draggedField.fieldId);
            const targetIndex = fields.findIndex((f) => f.id === targetFieldId);

            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            const [draggedItem] = fields.splice(draggedIndex, 1);
            fields.splice(targetIndex, 0, draggedItem);
            
            return newWorkflow;
        });
        setDraggedField(null);
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                    <input value={localWorkflow.name} onChange={handleWorkflowNameChange} className="text-2xl md:text-3xl font-bold p-1 rounded-md focus:ring-2 focus:ring-blue-300 w-full" />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                {localWorkflow.steps.map(step => (
                    <div key={step.id} className="border rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <input value={step.title} onChange={e => handleUpdateStep(step.id, e.target.value)} className="text-xl font-semibold p-1 rounded-md focus:ring-1 focus:ring-blue-400 w-full"/>
                           <button onClick={() => handleDeleteStep(step.id)} className="text-red-500 hover:text-red-700 font-semibold transition-colors flex-shrink-0">حذف مرحله</button>
                        </div>
                        <div className="space-y-2">
                            {step.fields.map(field => (
                                <div 
                                    key={field.id} 
                                    draggable="true"
                                    onDragStart={(e) => handleFieldDragStart(e, step.id, field.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleFieldDrop(e, step.id, field.id)}
                                    onDragEnd={() => setDraggedField(null)}
                                    className={`p-2 bg-gray-50 rounded-lg border border-dashed transition-opacity ${draggedField?.fieldId === field.id ? 'opacity-30' : 'opacity-100'}`}
                                >
                                    <FieldEditor
                                        field={field}
                                        onUpdate={(updatedField) => handleUpdateField(step.id, updatedField)}
                                        onDelete={() => handleDeleteField(step.id, field.id)}
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleAddField(step.id)} className="text-blue-600 hover:text-blue-800 mt-4 font-semibold transition-colors">+ افزودن فیلد</button>
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 pt-6 mt-4 border-t">
                <button onClick={handleAddStep} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">+ افزودن مرحله جدید</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg float-left transition-colors">ذخیره کل تغییرات</button>
            </div>
        </div>
    );
};

export default WorkflowEditor;