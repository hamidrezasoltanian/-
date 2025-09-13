import React, { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import KamaDatePicker from '../shared/KamaDatePicker.tsx';
import ProductSelectorField from './ProductSelectorField.tsx';

const StepForm = ({ order, workflowStep, onStepDataChange, readOnly = false }) => {
    const { showNotification } = useContext(AppContext);
    
    const [formData, setFormData] = useState(() => order.steps_data?.[workflowStep.id]?.data || {});
    const [errors, setErrors] = useState({});

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (readOnly) return;
        
        const newErrors = {};
        workflowStep.fields.forEach(field => {
            const value = formData[field.name];
            if (field.required) {
                if (field.type === 'product') {
                     if (!Array.isArray(value) || value.length === 0) {
                        newErrors[field.name] = 'انتخاب حداقل یک مورد الزامی است';
                     }
                } else if (value === undefined || value === null || value === '') {
                    newErrors[field.name] = 'این فیلد الزامی است';
                }
            }
        });
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onStepDataChange(workflowStep.id, {
                data: formData,
                completed_at: new Date().toISOString()
            });
            showNotification("اطلاعات مرحله با موفقیت ذخیره شد");
        } else {
            showNotification("لطفاً فیلدهای الزامی را پر کنید", "error");
        }
    };
    
    const renderField = (field) => {
        const value = formData[field.name];
        const error = errors[field.name];
        const disabledClass = "disabled:bg-gray-100 disabled:cursor-not-allowed";

        switch (field.type) {
            case 'date':
                return <KamaDatePicker name={field.name} value={String(value || '')} onChange={handleChange} error={!!error} />;
            case 'checkbox':
                return (
                    <div className="flex items-center pt-6">
                        <input id={field.id} type="checkbox" name={field.name} checked={!!value} onChange={handleChange} disabled={readOnly} className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${disabledClass}`} />
                        <label htmlFor={field.id} className="mr-2 block text-sm font-medium text-gray-700">{field.label}</label>
                    </div>
                );
            case 'select':
                return (
                    <select name={field.name} value={String(value || '')} onChange={handleChange} disabled={readOnly} className={`w-full border rounded-lg shadow-sm p-3 bg-white appearance-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${disabledClass}`}>
                        <option value="">انتخاب کنید...</option>
                        {(field.options || []).map((opt, i) => (<option key={i} value={opt.trim()}>{opt.trim()}</option>))}
                    </select>
                );
            case 'product':
                return <ProductSelectorField field={field} value={Array.isArray(value) ? value : []} onChange={handleChange} error={!!error} readOnly={readOnly} />;
            case 'textarea':
                return <textarea name={field.name} value={String(value || '')} onChange={handleChange} rows={4} disabled={readOnly} className={`w-full border rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${disabledClass}`} />;
            default:
                return <input type={field.type} name={field.name} value={String(value || '')} onChange={handleChange} disabled={readOnly} className={`w-full border rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'} ${disabledClass}`} />;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={readOnly}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    {workflowStep.fields.map(field => (
                        <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                            {field.type !== 'checkbox' && (
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label} {field.required && <span className="text-red-500 mr-1">*</span>}
                                </label>
                            )}
                            {renderField(field)}
                            {errors[field.name] && <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>}
                        </div>
                    ))}
                </div>
                {!readOnly && (
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg">ذخیره اطلاعات</button>
                    </div>
                )}
            </fieldset>
        </form>
    );
};

export default StepForm;