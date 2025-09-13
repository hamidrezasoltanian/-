// This file was renamed to ProductSelectorField.jsx to fix MIME type issues on static hosting.
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { formatNumber } from '../../utils/formatters.js';

const ProductSelectorField = ({ field, value, onChange, error, readOnly = false }) => {
    const { products } = useContext(AppContext);
    const selectedItems = value || [];

    const handleQuantityChange = (productId, quantity) => {
        const newItems = selectedItems.map(item =>
            item.productId === productId ? { ...item, quantity: parseInt(quantity, 10) || 0 } : item
        );
        onChange({ target: { name: field.name, value: newItems } });
    };
    
    const handleRemoveItem = (productId) => {
        const newItems = selectedItems.filter(item => item.productId !== productId);
        onChange({ target: { name: field.name, value: newItems } });
    };

    const handleProductAdd = (e) => {
        const productId = e.target.value;
        if (productId) {
             const newItems = [...selectedItems, { productId, quantity: 1 }];
             onChange({ target: { name: field.name, value: newItems } });
             e.target.value = ""; // Reset select
        }
    };

    const availableProducts = useMemo(() => {
        const selectedIds = new Set(selectedItems.map(item => item.productId));
        return products.filter(p => !selectedIds.has(p.id));
    }, [products, selectedItems]);

    const grandTotal = useMemo(() => {
        return selectedItems.reduce((total, item) => {
            const product = products.find(p => p.id === item.productId);
            return total + (product ? (Number(product.currencyPrice) || 0) * item.quantity : 0);
        }, 0);
    }, [selectedItems, products]);
    
    // Assuming a consistent currency type for the grand total for simplicity.
    const currencyType = selectedItems.length > 0 ? products.find(p => p.id === selectedItems[0].productId)?.currencyType : 'USD';


    return (
        <div className={`w-full border rounded-lg bg-white ${error ? 'border-red-500' : 'border-gray-200'} ${readOnly ? 'bg-gray-100' : ''}`}>
            {!readOnly && (
                <div className="p-3 border-b">
                    <label htmlFor={`product-adder-${field.id}`} className="font-semibold text-gray-700 block mb-2">افزودن کالا</label>
                     <select 
                        id={`product-adder-${field.id}`}
                        onChange={handleProductAdd} 
                        disabled={readOnly}
                        className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500"
                        value=""
                    >
                        <option value="" disabled>-- یک کالا برای افزودن انتخاب کنید --</option>
                        {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                </div>
            )}
            <div className="p-3">
                <h4 className="font-semibold mb-3 text-gray-700">کالاهای انتخاب شده</h4>
                {selectedItems.length === 0 ? <p className="text-sm text-gray-500">کالایی انتخاب نشده است.</p> : (
                    <div className="space-y-3">
                        {selectedItems.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            const total = (Number(product.currencyPrice) || 0) * item.quantity;
                            return (
                                <div key={item.productId} className="grid grid-cols-12 gap-2 items-center text-sm">
                                    <span className="col-span-4 font-medium">{product.name}</span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                        disabled={readOnly}
                                        className="col-span-3 w-full p-1 border rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        min="1"
                                    />
                                    <span className="col-span-3 text-gray-600">{formatNumber(product.currencyPrice)} {product.currencyType}</span>
                                    <span className="col-span-1 font-semibold text-gray-800">{formatNumber(total)}</span>
                                    {!readOnly && <button type="button" onClick={() => handleRemoveItem(product.id)} className="col-span-1 text-red-500 hover:text-red-700 font-bold text-lg">×</button>}
                                </div>
                            );
                        })}
                    </div>
                )}
                {selectedItems.length > 0 &&
                    <div className="text-left font-bold mt-4 pt-3 border-t text-gray-800">
                        جمع کل: {formatNumber(grandTotal)} {currencyType}
                    </div>
                }
            </div>
        </div>
    );
};

export default ProductSelectorField;
