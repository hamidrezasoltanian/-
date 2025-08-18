import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Proforma, ProformaItem, Product } from '../../types.ts';
import { generateId } from '../../utils/idUtils.ts';
import { formatNumber } from '../../utils/formatters.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import ConfirmationModal from '../shared/ConfirmationModal.tsx';

// ProformaEditor component (form for create/edit)
interface ProformaEditorProps {
    initialProforma: Proforma | null;
    onSave: (data: Omit<Proforma, 'id' | 'date'> & { id?: string }) => void;
    onCancel: () => void;
}

const ProformaEditor: React.FC<ProformaEditorProps> = ({ initialProforma, onSave, onCancel }) => {
    const { products, showNotification } = useContext(AppContext)!;
    const [companyName, setCompanyName] = useState('');
    const [proformaItems, setProformaItems] = useState<ProformaItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialProforma) {
            setCompanyName(initialProforma.companyName);
            setProformaItems(initialProforma.items);
        } else {
            setCompanyName('');
            setProformaItems([]);
        }
    }, [initialProforma]);

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        if (productId && !proformaItems.some(item => item.productId === productId)) {
            const product = products.find(p => p.id === productId);
            if (product) {
                addOrUpdateItem(product, 1);
            }
        }
        e.target.value = ""; // Reset select
    };
    
    const addOrUpdateItem = (product: Product, quantity: number) => {
        setProformaItems(prev => {
            const existingItem = prev.find(item => item.productId === product.id);
            if(existingItem) {
                return prev.map(item => item.productId === product.id ? {...item, quantity: item.quantity + quantity} : item);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                code: product.code,
                irc: product.irc,
                netWeight: product.netWeight,
                grossWeight: product.grossWeight,
                quantity: quantity,
                price: Number(product.currencyPrice) || 0,
                currency: product.currencyType || 'USD'
            }];
        });
    };

    const handleItemChange = (productId: string, field: keyof ProformaItem, value: string | number) => {
        setProformaItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveItem = (productId: string) => {
        setProformaItems(prev => prev.filter(item => item.productId !== productId));
    };

    const grandTotal = useMemo(() => {
        return proformaItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [proformaItems]);
    
    const currencyType = useMemo(() => {
        if (proformaItems.length > 0) {
           const firstItemWithProduct = proformaItems.find(item => products.some(p => p.id === item.productId));
           if (firstItemWithProduct) {
               return firstItemWithProduct.currency;
           }
        }
        return 'USD';
    }, [proformaItems, products]);

    const handleSave = () => {
        if (!companyName.trim()) {
            showNotification("لطفاً نام شرکت را وارد کنید", "error");
            return;
        }
        if (proformaItems.length === 0) {
            showNotification("لطفاً حداقل یک کالا به پیش‌فاکتور اضافه کنید", "error");
            return;
        }

        onSave({
            companyName,
            items: proformaItems,
            total: grandTotal,
            ...(initialProforma && { id: initialProforma.id })
        });
    };

     const handleDownloadSample = () => {
        const csvHeader = "product_code,quantity\n";
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvHeader +
            "PROD-001,5\n" +
            "PROD-002,10";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "proforma_items_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                if (lines.length < 2) {
                    showNotification("فایل خالی یا نامعتبر است", "error"); return;
                }
                const header = lines[0].trim().split(',').map(h => h.trim());
                if (header[0] !== 'product_code' || header[1] !== 'quantity') {
                    showNotification("فایل باید شامل ستون‌های product_code و quantity باشد", "error"); return;
                }
                let itemsAdded = 0;
                let errors: string[] = [];
                lines.slice(1).forEach((line, index) => {
                    const [code, quantityStr] = line.trim().split(',');
                    const product = products.find(p => p.code === code.trim());
                    const quantity = parseInt(quantityStr, 10);

                    if (product && !isNaN(quantity) && quantity > 0) {
                        addOrUpdateItem(product, quantity);
                        itemsAdded++;
                    } else {
                        errors.push(`کد کالا یا تعداد در ردیف ${index + 2} نامعتبر است.`);
                    }
                });
                if(itemsAdded > 0) showNotification(`${itemsAdded} آیتم با موفقیت افزوده شد.`);
                if(errors.length > 0) showNotification(errors.join('\n'), "error");

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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {initialProforma ? 'ویرایش پیش‌فاکتور' : 'ایجاد پیش‌فاکتور جدید'}
                </h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">لغو</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">ذخیره</button>
                </div>
            </div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="نام شرکت" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500" />
                 <div className="flex items-center gap-2">
                    <select onChange={handleProductSelect} defaultValue="" className="w-full p-3 border rounded-lg bg-white appearance-none focus:ring-2 focus:ring-blue-500">
                        <option value="" disabled>-- افزودن کالا به لیست --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-green-100 text-green-800 font-semibold px-3 py-3 rounded-lg hover:bg-green-200 transition-colors" title="ورود آیتم‌ها از اکسل">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
                 </div>
            </div>
            <div className="flex-grow bg-white shadow-lg rounded-xl overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['کالا', 'تعداد', 'قیمت واحد', 'جمع کل', ''].map(h => <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {proformaItems.map(item => (
                            <tr key={item.productId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                <td className="px-6 py-4"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.productId, 'quantity', parseInt(e.target.value, 10))} className="w-24 p-2 border rounded-md" min="1" /></td>
                                <td className="px-6 py-4">{formatNumber(item.price)} {item.currency}</td>
                                <td className="px-6 py-4 font-semibold">{formatNumber(item.price * item.quantity)} {item.currency}</td>
                                <td className="px-6 py-4"><button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 font-bold text-xl transition-colors">×</button></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold text-gray-800">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-left text-lg">جمع کل</td>
                            <td colSpan={2} className="px-6 py-4 text-right text-lg">{formatNumber(grandTotal)} {currencyType}</td>
                        </tr>
                    </tfoot>
                </table>
                 {proformaItems.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>برای شروع، یک کالا از لیست بالا انتخاب کنید یا <button onClick={handleDownloadSample} className="text-blue-500 hover:underline">یک فایل نمونه دانلود</button> کرده و آیتم‌ها را وارد کنید.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// ProformaView main component
const ProformaView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { proformas, setProformas, showNotification, logActivity } = context;

    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreateNew = () => {
        setSelectedProforma(null);
        setViewMode('create');
    };

    const handleEdit = (proforma: Proforma) => {
        setSelectedProforma(proforma);
        setViewMode('create');
    };

    const handleDeleteRequest = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        const proformaToDelete = proformas.find(p => p.id === deleteConfirmId);
        setProformas(prev => prev.filter(p => p.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        showNotification('پیش‌فاکتور با موفقیت حذف شد');
        if (proformaToDelete) {
            logActivity('DELETE', 'Proforma', `پیش‌فاکتور برای شرکت '${proformaToDelete.companyName}' را حذف کرد.`, deleteConfirmId);
        }
    };

    const handleSave = (data: Omit<Proforma, 'id' | 'date'> & { id?: string }) => {
        if (data.id) { // Update
            setProformas(prev => prev.map(p => p.id === data.id ? { ...p, companyName: data.companyName, items: data.items, total: data.total } : p));
            showNotification('پیش‌فاکتور با موفقیت به‌روزرسانی شد');
            logActivity('UPDATE', 'Proforma', `پیش‌فاکتور برای شرکت '${data.companyName}' را به‌روزرسانی کرد.`, data.id);
        } else { // Create
            const newProforma: Proforma = {
                ...data,
                id: generateId('prof'),
                date: new Date().toISOString(),
            };
            setProformas(prev => [newProforma, ...prev]);
            showNotification("پیش‌فاکتور با موفقیت ذخیره شد");
            logActivity('CREATE', 'Proforma', `پیش‌فاکتور برای شرکت '${data.companyName}' را ایجاد کرد.`, newProforma.id);
        }
        setViewMode('list');
        setSelectedProforma(null);
    };

    const handleExport = (proforma: Proforma) => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
        csvContent += "نام کالا,کد کالا,کد IRC,وزن خالص,وزن ناخالص,تعداد,قیمت واحد,جمع کل\n";
        proforma.items.forEach(item => {
            const rowData = [
                `"${item.name.replace(/"/g, '""')}"`,
                item.code, item.irc, item.netWeight, item.grossWeight,
                item.quantity, item.price, item.price * item.quantity
            ];
            csvContent += rowData.join(",") + "\n";
        });
        csvContent += `,,,,,,,جمع کل,"${proforma.total}"\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `proforma-${proforma.companyName.replace(/\s+/g, '_') || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification("فایل اکسل با موفقیت دانلود شد");
    };
    
    const sortedProformas = useMemo(() => 
        [...proformas].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [proformas]);

    const filteredProformas = useMemo(() => {
        if (!searchTerm) return sortedProformas;
        const lowercasedFilter = searchTerm.toLowerCase();
        return sortedProformas.filter(p =>
            p.companyName.toLowerCase().includes(lowercasedFilter)
        );
    }, [sortedProformas, searchTerm]);

    if (viewMode === 'create') {
        return <ProformaEditor initialProforma={selectedProforma} onSave={handleSave} onCancel={() => { setViewMode('list'); setSelectedProforma(null); }} />;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">لیست پیش‌فاکتورها</h2>
                <button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all">+ ایجاد پیش‌فاکتور</button>
            </div>
            <input 
                type="text" 
                placeholder="جستجو بر اساس نام شرکت..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500" 
            />
            
            <div className="flex-grow bg-white shadow-lg rounded-xl overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['شرکت', 'تاریخ', 'مبلغ کل', 'عملیات'].map(h => 
                                <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProformas.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.companyName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{toJalali(p.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(p.total)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900 ml-4 transition-colors">ویرایش</button>
                                    <button onClick={() => handleExport(p)} className="text-green-600 hover:text-green-900 ml-4 transition-colors">خروجی</button>
                                    <button onClick={() => handleDeleteRequest(p.id)} className="text-red-600 hover:text-red-900 transition-colors">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProformas.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        <p>{searchTerm ? 'هیچ پیش‌فاکتوری با این مشخصات یافت نشد.' : 'هیچ پیش‌فاکتوری ثبت نشده است.'}</p>
                    </div>
                 )}
            </div>
            
            <ConfirmationModal 
                show={!!deleteConfirmId}
                message="آیا از حذف این پیش‌فاکتور مطمئن هستید؟ این عمل غیرقابل بازگشت است."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />
        </div>
    );
};

export default ProformaView;
