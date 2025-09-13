// @FIX: Populating types to fix import errors across the application.
export type Product = {
    id: string;
    name: string;
    code: string;
    irc: string;
    netWeight: string;
    grossWeight: string;
    description: string;
    currencyPrice: string;
    currencyType: 'USD' | 'EUR' | 'AED';
    manufacturer: string;
};

export type OrderProductItem = {
    productId: string;
    quantity: number;
}

export type Order = {
    id: string;
    workflowId: string;
    created_at: string;
    title: string;
    steps_data: {
        [stepId: string]: {
            data: { [fieldId: string]: any };
            completed_at?: string;
        }
    };
    is_finalized?: boolean;
};

export type WorkflowStepField = {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'product';
    required: boolean;
    width: 'half' | 'full';
    options?: string[];
};

export type WorkflowStep = {
    id: string;
    title: string;
    fields: WorkflowStepField[];
};

export type Workflow = {
    id: string;
    name: string;
    steps: WorkflowStep[];
};

export type ProformaItem = {
    productId: string;
    name: string;
    code: string;
    irc: string;
    netWeight: string;
    grossWeight: string;
    quantity: number;
    price: number;
    currency: string;
};

export type Proforma = {
    id: string;
    companyName: string;
    date: string;
    items: ProformaItem[];
    total: number;
};

export type User = {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'sales' | 'procurement';
};

export type ActivityLog = {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: string;
    entityType: string;
    details: string;
    entityId?: string;
};