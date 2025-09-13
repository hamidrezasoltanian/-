import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { toJalali } from '../../utils/dateUtils.ts';
import { formatNumber } from '../../utils/formatters.ts';

const OrderSummary = ({ order, onClose }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { workflows, products } = context;

    const workflow = workflows.find(wf => wf.id === order.workflowId);

    const handlePrint = () => {
        window.print();
    };
    
    const renderFieldValue = (field, value) => {
        if (value === undefined || value === null || value === '') return <span className="text-gray-500">--</span>;
        switch (field.type) {
            case 'date':
                return toJalali(String(value));
            case 'checkbox':
                return value ? 'بله' : 'خیر';
            case 'product':
                const items = value;
                if (!items || items.length === 0) return <span className="text-gray-500">--</span>;
                
                const total = items.reduce((acc, item) => {
                    const product = products.find(p => p.id === item.productId);
                    return acc + (item.quantity * Number(product?.currencyPrice || 0));
                }, 0);
                const currency = products.find(p => p.id === items[0].productId)?.currencyType || 'USD';

                return (
                    <div className="mt-2 w-full">
                        <table className="min-w-full text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border p-2 text-right">کالا</th>
                                    <th className="border p-2 text-center">تعداد</th>
                                    <th className="border p-2 text-right">قیمت واحد</th>
                                    <th className="border p-2 text-right">جمع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    return (
                                        <tr key={item.productId}>
                                            <td className="border p-2">{product.name}</td>
                                            <td className="border p-2 text-center">{formatNumber(item.quantity)}</td>
                                            <td className="border p-2">{formatNumber(product.currencyPrice)} {product.currencyType}</td>
                                            <td className="border p-2">{formatNumber(item.quantity * Number(product.currencyPrice))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="font-bold bg-gray-50">
                                 <tr>
                                    <td colSpan={3} className="border p-2 text-left">جمع کل</td>
                                    <td className="border p-2">{formatNumber(total)} {currency}</td>
                                 </tr>
                            </tfoot>
                        </table>
                    </div>
                );
            default:
                return String(value);
        }
    };

    return (
        <div>
            <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-area, .print-area * {
                    visibility: visible;
                  }
                  .print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 2rem;
                    margin: 0;
                  }
                  .no-print {
                    display: none;
                  }
                }
            `}</style>
            <div className="print-area p-4">
                <header className="border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{order.title}</h1>
                    <p className="text-gray-500 mt-1">تاریخ ایجاد: {toJalali(order.created_at)}</p>
                </header>
                <main className="space-y-6">
                    {workflow?.steps.map(step => {
                        const stepData = order.steps_data?.[step.id]?.data;
                        if (!stepData) return null;
                        
                        return (
                             <div key={step.id}>
                                <h2 className="text-xl font-bold text-gray-700 border-b-2 border-gray-200 pb-2 mb-4">{step.title}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {step.fields.map(field => (
                                    <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                                        <p className="font-semibold text-gray-600">{field.label}:</p>
                                        <div className="text-gray-900 break-words">{renderFieldValue(field, stepData[field.name])}</div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )
                    })}
                </main>
            </div>
             <div className="mt-8 flex justify-end gap-4 no-print p-4 bg-gray-50 -m-8 mt-8 rounded-b-xl">
                <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">بستن</button>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">چاپ</button>
            </div>
        </div>
    );
};

export default OrderSummary;