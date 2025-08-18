
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { Field, OrderProductItem } from '../../types.ts';
import { formatNumber } from '../../utils/formatters.ts';

interface ProductSelectorFieldProps {
    field: Field;
    value: OrderProductItem[];
    onChange: (e: { target: { name: string; value: OrderProductItem[] } }) => void;
    error?: boolean;
    readOnly?: boolean;
}

const ProductSelectorField: React.FC<ProductSelectorFieldProps> = ({ field, value, onChange, error, readOnly = false }) => {
    const { products } = useContext(AppContext)!;
    const selectedItems = value || [];

    const handleQuantityChange = (productId: string, quantity: string) => {
        const newItems = selectedItems.map(item =>
            item.productId === productId ? { ...item, quantity: parseInt(quantity, 10) || 0 } : item
        );
        onChange({ target: { name: field.name, value: newItems } });
    };

    const handleProductToggle = (productId: string) => {
        const isSelected = selectedItems.some(item => item.productId === productId);
        let newItems;
        if (isSelected) {
            newItems = selectedItems.filter(item => item.productId !== productId);
        } else {
            newItems = [...selectedItems, { productId, quantity: 1 }];
        }
        onChange({ target: { name: field.name, value: newItems } });
    };

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
                    <h4 className="font-semibold text-gray-700">انتخاب کالاها</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 max-h-48 overflow-y-auto pr-2">
                        {products.map(product => (
                            <div key={product.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`${field.id}-${product.id}`}
                                    checked={selectedItems.some(item => item.productId === product.id)}
                                    onChange={() => handleProductToggle(product.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={`${field.id}-${product.id}`} className="mr-2 text-sm text-gray-800 cursor-pointer">{product.name}</label>
                            </div>
                        ))}
                    </div>
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
                                    <span className="col-span-4">{product.name}</span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                        disabled={readOnly}
                                        className="col-span-3 w-full p-1 border rounded-md disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        min="1"
                                    />
                                    <span className="col-span-3 text-gray-600">{formatNumber(product.currencyPrice)} {product.currencyType}</span>
                                    <span className="col-span-2 font-semibold text-gray-800">{formatNumber(total)}</span>
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