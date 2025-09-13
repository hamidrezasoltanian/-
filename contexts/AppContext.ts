import React from 'react';
// @FIX: Import types to define the context shape.
import { Product, Order, Workflow, Proforma, User, ActivityLog } from '../types.ts';


// @FIX: Define and export View and AppContextType to be used in other components.
export type View = 'home' | 'workflow' | 'products' | 'proforma' | 'reports' | 'settings' | 'activity';

// Omit password from the user object that is publicly available in context
type CurrentUser = Omit<User, 'password'>;

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
  currentUser: CurrentUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  setActiveView: React.Dispatch<React.SetStateAction<View | string>>; // Allow string for flexibility
  selectedOrderId: string | null;
  setSelectedOrderId: React.Dispatch<React.SetStateAction<string | null>>;
  activityLogs: ActivityLog[];
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  logActivity: (action: string, entityType: string, details: string, entityId?: string) => void;
}


// @FIX: Provide a generic type to createContext for type safety.
export const AppContext = React.createContext<AppContextType | undefined>(undefined);