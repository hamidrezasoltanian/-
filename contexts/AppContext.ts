import React from 'react';
import { Product, Order, Workflow, Proforma, User, ActivityLog } from '../types.ts';

export type View = 'home' | 'workflow' | 'products' | 'proforma' | 'reports' | 'settings' | 'activity';

export interface AppContextType {
    workflows: Workflow[];
    setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    proformas: Proforma[];
    setProformas: React.Dispatch<React.SetStateAction<Proforma[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    showNotification: (message: string, type?: 'success' | 'error') => void;
    setActiveView: React.Dispatch<React.SetStateAction<View>>;
    selectedOrderId: string | null;
    setSelectedOrderId: React.Dispatch<React.SetStateAction<string | null>>;
    activityLogs: ActivityLog[];
    setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
    logActivity: (action: ActivityLog['action'], entityType: ActivityLog['entityType'], details: string, entityId?: string) => void;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);
