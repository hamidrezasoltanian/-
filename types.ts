export type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'product';
export type FieldWidth = 'half' | 'full';

export interface Field {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  width: FieldWidth;
  options?: string[];
}

export interface Step {
  id:string;
  title: string;
  fields: Field[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: Step[];
}

export interface OrderProductItem {
    productId: string;
    quantity: number;
}

export type OrderStepFieldValue = string | boolean | OrderProductItem[] | number;

export interface OrderStepData {
  [key: string]: OrderStepFieldValue;
}

export interface Order {
  id: string;
  workflowId: string;
  created_at: string; // ISO date string
  title: string;
  steps_data: {
    [stepId: string]: {
      data: OrderStepData;
      completed_at?: string; // ISO date string
    };
  };
  is_finalized?: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  irc: string;
  netWeight: string;
  grossWeight: string;
  description: string;
  currencyPrice: string;
  currencyType: 'USD' | 'EUR' | 'AED';
  manufacturer?: string;
}

export interface ProformaItem {
  productId: string;
  name: string;
  code: string;
  irc: string;
  netWeight: string;
  grossWeight: string;
  quantity: number;
  price: number;
  currency: 'USD' | 'EUR' | 'AED';
}

export interface Proforma {
  id: string;
  companyName: string;
  date: string; // ISO date string
  items: ProformaItem[];
  total: number;
}

export type UserRole = 'admin' | 'sales' | 'procurement';

export interface User {
    id: string;
    username: string;
    password?: string; // Optional for security when sending to client
    role: UserRole;
}

export type ActivityLogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'LOGIN' | 'LOGOUT';
export type EntityType = 'Order' | 'Product' | 'Proforma' | 'User' | 'Workflow' | 'System';

export interface ActivityLog {
    id: string;
    timestamp: string; // ISO date string
    userId: string;
    username: string;
    action: ActivityLogAction;
    entityType: EntityType;
    entityId?: string; 
    details: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    isLoading?: boolean;
    actions?: {
        label: string;
        action_type: 'navigation';
        payload: {
            view: any; // Using `any` to avoid circular dependency issues with View type
        };
    }[];
}