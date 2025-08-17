
import React from 'react';
import { Product, Order, Workflow, Proforma } from '../types.ts';

export interface AppContextType {
    workflows: Workflow[];
    setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    proformas: Proforma[];
    setProformas: React.Dispatch<React.SetStateAction<Proforma[]>>;
    showNotification: (message: string, type?: 'success' | 'error') => void;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);