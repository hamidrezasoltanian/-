// This file was renamed to ProductsView.jsx to fix MIME type issues on static hosting.
import React, { useState, useMemo, useContext, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { formatNumber } from '../../utils/formatters.js';
import { generateId } from '../../utils/idUtils.js';
import Modal from '../shared/Modal.jsx';
import ConfirmationModal from '../shared/ConfirmationModal.jsx';
import { isAiAvailable, generateProductDescription } from '../../services/geminiService.js';
import { AiSparkleIcon } from '../shared/Icons.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

// ProductForm Component
const ProductForm = ({ product, onSave, onCancel, showNotification }) => {
    const [localProduct, setLocalProduct] = useState(product);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleChange = (field, value) => {
        setLocalProduct(p => ({ ...p, [field]: value }));
    };

    const handleSave = () => {
        if (!localProduct.name?.trim() || !localProduct.code?.trim()) {
            showNotification("نام و کد کالا الزامی است", "error");
            return;
        }
        onSave({
            id: localProduct.id || generateId('prod'),
            name: localProduct.name,
            code: localProduct.code,
            irc: localProduct.irc || '',
            netWeight: localProduct.netWeight || '',
            grossWeight: localProduct.grossWeight || '',
            description: localProduct.description || '',
            currencyPrice: localProduct.currencyPrice || '0',
            currencyType: localProduct.currencyType || 'USD',
            manufacturer: localProduct.manufacturer || '',
        });
    };

    const handleGenerateDesc = async () => {
        setIsGenerating(true);
        const generatedDesc = await generateProductDescription(localProduct);
        setLocalProduct(p => ({ ...p, description: generatedDesc }));
        setIsGenerating(false);
    };

    const formTitle = product.id ? 'ویرایش کالا' : 'افزودن کالا';

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{formTitle}</h2>
            <div className="space-y-4">
                <input type="text" placeholder="نام کالا *" value={localProduct.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="کد کالا *" value={localProduct.code || ''} onChange={e => handleChange('code', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="کد IRC" value={localProduct.irc || ''} onChange={e => handleChange('irc', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" placeholder="وزن خالص (Kg)" value={localProduct.netWeight || ''} onChange={e => handleChange('netWeight', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                     <input type="text" placeholder="شرکت تولید کننده" value={localProduct.manufacturer || ''} onChange={e => handleChange('manufacturer', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" placeholder="قیمت ارزی" value={localProduct.currencyPrice || ''} onChange={e => handleChange('currencyPrice', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" />
                    <select value={localProduct.currencyType || 'USD'} onChange={e => handleChange('currencyType', e.target.value)} className="w-full p-3 border rounded-lg bg-white appearance-none focus:ring-2 focus:ring-blue-500">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="AED">AED</option>
                    </select>
                </div>
                <div className="relative">
                    <textarea placeholder="توضیحات" value={localProduct.description || ''} onChange={e => handleChange('description', e.target.value)} className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500" rows={4}></textarea>
                    {isAiAvailable() && (
                        <button
                            type="button"
                            onClick={handleGenerateDesc}
                            disabled={isGenerating}
                            className="absolute bottom-3 left-3 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-wait flex items-center gap-1 transition-all"
                        >
                            <AiSparkleIcon className="h-4 w-4" />
                            {isGenerating ? 'در حال تولید...' : 'تولید با AI'}
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">لغو</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">ذخیره</button>
            </div>
        </div>
    );
};

// Memoized ProductRow Component for performance
// @FIX: Added inline types for props to resolve destructuring errors with TypeScript.
const ProductRow = React.memo(({ product, onEdit, onDelete, canEdit }: { product: any; onEdit: (product: any) => void; onDelete: (id: any) => void; canEdit: boolean; }) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.code}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.manufacturer}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(product.currencyPrice)} {product.currencyType}</td>
            {canEdit && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEdit(product)} className="text-indigo-600 hover:text-indigo-900 ml-4 transition-colors">ویرایش</button>
                    <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900 transition-colors">حذف</button>
                </td>
            )}
        </tr>
    );
});

// Main ProductsView Component
const ProductsView = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { products, setProducts, showNotification, logActivity } = context;

    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const fileInputRef = useRef(null);

    const canEdit = true;

    const filteredProducts = useMemo(() => {
        if (!debouncedSearchTerm) return products;
        const lowercasedFilter = debouncedSearchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowercasedFilter) ||
            p.code.toLowerCase().includes(lowercasedFilter) ||
            (p.irc && p.irc.toLowerCase().includes(lowercasedFilter)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(lowercasedFilter))
        );
    }, [products, debouncedSearchTerm]);

    const handleAdd = () => setEditingProduct({});
    const handleEdit = (product) => setEditingProduct(product);
    const handleDeleteRequest = (id) => setDeleteConfirmId(id);

    const handleSave = (productToSave) => {
        if (!canEdit) {
            showNotification("شما اجازه ویرایش کالاها را ندارید", "error");
            return;
        }
        const isUpdating = products.some(p => p.id === productToSave.id);

        if (isUpdating) {
            setProducts(prev => prev.map(p => p.id === productToSave.id ? productToSave : p));
            showNotification("کالا با موفقیت به‌روزرسانی شد");
            logActivity('UPDATE', 'Product', `کالای '${productToSave.name}' را به‌روزرسانی کرد.`, productToSave.id);
        } else {
            setProducts(prev => [...prev, productToSave]);
            showNotification("کالا با موفقیت اضافه شد");
            logActivity('CREATE', 'Product', `کالای '${productToSave.name}' را ایجاد کرد.`, productToSave.id);
        }
        setEditingProduct(null);
    };

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        if (!canEdit) {
            showNotification("شما اجازه حذف کالاها را ندارید", "error");
            return;
        }
        const productToDelete = products.find(p => p.id === deleteConfirmId);
        setProducts(prev => prev.filter(p => p.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        showNotification("کالا با موفقیت حذف شد");
        if (productToDelete) {
            logActivity('DELETE', 'Product', `کالای '${productToDelete.name}' (کد: ${productToDelete.code}) را حذف کرد.`, deleteConfirmId);
        }
    };

    const handleDownloadSample = () => {
        const csvHeader = "name,code,irc,netWeight,currencyPrice,currencyType,manufacturer\n";
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvHeader +
            "کالای نمونه 1,PROD-001,12345,12.5,150.50,USD,سازنده نمونه الف\n" +
            "کالای نمونه 2,PROD-002,67890,0.8,220.00,EUR,سازنده نمونه ب";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "product_import_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleFileImport = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // @FIX: Ensure file content is a string before calling .split()
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    showNotification("خطا در خواندن محتوای فایل", "error");
                    return;
                }
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    showNotification("فایل خالی یا نامعتبر است", "error");
                    return;
                }
                const header = lines[0].trim().split(',').map(h => h.trim());
                const requiredHeaders = ['name', 'code', 'currencyPrice', 'currencyType'];
                if (!requiredHeaders.every(h => header.includes(h))) {
                    showNotification(`فایل اکسل باید شامل ستون‌های الزامی زیر باشد: ${requiredHeaders.join(', ')}`, "error");
                    return;
                }

                const newProducts = [];
                let hasError = false;
                lines.slice(1).forEach((line, index) => {
                    const values = line.trim().split(',');
                    // @FIX: Type rowData to allow dynamic property access.
                    const rowData: Record<string, string> = {};
                    header.forEach((h, i) => rowData[h] = values[i]?.trim());
                    
                    if (!rowData.name || !rowData.code) {
                        showNotification(`خطا در ردیف ${index + 2}: نام و کد کالا الزامی است.`, "error");
                        hasError = true;
                        return;
                    }
                    newProducts.push({
                        id: generateId('prod'),
                        name: rowData.name,
                        code: rowData.code,
                        irc: rowData.irc || '',
                        netWeight: rowData.netWeight || '',
                        grossWeight: '',
                        description: '',
                        currencyPrice: rowData.currencyPrice || '0',
                        currencyType: rowData.currencyType === 'EUR' || rowData.currencyType === 'AED' ? rowData.currencyType : 'USD',
                        manufacturer: rowData.manufacturer || ''
                    });
                });
                
                if (!hasError && newProducts.length > 0) {
                    setProducts(prev => [...prev, ...newProducts]);
                    showNotification(`${newProducts.length} کالا با موفقیت اضافه شد.`);
                    logActivity('IMPORT', 'Product', `تعداد ${newProducts.length} کالا را از طریق فایل اکسل وارد کرد.`);
                }
            } catch (err) {
                 showNotification("خطا در پردازش فایل.", "error");
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                 {canEdit && (
                    <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">ورود از اکسل</button>
                        <button onClick={handleDownloadSample} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-sm py-2 px-2">دانلود نمونه</button>
                        <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm">+ افزودن کالا</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
                    </div>
                 )}
            </div>
            <input type="text" placeholder="جستجوی کالا (نام، کد، IRC، تولیدکننده...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500" />
            
            <div className="flex-grow bg-white shadow-lg rounded-xl overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['نام کالا', 'کد کالا', 'تولیدکننده', 'قیمت ارزی', canEdit ? 'عملیات' : ''].map(h => 
                                <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.map(p => (
                            <ProductRow
                                key={p.id}
                                product={p}
                                onEdit={handleEdit}
                                onDelete={handleDeleteRequest}
                                canEdit={canEdit}
                            />
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>هیچ کالایی یافت نشد.</p>
                    </div>
                 )}
            </div>

            <Modal show={!!editingProduct} onClose={() => setEditingProduct(null)}>
                {editingProduct && <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setEditingProduct(null)} showNotification={showNotification} />}
            </Modal>
            
            <ConfirmationModal 
                show={!!deleteConfirmId}
                message="آیا از حذف این کالا مطمئن هستید؟ این عمل غیرقابل بازگشت است."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

export default ProductsView;