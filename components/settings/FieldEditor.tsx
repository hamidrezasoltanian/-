// This file was renamed to FieldEditor.jsx to fix MIME type issues on static hosting.
import React from 'react';

const FieldEditor = ({ field, onUpdate, onDelete }) => {
    const handleChange = (key, value) => {
        onUpdate({ ...field, [key]: value });
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 md:col-span-3">
                    <input value={field.label} onChange={e => handleChange('label', e.target.value)} placeholder="عنوان فیلد" className="w-full p-2 border rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-2">
                    <select value={field.type} onChange={e => handleChange('type', e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="text">متن</option>
                        <option value="number">عدد</option>
                        <option value="date">تاریخ</option>
                        <option value="textarea">متن بلند</option>
                        <option value="checkbox">چک‌باکس</option>
                        <option value="select">انتخابی</option>
                        <option value="product">کالا</option>
                    </select>
                </div>
                <div className="col-span-6 md:col-span-2">
                    <select value={field.width || 'half'} onChange={e => handleChange('width', e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="half">نیم عرض</option>
                        <option value="full">تمام عرض</option>
                    </select>
                </div>
                <div className="col-span-6 md:col-span-3 flex items-center gap-2 justify-center">
                    <input type="checkbox" id={`req_${field.id}`} checked={!!field.required} onChange={e => handleChange('required', e.target.checked)} className="h-4 w-4 rounded" />
                    <label htmlFor={`req_${field.id}`} className="cursor-pointer">الزامی</label>
                </div>
                <div className="col-span-6 md:col-span-2 text-left">
                    <button onClick={onDelete} className="text-gray-500 hover:text-red-600 font-semibold transition-colors">حذف</button>
                </div>
            </div>
            {field.type === 'select' && (
                <div className="col-span-12 mt-2">
                    <input
                        type="text"
                        placeholder="گزینه‌ها را با کاما (,) جدا کنید"
                        value={(field.options || []).join(',')}
                        onChange={e => handleChange('options', e.target.value.split(','))}
                        className="w-full p-2 border rounded-md text-sm bg-gray-100"
                    />
                </div>
            )}
        </div>
    );
};

export default FieldEditor;
